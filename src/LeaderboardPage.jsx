import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import AppHeader from "./AppHeader";

export default function LeaderboardPage({ activeTab, onChangeTab }) {
  const { user, logout } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const top = entries[0]?.balance ?? 1;
  const myRank = entries.findIndex((e) => e.user_id === user?.user_id) + 1;

  return (
    <div className="ksc-shell">
      <AppHeader activeTab={activeTab} onChangeTab={onChangeTab} user={user} onLogout={logout} />

      <div className="ksc-content-wrap" style={{ maxWidth: 680 }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Leaderboard</h2>
            {myRank > 0 && (
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
                You are ranked <span className="ksc-mono" style={{ color: "#c4b5fd", fontWeight: 700 }}>#{myRank}</span> of {entries.length}
              </div>
            )}
          </div>
          <button className="ksc-btn" onClick={load}>Refresh</button>
        </div>

        {/* Top 3 podium */}
        {!loading && entries.length >= 2 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-end" }}>
            {[entries[1], entries[0], entries[2]].filter(Boolean).map((e, idx) => {
              // 0 = 2nd (left), 1 = 1st (center), 2 = 3rd (right)
              const trueRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              const heights = { 1: 110, 2: 80, 3: 60 };
              const isMe = e.user_id === user?.user_id;
              return (
                <div key={e.user_id} style={{
                  flex: trueRank === 1 ? 1.3 : 1,
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <div className="ksc-mono" style={{ fontSize: trueRank === 1 ? 22 : 16, fontWeight: 800, color: "var(--text-faint)", marginBottom: 4 }}>#{trueRank}</div>
                  <div style={{ fontWeight: 700, fontSize: trueRank === 1 ? 15 : 13, marginBottom: 2, color: isMe ? "#c4b5fd" : "var(--text)" }}>
                    {e.username}{isMe ? " (you)" : ""}
                  </div>
                  <div className="ksc-mono" style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>
                    ${(e.balance / 100).toFixed(2)}
                  </div>
                  <div style={{
                    width: "100%",
                    height: heights[trueRank],
                    background: trueRank === 1
                      ? "linear-gradient(180deg, rgba(124,58,237,0.45) 0%, rgba(109,40,217,0.15) 100%)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${trueRank === 1 ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "8px 8px 0 0",
                    boxShadow: trueRank === 1 ? "0 -4px 24px -8px rgba(139,92,246,0.5)" : "none",
                  }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Full ranked list */}
        <div className="ksc-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div className="ksc-skel" style={{ height: 200, borderRadius: 12 }} />
          ) : entries.length === 0 ? (
            <div style={{ padding: 24, color: "var(--text-faint)", fontSize: 13 }}>No users yet.</div>
          ) : (
            <div>
              {entries.map((e, i) => {
                const isMe = e.user_id === user?.user_id;
                const barPct = (e.balance / top) * 100;
                const rank = i + 1;
                return (
                  <div key={e.user_id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px",
                    borderBottom: i < entries.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: isMe ? "rgba(109,40,217,0.08)" : "transparent",
                    transition: "background 0.2s",
                  }}>
                    {/* Rank */}
                    <div className="ksc-mono" style={{
                      width: 28, textAlign: "right", fontSize: 13,
                      color: "var(--text-faint)",
                      fontWeight: rank <= 3 ? 700 : 400,
                      flexShrink: 0,
                    }}>
                      #{rank}
                    </div>

                    {/* Avatar initial */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: isMe ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isMe ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: isMe ? "#c4b5fd" : "var(--text-dim)",
                    }}>
                      {e.username[0]?.toUpperCase()}
                    </div>

                    {/* Name + bar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: isMe ? 700 : 500, fontSize: 13, marginBottom: 4 }}>
                        {e.username}{isMe ? <span style={{ color: "#a78bfa", fontSize: 11, marginLeft: 6 }}>you</span> : ""}
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{
                          height: "100%", borderRadius: 2,
                          width: `${barPct}%`,
                          background: rank === 1
                            ? "linear-gradient(90deg, #7c3aed, #a78bfa)"
                            : isMe
                            ? "rgba(139,92,246,0.6)"
                            : "rgba(255,255,255,0.18)",
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="ksc-mono" style={{
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                      color: rank === 1 ? "#c4b5fd" : isMe ? "#a78bfa" : "#e5e7eb",
                    }}>
                      ${(e.balance / 100).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-faint)", textAlign: "center" }}>
          Auto-refreshes every 15s
        </div>
      </div>
    </div>
  );
}
