const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.sql`;
  const backupPath = path.join(__dirname, '..', 'backups', backupFileName);
  
  const command = `mysqldump -h ${process.env.DB_HOST || 'localhost'} -u ${process.env.DB_USER || 'root'} ${process.env.DB_PASSWORD ? '-p' + process.env.DB_PASSWORD : ''} ${process.env.DB_NAME || 'online_shop'} > ${backupPath}`;
  
  console.log('💾 เริ่มสำรองข้อมูล...');
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ เกิดข้อผิดพลาดในการสำรองข้อมูล:', error.message);
      return;
    }
    
    if (stderr) {
      console.error('⚠️ คำเตือน:', stderr);
    }
    
    console.log(`✅ สำรองข้อมูลเรียบร้อยแล้ว: ${backupFileName}`);
  });
}

backupDatabase();