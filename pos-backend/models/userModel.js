const db = require('../db');

// add a new user
function createUser(name, email, password, role) {
    return new Promise((resolve, reject) => {
        // ✅ CHANGED: Added 'restaurant_id' with a default value of 1
        // This fixes the "Field 'restaurant_id' doesn't have a default value" error
        const query = 'INSERT INTO users (username, email, password, role, restaurant_id) VALUES (?, ?, ?, ?, 1)';
        
        db.query(query, [name, email, password, role], (err, result) => {
            if (err) {
                return reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// get user by email
function findUserByEmail(email) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        db.query(query, [email], (err, result) => {
            if (err) {
                return reject(err);
            } else {
                resolve(result[0]);
            }
        });
    });
}

module.exports = { createUser, findUserByEmail };