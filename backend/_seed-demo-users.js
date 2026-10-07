// backend/_seed-demo-users.js
// ------------------------------------------------------------
// Seeds well-known DEMO users for local development & college demos.
//
//   RUN WITH:
//     cd SmartBusTracking/backend
//     node _seed-demo-users.js
//
//   - Uses MONGO_URI from .env (via dotenv), or override:
//     MONGO_URI="..." node _seed-demo-users.js
//   - Idempotent: if an email already exists, it SKIPS creating that user
//     (no duplicate, no password overwrite).
//   - To RE-SEED with fresh passwords: delete users manually from
//     Atlas Compass / mongosh, then re-run.
//   - KeePass-strength passwords are intentionally SIMPLE (demo only).
//     In production, rotate these or delete the users.
// ------------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const DEMO_USERS = [
  // ——————————————————————————— ADMIN ———————————————————————————
  {
    name: "System Admin",
    email: "admin@smartbus.in",
    password: "Admin@123",
    phone: "+91-90000-00000",
    role: "admin",
    licenseNumber: null,
  },

  // ——————————————————————————— DRIVERS —————————————————————————
  {
    name: "Rajesh Kumar",
    email: "driver.rajesh@smartbus.in",
    password: "Driver@123",
    phone: "+91-90000-00001",
    role: "driver",
    licenseNumber: "KA-01/2022/123456",
  },
  {
    name: "Priya Sharma",
    email: "driver.priya@smartbus.in",
    password: "Driver@123",
    phone: "+91-90000-00002",
    role: "driver",
    licenseNumber: "KA-01/2023/987654",
  },

  // ————————————————————————— PASSENGERS —————————————————————————
  {
    name: "Aarav Patel",
    email: "passenger.aarav@smartbus.in",
    password: "Passenger@123",
    phone: "+91-90000-00003",
    role: "passenger",
    licenseNumber: null,
  },
  {
    name: "Ananya Reddy",
    email: "passenger.ananya@smartbus.in",
    password: "Passenger@123",
    phone: "+91-90000-00004",
    role: "passenger",
    licenseNumber: null,
  },
];

const line = "─".repeat(64);

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set — copy .env.example to .env and fill MONGO_URI first.");
    process.exit(1);
  }

  console.log(line);
  console.log("🌱 Smart Bus Tracking  —  Demo User Seeder");
  console.log(line);

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log("✅ Connected to MongoDB");
    console.log("");
  } catch (err) {
    console.error("❌ Could not connect to MongoDB:");
    console.error("   ", err.message);
    console.error("");
    console.error("🧠 If this is a timeout / IP whitelist error, go to Atlas → Security →");
    console.error("   Network Access → Add IP Address → ALLOW ACCESS FROM ANYWHERE → wait 60s.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const data of DEMO_USERS) {
    try {
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        console.log(`⏭️  SKIP  ${data.role.toUpperCase().padEnd(9)}  ${data.email}  (already exists)`);
        skipped++;
        continue;
      }
      await User.create(data);
      console.log(`✅ ADDED ${data.role.toUpperCase().padEnd(9)}  ${data.email}   password: ${data.password}`);
      created++;
    } catch (err) {
      console.error(`❌ FAIL  ${data.role.toUpperCase().padEnd(9)}  ${data.email}  →  ${err.message}`);
    }
  }

  console.log("");
  console.log(line);
  console.log(`📊 Summary:  ${created} created  ·  ${skipped} skipped  ·  ${DEMO_USERS.length} total`);
  console.log(line);

  console.log("");
  console.log("🔑 HOW TO LOG IN:");
  console.log("   Admin Panel (inside passenger app, after login):");
  console.log("       URL  :  http://localhost:5173/login");
  console.log("       Email:  admin@smartbus.in");
  console.log("       Pass :  Admin@123");
  console.log("");
  console.log("   Driver App:");
  console.log("       URL  :  http://localhost:5174/login");
  console.log("       Email:  driver.rajesh@smartbus.in   or   driver.priya@smartbus.in");
  console.log("       Pass :  Driver@123");
  console.log("");
  console.log("   Passenger App:");
  console.log("       URL  :  http://localhost:5173/login");
  console.log("       Email:  passenger.aarav@smartbus.in   or   passenger.ananya@smartbus.in");
  console.log("       Pass :  Passenger@123");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  try { mongoose.disconnect(); } catch {}
  process.exit(1);
});
