// backend/src/controllers/routeController.js

const Route = require("../models/Route");
const axios = require("axios");

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

// Calls OSRM for a road-following path between two GeoJSON [lng, lat] points
// Returns an array of [lng, lat] coordinates (GeoJSON order, for backend storage)
const getRoadSegmentCoords = async (coord1, coord2) => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const url = `${OSRM_BASE_URL}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;

  const response = await axios.get(url, { timeout: 10000 });
  const data = response.data;

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("OSRM returned no route");
  }

  return data.routes[0].geometry.coordinates;
};


// @route   POST /api/routes
// @access  Private/Admin
const createRoute = async (req, res) => {
  try {
    const { routeName, routeNumber, stops, startPoint, endPoint } = req.body;

    if (!routeName || !routeNumber) {
      return res.status(400).json({
        success: false,
        message: "routeName and routeNumber are required",
      });
    }

    const route = await Route.create({
      routeName,
      routeNumber,
      stops: stops || [], // expects: [{ stop: "<stopId>", order: 1 }, ...]
      startPoint,
      endPoint,
    });

    res.status(201).json({
      success: true,
      message: "Route created successfully",
      route,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while creating route",
      error: error.message,
    });
  }
};

// @route   GET /api/routes
// @access  Public
const getAllRoutes = async (req, res) => {
  try {
    // .populate() replaces each stop's ID reference with the FULL stop
    // document (name, coordinates), so the frontend doesn't need a
    // second request just to show stop names on a route
    const routes = await Route.find()
      .populate("stops.stop")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: routes.length,
      routes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching routes",
      error: error.message,
    });
  }
};

// @route   GET /api/routes/:id
// @access  Public
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate("stops.stop");

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.status(200).json({
      success: true,
      route,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching route",
      error: error.message,
    });
  }
};

// @route   PUT /api/routes/:id
// @access  Private/Admin
const updateRoute = async (req, res) => {
  try {
    const { routeName, routeNumber, stops, startPoint, endPoint } = req.body;

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    if (routeName) route.routeName = routeName;
    if (routeNumber) route.routeNumber = routeNumber;
    if (stops) route.stops = stops;
    if (startPoint) route.startPoint = startPoint;
    if (endPoint) route.endPoint = endPoint;

    await route.save();

    res.status(200).json({
      success: true,
      message: "Route updated successfully",
      route,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating route",
      error: error.message,
    });
  }
};

// @route   DELETE /api/routes/:id
// @access  Private/Admin
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    await route.deleteOne();

    res.status(200).json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting route",
      error: error.message,
    });
  }
};

// @route   POST /api/routes/:id/calculate-road-path
// @access  Private/Admin
// Calculates the full road-following route line via OSRM and caches it
// on the Route document as roadPath (GeoJSON LineString, [lng, lat] coords)
const calculateRoadPath = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate("stops.stop");
    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    const validStops = (route.stops || [])
      .filter((s) => s.stop && s.stop.location && s.stop.location.coordinates)
      .slice()
      .sort((a, b) => a.order - b.order);

    if (validStops.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Route must have at least 2 valid stops to calculate a road path",
      });
    }

    // Run segment requests sequentially to avoid OSRM rate limiting
    const allCoordinates = [];
    for (let i = 0; i < validStops.length - 1; i++) {
      const fromCoord = validStops[i].stop.location.coordinates;
      const toCoord = validStops[i + 1].stop.location.coordinates;
      try {
        const segmentCoords = await getRoadSegmentCoords(fromCoord, toCoord);
        // Avoid duplicating the join point between segments (except first)
        if (allCoordinates.length > 0 && segmentCoords.length > 0) {
          allCoordinates.push(...segmentCoords.slice(1));
        } else {
          allCoordinates.push(...segmentCoords);
        }
      } catch (segErr) {
        // Fallback for individual segment: straight line
        console.warn(`OSRM segment ${i} failed, using straight line:`, segErr.message);
        if (allCoordinates.length === 0) {
          allCoordinates.push(fromCoord);
        }
        allCoordinates.push(toCoord);
      }
    }

    route.roadPath = {
      type: "LineString",
      coordinates: allCoordinates,
    };
    await route.save();

    res.status(200).json({
      success: true,
      message: `Road path calculated (${allCoordinates.length} points) and cached on route`,
      route,
      pointCount: allCoordinates.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while calculating road path",
      error: error.message,
    });
  }
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  calculateRoadPath,
};