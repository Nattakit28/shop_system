const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedData() {
  let connection;
  
  try {
    console.log('🌱 เริ่มเพิ่มข้อมูลตัวอย่าง...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'online_shop'
    });

    // เพิ่มสินค้าตัวอย่างเพิ่มเติม
    const additionalProducts = [
      ['เสื้อโปโลผู้ชาย', 'เสื้อโปโลผ้า Cotton ผู้ชาย สีน้ำเงิน', 650.00, 20, 1, false],
      ['กระโปรงยีนส์', 'กระโปรงยีนส์ผู้หญิง ทรงเอ สีน้ำเงิน', 750.00, 15, 1, true],
      ['รองเท้าผ้าใบ', 'รองเท้าผ้าใบสีขาว สไตล์เกาหลี', 1200.00, 10, 1, true],
      ['กระติกน้ำสแตนเลส', 'กระติกน้ำสแตนเลส เก็บความเย็นได้ 12 ชั่วโมง', 450.00, 30, 2, false],
      ['หมอนหนุน', 'หมอนหนุนใยไผ่ นุ่มสบาย', 380.00, 25, 2, false],
      ['ผ้าขนหนู', 'ผ้าขนหนูผ้าไผ่ ซับน้ำดี', 150.00, 40, 2, false],
      ['ชาเขียวใบหม่อน', 'ชาเขียวใบหม่อน ออร์แกนิก 100%', 280.00, 35, 3, true],
      ['น้ำผึ้งแท้', 'น้ำผึ้งแท้จากธรรมชาติ ขนาด 500ml', 420.00, 20, 3, false],
      ['ข้าวหอมมะลิ', 'ข้าวหอมมะลิแท้ 5 กิโลกรัม', 180.00, 50, 3, false],
      ['สมาร์ทวอทช์', 'สมาร์ทวอทช์ติดตามสุขภาพ กันน้ำ IP68', 3500.00, 8, 4, true],
      ['พาวเวอร์แบงค์', 'พาวเวอร์แบงค์ 10,000mAh ชาร์จเร็ว', 890.00, 25, 4, false],
      ['ลำโพงบลูทูธ', 'ลำโพงบลูทูธพกพา เสียงใสเบสหนัก', 1500.00, 12, 4, true],
      ['เสื่อโยคะ', 'เสื่อโยคะ TPE หนา 6mm กันลื่น', 650.00, 20, 5, false],
      ['ดัมเบลปรับน้ำหนัก', 'ดัมเบลปรับน้ำหนักได้ 5-20kg', 2800.00, 6, 5, false],
      ['ลูกบาสเกตบอล', 'ลูกบาสเกตบอล หนังแท้ ขนาดมาตรฐาน', 780.00, 15, 5, false]
    ];

    console.log('📦 เพิ่มสินค้าตัวอย่าง...');
    for (const product of additionalProducts) {
      await connection.execute(`
        INSERT INTO products (name, description, price, stock_quantity, category_id, is_featured)
        VALUES (?, ?, ?, ?, ?, ?)
      `, product);
    }

    // เพิ่มคำสั่งซื้อตัวอย่างเพิ่มเติม
    console.log('📋 เพิ่มคำสั่งซื้อตัวอย่าง...');
    const additionalOrders = [
      ['ORD1704123459', 'มาลี สวยงาม', '084-567-8901', '789 ถนนราชดำเนิน เขตพระนคร กรุงเทพฯ 10200', 2150.00, 'shipped'],
      ['ORD1704123460', 'วิชัย แก้วใส', '085-678-9012', '321 ถนนเพชรบุรี เขตราชเทวี กรุงเทพฯ 10400', 890.00, 'completed'],
      ['ORD1704123461', 'สุวรรณ ทองคำ', '086-789-0123', '654 ถนนสีลม เขตบางรัก กรุงเทพฯ 10500', 1500.00, 'confirmed']
    ];

    for (const order of additionalOrders) {
      await connection.execute(`
        INSERT INTO orders (order_number, customer_name, customer_phone, customer_address, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, order);
    }

    console.log('✅ เพิ่มข้อมูลตัวอย่างเรียบร้อยแล้ว!\n');
    console.log('📊 สถิติข้อมูล:');
    
    // แสดงสถิติ
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    
    console.log(`   📦 สินค้า: ${productCount[0].count} รายการ`);
    console.log(`   📋 คำสั่งซื้อ: ${orderCount[0].count} รายการ`);
    console.log(`   📂 หมวดหมู่: ${categoryCount[0].count} หมวด`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedData();