const axios = require("axios");

const ESP_IP = "http://192.168.4.1";

async function sendTokenToESP(token) {
  try {
    const res = await axios.post(`${ESP_IP}/token`, {
      token: token
    }, {
      timeout: 3000
    });

    return true;
  } catch (err) {
    console.error("ESP not reachable:", err.message);
    return false;
  }
}

module.exports = { sendTokenToESP };