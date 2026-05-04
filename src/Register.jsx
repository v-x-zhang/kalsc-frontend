import { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function Register({ onSwitchToLogin }) {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState("100");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim() || !email.trim() || !balance) return setError("All fields are required");
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (!email.includes("@")) return setError("Please enter a valid email");
    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) return setError("Please enter a valid balance");

    setLoading(true);
    const result = await register(username, password, balanceNum, email);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <>
      <h1>Create account.</h1>
      <p className="sub">Get virtual play money and start predicting.</p>

      <form onSubmit={handleSubmit}>
        <div className="ksc-auth-field">
          <label>Username</label>
          <input className="ksc-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="trader42" />
        </div>

        <div className="ksc-auth-field">
          <label>Email</label>
          <input className="ksc-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>

        <div className="ksc-auth-field">
          <label>Starting balance (¢)</label>
          <input className="ksc-input" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="100" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="ksc-auth-field">
            <label>Password</label>
            <input className="ksc-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="ksc-auth-field">
            <label>Confirm</label>
            <input className="ksc-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
        </div>

        {error && <div className="ksc-auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="ksc-btn ksc-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, fontWeight: 800 }}>
          {loading ? <span className="ksc-spinner" /> : null}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="ksc-auth-switch">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="ksc-link-btn">Sign in</button>
      </p>
    </>
  );
}
