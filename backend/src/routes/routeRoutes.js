// backend/src/routes/routeRoutes.js

const express = require("express");
const router = express.Router();
const {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  calculateRoadPath,
} = require("../controllers/routeController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getAllRoutes);
router.get("/:id", getRouteById);

router.post("/", protect, authorize("admin"), createRoute);
router.put("/:id", protect, authorize("admin"), updateRoute);
router.delete("/:id", protect, authorize("admin"), deleteRoute);
router.post("/:id/calculate-road-path", protect, authorize("admin"), calculateRoadPath);

module.exports = router;