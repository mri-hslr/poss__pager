const db = require('../db');

const findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE email = ?";
        db.query(sql, [email], (err, results) => {
            if (err) return reject(err);
            if (results.length > 0) resolve(results[0]);
            else resolve(null);
        });
    });
};

const createUser = (name, email, password, role) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        db.query(sql, [name, email, password, role], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

module.exports = { findUserByEmail, createUser };