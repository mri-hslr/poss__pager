const db = require('../db'); 

const getSettings = () => {
    return new Promise((resolve, reject) => {
        // ✅ CHANGED: 'app_settings' -> 'store_settings'
        const query = 'SELECT upi_id, payee_name FROM store_settings WHERE id = 1 LIMIT 1';
        
        db.query(query, (err, results) => {
            if (err) {
                console.error("Settings DB Error:", err);
                resolve(null); 
            } else {
                resolve(results[0] || null);
            }
        });
    });
};

module.exports = { getSettings };