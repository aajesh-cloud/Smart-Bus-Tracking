// backend/src/models/Route.js

const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, "Route name is required"],
      trim: true,
    },
    routeNumber: {
      type: String,
      required: [true, "Route number is required"],
      unique: true,
      trim: true,
    },
    stops: [
      {
        stop: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stop",
        },
        order: {
          type: Number, // 1 = first stop, 2 = second stop, etc.
          required: true,
        },
      },
    ],
    startPoint: {
      type: String,
      trim: true,
    },
    endPoint: {
      type: String,
      trim: true,
    },
    roadPath: {
      type: {
        type: String,
        enum: ["LineString"],
        default: "LineString",
      },
      coordinates: {
        type: [[Number]],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Route", routeSchema);