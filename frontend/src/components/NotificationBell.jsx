import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import socket from "../services/socket";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const dropdownRef = useRef(null);
  const prevUnreadRef = useRef(0);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications);
      const unread = (response.data.notifications || []).filter((n) => !n.read).length;
      setUnreadCount(unread);
      prevUnreadRef.current = unread;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleBusNearStop = (data) => {
      setNotifications((prev) => [
        {
          _id: `temp-${Date.now()}`,
          message: data.message,
          createdAt: new Date().toISOString(),
          bus: { busNumber: "" },
          stop: { stopName: data.stopName },
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => {
        const next = prev + 1;
        return next;
      });
    };

    socket.on("busNearStop", handleBusNearStop);

    return () => {
      socket.off("busNearStop", handleBusNearStop);
    };
  }, []);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setWiggle(true);
      const t = setTimeout(() => setWiggle(false), 900);
      prevUnreadRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const nextIsOpen = !prev;
      if (!nextIsOpen) {
        setUnreadCount(0);
      } else {
        // Opening the panel — persist the "mark all as read" operation
        // in the backend AND reset local unread state.
        api
          .put("/notifications/mark-all-read")
          .then(() => {
            setNotifications((list) =>
              list.map((n) => ({ ...n, read: true }))
            );
          })
          .catch((err) =>
            console.warn("Could not mark notifications read:", err)
          );
        setUnreadCount(0);
      }
      return nextIsOpen;
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
        className={`notification-bell-btn ${wiggle ? "bell-wiggle" : ""}`}
        aria-label="Notifications"
      >
        <span className="notification-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge count-pop">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown fade-in-up">
          <div className="notification-header">
            <span className="notification-title">
              <span className="notification-title-accent">✦</span> Notifications
            </span>
            <span className="notification-count">{notifications.length} total</span>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon">🔕</span>
                <p>No notifications yet.</p>
                <p className="notification-empty-sub">
                  Alerts will appear here when buses approach stops.
                </p>
              </div>
            ) : (
              notifications.map((notif, i) => (
                <div
                  key={notif._id}
                  className={`notification-item fade-in-up delay-${Math.min(i + 1, 8)} ${
                    !notif.read ? "notification-item-unread" : ""
                  }`}
                >
                  <div className="notification-item-icon">📍</div>
                  <div className="notification-item-body">
                    <div className="notification-item-message">{notif.message}</div>
                    <div className="notification-item-meta">
                      <span>{formatTime(notif.createdAt)}</span>
                      {notif.stop?.stopName && (
                        <span className="notification-item-stop">
                          • {notif.stop.stopName}
                        </span>
                      )}
                    </div>
                  </div>
                  {!notif.read && <span className="notification-item-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
