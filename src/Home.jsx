import { useEffect, useState } from "react";

export default function Home() {
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
  <div style={{
    padding: "32px",
    fontFamily: "Inter, sans-serif",
    backgroundColor: "#110f15",
    minHeight: "100vh",
    color: "white"
  }}>
    <h1 style={{
      color: "#8b5cf6",
      fontSize: "28px",
      fontWeight: "600",
      marginBottom: "24px"
    }}>
      Home
    </h1>

    {contracts.length === 0 ? (
      <p style={{ color: "rgba(255,255,255,0.5)" }}>No contracts yet.</p>
    ) : (
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        {contracts.map((c) => (
          <div
            key={c.contract_id}
            style={{
              backgroundColor: "#1a1d24",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "16px",
              width: "280px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
              transition: "all 0.2s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.4)";
            }}
          >
            <h2 style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "6px"
            }}>
              {c.contract_name}
            </h2>

            <p style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "12px"
            }}>
              {c.contract_description || "No description"}
            </p>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px"
            }}>
              <span style={{
                color: "#0ac285", 
                fontWeight: "500"
              }}>
                Bid: {c.current_bid ?? "--"}
              </span>

              <span style={{
                color: "#f45b5b", 
                fontWeight: "500"
              }}>
                Ask: {c.current_ask ?? "--"}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}