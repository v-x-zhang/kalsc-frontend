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

  const contract = contracts[0];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Home</h1>

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