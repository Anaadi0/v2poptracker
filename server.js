const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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

  // ⭐ IMPORTANT: USE DEVICE ID AS PRIMARY KEY
  if (!db.devices[device_id]) {
    db.devices[device_id] = {
      first_seen: new Date().toISOString(),
      last_seen: null,
      ip,
      fingerprint,
      browser,
      os,
      screen,
      timezone,
      visits: 0
    };
  }

  db.devices[device_id].last_seen = new Date().toISOString();
  db.devices[device_id].visits += 1;

  console.log("\n🔐 DEVICE VISIT");
  console.log(db.devices[device_id]);

  saveDB(db);

  res.json({ status: "ok" });
});

/* =========================
   VIEW CLEAN LOGS
========================= */

app.get("/logs", (req, res) => {
  const db = loadDB();

  let html = "<h2>📊 Devices</h2><pre>";

  Object.entries(db.devices).forEach(([id, d], i) => {
    html += `
[${i + 1}]
Device ID: ${id}
First Seen: ${d.first_seen}
Last Seen: ${d.last_seen}
Visits: ${d.visits}
IP: ${d.ip}
Fingerprint: ${d.fingerprint}
OS: ${d.os}
Browser: ${d.browser}
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
