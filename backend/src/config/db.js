// backend/src/config/db.js

const mongoose = require("mongoose");

const connectDB = async (retries = 5, delayMs = 2500) => {
  const attempt = async (attemptNumber) => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 20000,
        maxPoolSize: 10,
      });
      console.log("✅ MongoDB Atlas connected successfully");
    } catch (error) {
      if (attemptNumber < retries) {
        console.warn(
          `⚠️  MongoDB connection attempt ${attemptNumber}/${retries} failed (${error.name}: ${error.message}).  Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return attempt(attemptNumber + 1);
      }
      console.error("❌ MongoDB connection failed after", retries, "attempts.");
      console.error("   name    :", error.name);
      console.error("   code    :", error.code || "(none)");
      console.error("   message :", error.message);
      if (error.reason) {
        console.error("   reason  :", error.reason.message || error.reason.errmsg || error.reason);
      }
      console.error("");
      console.error("🧠 Quick checklist:");
      console.error("   1) Go to MongoDB Atlas → Network Access → confirm your CURRENT IP is listed (or use 0.0.0.0/0 temporarily for testing)");
      console.error("   2) Go to Database Access → confirm the username / password in MONGO_URI match exactly");
      console.error("   3) Database → Connect → Drivers → Node.js → COPY the exact URI and paste into .env");
      console.error("   4) If on mobile hotspot / college WiFi, try the EXPLICIT 3-shard mongodb:// URI (no SRV) — see backend/.env.example");
      console.error("   5) Run diagnostic:   node _test-mongo-connection.js \"$MONGO_URI\"");
      process.exit(1);
    }
  };

  return attempt(1);
};

module.exports = connectDB;