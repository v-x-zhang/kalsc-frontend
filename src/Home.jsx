import { useEffect, useState } from "react";

export default function Home() {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    async function loadContracts() {
      try {
        const res = await fetch("/api/contracts");
        const data = await res.json();
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
        minHeight: "100vh",
        backgroundColor: "#0a0910",
        padding: "32px 20px 48px",
        fontFamily: "Inter, sans-serif",
        color: "#f3f4f6",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "36px",
        }}
      >
        <h1
          style={{
            fontFamily: "Qualy, sans-serif",
            fontSize: "42px",
            letterSpacing: "1.5px",
            margin: 0,
            background:
              "linear-gradient(180deg, #741BC1, #322B8E, #001897)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          KalSC
        </h1>
      </div>

      {contracts.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.6 }}>
          No contracts yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "40px",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {contracts.map((contract) => (
            <div
              key={contract.contract_id}
              style={{
                backgroundColor: "#14121b",
                borderRadius: "18px",
                padding: "28px",
                minHeight: "300px",
                border: "1px solid rgba(139, 92, 246, 0.12)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 26px rgba(139, 92, 246, 0.08)";
                e.currentTarget.style.border =
                  "1px solid rgba(139, 92, 246, 0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 10px rgba(0,0,0,0.5)";
                e.currentTarget.style.border =
                  "1px solid rgba(139, 92, 246, 0.12)";
              }}
            >
              {/* TITLE + DESCRIPTION */}
              <div style={{ marginBottom: "28px" }}>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    lineHeight: "1.4",
                  }}
                >
                  {contract.contract_name}
                </h2>

                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: "1.4",
                    minHeight: "22px",
                  }}
                >
                  {contract.contract_description || ""}
                </div>
              </div>

              <div style={{ display: "grid", gap: "24px" }}>
                {/* YES */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", marginBottom: "6px" }}>
                      Yes
                    </div>

                    <div
                      style={{
                        height: "6px",
                        background: "rgba(139, 92, 246, 0.18)",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${contract.yes_mid ?? 0}%`,
                          background: "#8b5cf6",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: "105px",
                      textAlign: "center",
                      border: "1px solid #8b5cf6",
                      borderRadius: "999px",
                      padding: "9px 16px",
                      fontSize: "19px",
                      fontWeight: "600",
                    }}
                  >
                    {contract.yes_mid ?? "--"}%
                  </div>
                </div>

                {/* NO */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", marginBottom: "6px" }}>
                      No
                    </div>

                    <div
                      style={{
                        height: "6px",
                        background: "rgba(99, 102, 241, 0.18)",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${contract.no_mid ?? 0}%`,
                          background: "#6366f1",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: "105px",
                      textAlign: "center",
                      border: "1px solid #6366f1",
                      borderRadius: "999px",
                      padding: "9px 16px",
                      fontSize: "19px",
                      fontWeight: "600",
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