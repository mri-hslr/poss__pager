const mysql = require("mysql2");

// Create normal pool (for callback-style code)
const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "323112rm",
  database: "pos_db",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Also expose promise version (for async/await code)
pool.promise = () => pool.promise();

module.exports = pool;