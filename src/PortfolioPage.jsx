import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import AppHeader from "./AppHeader";

function buildPortfolio(transactions, contractsById) {
  const byContract = new Map();

  for (const t of transactions) {
    const id = Number(t.contract_id);
    if (!byContract.has(id)) {
      byContract.set(id, {
        contract_id: id,
        contract_name: t.contract_name,
        qty: 0,
        avgCost: 0,
        realized: 0,
        buys: 0,
        sells: 0,
      });
    }

    const p = byContract.get(id);
    const px = Number(t.price);

    if (t.side === "BUY") {
      const nextQty = p.qty + 1;
      p.avgCost = nextQty > 0 ? ((p.avgCost * p.qty) + px) / nextQty : 0;
      p.qty = nextQty;
      p.buys += 1;
    } else {
      p.realized += px - p.avgCost;
      p.qty -= 1;
      p.sells += 1;
      if (p.qty <= 0) {
        p.qty = 0;
        p.avgCost = 0;
      }
    }
  }

  const rows = Array.from(byContract.values()).map((p) => {
    const c = contractsById.get(p.contract_id);
    const mark = c?.yes_mid != null ? Number(c.yes_mid) : null;
    const unrealized = mark != null ? (mark - p.avgCost) * p.qty : 0;
    const totalPnl = p.realized + unrealized;
    return {
      ...p,
      mark,
      unrealized,
      totalPnl,
      marketValue: mark != null ? mark * p.qty : null,
    };
  });

  return rows.sort((a, b) => Math.abs(b.marketValue ?? 0) - Math.abs(a.marketValue ?? 0));
}

export default function PortfolioPage({ onSelectContract, activeTab, onChangeTab }) {
  const { user, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const [txRes, cRes] = await Promise.all([
        fetch(`/api/users/${user.user_id}/transactions`),
        fetch("/api/contracts"),
      ]);
      const [txData, cData] = await Promise.all([txRes.json(), cRes.json()]);
      setTransactions(Array.isArray(txData) ? txData : []);
      setContracts(Array.isArray(cData) ? cData : []);
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  const contractsById = useMemo(() => {
    const m = new Map();
    for (const c of contracts) m.set(Number(c.contract_id), c);
    return m;
  }, [contracts]);

  const rows = useMemo(
    () => buildPortfolio(transactions, contractsById),
    [transactions, contractsById]
  );

  const summary = useMemo(() => {
    const openPositions = rows.filter((r) => r.qty > 0).length;
    const marketValue = rows.reduce((s, r) => s + (r.marketValue ?? 0), 0);
    const realized = rows.reduce((s, r) => s + r.realized, 0);
    const unrealized = rows.reduce((s, r) => s + r.unrealized, 0);
    return {
      openPositions,
      marketValue,
      realized,
      unrealized,
      totalPnl: realized + unrealized,
    };
  }, [rows]);

  const pnlColor = (v) => (v >= 0 ? "#4ade80" : "#f87171");
  const pnlStr = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}¢`;

  return (
    <div className="ksc-shell">
      <AppHeader activeTab={activeTab} onChangeTab={onChangeTab} user={user} onLogout={logout} />

      <div className="ksc-settings-wrap">
        {/* Left rail: summary */}
        <aside className="ksc-settings-rail">
          <section className="ksc-card">
            <div className="ksc-section-label" style={{ marginBottom: 12 }}>Summary</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { label: "Open Positions", value: summary.openPositions, mono: true },
                { label: "Market Value", value: `$${(summary.marketValue / 100).toFixed(2)}`, mono: true },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.08 }}>{label}</div>
                  <div style={{ marginTop: 4, fontWeight: 700, fontSize: 17 }} className="ksc-mono">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="ksc-card">
            <div className="ksc-section-label" style={{ marginBottom: 10 }}>P&amp;L</div>
            <div style={{ display: "grid", gap: 8 }}>
              <span className="ksc-pill" style={{ justifyContent: "space-between" }}>
                Realized <span className="ksc-mono" style={{ color: pnlColor(summary.realized) }}>{pnlStr(summary.realized)}</span>
              </span>
              <span className="ksc-pill" style={{ justifyContent: "space-between" }}>
                Unrealized <span className="ksc-mono" style={{ color: pnlColor(summary.unrealized) }}>{pnlStr(summary.unrealized)}</span>
              </span>
              <span className="ksc-pill" style={{ justifyContent: "space-between" }}>
                Total <span className="ksc-mono" style={{ color: pnlColor(summary.totalPnl), fontWeight: 700 }}>{pnlStr(summary.totalPnl)}</span>
              </span>
            </div>
          </section>
        </aside>

        {/* Right main: holdings */}
        <main className="ksc-settings-main">
          <section className="ksc-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="ksc-section-label">Holdings</div>
              <button className="ksc-btn" onClick={load}>Refresh</button>
            </div>

            {loading ? (
              <div className="ksc-skel" style={{ height: 140 }} />
            ) : rows.length === 0 ? (
              <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No positions yet.</div>
            ) : (
              <div className="ksc-settings-list">
                {rows.map((r) => (
                  <div key={r.contract_id} style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) auto",
                    gap: 10,
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                  }}>
                    {/* Left: name + details */}
                    <div style={{ minWidth: 0 }}>
                      <button
                        className="ksc-link-btn"
                        onClick={() => onSelectContract(r.contract_id)}
                        style={{ textAlign: "left", fontWeight: 600, fontSize: 13, marginBottom: 4, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
                      >
                        {r.contract_name}
                      </button>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11.5 }}>
                        <span className="ksc-mono" style={{ color: "var(--text-dim)" }}>{r.qty} shares</span>
                        <span className="ksc-mono" style={{ color: "var(--text-faint)" }}>avg {r.avgCost.toFixed(1)}¢</span>
                        {r.mark != null && <span className="ksc-mono" style={{ color: "var(--text-faint)" }}>mark {r.mark.toFixed(1)}¢</span>}
                        <span className="ksc-mono" style={{ color: "var(--text-faint)" }}>{r.buys}B / {r.sells}S</span>
                      </div>
                    </div>

                    {/* Right: PnL column */}
                    <div style={{ textAlign: "right" }}>
                      <div className="ksc-mono" style={{ fontSize: 14, fontWeight: 700, color: pnlColor(r.totalPnl) }}>
                        {pnlStr(r.totalPnl)}
                      </div>
                      <div className="ksc-mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                        unreal. <span style={{ color: pnlColor(r.unrealized) }}>{pnlStr(r.unrealized)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
