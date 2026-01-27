// ✅ FIXED PATH: Pointing to '../db' instead of '../services/db'
const db = require('../db'); 

// Get Settings
async function getSettings(req, res) {
    const query = 'SELECT upi_id, payee_name FROM store_settings WHERE id = 1';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Settings DB Error:", err);
            // Return defaults if DB fails so frontend doesn't crash
            return res.json({ upi_id: 'aakash@okaxis', payee_name: 'Aakash' });
        }
        res.json(results[0] || { upi_id: '', payee_name: '' });
    });
}

// Update Settings
async function updateSettings(req, res) {
    const { upi_id, payee_name } = req.body;

    if (!upi_id || !payee_name) {
        return res.status(400).json({ message: "UPI ID and Payee Name are required" });
    }

    const query = 'UPDATE store_settings SET upi_id = ?, payee_name = ? WHERE id = 1';

    db.query(query, [upi_id, payee_name], (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ message: "Failed to update settings" });
        }
        res.json({ message: "Settings updated successfully", upi_id, payee_name });
    });
}

module.exports = { getSettings, updateSettings };