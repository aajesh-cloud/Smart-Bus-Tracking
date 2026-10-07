import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import socket from "../services/socket";
import api from "../services/api";
import { toLeafletCoords } from "../services/geoHelpers";
import { busIcon, stopIcon } from "../services/mapIcons";
import { getFullRouteLine } from "../services/routingService";

const DEFAULT_CENTER = [17.385, 78.4867];
const DEFAULT_ZOOM = 13;

const MapFocusController = ({ focusedBusId, liveBuses }) => {
  const map = useMap();

  useEffect(() => {
    if (focusedBusId && liveBuses[focusedBusId]) {
      const position = toLeafletCoords(liveBuses[focusedBusId].coordinates);
      map.flyTo(position, 15, { duration: 1 });
    }
  }, [focusedBusId, liveBuses, map]);

  return null;
};

const LiveMap = ({ routeId, focusedBusId }) => {
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [liveBuses, setLiveBuses] = useState({});
  const [routeLinePositions, setRouteLinePositions] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const fetchRouteStops = async () => {
      try {
        const response = await api.get(`/routes/${routeId}`);
        const fetchedRoute = response.data.route;
        setRoute(fetchedRoute);
        setStops(fetchedRoute.stops || []);
      } catch (error) {
        console.error("Failed to fetch route stops:", error);
      }
    };

    if (routeId) {
      fetchRouteStops();
    }
  }, [routeId]);

  useEffect(() => {
    const buildRoadRoute = async () => {
      // Strategy 1: if the route already has a cached roadPath from the
      // backend (admin ran "Build Path"), use it directly — zero extra calls.
      const cachedCoords = route?.roadPath?.coordinates;
      if (cachedCoords && cachedCoords.length > 1) {
        setRouteLinePositions(
          cachedCoords.map(([lng, lat]) => [lat, lng])
        );
        return;
      }

      // Strategy 2 (fallback): fetch the route line segment-by-segment
      // directly from OSRM in the browser. Slower, and may fail on CORS,
      // but works when admin hasn't prebuilt the path yet.
      const validStops = stops
        .filter((s) => s.stop && s.stop.location)
        .slice()
        .sort((a, b) => a.order - b.order);

      if (validStops.length < 2) {
        setRouteLinePositions([]);
        return;
      }

      setRouteLoading(true);
      const coordinates = validStops.map((s) => s.stop.location.coordinates);
      const roadLine = await getFullRouteLine(coordinates);
      setRouteLinePositions(roadLine);
      setRouteLoading(false);
    };

    buildRoadRoute();
  }, [route, stops]);

  useEffect(() => {
    const fetchInitialLiveLocations = async () => {
      try {
        const response = await api.get("/trips/live-locations");
        const initialBuses = {};
        response.data.liveLocations.forEach((loc) => {
          if (loc.bus) {
            initialBuses[loc.bus._id] = {
              busId: loc.bus._id,
              busNumber: loc.bus.busNumber,
              coordinates: loc.location.coordinates,
            };
          }
        });
        setLiveBuses(initialBuses);
      } catch (error) {
        console.error("Failed to fetch live locations:", error);
      }
    };

    fetchInitialLiveLocations();

    socket.connect();
    socket.emit("joinAdminRoom");

    socket.on("locationUpdate", (data) => {
      setLiveBuses((prev) => ({
        ...prev,
        [data.busId]: {
          busId: data.busId,
          busNumber: prev[data.busId]?.busNumber || "Bus",
          coordinates: [data.longitude, data.latitude],
        },
      }));
    });

    socket.on("tripStopped", (data) => {
      setLiveBuses((prev) => {
        const updated = { ...prev };
        delete updated[data.busId];
        return updated;
      });
    });

    return () => {
      socket.off("locationUpdate");
      socket.off("tripStopped");
      socket.disconnect();
    };
  }, []);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapFocusController focusedBusId={focusedBusId} liveBuses={liveBuses} />

      {routeLinePositions.length > 1 && (
        <Polyline
          positions={routeLinePositions}
          color="#2563eb"
          weight={5}
          opacity={routeLoading ? 0.4 : 0.9}
        />
      )}

      {stops.map((stopEntry) => {
        if (!stopEntry.stop || !stopEntry.stop.location) return null;
        const position = toLeafletCoords(stopEntry.stop.location.coordinates);
        return (
          <Marker key={stopEntry.stop._id} position={position} icon={stopIcon}>
            <Popup>
              <strong>{stopEntry.stop.stopName}</strong>
              <br />
              Stop #{stopEntry.order}
            </Popup>
          </Marker>
        );
      })}

      {Object.values(liveBuses).map((bus) => (
        <Marker
          key={bus.busId}
          position={toLeafletCoords(bus.coordinates)}
          icon={busIcon(bus.busId === focusedBusId)}
        >
          <Popup>
            <strong>{bus.busNumber}</strong>
            <br />
            Live location
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LiveMap;
