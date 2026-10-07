// frontend/src/pages/admin/AdminRoutes.jsx

import { useState, useEffect } from "react";
import api from "../../services/api";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";

const emptyForm = {
  routeName: "",
  routeNumber: "",
  startPoint: "",
  endPoint: "",
  selectedStopIds: [], // ordered array of stop IDs
};

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calculatingId, setCalculatingId] = useState(null);

  const fetchData = async () => {
    try {
      const [routesRes, stopsRes] = await Promise.all([
        api.get("/routes"),
        api.get("/stops"),
      ]);
      setRoutes(routesRes.data.routes);
      setAllStops(stopsRes.data.stops);
    } catch (err) {
      console.error("Failed to fetch routes/stops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingRoute(null);
    setFormData(emptyForm);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (route) => {
    setEditingRoute(route);
    const sortedStops = [...route.stops].sort((a, b) => a.order - b.order);
    setFormData({
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      startPoint: route.startPoint || "",
      endPoint: route.endPoint || "",
      selectedStopIds: sortedStops.map((s) => s.stop._id),
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Toggling a stop in/out of the selected list (clicking a checkbox)
  const toggleStop = (stopId) => {
    setFormData((prev) => {
      const isSelected = prev.selectedStopIds.includes(stopId);
      const updated = isSelected
        ? prev.selectedStopIds.filter((id) => id !== stopId)
        : [...prev.selectedStopIds, stopId];
      return { ...prev, selectedStopIds: updated };
    });
  };

  // Moves a selected stop up/down in the order list
  const moveStop = (index, direction) => {
    setFormData((prev) => {
      const updated = [...prev.selectedStopIds];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) return prev;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return { ...prev, selectedStopIds: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      routeName: formData.routeName,
      routeNumber: formData.routeNumber,
      startPoint: formData.startPoint,
      endPoint: formData.endPoint,
      stops: formData.selectedStopIds.map((stopId, index) => ({
        stop: stopId,
        order: index + 1,
      })),
    };

    try {
      if (editingRoute) {
        await api.put(`/routes/${editingRoute._id}`, payload);
      } else {
        await api.post("/routes", payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (route) => {
    const confirmed = window.confirm(`Delete route "${route.routeName}"?`);
    if (!confirmed) return;

    try {
      await api.delete(`/routes/${route._id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete route");
    }
  };

  const handleCalculateRoadPath = async (route) => {
    setCalculatingId(route._id);
    try {
      const res = await api.post(`/routes/${route._id}/calculate-road-path`);
      alert(res.data.message || `Road path calculated (${res.data.pointCount} points).`);
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to calculate road path. The OSRM service may be temporarily unavailable."
      );
    } finally {
      setCalculatingId(null);
    }
  };

  const columns = [
    { key: "routeNumber", label: "Route #" },
    { key: "routeName", label: "Route Name" },
    { key: "stopCount", label: "Stops" },
    { key: "roadPath", label: "Map Path" },
  ];

  const renderCell = (row, col) => {
    if (col.key === "stopCount") return row.stops.length;
    if (col.key === "roadPath") {
      const count = row.roadPath?.coordinates?.length || 0;
      return count > 0 ? (
        <span style={{ color: "#10b981", fontWeight: 600 }}>✓ {count} pts</span>
      ) : (
        <span style={{ color: "#f59e0b" }}>— Not built</span>
      );
    }
    return row[col.key];
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Manage Routes</h1>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "10px 20px" }}
          onClick={openAddModal}
        >
          + Add Route
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading routes...</p>
      ) : (
        <DataTable
          columns={columns}
          data={routes}
          renderCell={renderCell}
          actions={(row) => (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => handleCalculateRoadPath(row)}
                disabled={calculatingId === row._id}
                title={
                  row.roadPath?.coordinates?.length
                    ? "Recalculate road path"
                    : "Generate road-following route line"
                }
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  backgroundColor:
                    calculatingId === row._id ? "#1d4ed8" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: calculatingId === row._id ? "wait" : "pointer",
                  opacity: calculatingId === row._id ? 0.7 : 1,
                }}
              >
                {calculatingId === row._id
                  ? "⏳ Building..."
                  : row.roadPath?.coordinates?.length
                  ? "🛣️ Rebuild Path"
                  : "🛣️ Build Path"}
              </button>
              <button
                onClick={() => openEditModal(row)}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  backgroundColor: "#334155",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(row)}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          )}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoute ? "Edit Route" : "Add New Route"}
      >
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Route Name</label>
            <input
              type="text"
              name="routeName"
              value={formData.routeName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Route Number</label>
            <input
              type="text"
              name="routeNumber"
              value={formData.routeNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Start Point</label>
            <input
              type="text"
              name="startPoint"
              value={formData.startPoint}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>End Point</label>
            <input
              type="text"
              name="endPoint"
              value={formData.endPoint}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Select Stops</label>
            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "8px",
              }}
            >
              {allStops.map((stop) => (
                <label
                  key={stop._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 4px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedStopIds.includes(stop._id)}
                    onChange={() => toggleStop(stop._id)}
                  />
                  {stop.stopName}
                </label>
              ))}
            </div>
          </div>

          {formData.selectedStopIds.length > 0 && (
            <div className="form-group">
              <label>Stop Order (use arrows to reorder)</label>
              {formData.selectedStopIds.map((stopId, index) => {
                const stop = allStops.find((s) => s._id === stopId);
                return (
                  <div
                    key={stopId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#0f172a",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginBottom: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <span>
                      {index + 1}. {stop?.stopName}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => moveStop(index, -1)}
                        style={{ cursor: "pointer" }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStop(index, 1)}
                        style={{ cursor: "pointer" }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : editingRoute ? "Update Route" : "Create Route"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminRoutes;