import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
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

  const contract = contracts[0];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Home</h1>
        <div>
          <p>Logged in as: <strong>{user?.username}</strong></p>
          <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {!contract ? (
        <p>No contracts yet.</p>
      ) : (
        <div style={{ border: "1px solid gray", padding: "16px", borderRadius: "8px", width: "300px" }}>
          <h2>{contract.contract_name}</h2>
          <p>{contract.contract_description}</p>
        </div>
      )}
    </div>
  );
}