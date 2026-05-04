import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import AppHeader from "./AppHeader";

/* ---------- animated number ---------- */
function useAnimatedNumber(target, duration = 500) {
  const [v, setV] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (target == null || isNaN(target)) return;
    cancelAnimationFrame(rafRef.current);
    fromRef.current = v;
    startRef.current = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [target]);
  return v;
}

/* ---------- price chart ---------- */
function PriceChart({ trades, height = 220 }) {
  const W = 720, H = height, PX = 14, PY = 14;

  if (!trades || trades.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height, color: "var(--text-faint)", fontSize: 14 }}>
        No trades yet — be the first.
      </div>
    );
  }

  const prices = trades.map((t) => t.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = (max - min) || 1;
  const padR = range * 0.15;
  const lo = Math.max(0, min - padR), hi = Math.min(100, max + padR);
  const innerW = W - PX * 2, innerH = H - PY * 2;

  const pts = trades.map((t, i) => {
    const x = PX + (i / Math.max(trades.length - 1, 1)) * innerW;
    const y = PY + (1 - (t.price - lo) / (hi - lo)) * innerH;
    return [x, y];
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0].toFixed(1)} ${H - PY} L ${PX} ${H - PY} Z`;
  const lastPrice = prices[prices.length - 1];
  const first = prices[0];
  const delta = lastPrice - first;
  const deltaPct = first ? (delta / first) * 100 : 0;
  const isUp = delta >= 0;
  const color = isUp ? "#22c55e" : "#ef4444";

  const grid = [0.0, 0.25, 0.5, 0.75, 1.0].map((f) => PY + f * innerH);

  // Draw animation length
  const len = 1500;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 }}>
        <div className="ksc-mono" style={{ fontSize: 30, fontWeight: 800 }}>
          {lastPrice.toFixed(1)}<span style={{ fontSize: 18, color: "var(--text-faint)" }}>¢</span>
        </div>
        <div className="ksc-mono" style={{ fontSize: 13, color, fontWeight: 700 }}>
          {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} ({deltaPct.toFixed(1)}%)
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-faint)" }}>
          {trades.length} trade{trades.length !== 1 ? "s" : ""}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        <defs>
          <linearGradient id="cp-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="cp-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {grid.map((y, i) => (
          <line key={i} x1={PX} x2={W - PX} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#cp-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#cp-stroke)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ strokeDasharray: len, animation: "ksc-draw 1.4s ease-out forwards" }}
        />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={color}>
          <animate attributeName="r" values="4;7;4" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill="#fff" />
      </svg>
      <div className="ksc-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
        <span>{lo.toFixed(0)}¢</span>
        <span>{hi.toFixed(0)}¢</span>
      </div>
    </div>
  );
}

/* ---------- order book side with depth bars ---------- */
function OrderbookSide({ entries, side }) {
  const isBid = side === "bids";
  const color = isBid ? "#a78bfa" : "#818cf8";
  const label = isBid ? "Bids" : "Asks";

  const max = useMemo(() => {
    if (!entries || entries.length === 0) return 1;
    return Math.max(...entries.map((e) => e.quantity_remaining)) || 1;
  }, [entries]);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="ksc-section-label" style={{ color, marginBottom: 10 }}>{label}</div>
      {!entries || entries.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-faint)", padding: "10px 0" }}>Empty</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {entries.slice(0, 10).map((o, i) => {
            const pct = (o.quantity_remaining / max) * 100;
            return (
              <div key={i} style={{ position: "relative", padding: "5px 10px", borderRadius: 6, overflow: "hidden", fontSize: 12.5 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  [isBid ? "left" : "right"]: 0,
                  [isBid ? "right" : "left"]: "auto",
                  width: `${pct}%`,
                  background: isBid ? "rgba(167,139,250,0.13)" : "rgba(129,140,248,0.13)",
                  transition: "width .4s ease",
                }} />
                <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
                  <span className="ksc-mono" style={{ color, fontWeight: 600 }}>{o.book_price.toFixed(1)}¢</span>
                  <span className="ksc-mono" style={{ color: "var(--text-dim)" }}>{o.quantity_remaining}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- side stat card ---------- */
function SideStat({ label, color, mid, bid, ask }) {
  const m = useAnimatedNumber(mid != null ? mid : 0);
  return (
    <div style={{
      flex: 1,
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${color}55`,
      borderRadius: 14, padding: "12px 16px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div className="ksc-section-label" style={{ color }}>{label}</div>
      <div className="ksc-stat-num" style={{ fontSize: 24, color }}>
        {mid != null ? `${m.toFixed(0)}¢` : "—"}
      </div>
      <div className="ksc-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
        bid {bid != null ? `${bid}¢` : "?"} · ask {ask != null ? `${ask}¢` : "?"}
      </div>
    </div>
  );
}

/* ---------- main page ---------- */
export default function ContractPage({ contractId, onBack, activeTab, onChangeTab }) {
  const { user, logout } = useContext(AuthContext);
  const [contract, setContract] = useState(null);
  const [trades, setTrades] = useState([]);
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
  const [form, setForm] = useState({ side: "YES", direction: "BUY", order_type: "LIMIT", price: "", quantity: "" });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);
  const [priceFlash, setPriceFlash] = useState("");

  const load = async () => {
    try {
      const [cRes, tRes, oRes] = await Promise.all([
        fetch(`/api/contracts/${contractId}`),
        fetch(`/api/contracts/${contractId}/trades`),
        fetch(`/api/contracts/${contractId}/orderbook`),
      ]);
      if (cRes.ok) setContract(await cRes.json());
      if (tRes.ok) {
        const d = await tRes.json();
        const arr = Array.isArray(d) ? d : [];
        setTrades(arr);
        const last = arr.length ? arr[arr.length - 1].price : null;
        if (last != null && lastPrice != null && last !== lastPrice) {
          setPriceFlash(last > lastPrice ? "ksc-flash-up" : "ksc-flash-down");
          setTimeout(() => setPriceFlash(""), 900);
        }
        if (last != null) setLastPrice(last);
      }
      if (oRes.ok) setOrderbook(await oRes.json());
    } catch (err) {
      console.error("Failed to load contract data:", err);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [contractId]);

  const submitOrder = async () => {
    const qty = parseInt(form.quantity, 10);
    if (!qty || qty <= 0) return setStatus({ ok: false, msg: "Enter a valid quantity." });
    if (form.order_type === "LIMIT") {
      const p = parseFloat(form.price);
      if (isNaN(p) || p < 0 || p > 100) return setStatus({ ok: false, msg: "Price must be between 0 and 100." });
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const body = {
        user_id: user.user_id,
        contract_id: contractId,
        side: form.side,
        direction: form.direction,
        order_type: form.order_type,
        quantity: qty,
      };
      if (form.order_type === "LIMIT") body.price = parseFloat(form.price);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const fills = data.fills?.length ?? 0;
        setStatus({ ok: true, msg: `Order placed. ${fills} fill${fills !== 1 ? "s" : ""}, ${data.quantity_remaining} remaining.` });
        setForm((f) => ({ ...f, price: "", quantity: "" }));
        await load();
      } else {
        setStatus({ ok: false, msg: data.error || "Order failed." });
      }
    } catch {
      setStatus({ ok: false, msg: "Network error." });
    }
    setSubmitting(false);
  };

  const isOpen = contract?.is_open !== false;
  const estCost =
    form.order_type === "LIMIT" && form.price && form.quantity
      ? parseFloat(form.price) * parseInt(form.quantity, 10)
      : null;
  const shareCount = parseInt(form.quantity || "0", 10) || 0;
  const payoutIfNoDollars = shareCount;
  const orderbookView = form.side;

  const noViewFromAsks = (orderbook.asks ?? []).map((o) => ({
    ...o,
    no_book_price: 100 - Number(o.book_price),
  }));
  const noViewFromBids = (orderbook.bids ?? []).map((o) => ({
    ...o,
    no_book_price: 100 - Number(o.book_price),
  }));

  const noBids = [...noViewFromAsks].sort((a, b) => b.no_book_price - a.no_book_price);
  const noAsks = [...noViewFromBids].sort((a, b) => a.no_book_price - b.no_book_price);

  return (
    <div className="ksc-shell">
      <AppHeader activeTab={activeTab} onChangeTab={onChangeTab} user={user} onLogout={logout} />

      {/* Header */}
      <div className="ksc-fade-up" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <button className="ksc-btn ksc-btn-ghost" onClick={onBack}>← Back</button>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className={`ksc-tag ${isOpen ? "open" : "closed"}`}>
              {isOpen && <span className="ksc-live-dot" style={{ width: 6, height: 6 }} />}
              {isOpen ? "Live" : "Closed"}
            </span>
            <span className="ksc-section-label">Market #{contractId}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>
            {contract?.contract_name ?? "Loading…"}
          </h1>
          {contract?.contract_description && (
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>
              {contract.contract_description}
            </p>
          )}
        </div>

      </div>

      {/* Main grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 360px",
        gap: 20,
        alignItems: "start",
      }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Chart */}
          <div className="ksc-card ksc-fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="ksc-section-label">Price History</div>
              <div className="ksc-section-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="ksc-live-dot" /> Live · 3s
              </div>
            </div>
            <PriceChart trades={trades} />
          </div>

          {/* Order book */}
          <div className="ksc-card ksc-fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="ksc-section-label">Order Book</div>
              <div className="ksc-pill" style={{ background: "transparent" }}>
                <span style={{ color: "var(--text-faint)" }}>View</span>
                <span className="ksc-mono" style={{ color: "#e5e7eb", fontWeight: 700 }}>
                  BUY {orderbookView}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 12 }}>
              {orderbookView === "YES"
                ? "YES view quotes in YES cents. Bids = buy YES, asks = sell YES."
                : "NO view quotes in NO cents. Bids = buy NO, asks = sell NO."}
            </div>

            <div style={{ display: "flex", gap: 24 }}>
              {orderbookView === "YES" ? (
                <>
                  <OrderbookSide entries={orderbook.bids ?? []} side="bids" />
                  <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
                  <OrderbookSide entries={orderbook.asks ?? []} side="asks" />
                </>
              ) : (
                <>
                  <OrderbookSide
                    entries={noBids.map((o) => ({ ...o, book_price: o.no_book_price }))}
                    side="bids"
                  />
                  <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
                  <OrderbookSide
                    entries={noAsks.map((o) => ({ ...o, book_price: o.no_book_price }))}
                    side="asks"
                  />
                </>
              )}
            </div>
          </div>

          {/* Recent trades */}
          {trades.length > 0 && (
            <div className="ksc-card ksc-fade-up">
              <div className="ksc-section-label" style={{ marginBottom: 12 }}>Recent Trades</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                {[...trades].reverse().slice(0, 25).map((t, i, arr) => {
                  const prev = arr[i + 1]?.price;
                  const up = prev != null ? t.price >= prev : true;
                  return (
                    <div key={i} className="ksc-mono" style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 12.5, padding: "6px 8px",
                      background: i === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                      borderRadius: 6,
                    }}>
                      <span style={{ color: up ? "#4ade80" : "#f87171" }}>
                        {up ? "▲" : "▼"} {t.price.toFixed(1)}¢
                      </span>
                      <span style={{ color: "var(--text-faint)" }}>
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: order ticket */}
        <div className="ksc-fade-up" style={{ position: "sticky", top: 20 }}>
          {/* Probability bar at top */}
          {contract?.yes_mid != null && (
            <div className="ksc-card" style={{ marginBottom: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", marginBottom: 6 }}>
                <span style={{ color: "#a78bfa", fontWeight: 700 }}>YES {Number(contract.yes_mid).toFixed(0)}¢</span>
                <span style={{ color: "#818cf8", fontWeight: 700 }}>NO {Number(contract.no_mid ?? (100 - contract.yes_mid)).toFixed(0)}¢</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Number(contract.yes_mid)}%`,
                  background: "linear-gradient(90deg, #7c3aed, #818cf8)",
                  borderRadius: 4,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          )}

          {/* Main ticket card */}
          <div className="ksc-card" style={{
            background: "rgba(15,12,26,0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 0 40px -20px rgba(109,40,217,0.4)",
          }}>
            {/* Ticket header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.03 }}>Place Order</span>
              <span className="ksc-mono" style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 20,
                background: isOpen ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
                color: isOpen ? "#4ade80" : "var(--text-faint)",
                border: `1px solid ${isOpen ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
              }}>
                {isOpen ? "● OPEN" : "● CLOSED"}
              </span>
            </div>

            {/* Outcome + Direction in one row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.08 }}>Outcome</div>
                <div className="ksc-toggle-row" style={{ gap: 4 }}>
                  {["YES", "NO"].map((s) => (
                    <button key={s} className={`ksc-toggle ${form.side === s ? "active" : ""}`}
                      style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 700 }}
                      onClick={() => setForm((f) => ({ ...f, side: s }))}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.08 }}>Action</div>
                <div className="ksc-toggle-row" style={{ gap: 4 }}>
                  {["BUY", "SELL"].map((d) => (
                    <button key={d} className={`ksc-toggle ${form.direction === d ? "active" : ""}`}
                      style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 700 }}
                      onClick={() => setForm((f) => ({ ...f, direction: d }))}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Type */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.08 }}>Order Type</div>
              <div className="ksc-toggle-row" style={{ gap: 4 }}>
                {["LIMIT", "MARKET"].map((t) => (
                  <button key={t} className={`ksc-toggle ${form.order_type === t ? "active" : ""}`}
                    style={{ flex: 1, padding: "7px 0", fontSize: 12 }}
                    onClick={() => setForm((f) => ({ ...f, order_type: t }))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Price + Quantity */}
            <div style={{ display: "grid", gridTemplateColumns: form.order_type === "LIMIT" ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 14 }}>
              {form.order_type === "LIMIT" && (
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.08 }}>Price (¢)</div>
                  <input
                    className="ksc-input"
                    type="number" min="0" max="100" step="0.5"
                    placeholder="60"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.08 }}>Qty</div>
                <input
                  className="ksc-input"
                  type="number" min="1" step="1"
                  placeholder="10"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>

            {/* Order summary — glassy breakdown */}
            {(shareCount > 0 || estCost != null) && (
              <div style={{
                borderRadius: 10, marginBottom: 14, overflow: "hidden",
                border: "1px solid rgba(139,92,246,0.18)",
                background: "rgba(109,40,217,0.07)",
              }}>
                <div style={{ padding: "8px 12px", background: "rgba(109,40,217,0.1)", borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
                  <span style={{ fontSize: 10, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>
                    Order Preview
                  </span>
                </div>
                <div style={{ padding: "10px 12px", display: "grid", gap: 7, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-dim)" }}>
                    <span>Shares</span>
                    <span className="ksc-mono" style={{ color: "#e5e7eb", fontWeight: 700 }}>{shareCount}</span>
                  </div>
                  {estCost != null && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-dim)" }}>
                      <span>Est. {form.direction === "BUY" ? "cost" : "proceeds"}</span>
                      <span className="ksc-mono" style={{ color: "#c4b5fd", fontWeight: 700 }}>${(estCost / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {form.side === "NO" && shareCount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-dim)" }}>
                      <span>Payout if NO</span>
                      <span className="ksc-mono" style={{ color: "#4ade80", fontWeight: 700 }}>${payoutIfNoDollars.toFixed(2)}</span>
                    </div>
                  )}
                  {estCost != null && (
                    <div style={{ marginTop: 2 }}>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, (estCost / 100) / ((user?.balance ?? 10000) / 100) * 100)}%`,
                          background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                          borderRadius: 2,
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                        {Math.min(100, Math.round((estCost / 100) / ((user?.balance ?? 10000) / 100) * 100))}% of balance
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={submitOrder}
              disabled={submitting || !isOpen}
              style={{
                width: "100%", padding: "14px",
                border: "none", borderRadius: 10, cursor: isOpen ? "pointer" : "not-allowed",
                background: !isOpen
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)",
                boxShadow: !isOpen ? "none" : "0 6px 28px -8px rgba(139,92,246,0.8), inset 0 1px 0 rgba(255,255,255,0.15)",
                fontSize: 14, fontWeight: 800, letterSpacing: 0.06,
                color: isOpen ? "#fff" : "var(--text-faint)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "box-shadow 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => { if (isOpen) e.currentTarget.style.boxShadow = "0 8px 36px -8px rgba(139,92,246,1), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
              onMouseLeave={(e) => { if (isOpen) e.currentTarget.style.boxShadow = "0 6px 28px -8px rgba(139,92,246,0.8), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
            >
              {submitting && <span className="ksc-spinner" />}
              <span>{submitting ? "Placing…" : `${form.direction} ${form.side}`}</span>
            </button>

            {!isOpen && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>
                This contract is closed
              </div>
            )}

            {status && (
              <div className={`ksc-banner ${status.ok ? "ok" : "err"}`} style={{ marginTop: 10 }}>{status.msg}</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .ksc-shell > div[style*="grid-template-columns: minmax"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
