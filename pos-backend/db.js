const mysql = require('mysql2');

// CONFIGURATION
// -------------------------------------------------------------------------
// Mac users (MAMP) often use password: 'root' and port: 8889
// Windows users (XAMPP) use password: '' and port: 3306
// -------------------------------------------------------------------------

const db = mysql.createPool({
  host: '127.0.0.1',       // <--- The Universal Fix (Forces TCP/IP connection)
  user: 'root',
  password: '',            // XAMPP default. If on Mac/MAMP, change to 'root'
  database: 'pos_db',
  port: 3306,              // XAMPP default. If on Mac/MAMP, change to 8889
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection immediately
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Connection Failed!");
    console.error("   Error Code:", err.code);
    console.error("   Message:", err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log("\n💡 TROUBLESHOOTING:");
      console.log("1. Is XAMPP/MAMP MySQL running?");
      console.log("2. Mac MAMP Users: Change 'port' in db.js to 8889");
      console.log("3. Mac MAMP Users: Change 'password' in db.js to 'root'");
    }
  } else {
    console.log("✅ Connected to MySQL database! (Cross-Platform Mode)");
    connection.release();
  }
});

module.exports = db;