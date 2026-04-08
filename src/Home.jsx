import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    async function loadContracts() {
      try {
        console.log("loading contracts from /api/contracts");
        const res = await fetch("/api/contracts");
        const data = await res.json();
        console.log("contracts:", data);
        setContracts(data);
      } catch (err) {
        console.error("Failed to load contracts:", err);
      }
    }

    loadContracts();
  }, []);

  return (
    <div
      style={{
        padding: "32px",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#110f15",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            color: "#8b5cf6",
            fontSize: "28px",
            fontWeight: "600",
            margin: 0,
          }}
        >
          Home
        </h1>

        <div>
          <p style={{ margin: "0 0 8px 0" }}>
            Logged in as: <strong>{user?.username}</strong>
          </p>
          <button
            onClick={logout}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {contracts.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.5)" }}>No contracts yet.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
    
    {contracts.map((contract) => (
  <div
    key={contract.contract_id}
    style={{
      backgroundColor: "#1a1625",
      borderRadius: "18px",
      padding: "20px",
      width: "420px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
      border: "1px solid rgba(139, 92, 246, 0.25)",
      transition: "all 0.15s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 92, 246, 0.18)";
      e.currentTarget.style.border = "1px solid rgba(139, 92, 246, 0.55)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.4)";
      e.currentTarget.style.border = "1px solid rgba(139, 92, 246, 0.25)";
    }}
  >
    <h2
      style={{
        fontSize: "22px",
        fontWeight: "600",
        marginBottom: "22px",
        lineHeight: "1.3",
        color: "#f3f4f6"
      }}
    >
      {contract.contract_name}
    </h2>

    <div style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "18px", marginBottom: "8px", color: "#e5e7eb" }}>Yes</div>
          <div style={{ height: "4px", width: "100%", background: "rgba(139, 92, 246, 0.18)", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${contract.yes_mid ?? 0}%`,
                background: "#8b5cf6",
                borderRadius: "999px"
              }}
            />
          </div>
        </div>

        <div
          style={{
            minWidth: "110px",
            textAlign: "center",
            border: "2px solid #8b5cf6",
            borderRadius: "999px",
            padding: "12px 18px",
            fontSize: "20px",
            fontWeight: "700",
            color: "#f3f4f6"
          }}
        >
          {contract.yes_mid ?? "--"}%
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "18px", marginBottom: "8px", color: "#e5e7eb" }}>No</div>
          <div style={{ height: "4px", width: "100%", background: "rgba(99, 102, 241, 0.18)", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${contract.no_mid ?? 0}%`,
                background: "#6366f1",
                borderRadius: "999px"
              }}
            />
          </div>
        </div>

        <div
          style={{
            minWidth: "110px",
            textAlign: "center",
            border: "2px solid #6366f1",
            borderRadius: "999px",
            padding: "12px 18px",
            fontSize: "20px",
            fontWeight: "700",
            color: "#f3f4f6"
          }}
        >
          {contract.no_mid ?? "--"}%
        </div>
      </div>
    </div>
  </div>
         ))}
        </div>
      )}
    </div>
  );
}