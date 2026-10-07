// backend/src/routes/notificationRoutes.js

const express = require("express");
const router = express.Router();
const {
  setFavoriteStop,
  getMyNotifications,
  markAllAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);
router.put("/favorite-stop", protect, setFavoriteStop);
router.put("/mark-all-read", protect, markAllAsRead);

module.exports = router;