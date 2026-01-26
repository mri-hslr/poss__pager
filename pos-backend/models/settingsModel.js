const db = require("../db");

async function getSettings() {
  const [rows] = await db.query("SELECT upi_id, payee_name FROM app_settings WHERE id = 1");
  return rows[0];
}

async function updateSettings(upiId, payeeName) {
  await db.query(
    "UPDATE app_settings SET upi_id = ?, payee_name = ? WHERE id = 1",
    [upiId, payeeName]
  );
}

module.exports = { getSettings, updateSettings };