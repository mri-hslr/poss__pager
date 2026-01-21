const mysql = require('mysql');

const db = mysql.createConnection({
  host: '127.0.0.1',       // <--- IMPORTANT: This forces Windows to work
  user: 'root',            // Default XAMPP user
  password: '',            // Default XAMPP password is empty
  database: 'pos_db',      // Your database name
  port: 3306               // Default XAMPP port
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database!');
});

module.exports = db;