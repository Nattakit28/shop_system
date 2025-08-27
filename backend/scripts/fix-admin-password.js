#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'online_shop',
  port: process.env.DB_PORT || 3306
};

const SALT_ROUNDS = 12;

async function fixAdminPassword() {
  let connection;
  
  try {
    console.log('🔧 Starting admin password fix...');
    console.log('📊 Database config:', { 
      host: dbConfig.host, 
      user: dbConfig.user, 
      database: dbConfig.database,
      port: dbConfig.port 
    });

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Check if admins table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'admins'"
    );

    if (tables.length === 0) {
      console.log('❌ Admins table does not exist. Creating it...');
      await createAdminsTable(connection);
    }

    // Check current admin data
    console.log('\n🔍 Checking current admin data...');
    const [admins] = await connection.execute(
      'SELECT id, username, email, role, status, created_at FROM admins'
    );

    console.log(`📋 Found ${admins.length} admin(s):`);
    admins.forEach(admin => {
      console.log(`  - ID: ${admin.id}, Username: ${admin.username}, Email: ${admin.email}, Role: ${admin.role}, Status: ${admin.status}`);
    });

    // Test password verification for existing admin
    if (admins.length > 0) {
      console.log('\n🔐 Testing current password hash...');
      const [adminRows] = await connection.execute(
        'SELECT * FROM admins WHERE username = ? AND status = ?',
        ['admin', 'active']
      );

      if (adminRows.length > 0) {
        const admin = adminRows[0];
        console.log('👤 Found admin:', admin.username);
        console.log('🔑 Current password hash:', admin.password);
        
        // Test if current password works
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, admin.password);
        console.log(`🧪 Password '${testPassword}' verification:`, isValid ? '✅ VALID' : '❌ INVALID');
        
        if (!isValid) {
          console.log('\n🔄 Updating password hash...');
          await updateAdminPassword(connection, admin.id, testPassword);
        } else {
          console.log('✅ Password is already correct!');
        }
      }
    } else {
      console.log('\n➕ No admin found. Creating new admin...');
      await createNewAdmin(connection);
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    await verifyAdminLogin(connection, 'admin', 'admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📍 Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📪 Database connection closed');
    }
  }
}

async function createAdminsTable(connection) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      role ENUM('admin', 'super_admin') DEFAULT 'admin',
      status ENUM('active', 'inactive') DEFAULT 'active',
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.execute(createTableSQL);
  console.log('✅ Admins table created successfully');
}

async function updateAdminPassword(connection, adminId, newPassword) {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    console.log('🔐 New password hash generated:', hashedPassword);

    // Update the password in database
    const [result] = await connection.execute(
      'UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, adminId]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Password updated successfully');
      
      // Verify the update worked
      const [updatedAdmin] = await connection.execute(
        'SELECT password FROM admins WHERE id = ?',
        [adminId]
      );
      
      if (updatedAdmin.length > 0) {
        const isValid = await bcrypt.compare(newPassword, updatedAdmin[0].password);
        console.log('🧪 Password verification after update:', isValid ? '✅ SUCCESS' : '❌ FAILED');
      }
    } else {
      console.log('❌ Password update failed - no rows affected');
    }
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    throw error;
  }
}

async function createNewAdmin(connection) {
  try {
    const adminData = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      first_name: 'Admin',
      last_name: 'User',
      role: 'super_admin',
      status: 'active'
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);
    console.log('🔐 Password hash for new admin:', hashedPassword);

    // Insert new admin
    const [result] = await connection.execute(`
      INSERT INTO admins (username, email, password, first_name, last_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      adminData.username,
      adminData.email,
      hashedPassword,
      adminData.first_name,
      adminData.last_name,
      adminData.role,
      adminData.status
    ]);

    console.log('✅ New admin created with ID:', result.insertId);
    console.log('👤 Admin credentials:');
    console.log('  Username:', adminData.username);
    console.log('  Password:', adminData.password);
    console.log('  Email:', adminData.email);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    throw error;
  }
}

async function verifyAdminLogin(connection, username, password) {
  try {
    console.log(`🔍 Testing login for username: ${username}`);
    
    // Get admin from database
    const [adminRows] = await connection.execute(
      'SELECT * FROM admins WHERE username = ? AND status = ?',
      [username, 'active']
    );

    if (adminRows.length === 0) {
      console.log('❌ Admin not found or inactive');
      return false;
    }

    const admin = adminRows[0];
    console.log('👤 Admin found:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      status: admin.status
    });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    console.log('🔐 Password verification:', isValidPassword ? '✅ SUCCESS' : '❌ FAILED');

    if (isValidPassword) {
      console.log('🎉 Login test SUCCESSFUL! Admin can now login with:');
      console.log(`  Username: ${username}`);
      console.log(`  Password: ${password}`);
      
      // Update last login
      await connection.execute(
        'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id]
      );
      
      return true;
    } else {
      console.log('❌ Login test FAILED - Invalid password');
      return false;
    }

  } catch (error) {
    console.error('❌ Error during login verification:', error.message);
    return false;
  }
}

// Command line options
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
🔧 Admin Password Fix Tool

Usage:
  node fix-admin-password.js          Fix admin password issues
  node fix-admin-password.js --help   Show this help

This script will:
1. Check if admins table exists
2. Verify current admin password
3. Update password if needed
4. Create new admin if none exists
5. Test login functionality

Default admin credentials:
  Username: admin
  Password: admin123
  `);
  process.exit(0);
}

// Run the fix
if (require.main === module) {
  fixAdminPassword()
    .then(() => {
      console.log('\n🎉 Admin password fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixAdminPassword };