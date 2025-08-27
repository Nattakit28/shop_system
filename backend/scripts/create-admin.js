// scripts/create-admin.js
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Function to ask for password (hidden input would be better, but this works)
function askPassword(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate username (alphanumeric and underscore only)
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

async function createAdmin() {
  let connection;
  
  try {
    console.log('🔐 สร้างผู้ดูแลระบบใหม่\n');
    console.log('📋 กรุณากรอกข้อมูลต่อไปนี้:\n');
    
    // Get username with validation
    let username;
    while (true) {
      username = await askQuestion('👤 ชื่อผู้ใช้ (3-20 ตัวอักษร, a-z, 0-9, _): ');
      if (!username.trim()) {
        console.log('❌ กรุณากรอกชื่อผู้ใช้\n');
        continue;
      }
      if (!isValidUsername(username)) {
        console.log('❌ ชื่อผู้ใช้ต้องมี 3-20 ตัวอักษร และใช้ได้เฉพาะ a-z, 0-9, _\n');
        continue;
      }
      break;
    }
    
    // Get password with validation
    let password;
    while (true) {
      password = await askPassword('🔑 รหัสผ่าน (อย่างน้อย 6 ตัวอักษร): ');
      if (!password.trim()) {
        console.log('❌ กรุณากรอกรหัสผ่าน\n');
        continue;
      }
      if (password.length < 6) {
        console.log('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร\n');
        continue;
      }
      
      const confirmPassword = await askPassword('🔑 ยืนยันรหัสผ่าน: ');
      if (password !== confirmPassword) {
        console.log('❌ รหัสผ่านไม่ตรงกัน กรุณาลองใหม่\n');
        continue;
      }
      break;
    }
    
    // Get email with validation
    let email;
    while (true) {
      email = await askQuestion('📧 อีเมล (ไม่บังคับ, กด Enter เพื่อข้าม): ');
      if (!email.trim()) {
        email = null;
        break;
      }
      if (!isValidEmail(email)) {
        console.log('❌ รูปแบบอีเมลไม่ถูกต้อง\n');
        continue;
      }
      break;
    }
    
    // Get first name
    const firstName = await askQuestion('👤 ชื่อจริง (ไม่บังคับ): ') || null;
    
    // Get last name  
    const lastName = await askQuestion('👤 นามสกุล (ไม่บังคับ): ') || null;
    
    // Get role
    console.log('\n🎭 เลือกบทบาท:');
    console.log('1. super_admin (สิทธิ์เต็ม)');
    console.log('2. admin (ผู้ดูแลทั่วไป)');
    console.log('3. manager (ผู้จัดการ)');
    
    let role = 'admin'; // default
    while (true) {
      const roleChoice = await askQuestion('เลือกบทบาท (1-3, default: 2): ') || '2';
      switch (roleChoice) {
        case '1':
          role = 'super_admin';
          break;
        case '2':
          role = 'admin';
          break;
        case '3':
          role = 'manager';
          break;
        default:
          console.log('❌ กรุณาเลือก 1, 2, หรือ 3\n');
          continue;
      }
      break;
    }

    console.log('\n🔄 กำลังเชื่อมต่อฐานข้อมูล...');
    
    // Create database connection with better error handling
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'online_shop',
        charset: 'utf8mb4'
      });
      console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    } catch (dbError) {
      console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:');
      console.error('   เหตุผล:', dbError.message);
      console.error('\n💡 กรุณาตรวจสอบ:');
      console.error('   1. MySQL Server กำลังทำงานอยู่หรือไม่');
      console.error('   2. ข้อมูลในไฟล์ .env ถูกต้องหรือไม่');
      console.error('   3. Database "online_shop" มีอยู่หรือไม่');
      return;
    }

    // Check if username already exists
    console.log('🔍 ตรวจสอบชื่อผู้ใช้...');
    const [existingUsers] = await connection.execute(
      'SELECT id FROM admins WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      console.error('❌ ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่อผู้ใช้อื่น');
      return;
    }

    // Check if email already exists (if provided)
    if (email) {
      const [existingEmails] = await connection.execute(
        'SELECT id FROM admins WHERE email = ?',
        [email]
      );

      if (existingEmails.length > 0) {
        console.error('❌ อีเมลนี้มีอยู่แล้ว กรุณาใช้อีเมลอื่น');
        return;
      }
    }

    console.log('🔐 กำลังเข้ารหัสรหัสผ่าน...');
    
    // Hash password with higher security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('💾 กำลังบันทึกข้อมูล...');
    
    // Insert admin with correct column names matching our schema
    const [result] = await connection.execute(`
      INSERT INTO admins (username, email, password, first_name, last_name, role, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `, [username, email, hashedPassword, firstName, lastName, role]);

    console.log('\n🎉 สร้างผู้ดูแลระบบเรียบร้อยแล้ว!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 ชื่อผู้ใช้: ${username}`);
    console.log(`🔑 รหัสผ่าน: ${password}`);
    if (email) console.log(`📧 อีเมล: ${email}`);
    if (firstName || lastName) console.log(`👨‍💼 ชื่อ: ${firstName || ''} ${lastName || ''}`.trim());
    console.log(`🎭 บทบาท: ${role}`);
    console.log(`🆔 ID: ${result.insertId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📱 ขั้นตอนต่อไป:');
    console.log('1. เปิด http://localhost:3000/admin/login');
    console.log('2. ใช้ชื่อผู้ใช้และรหัสผ่านข้างต้นเพื่อเข้าสู่ระบบ');
    
  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:');
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('   ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้ว');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('   ตาราง admins ไม่มีอยู่ในฐานข้อมูล');
      console.error('   กรุณารันคำสั่ง: node scripts/init-database.js ก่อน');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   ไม่สามารถเชื่อมต่อ MySQL ได้');
      console.error('   กรุณาตรวจสอบว่า MySQL Server กำลังทำงานอยู่');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   ชื่อผู้ใช้หรือรหัสผ่าน MySQL ไม่ถูกต้อง');
      console.error('   กรุณาตรวจสอบไฟล์ .env');
    } else {
      console.error('   รายละเอียด:', error.message);
    }
    
    console.error('\n💡 วิธีแก้ไขปัญหา:');
    console.error('1. ตรวจสอบว่า MySQL Server กำลังทำงานอยู่');
    console.error('2. ตรวจสอบข้อมูลในไฟล์ .env');
    console.error('3. รันคำสั่ง: node scripts/init-database.js');
    console.error('4. ลองใหม่อีกครั้ง');
    
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('\n🔐 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
      } catch (closeError) {
        console.error('⚠️  เกิดข้อผิดพลาดในการปิดการเชื่อมต่อ:', closeError.message);
      }
    }
    rl.close();
  }
}

// Function to show existing admins
async function listAdmins() {
  let connection;
  
  try {
    console.log('📋 รายการผู้ดูแลระบบ\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'online_shop',
      charset: 'utf8mb4'
    });

    const [admins] = await connection.execute(`
      SELECT id, username, email, first_name, last_name, role, status, 
             last_login, created_at 
      FROM admins 
      ORDER BY created_at DESC
    `);

    if (admins.length === 0) {
      console.log('ไม่มีผู้ดูแลระบบในฐานข้อมูล');
      console.log('กรุณารันคำสั่ง: node scripts/create-admin.js เพื่อสร้างผู้ดูแลระบบ');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('| ID | ชื่อผู้ใช้        | อีเมล                    | บทบาท      | สถานะ  | ล็อกอินล่าสุด     |');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    admins.forEach(admin => {
      const lastLogin = admin.last_login 
        ? new Date(admin.last_login).toLocaleString('th-TH')
        : 'ไม่เคย';
      
      console.log(
        `| ${admin.id.toString().padEnd(2)} | ` +
        `${admin.username.padEnd(15)} | ` +
        `${(admin.email || '-').padEnd(24)} | ` +
        `${admin.role.padEnd(10)} | ` +
        `${admin.status.padEnd(6)} | ` +
        `${lastLogin.padEnd(16)} |`
      );
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`รวม: ${admins.length} คน\n`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Main function to handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    await listAdmins();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🔐 สคริปต์จัดการผู้ดูแลระบบ\n');
    console.log('การใช้งาน:');
    console.log('  node scripts/create-admin.js           สร้างผู้ดูแลระบบใหม่');
    console.log('  node scripts/create-admin.js --list    แสดงรายการผู้ดูแลระบบ');
    console.log('  node scripts/create-admin.js --help    แสดงวิธีการใช้งาน');
    console.log('\nตัวอย่าง:');
    console.log('  node scripts/create-admin.js');
    console.log('  node scripts/create-admin.js -l');
  } else {
    await createAdmin();
  }
}

// Check if this script is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ เกิดข้อผิดพลาดร้ายแรง:', error);
    process.exit(1);
  });
}

module.exports = { createAdmin, listAdmins };