export default function AppHeader({ activeTab, onChangeTab, user, onLogout }) {
  return (
    <nav className="ksc-nav">
      <div className="ksc-brand-mark" onClick={() => onChangeTab("markets")}>
        <span className="dot" />
        <span className="ksc-brand">KalSC</span>
      </div>

      <div className="ksc-top-tabs">
        <button
          className={`ksc-top-tab ${activeTab === "markets" ? "active" : ""}`}
          onClick={() => onChangeTab("markets")}
        >
          Markets
        </button>
        <button
          className={`ksc-top-tab ${activeTab === "portfolio" ? "active" : ""}`}
          onClick={() => onChangeTab("portfolio")}
        >
          Portfolio
        </button>
        <button
          className={`ksc-top-tab ${activeTab === "leaderboard" ? "active" : ""}`}
          onClick={() => onChangeTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={`ksc-top-tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => onChangeTab("settings")}
        >
          Settings
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
        <span className="ksc-pill" style={{ background: "transparent" }}>
          <span style={{ color: "var(--text-faint)" }}>Bal</span>
          <span className="ksc-mono" style={{ color: "#c4b5fd", fontWeight: 700 }}>
            ${((user?.balance ?? 0) / 100).toFixed(2)}
          </span>
        </span>
        <button className="ksc-btn ksc-btn-ghost" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
