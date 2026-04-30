const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const LOG_FILE = path.join(__dirname, "logs.txt");

// save logs to file
function saveLog(data) {
  const text = `
==================== LOG ====================
Time: ${data.time}
IP: ${data.ip}
Fingerprint: ${data.fingerprint}
Browser: ${data.browser}
OS: ${data.os}
Screen: ${data.screen}
Timezone: ${data.timezone}
============================================
`;

  fs.appendFileSync(LOG_FILE, text + "\n");
}

app.post("/log", (req, res) => {

  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const entry = {
    ip,
    fingerprint: req.body.fingerprint,
    browser: req.body.browser,
    os: req.body.os,
    screen: req.body.screen,
    timezone: req.body.timezone,
    time: new Date().toISOString()
  };

  console.log("\n🔐 NEW VISITOR DETECTED");
  console.log(entry);
  console.log("---------------------------");

  try {
    saveLog(entry);
    console.log("💾 Saved to logs.txt");
  } catch (err) {
    console.log("❌ File error:", err.message);
  }

  res.json({ status: "success" });
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
