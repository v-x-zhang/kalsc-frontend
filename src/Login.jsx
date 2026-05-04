import { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function Login({ onSwitchToRegister }) {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) return setError("Username and password are required");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <>
      <h1>Welcome back.</h1>
      <p className="sub">Sign in to start trading on what comes next.</p>

      <form onSubmit={handleSubmit}>
        <div className="ksc-auth-field">
          <label>Username</label>
          <input
            className="ksc-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoFocus
          />
        </div>
        <div className="ksc-auth-field">
          <label>Password</label>
          <input
            className="ksc-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="ksc-auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="ksc-btn ksc-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, fontWeight: 800 }}>
          {loading ? <span className="ksc-spinner" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="ksc-auth-switch">
        New to KalSC?{" "}
        <button onClick={onSwitchToRegister} className="ksc-link-btn">Create an account</button>
      </p>
    </>
  );
}
