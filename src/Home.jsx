import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import AppHeader from "./AppHeader";

/* --------------------------- helpers --------------------------- */

function useAnimatedNumber(target, duration = 700) {
  const [value, setValue] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (target == null || isNaN(target)) return;
    cancelAnimationFrame(rafRef.current);
    fromRef.current = value;
    startRef.current = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

/* Sparkline driven by a deterministic seed (so each contract is stable)
   but slightly drifts towards the contract's yes_mid for vibe. */
function Sparkline({ seed, target = 50, color = "#8b5cf6" }) {
  const points = useMemo(() => {
    const n = 32;
    const out = [];
    let v = target;
    let s = (seed || 1) * 9301 + 49297;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < n; i++) {
      v += (rand() - 0.5) * 8 + (target - v) * 0.05;
      v = Math.max(2, Math.min(98, v));
      out.push(v);
    }
    out[n - 1] = target;
    return out;
  }, [seed, target]);

  const W = 320, H = 56, PAD = 4;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const innerW = W - PAD * 2, innerH = H - PAD * 2;
  const pts = points.map((p, i) => [
    PAD + (i / (points.length - 1)) * innerW,
    PAD + (1 - (p - min) / range) * innerH,
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${H - PAD} L ${PAD} ${H - PAD} Z`;
  const id = `spark-${seed}`;
  const len = 600;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ksc-spark" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ strokeDasharray: len, animation: `ksc-draw 1.2s ease-out forwards` }}
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color}>
        <animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function Counter({ value, suffix = "", decimals = 0 }) {
  const v = useAnimatedNumber(Number.isFinite(value) ? value : 0);
  return <span className="ksc-stat-num">{v.toFixed(decimals)}{suffix}</span>;
}

/* --------------------------- card --------------------------- */

function ContractCard({ c, onSelect, prevYes }) {
  const yes = c.yes_mid ?? null;
  const no = c.no_mid ?? null;
  const status = c.status ?? (c.is_open !== false ? "open" : "closed");
  const isOpen = status === "open";
  const isUpcoming = status === "upcoming";

  const flashClass =
    isOpen && prevYes != null && yes != null
      ? yes > prevYes ? "ksc-flash-up"
      : yes < prevYes ? "ksc-flash-down"
      : ""
      : "";

  return (
    <div
      className={`ksc-card ksc-fade-up ${isOpen ? "interactive" : ""} ${flashClass}`}
      onClick={() => isOpen && onSelect(c.contract_id)}
      style={{ minHeight: 252, display: "flex", flexDirection: "column", gap: 14,
               opacity: isUpcoming ? 0.72 : 1 }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span className={`ksc-tag ${status}`}>
            {isOpen && <span className="ksc-live-dot" style={{ width: 6, height: 6 }} />}
            {isOpen ? "Live" : isUpcoming ? "Upcoming" : "Closed"}
          </span>
          <span className="ksc-section-label">#{c.contract_id}</span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, marginBottom: 6 }}>
          {c.contract_name}
        </h2>
        <p style={{ fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.45,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {c.contract_description || "No description provided"}
        </p>
      </div>

      <div style={{ margin: "0 -4px" }}>
        <Sparkline seed={c.contract_id || 1} target={yes ?? 50} color={isUpcoming ? "#6b7280" : "#a78bfa"} />
      </div>

      {isUpcoming && (
        <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.08)", borderRadius: 8,
                      fontSize: 12, color: "var(--text-faint)", textAlign: "center", letterSpacing: 0.3 }}>
          Trading opens when this market goes live
        </div>
      )}

      <div style={{ display: "grid", gap: 10, opacity: isUpcoming ? 0.45 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", letterSpacing: 0.06, textTransform: "uppercase" }}>Yes</span>
              <span className="ksc-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                {yes != null ? `${yes}¢` : "—"}
              </span>
            </div>
            <div className="ksc-progress"><span style={{ width: `${yes ?? 0}%` }} /></div>
          </div>
          <div className="ksc-market-mid" style={{ minWidth: 72 }}>
            <span className="ksc-mono" style={{ fontSize: 14 }}><Counter value={yes ?? 0} suffix="%" /></span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", letterSpacing: 0.06, textTransform: "uppercase" }}>No</span>
              <span className="ksc-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                {no != null ? `${no}¢` : "—"}
              </span>
            </div>
            <div className="ksc-progress no"><span style={{ width: `${no ?? 0}%` }} /></div>
          </div>
          <div className="ksc-market-mid" style={{ minWidth: 72 }}>
            <span className="ksc-mono" style={{ fontSize: 14 }}><Counter value={no ?? 0} suffix="%" /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- page --------------------------- */

export default function Home({ onSelectContract, activeTab, onChangeTab }) {
  const { user, logout } = useContext(AuthContext);
  const [contracts, setContracts] = useState([]);
  const [prevYes, setPrevYes] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | UPCOMING | LIVE | CLOSED

  const load = async () => {
    try {
      const res = await fetch("/api/contracts");
      const data = await res.json();
      setContracts((old) => {
        const map = {};
        old.forEach((c) => (map[c.contract_id] = c.yes_mid));
        setPrevYes(map);
        return Array.isArray(data) ? data : [];
      });
    } catch (err) {
      console.error("Failed to load contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts.filter((c) => {
      const status = c.status ?? (c.is_open !== false ? "open" : "closed");
      if (filter === "LIVE" && status !== "open") return false;
      if (filter === "CLOSED" && status !== "closed") return false;
      if (filter === "UPCOMING" && status !== "upcoming") return false;
      if (!q) return true;
      return (
        (c.contract_name || "").toLowerCase().includes(q) ||
        (c.contract_description || "").toLowerCase().includes(q)
      );
    });
  }, [contracts, search, filter]);

  const openCount = useMemo(
    () => contracts.filter((c) => (c.status ?? (c.is_open !== false ? "open" : "closed")) === "open").length,
    [contracts]
  );
  const upcomingCount = useMemo(
    () => contracts.filter((c) => c.status === "upcoming").length,
    [contracts]
  );

  return (
    <div className="ksc-shell">
      <AppHeader activeTab={activeTab} onChangeTab={onChangeTab} user={user} onLogout={logout} />

      <div className="ksc-content-wrap">

      <div style={{ marginBottom: 14, color: "var(--text-faint)", fontSize: 12 }}>
        {openCount} live · {upcomingCount} upcoming. Auto-refreshes every 5s.
      </div>

      {/* SEARCH + FILTERS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <input
          className="ksc-input"
          placeholder="Search markets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 280px", maxWidth: 420 }}
        />
        <div className="ksc-toggle-row" style={{ minWidth: 340 }}>
          {["ALL", "UPCOMING", "LIVE", "CLOSED"].map((f) => (
            <button
              key={f}
              className={`ksc-toggle ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-faint)" }}>
          {filtered.length} of {contracts.length} markets
        </span>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="ksc-grid-cards">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ksc-skel" style={{ height: 280 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ksc-card" style={{ textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 15 }}>
            {contracts.length === 0
              ? "No markets are live yet. Check back soon."
              : "No markets match your filters."}
          </p>
        </div>
      ) : (
        <div className="ksc-grid-cards">
          {filtered.map((c) => (
            <ContractCard
              key={c.contract_id}
              c={c}
              onSelect={onSelectContract}
              prevYes={prevYes[c.contract_id]}
            />
          ))}
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid var(--border)", color: "var(--text-faint)", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
        <span>© {new Date().getFullYear()} KalSC · Prediction markets done right.</span>
        <span>Auto-refreshing every 5s</span>
      </footer>
      </div>
    </div>
  );
}
