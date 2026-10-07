// backend/src/controllers/notificationController.js

const Notification = require("../models/Notification");
const User = require("../models/User");

// @route   PUT /api/notifications/favorite-stop
// @access  Private (any logged-in user, typically passenger)
const setFavoriteStop = async (req, res) => {
  try {
    const { stopId } = req.body;

    const user = await User.findById(req.user._id);
    user.favoriteStop = stopId || null;
    await user.save();

    res.status(200).json({
      success: true,
      message: stopId ? "Favorite stop updated" : "Favorite stop cleared",
      favoriteStop: user.favoriteStop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while setting favorite stop",
      error: error.message,
    });
  }
};

// @route   GET /api/notifications
// @access  Private
// Returns recent notifications relevant to the logged-in user's favorite stop.
// If no favorite stop is set, returns recent notifications across all stops
// (reasonable default so the panel isn't empty for new users)
const getMyNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const filter = user.favoriteStop ? { stop: user.favoriteStop } : {};

    const notifications = await Notification.find(filter)
      .populate("bus", "busNumber")
      .populate("stop", "stopName")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
      error: error.message,
    });
  }
};

// @route   PUT /api/notifications/mark-all-read
// @access  Private
// Marks all notifications relevant to the user (filtered by favorite stop,
// or all of them if no favorite stop is set) as read.
const markAllAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const filter = user.favoriteStop ? { stop: user.favoriteStop } : {};

    await Notification.updateMany(
      { ...filter, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while marking notifications read",
      error: error.message,
    });
  }
};

module.exports = { setFavoriteStop, getMyNotifications, markAllAsRead };