const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   SIMPLE JSON DATABASE
========================= */

const DB_FILE = path.join(__dirname, "db.json");

// load DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ logs: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

// save DB
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* =========================
   LOG REQUEST
========================= */

app.post("/log", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const entry = {
    time: new Date().toISOString(),
    ip,
    fingerprint: req.body.fingerprint,
    browser: req.body.browser,
    os: req.body.os,
    screen: req.body.screen,
    timezone: req.body.timezone
  };

  console.log("\n🔐 NEW VISITOR");
  console.log(entry);
  console.log("--------------------");

  const db = loadDB();
  db.logs.push(entry);
  saveDB(db);

  res.json({ status: "saved" });
});

/* =========================
   VIEW LOGS PAGE
========================= */

app.get("/logs", (req, res) => {
  const db = loadDB();

  let html = "<h2>📊 Logs</h2><pre>";

  db.logs
    .slice()
    .reverse()
    .forEach((r, i) => {
      html += `
[${i + 1}]
Time: ${r.time}
IP: ${r.ip}
Fingerprint: ${r.fingerprint}
Browser: ${r.browser}
OS: ${r.os}
Screen: ${r.screen}
Timezone: ${r.timezone}
-------------------------
`;
    });

  html += "</pre>";

  res.send(html);
});

/* =========================
   START SERVER (RENDER SAFE)
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
