// scripts/fresh-admin-setup.js
// สร้าง admin table และระบบ login ใหม่ทั้งหมด

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function freshAdminSetup() {
  let connection;
  
  try {
    console.log('🔥 Fresh Admin Setup - Creating Everything New');
    console.log('═══════════════════════════════════════════════════════════════════════════════════');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'online_shop',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Connected to database');
    
    // Step 1: Drop existing admin table if exists
    console.log('\n🗑️  Step 1: Removing old admin table...');
    try {
      await connection.execute('DROP TABLE IF EXISTS admins');
      console.log('✅ Old admin table removed');
    } catch (error) {
      console.log('ℹ️  No existing admin table found');
    }
    
    // Step 2: Create fresh admin table
    console.log('\n🔨 Step 2: Creating fresh admin table...');
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
        last_login DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes for better performance
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Fresh admin table created');
    
    // Step 3: Create default admin user
    console.log('\n👤 Step 3: Creating default admin user...');
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    console.log('Password hash details:');
    console.log(`  - Original password: ${defaultPassword}`);
    console.log(`  - Hash length: ${hashedPassword.length}`);
    console.log(`  - Hash type: ${hashedPassword.substring(0, 4)}`);
    console.log(`  - Sample: ${hashedPassword.substring(0, 20)}...`);
    
    // Test hash before saving
    const hashTest = await bcrypt.compare(defaultPassword, hashedPassword);
    console.log(`  - Hash verification test: ${hashTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!hashTest) {
      throw new Error('Hash verification failed! Cannot proceed.');
    }
    
    await connection.execute(`
      INSERT INTO admins (
        username, 
        email, 
        password, 
        first_name, 
        last_name, 
        role, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'admin',
      'admin@example.com',
      hashedPassword,
      'Admin',
      'User',
      'super_admin',
      'active'
    ]);
    
    console.log('✅ Default admin user created');
    
    // Step 4: Verify admin user
    console.log('\n🔍 Step 4: Verifying admin user...');
    const [adminUsers] = await connection.execute(
      'SELECT id, username, email, first_name, last_name, role, status, created_at FROM admins'
    );
    
    console.log(`Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.username} (${admin.email})`);
      console.log(`     Name: ${admin.first_name} ${admin.last_name}`);
      console.log(`     Role: ${admin.role}, Status: ${admin.status}`);
      console.log(`     Created: ${admin.created_at}`);
    });
    
    // Step 5: Test login functionality
    console.log('\n🧪 Step 5: Testing login functionality...');
    const [testAdmin] = await connection.execute(
      'SELECT id, username, password, email, first_name, last_name, role, status FROM admins WHERE username = ?',
      ['admin']
    );
    
    if (testAdmin.length === 0) {
      throw new Error('Admin user not found after creation!');
    }
    
    const admin = testAdmin[0];
    console.log('Testing admin login:');
    console.log(`  - Username: ${admin.username}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Status: ${admin.status}`);
    console.log(`  - Role: ${admin.role}`);
    
    // Test password verification
    const passwordTest = await bcrypt.compare('admin123', admin.password);
    console.log(`  - Password verification: ${passwordTest ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!passwordTest) {
      throw new Error('Password verification failed for created admin!');
    }
    
    // Step 6: Create additional test users (optional)
    console.log('\n👥 Step 6: Creating additional admin users...');
    
    const additionalAdmins = [
      {
        username: 'manager',
        email: 'manager@example.com',
        password: 'manager123',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager'
      },
      {
        username: 'admin2',
        email: 'admin2@example.com', 
        password: 'admin2123',
        firstName: 'Second',
        lastName: 'Admin',
        role: 'admin'
      }
    ];
    
    for (const adminData of additionalAdmins) {
      const hash = await bcrypt.hash(adminData.password, 12);
      
      await connection.execute(`
        INSERT INTO admins (username, email, password, first_name, last_name, role, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminData.username,
        adminData.email,
        hash,
        adminData.firstName,
        adminData.lastName,
        adminData.role,
        'active'
      ]);
      
      console.log(`  ✅ Created: ${adminData.username} (${adminData.role})`);
    }
    
    // Step 7: Show final table structure
    console.log('\n📋 Step 7: Final table structure...');
    const [columns] = await connection.execute('DESCRIBE admins');
    
    console.log('Admin table columns:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('| Field           | Type                     | Null | Key | Default             | Extra          |');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    columns.forEach(col => {
      console.log(`| ${col.Field.padEnd(15)} | ${col.Type.padEnd(24)} | ${col.Null.padEnd(4)} | ${col.Key.padEnd(3)} | ${(col.Default || '').toString().padEnd(19)} | ${col.Extra.padEnd(14)} |`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Step 8: Final verification
    console.log('\n✅ Step 8: Final verification...');
    const [finalAdmins] = await connection.execute(
      'SELECT username, email, role, status FROM admins ORDER BY id'
    );
    
    console.log(`Total admin users created: ${finalAdmins.length}`);
    finalAdmins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.username} - ${admin.role} (${admin.status})`);
    });
    
    console.log('\n🎉 FRESH ADMIN SETUP COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════════════════════════');
    console.log('\n📋 Default Login Credentials:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│  Primary Admin:                                             │');
    console.log('│    👤 Username: admin                                       │');
    console.log('│    🔑 Password: admin123                                    │');
    console.log('│    📧 Email: admin@example.com                              │');
    console.log('│    🛡️  Role: super_admin                                    │');
    console.log('│                                                             │');
    console.log('│  Manager:                                                   │');
    console.log('│    👤 Username: manager                                     │');
    console.log('│    🔑 Password: manager123                                  │');
    console.log('│                                                             │');
    console.log('│  Second Admin:                                              │');
    console.log('│    👤 Username: admin2                                      │');
    console.log('│    🔑 Password: admin2123                                   │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    console.log('\n📱 Next Steps:');
    console.log('1. Your backend server should restart automatically');
    console.log('2. Go to: http://localhost:3000/admin/login');
    console.log('3. Use any of the credentials above');
    console.log('4. Admin login should work perfectly now!');
    
    console.log('\n💡 Technical Details:');
    console.log('- All passwords are hashed with bcrypt (salt rounds: 12)');
    console.log('- Table uses utf8mb4 charset for full Unicode support');
    console.log('- Proper indexes added for performance');
    console.log('- ENUM fields for role and status validation');
    
  } catch (error) {
    console.error('\n❌ Fresh admin setup failed:', error.message);
    console.error('\nError details:', error);
    
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure MySQL server is running');
    console.error('2. Check database credentials in .env file');
    console.error('3. Ensure database "online_shop" exists');
    console.error('4. Try running: mysql -u root -p < create_database.sql');
    
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔐 Database connection closed');
    }
  }
}

// Function to test login after setup
async function testLogin() {
  let connection;
  
  try {
    console.log('🧪 Testing admin login functionality...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'online_shop',
      charset: 'utf8mb4'
    });
    
    const testCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'manager', password: 'manager123' },
      { username: 'admin2', password: 'admin2123' }
    ];
    
    console.log('\nTesting login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const cred of testCredentials) {
      // Simulate backend login process
      const [rows] = await connection.execute(
        'SELECT id, username, password, email, first_name, last_name, role, status FROM admins WHERE username = ?',
        [cred.username]
      );
      
      if (rows.length === 0) {
        console.log(`❌ ${cred.username}: User not found`);
        continue;
      }
      
      const admin = rows[0];
      
      if (admin.status !== 'active') {
        console.log(`❌ ${cred.username}: Account not active`);
        continue;
      }
      
      const isValidPassword = await bcrypt.compare(cred.password, admin.password);
      
      if (isValidPassword) {
        console.log(`✅ ${cred.username}: Login successful`);
        console.log(`   → Role: ${admin.role}, Status: ${admin.status}`);
      } else {
        console.log(`❌ ${cred.username}: Invalid password`);
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Login testing completed!');
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test-login') || args.includes('-t')) {
    await testLogin();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🔥 Fresh Admin Setup Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/fresh-admin-setup.js            Create fresh admin table & users');
    console.log('  node scripts/fresh-admin-setup.js --test-login  Test login functionality');
    console.log('  node scripts/fresh-admin-setup.js --help       Show this help');
    console.log('');
    console.log('This script will:');
    console.log('- Drop existing admin table');
    console.log('- Create fresh admin table with proper structure');
    console.log('- Create default admin users with working passwords');
    console.log('- Test login functionality');
    console.log('- Ensure everything works perfectly');
  } else {
    console.log('⚠️  WARNING: This will completely recreate the admin table and delete all existing admin users!');
    console.log('Continue? (y/N): ');
    
    // Simple confirmation without readline dependency
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', async (key) => {
      const input = key.toString().toLowerCase();
      if (input === 'y' || input === 'yes\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        await freshAdminSetup();
        process.exit(0);
      } else {
        console.log('\nOperation cancelled.');
        process.exit(0);
      }
    });
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}