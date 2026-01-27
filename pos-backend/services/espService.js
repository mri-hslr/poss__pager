const { SerialPort } = require("serialport");

// ⚙️ CONFIGURATION
// Windows: "COM3", "COM4" | Mac: "/dev/cu.usbserial-..."
const PREFERRED_PORT = process.platform === "win32" ? "COM9" : "/dev/cu.usbserial-0001";
const BAUD_RATE = 115200;

let port;

console.log(`🔌 Initializing Serial Port on: ${PREFERRED_PORT}`);

try {
  port = new SerialPort({
    path: PREFERRED_PORT,
    baudRate: BAUD_RATE,
    autoOpen: true,
  });

  port.on("error", (err) => {
    console.log(`⚠️ Serial Port Error: ${err.message} (Is ESP connected?)`);
  });

} catch (err) {
  console.log(`⚠️ Failed to open Serial Port: ${err.message}`);
}

/**
 * Sends a token to the ESP32 via UART.
 * Resolves TRUE if sent, FALSE if failed/timeout.
 * Includes a 500ms timeout so the UI never freezes.
 */
function sendTokenToESP(token) {
  return new Promise((resolve) => {
    if (!port || !port.isOpen) return resolve(false);

    // Timeout safety
    const timeout = setTimeout(() => resolve(false), 500);

    port.write(`${token}\n`, (err) => {
      clearTimeout(timeout);
      if (err) {
        console.error("❌ UART Write Failed:", err.message);
        resolve(false);
      } else {
        console.log(`✅ UART Sent Token: ${token}`);
        resolve(true);
      }
    });
  });
}

module.exports = { sendTokenToESP };