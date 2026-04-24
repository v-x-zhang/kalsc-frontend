import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

function PriceChart({ trades }) {
  if (trades.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>
        No trades yet — place the first order!
      </div>
    );
  }

  const W = 560, H = 140, PX = 12, PY = 12;
  const prices = trades.map((t) => t.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const innerW = W - PX * 2;
  const innerH = H - PY * 2;

  const pts = trades.map((t, i) => {
    const x = PX + (i / Math.max(trades.length - 1, 1)) * innerW;
    const y = PY + (1 - (t.price - minP) / range) * innerH;
    return [x, y];
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1][0].toFixed(1)} ${H - PY} L ${PX} ${H - PY} Z`;

  const lastPrice = prices[prices.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartFill)" />
        <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round" />
        {pts.length > 0 && (
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="#8b5cf6" />
        )}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
        <span>0¢</span>
        <span>Last: {lastPrice.toFixed(1)}¢</span>
        <span>100¢</span>
      </div>
    </div>
  );
}

function OrderbookSide({ entries, side }) {
  const isBid = side === "bids";
  const color = isBid ? "#8b5cf6" : "#6366f1";
  const label = isBid ? "Bids (Buy)" : "Asks (Sell)";
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "11px", fontWeight: "600", color, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      {entries.length === 0 ? (
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Empty</div>
      ) : (
        entries.slice(0, 8).map((o, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0", color: "#e5e7eb" }}>
            <span style={{ color }}>{o.book_price.toFixed(1)}¢</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>×{o.quantity_remaining}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function ContractPage({ contractId, onBack }) {
  const { user } = useContext(AuthContext);
  const [contract, setContract] = useState(null);
  const [trades, setTrades] = useState([]);
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
  const [form, setForm] = useState({ side: "YES", direction: "BUY", order_type: "LIMIT", price: "", quantity: "" });
  const [status, setStatus] = useState(null); // { ok: bool, msg: string }
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [cRes, tRes, oRes] = await Promise.all([
        fetch(`/api/contracts/${contractId}`),
        fetch(`/api/contracts/${contractId}/trades`),
        fetch(`/api/contracts/${contractId}/orderbook`),
      ]);
      if (cRes.ok) setContract(await cRes.json());
      if (tRes.ok) setTrades(await tRes.json());
      if (oRes.ok) setOrderbook(await oRes.json());
    } catch (err) {
      console.error("Failed to load contract data:", err);
    }
  };

  useEffect(() => { load(); }, [contractId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (key, a, b) => () => setForm((f) => ({ ...f, [key]: f[key] === a ? b : a }));

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

  const bg = "#110f15";
  const card = "#1a1625";
  const border = "rgba(139, 92, 246, 0.22)";
  const inputStyle = {
    background: "#0f0d14",
    border: "1px solid rgba(139, 92, 246, 0.35)",
    borderRadius: "8px",
    color: "#f3f4f6",
    padding: "10px 12px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };
  const toggleBtn = (active) => ({
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    background: active ? "#8b5cf6" : "rgba(139,92,246,0.1)",
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    transition: "all 0.12s",
  });

  return (
    <div style={{ padding: "28px 32px", fontFamily: "Inter, sans-serif", backgroundColor: bg, minHeight: "100vh", color: "white" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <button
          onClick={onBack}
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#c4b5fd", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "14px" }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#f3f4f6" }}>
            {contract?.contract_name ?? "Loading…"}
          </h1>
          {contract?.contract_description && (
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
              {contract.contract_description}
            </p>
          )}
        </div>
        {contract && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
            {[["YES", "#8b5cf6", contract.yes_bid, contract.yes_ask, contract.yes_mid],
              ["NO",  "#6366f1", contract.no_bid,  contract.no_ask,  contract.no_mid]].map(([label, color, bid, ask, mid]) => (
              <div key={label} style={{ textAlign: "center", background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "10px 16px", minWidth: "90px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color }}>{mid != null ? `${mid}¢` : "--"}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                  {bid != null ? `${bid}¢` : "?"} / {ask != null ? `${ask}¢` : "?"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

        {/* Left column: chart + orderbook */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Price chart */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Price History
            </div>
            <PriceChart trades={trades} />
          </div>

          {/* Orderbook */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Order Book
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              <OrderbookSide entries={orderbook.bids ?? []} side="bids" />
              <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
              <OrderbookSide entries={orderbook.asks ?? []} side="asks" />
            </div>
          </div>
        </div>

        {/* Right column: order form */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Place Order
          </div>

          {/* Side toggle */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Outcome</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["YES", "NO"].map((s) => (
                <button key={s} onClick={() => setForm((f) => ({ ...f, side: s }))} style={toggleBtn(form.side === s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Direction toggle */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Direction</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["BUY", "SELL"].map((d) => (
                <button key={d} onClick={() => setForm((f) => ({ ...f, direction: d }))} style={toggleBtn(form.direction === d)}>{d}</button>
              ))}
            </div>
          </div>

          {/* Order type toggle */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Order Type</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["LIMIT", "MARKET"].map((t) => (
                <button key={t} onClick={() => setForm((f) => ({ ...f, order_type: t }))} style={toggleBtn(form.order_type === t)}>{t}</button>
              ))}
            </div>
          </div>

          {/* Price (limit only) */}
          {form.order_type === "LIMIT" && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Price (0–100¢)</div>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="e.g. 60"
                value={form.price}
                onChange={set("price")}
                style={inputStyle}
              />
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Quantity (shares)</div>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 10"
              value={form.quantity}
              onChange={set("quantity")}
              style={inputStyle}
            />
          </div>

          {/* Cost estimate for limit orders */}
          {form.order_type === "LIMIT" && form.price && form.quantity && (
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "12px" }}>
              Est. cost: {(parseFloat(form.price) * parseInt(form.quantity, 10)).toFixed(0)}¢ total
            </div>
          )}

          <button
            onClick={submitOrder}
            disabled={submitting || contract?.is_open === false}
            style={{
              width: "100%",
              padding: "12px",
              background: submitting ? "rgba(139,92,246,0.4)" : "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.12s",
            }}
          >
            {submitting ? "Placing…" : `${form.direction} ${form.side}`}
          </button>

          {contract?.is_open === false && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#f87171", textAlign: "center" }}>
              This contract is closed
            </div>
          )}

          {status && (
            <div style={{
              marginTop: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              background: status.ok ? "rgba(134,239,172,0.1)" : "rgba(248,113,113,0.1)",
              color: status.ok ? "#86efac" : "#f87171",
              border: `1px solid ${status.ok ? "rgba(134,239,172,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}>
              {status.msg}
            </div>
          )}

          {/* User balance */}
          {user && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              Balance: <span style={{ color: "#c4b5fd" }}>${(user.balance / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
