import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import AppHeader from "./AppHeader";

export default function SettingsPage({ activeTab, onChangeTab }) {
  const { user, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [keyName, setKeyName] = useState("");
  const [keyScope, setKeyScope] = useState("trade");
  const [keyRateLimit, setKeyRateLimit] = useState(60);
  const [keyAllowedIps, setKeyAllowedIps] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editScope, setEditScope] = useState("trade");
  const [editRateLimit, setEditRateLimit] = useState(60);
  const [editAllowedIps, setEditAllowedIps] = useState("");
  const [savingKeyPolicy, setSavingKeyPolicy] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const [txRes, keysRes] = await Promise.all([
        fetch(`/api/users/${user.user_id}/transactions`),
        fetch(`/api/users/${user.user_id}/api-keys`),
      ]);
      const [txData, keysData] = await Promise.all([txRes.json(), keysRes.json()]);
      setTransactions(Array.isArray(txData) ? txData : []);
      setApiKeys(Array.isArray(keysData) ? keysData : []);
    } catch (err) {
      console.error("Failed to load settings data:", err);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!user?.user_id || creatingKey) return;
    setCreatingKey(true);
    setApiKeyError("");
    setNewlyCreatedKey("");
    try {
      const res = await fetch(`/api/users/${user.user_id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim() || "bot-key",
          scope: keyScope,
          rate_limit_per_min: Number(keyRateLimit) || 60,
          allowed_ips: keyAllowedIps.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiKeyError(data.error || "Failed to create API key");
        return;
      }
      setNewlyCreatedKey(data.api_key || "");
      setKeyName("");
      setKeyAllowedIps("");
      setKeyRateLimit(60);
      await load();
    } catch (err) {
      console.error("Failed to create API key:", err);
      setApiKeyError("Network error while creating key");
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeApiKey = async (keyId) => {
    if (!user?.user_id || revokingKeyId != null) return;
    setRevokingKeyId(keyId);
    setApiKeyError("");
    try {
      const res = await fetch(`/api/users/${user.user_id}/api-keys/${keyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setApiKeyError(data.error || "Failed to revoke API key");
        return;
      }
      await load();
    } catch (err) {
      console.error("Failed to revoke API key:", err);
      setApiKeyError("Network error while revoking key");
    } finally {
      setRevokingKeyId(null);
    }
  };

  const beginEditPolicy = (k) => {
    setEditingKeyId(k.key_id);
    setEditName(k.name || "");
    setEditScope(k.scope || "trade");
    setEditRateLimit(k.rate_limit_per_min ?? 60);
    setEditAllowedIps(k.allowed_ips || "");
    setApiKeyError("");
  };

  const savePolicy = async () => {
    if (!user?.user_id || editingKeyId == null || savingKeyPolicy) return;
    setSavingKeyPolicy(true);
    setApiKeyError("");
    try {
      const res = await fetch(`/api/users/${user.user_id}/api-keys/${editingKeyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || "bot-key",
          scope: editScope,
          rate_limit_per_min: Number(editRateLimit) || 60,
          allowed_ips: editAllowedIps.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiKeyError(data.error || "Failed to update API key policy");
        return;
      }
      setEditingKeyId(null);
      await load();
    } catch (err) {
      console.error("Failed to update API key policy:", err);
      setApiKeyError("Network error while updating key policy");
    } finally {
      setSavingKeyPolicy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  const totals = useMemo(() => {
    const buys = transactions.filter((t) => t.side === "BUY").length;
    const sells = transactions.filter((t) => t.side === "SELL").length;
    return { buys, sells, total: transactions.length };
  }, [transactions]);

  return (
    <div className="ksc-shell">
      <AppHeader activeTab={activeTab} onChangeTab={onChangeTab} user={user} onLogout={logout} />

      <div className="ksc-settings-wrap">
        <aside className="ksc-settings-rail">
          <section className="ksc-card">
            <div className="ksc-section-label" style={{ marginBottom: 12 }}>Account</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.08 }}>Username</div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>{user?.username}</div>
              </div>
              <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.08 }}>Email</div>
                <div style={{ marginTop: 4, fontWeight: 600, wordBreak: "break-word" }}>{user?.email}</div>
              </div>
              <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.08 }}>Cash Balance</div>
                <div style={{ marginTop: 4, fontWeight: 700, fontSize: 18 }}>${((user?.balance ?? 0) / 100).toFixed(2)}</div>
              </div>
            </div>
          </section>

          <section className="ksc-card">
            <div className="ksc-section-label" style={{ marginBottom: 10 }}>Trade Totals</div>
            <div style={{ display: "grid", gap: 8 }}>
              <span className="ksc-pill" style={{ justifyContent: "space-between" }}>Total <span className="ksc-mono">{totals.total}</span></span>
              <span className="ksc-pill" style={{ justifyContent: "space-between" }}>Buys <span className="ksc-mono">{totals.buys}</span></span>
              <span className="ksc-pill" style={{ justifyContent: "space-between" }}>Sells <span className="ksc-mono">{totals.sells}</span></span>
            </div>
          </section>
        </aside>

        <main className="ksc-settings-main">
          <section className="ksc-card">
            <div className="ksc-section-label" style={{ marginBottom: 12 }}>API Keys</div>

            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>
              Create keys for bots, then send requests with header
              <span className="ksc-mono" style={{ color: "#c4b5fd", marginLeft: 6 }}>Authorization: Bearer YOUR_KEY</span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                className="ksc-input"
                style={{ flex: 1, minWidth: 220 }}
                placeholder="Key name (e.g. market-maker-bot)"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
              <select
                className="ksc-input"
                style={{ width: 120 }}
                value={keyScope}
                onChange={(e) => setKeyScope(e.target.value)}
              >
                <option value="trade">trade</option>
                <option value="read">read</option>
              </select>
              <button className="ksc-btn ksc-btn-primary" onClick={createApiKey} disabled={creatingKey}>
                {creatingKey ? "Creating..." : "Generate Key"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                className="ksc-input"
                type="number"
                min="1"
                max="10000"
                style={{ width: 180 }}
                value={keyRateLimit}
                onChange={(e) => setKeyRateLimit(e.target.value)}
                placeholder="Requests/min"
              />
              <input
                className="ksc-input"
                style={{ flex: 1, minWidth: 260 }}
                value={keyAllowedIps}
                onChange={(e) => setKeyAllowedIps(e.target.value)}
                placeholder="Allowed IPs CSV (optional), e.g. 203.0.113.7,198.51.100.10"
              />
            </div>

            {apiKeyError && (
              <div className="ksc-banner err" style={{ marginTop: 0 }}>{apiKeyError}</div>
            )}

            {newlyCreatedKey && (
              <div className="ksc-banner ok" style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 6, fontWeight: 700 }}>Copy this key now. It will not be shown in full again.</div>
                <div className="ksc-mono" style={{ fontSize: 12, wordBreak: "break-all" }}>{newlyCreatedKey}</div>
              </div>
            )}

            <div className="ksc-settings-list" style={{ marginTop: 12, maxHeight: 220 }}>
              {loading ? (
                <div className="ksc-skel" style={{ height: 80, borderRadius: 0 }} />
              ) : apiKeys.length === 0 ? (
                <div style={{ padding: 12, color: "var(--text-faint)", fontSize: 13 }}>No API keys yet.</div>
              ) : (
                apiKeys.map((k) => (
                  <div key={k.key_id} className="ksc-settings-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
                    <div className="ksc-settings-meta">
                      <div className="title">{k.name}</div>
                      <div className="sub">{k.preview} • {k.scope} • {k.rate_limit_per_min}/min • {k.allowed_ips ? `IPs: ${k.allowed_ips}` : "IPs: any"} • {new Date(k.created_at).toLocaleString()}</div>
                    </div>
                    <span className="ksc-mono" style={{ color: "#c4b5fd", fontSize: 11 }}>#{k.key_id}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="ksc-btn ksc-btn-ghost"
                        style={{ padding: "6px 10px", fontSize: 11 }}
                        onClick={() => beginEditPolicy(k)}
                        disabled={savingKeyPolicy || revokingKeyId === k.key_id}
                      >
                        Edit
                      </button>
                      <button
                        className="ksc-btn ksc-btn-ghost"
                        style={{ padding: "6px 10px", fontSize: 11 }}
                        disabled={revokingKeyId === k.key_id || savingKeyPolicy}
                        onClick={() => revokeApiKey(k.key_id)}
                      >
                        {revokingKeyId === k.key_id ? "Revoking..." : "Revoke"}
                      </button>
                    </div>

                    {editingKeyId === k.key_id && (
                      <div style={{ gridColumn: "1 / -1", marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, display: "grid", gap: 8 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input
                            className="ksc-input"
                            style={{ flex: 1, minWidth: 220 }}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Key name"
                          />
                          <select className="ksc-input" style={{ width: 120 }} value={editScope} onChange={(e) => setEditScope(e.target.value)}>
                            <option value="trade">trade</option>
                            <option value="read">read</option>
                          </select>
                          <input
                            className="ksc-input"
                            type="number"
                            min="1"
                            max="10000"
                            style={{ width: 170 }}
                            value={editRateLimit}
                            onChange={(e) => setEditRateLimit(e.target.value)}
                            placeholder="Requests/min"
                          />
                        </div>
                        <input
                          className="ksc-input"
                          value={editAllowedIps}
                          onChange={(e) => setEditAllowedIps(e.target.value)}
                          placeholder="Allowed IPs CSV (blank = any)"
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="ksc-btn ksc-btn-primary" onClick={savePolicy} disabled={savingKeyPolicy}>
                            {savingKeyPolicy ? "Saving..." : "Save Policy"}
                          </button>
                          <button className="ksc-btn" onClick={() => setEditingKeyId(null)} disabled={savingKeyPolicy}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="ksc-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="ksc-section-label">Historical Trades</div>
              <button className="ksc-btn" onClick={load}>Refresh</button>
            </div>

            {loading ? (
              <div className="ksc-skel" style={{ height: 120 }} />
            ) : transactions.length === 0 ? (
              <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No historical trades yet.</div>
            ) : (
              <div className="ksc-settings-list">
                {transactions.map((t) => (
                  <div key={t.transaction_id} className="ksc-settings-row">
                    <div className="ksc-settings-meta">
                      <div className="title">{t.contract_name}</div>
                      <div className="sub">{new Date(t.timestamp).toLocaleString()}</div>
                    </div>
                    <span className="ksc-mono" style={{ color: t.side === "BUY" ? "#4ade80" : "#f87171", fontWeight: 700 }}>{t.side}</span>
                    <span className="ksc-mono" style={{ color: "#e5e7eb" }}>{Number(t.price).toFixed(1)}¢</span>
                    <span className="ksc-mono" style={{ color: "var(--text-faint)", fontSize: 11 }}>#{t.contract_id}</span>
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
