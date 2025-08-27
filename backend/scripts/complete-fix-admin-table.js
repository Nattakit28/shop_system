// scripts/complete-fix-admin-table.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function completeFixAdminTable() {
  let connection;
  
  try {
    console.log('🔧 Complete Admin Table Fix...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'online_shop',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Connected to database');
    
    // ตรวจสอบโครงสร้างตารางปัจจุบัน
    console.log('🔍 Checking current admin table structure...');
    const [columns] = await connection.execute('DESCRIBE admins');
    
    console.log('\nCurrent columns:');
    const existingColumns = [];
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      existingColumns.push(col.Field);
    });
    
    // Define expected columns
    const expectedColumns = {
      'id': 'INT AUTO_INCREMENT PRIMARY KEY',
      'username': 'VARCHAR(50) UNIQUE NOT NULL',
      'email': 'VARCHAR(255) UNIQUE NOT NULL',
      'password': 'VARCHAR(255) NOT NULL',
      'first_name': 'VARCHAR(100)',
      'last_name': 'VARCHAR(100)',
      'role': "ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin'",
      'status': "ENUM('active', 'inactive') DEFAULT 'active'",
      'last_login': 'DATETIME',
      'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    };
    
    console.log('\n🔄 Fixing missing/incorrect columns...');
    
    // Fix password column
    if (existingColumns.includes('password_hash') && !existingColumns.includes('password')) {
      console.log('📝 Renaming password_hash to password...');
      await connection.execute('ALTER TABLE admins CHANGE COLUMN password_hash password VARCHAR(255) NOT NULL');
      console.log('✅ password column fixed');
    } else if (!existingColumns.includes('password')) {
      console.log('📝 Adding password column...');
      await connection.execute('ALTER TABLE admins ADD COLUMN password VARCHAR(255) NOT NULL');
      console.log('✅ password column added');
    }
    
    // Fix full_name to first_name and last_name
    if (existingColumns.includes('full_name') && !existingColumns.includes('first_name')) {
      console.log('📝 Splitting full_name into first_name and last_name...');
      
      // Add new columns
      await connection.execute('ALTER TABLE admins ADD COLUMN first_name VARCHAR(100)');
      await connection.execute('ALTER TABLE admins ADD COLUMN last_name VARCHAR(100)');
      
      // Split existing full_name data
      const [users] = await connection.execute('SELECT id, full_name FROM admins WHERE full_name IS NOT NULL');
      
      for (const user of users) {
        if (user.full_name) {
          const nameParts = user.full_name.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          await connection.execute(
            'UPDATE admins SET first_name = ?, last_name = ? WHERE id = ?',
            [firstName, lastName, user.id]
          );
        }
      }
      
      // Drop old full_name column
      await connection.execute('ALTER TABLE admins DROP COLUMN full_name');
      console.log('✅ first_name and last_name columns created from full_name');
      
    } else if (!existingColumns.includes('first_name')) {
      console.log('📝 Adding first_name and last_name columns...');
      await connection.execute('ALTER TABLE admins ADD COLUMN first_name VARCHAR(100)');
      await connection.execute('ALTER TABLE admins ADD COLUMN last_name VARCHAR(100)');
      console.log('✅ first_name and last_name columns added');
    }
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'role', sql: "ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin'" },
      { name: 'status', sql: "ENUM('active', 'inactive') DEFAULT 'active'" },
      { name: 'last_login', sql: 'DATETIME' },
      { name: 'created_at', sql: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', sql: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];
    
    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`📝 Adding ${col.name} column...`);
        await connection.execute(`ALTER TABLE admins ADD COLUMN ${col.name} ${col.sql}`);
        console.log(`✅ ${col.name} column added`);
      }
    }
    
    // Update admin users to have proper role if not set
    console.log('📝 Updating admin roles...');
    await connection.execute("UPDATE admins SET role = 'super_admin' WHERE role IS NULL OR role = ''");
    await connection.execute("UPDATE admins SET status = 'active' WHERE status IS NULL OR status = ''");
    
    // ตรวจสอบโครงสร้างใหม่
    console.log('\n🔍 Final table structure:');
    const [finalColumns] = await connection.execute('DESCRIBE admins');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('| Field           | Type                    | Null | Key | Default |');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    finalColumns.forEach(col => {
      console.log(`| ${col.Field.padEnd(15)} | ${col.Type.padEnd(23)} | ${col.Null.padEnd(4)} | ${col.Key.padEnd(3)} | ${(col.Default || '').toString().padEnd(7)} |`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ตรวจสอบข้อมูล admin
    console.log('\n👥 Current admin users:');
    const [admins] = await connection.execute(
      'SELECT id, username, email, first_name, last_name, role, status FROM admins'
    );
    
    if (admins.length === 0) {
      console.log('❌ No admin users found!');
      console.log('💡 Creating default admin user...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await connection.execute(`
        INSERT INTO admins (username, email, password, first_name, last_name, role, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['admin', 'admin@example.com', hashedPassword, 'Admin', 'User', 'super_admin', 'active']);
      
      console.log('✅ Default admin user created!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      
    } else {
      console.log(`✅ Found ${admins.length} admin users:`);
      admins.forEach(admin => {
        const fullName = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'No name';
        console.log(`  - ${admin.username} (${fullName}) - ${admin.role} - ${admin.status}`);
      });
    }
    
    console.log('\n🎉 Admin table completely fixed!');
    console.log('📋 Next steps:');
    console.log('1. Restart your backend server: npm start');
    console.log('2. Try admin login: http://localhost:3000/admin/login');
    console.log('3. Use credentials: admin / admin123');
    
  } catch (error) {
    console.error('❌ Error fixing admin table:', error.message);
    console.error('Error details:', error);
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔐 Database connection closed');
    }
  }
}

// Function to completely recreate admin table
async function recreateAdminTable() {
  let connection;
  
  try {
    console.log('🗑️  Recreating admin table from scratch...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'online_shop',
      charset: 'utf8mb4'
    });
    
    // Backup existing admin data
    console.log('💾 Backing up existing admin data...');
    let existingAdmins = [];
    try {
      const [admins] = await connection.execute('SELECT * FROM admins');
      existingAdmins = admins;
      console.log(`✅ Backed up ${existingAdmins.length} admin records`);
    } catch (error) {
      console.log('ℹ️  No existing admin data to backup');
    }
    
    // Drop and recreate table
    console.log('🗑️  Dropping old admins table...');
    await connection.execute('DROP TABLE IF EXISTS admins');
    
    console.log('🔨 Creating new admins table...');
    await connection.execute(`
      CREATE TABLE admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin',
        status ENUM('active', 'inactive') DEFAULT 'active',
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_status (status)
      )
    `);
    
    console.log('✅ New admins table created');
    
    // Restore data or create default admin
    if (existingAdmins.length > 0) {
      console.log('🔄 Restoring admin data...');
      
      const bcrypt = require('bcrypt');
      
      for (const admin of existingAdmins) {
        // Handle different column names in old data
        const firstName = admin.first_name || (admin.full_name ? admin.full_name.split(' ')[0] : null);
        const lastName = admin.last_name || (admin.full_name ? admin.full_name.split(' ').slice(1).join(' ') : null);
        const password = admin.password || admin.password_hash;
        
        if (password) {
          await connection.execute(`
            INSERT INTO admins (username, email, password, first_name, last_name, role, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            admin.username,
            admin.email || `${admin.username}@example.com`,
            password,
            firstName,
            lastName,
            admin.role || 'admin',
            admin.status || 'active'
          ]);
        }
      }
      
      console.log(`✅ Restored ${existingAdmins.length} admin users`);
      
    } else {
      console.log('👤 Creating default admin user...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await connection.execute(`
        INSERT INTO admins (username, email, password, first_name, last_name, role, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['admin', 'admin@example.com', hashedPassword, 'Admin', 'User', 'super_admin', 'active']);
      
      console.log('✅ Default admin user created');
    }
    
    console.log('\n🎉 Admin table recreated successfully!');
    
  } catch (error) {
    console.error('❌ Error recreating admin table:', error.message);
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--recreate') || args.includes('-r')) {
    console.log('⚠️  WARNING: This will completely recreate the admins table!');
    console.log('Continue? (y/N): ');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        recreateAdminTable();
      } else {
        console.log('Operation cancelled.');
      }
    });
    
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🔧 Complete Admin Table Fix Script\n');
    console.log('Usage:');
    console.log('  node scripts/complete-fix-admin-table.js           Fix existing table');
    console.log('  node scripts/complete-fix-admin-table.js --recreate  Recreate table completely');
    console.log('  node scripts/complete-fix-admin-table.js --help     Show this help');
    
  } else {
    await completeFixAdminTable();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}