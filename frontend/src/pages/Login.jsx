import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeFields, setShakeFields] = useState({ email: false, password: false });

  const { login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (shakeFields[e.target.name]) {
      setShakeFields((s) => ({ ...s, [e.target.name]: false }));
    }
  };

  const handleRipple = (e) => {
    if (loading || !btnRef.current) return;
    const btn = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple-ink";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "driver") {
        setError(
          "Driver accounts must use the dedicated Driver App. Please open the Driver App URL to sign in."
        );
        setShakeFields({ email: true, password: true });
        setTimeout(
          () => setShakeFields({ email: false, password: false }),
          500
        );
        logout();
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      setShakeFields({ email: true, password: true });
      setTimeout(() => setShakeFields({ email: false, password: false }), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        style={{ position: "absolute", top: "20px", right: "20px" }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Login to track your bus in real-time</p>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group fade-in-up delay-1 ${shakeFields.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@college.edu"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className={`form-group fade-in-up delay-2 ${shakeFields.password ? "has-error" : ""}`}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="fade-in-up delay-3" style={{ marginTop: "8px" }}>
            <button
              ref={btnRef}
              type="submit"
              className="btn-primary"
              disabled={loading}
              onClick={handleRipple}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>Logging in...</span>
                </>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer fade-in delay-5">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
