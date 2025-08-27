// quick-test.js - วางไฟล์นี้ในโฟลเดอร์รูทของ backend
// รันด้วย: node quick-test.js

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'online_shop',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

async function testDatabase() {
  let connection;
  
  try {
    console.log('🔌 กำลังเชื่อมต่อฐานข้อมูล...');
    console.log('📊 Config:', { ...dbConfig, password: '***' });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    
    // Test 1: Check database connection
    const [testResult] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Test 1 - Database Query:', testResult[0]);
    
    // Test 2: Check settings table
    const [tableInfo] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME, UPDATE_TIME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'settings'
    `, [dbConfig.database]);
    
    if (tableInfo.length > 0) {
      console.log('✅ Test 2 - Settings table exists:', tableInfo[0]);
    } else {
      console.log('❌ Test 2 - Settings table not found');
      return;
    }
    
    // Test 3: Check current settings
    const [currentSettings] = await connection.execute(
      'SELECT setting_key, setting_value, created_at, updated_at FROM settings ORDER BY setting_key'
    );
    console.log(`✅ Test 3 - Current settings (${currentSettings.length} items):`);
    currentSettings.forEach(setting => {
      console.log(`   - ${setting.setting_key}: "${setting.setting_value}"`);
    });
    
    // Test 4: Try to insert/update a test setting
    console.log('🧪 Test 4 - Testing INSERT/UPDATE...');
    
    const testKey = 'test_setting_' + Date.now();
    const testValue = 'test_value_' + Date.now();
    
    await connection.execute(`
      INSERT INTO settings (setting_key, setting_value, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value),
        updated_at = NOW()
    `, [testKey, testValue]);
    
    console.log(`✅ Test 4 - Insert/Update successful: ${testKey} = ${testValue}`);
    
    // Test 5: Clean up test data
    await connection.execute('DELETE FROM settings WHERE setting_key = ?', [testKey]);
    console.log('✅ Test 5 - Cleanup successful');
    
    // Test 6: Check admins table
    const [adminCount] = await connection.execute('SELECT COUNT(*) as count FROM admins WHERE status = "active"');
    console.log(`✅ Test 6 - Active admins: ${adminCount[0].count}`);
    
    console.log('\n🎉 ทุกการทดสอบผ่านหมดแล้ว! ฐานข้อมูลพร้อมใช้งาน');
    
  } catch (error) {
    console.error('❌ การทดสอบล้มเหลว:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 แนะนำ: ตรวจสอบ username/password ของฐานข้อมูล');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 แนะนำ: ตรวจสอบว่า MySQL server ทำงานอยู่หรือไม่');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 แนะนำ: สร้างฐานข้อมูล "online_shop" ก่อน');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('📪 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
    }
  }
}

async function testSpecificSettings() {
  let connection;
  
  try {
    console.log('\n🧪 ทดสอบการอัปเดต Settings เฉพาะเจาะจง...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const testSettings = {
      shop_name: 'ทดสอบร้าน ' + new Date().toLocaleString('th-TH'),
      promptpay_number: '0987654321',
      shop_address: 'ที่อยู่ทดสอบ',
      shop_phone: '02-987-6543',
      shop_email: 'test@example.com'
    };
    
    console.log('📝 ข้อมูลที่จะทดสอบ:', testSettings);
    
    // Update each setting
    for (const [key, value] of Object.entries(testSettings)) {
      try {
        await connection.execute(`
          INSERT INTO settings (setting_key, setting_value, created_at, updated_at)
          VALUES (?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
            setting_value = VALUES(setting_value),
            updated_at = NOW()
        `, [key, value]);
        
        console.log(`✅ อัปเดต ${key} สำเร็จ`);
      } catch (settingError) {
        console.error(`❌ อัปเดต ${key} ล้มเหลว:`, settingError.message);
      }
    }
    
    // Verify updates
    const [verifyResults] = await connection.execute(`
      SELECT setting_key, setting_value, updated_at 
      FROM settings 
      WHERE setting_key IN ('shop_name', 'promptpay_number', 'shop_address', 'shop_phone', 'shop_email')
      ORDER BY setting_key
    `);
    
    console.log('\n✅ ผลลัพธ์หลังการอัปเดต:');
    verifyResults.forEach(result => {
      console.log(`   - ${result.setting_key}: "${result.setting_value}" (${result.updated_at})`);
    });
    
    console.log('\n🎉 การทดสอบ Settings สำเร็จ!');
    
  } catch (error) {
    console.error('❌ การทดสอบ Settings ล้มเหลว:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// เรียกใช้งาน
async function runAllTests() {
  console.log('🚀 เริ่มการทดสอบฐานข้อมูลและ Settings...');
  console.log('='.repeat(50));
  
  await testDatabase();
  await testSpecificSettings();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 การทดสอบเสร็จสิ้น');
}

// รันทันทีถ้าไฟล์นี้ถูกเรียกใช้โดยตรง
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบ:', error);
    process.exit(1);
  });
}

module.exports = {
  testDatabase,
  testSpecificSettings,
  runAllTests
};