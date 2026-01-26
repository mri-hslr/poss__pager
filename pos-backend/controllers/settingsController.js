const settingsModel = require("../models/settingsModel");

async function getSettings(req, res) {
  try {
    const settings = await settingsModel.getSettings();
    res.json(settings);
  } catch {
    res.status(500).json({ message: "Failed to load settings" });
  }
}

async function updateSettings(req, res) {
  const { upiId, payeeName } = req.body;

  if (!upiId || !payeeName) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    await settingsModel.updateSettings(upiId, payeeName);
    res.json({ message: "Settings updated" });
  } catch {
    res.status(500).json({ message: "Failed to update settings" });
  }
}

module.exports = { getSettings, updateSettings };