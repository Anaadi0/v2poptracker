const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   DATABASE FILE
========================= */

const DB_FILE = path.join(__dirname, "db.json");

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ devices: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* =========================
   LOG DEVICE DATA
========================= */

app.post("/log", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const {
    device_id,
    fingerprint,
    browser,
    os,
    screen,
    timezone
  } = req.body;

  const db = loadDB();

  if (!db.devices[device_id]) {
    db.devices[device_id] = {
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      ip,
      fingerprint,
      browser,
      os,
      screen,
      timezone,
      visits: 1
    };
  } else {
    db.devices[device_id].last_seen = new Date().toISOString();
    db.devices[device_id].visits += 1;
  }

  console.log("\n🔐 DEVICE LOG");
  console.log(db.devices[device_id]);
  console.log("--------------------");

  saveDB(db);

  res.json({ status: "ok" });
});

/* =========================
   VIEW LOGS
========================= */

app.get("/logs", (req, res) => {
  const db = loadDB();

  let html = "<h2>📊 Device Logs</h2><pre>";

  Object.entries(db.devices).forEach(([id, d], i) => {
    html += `
[${i + 1}]
{
  first_seen: '${d.first_seen}',
  last_seen: '${d.last_seen}',
  ip: '${d.ip}',
  fingerprint: ${d.fingerprint},
  browser: '${d.browser}',
  os: '${d.os}',
  screen: '${d.screen}',
  timezone: '${d.timezone}',
  visits: ${d.visits}
}
-------------------------
`;
  });

  html += "</pre>";
  res.send(html);
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
