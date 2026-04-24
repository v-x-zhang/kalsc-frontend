import { useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import Home from "./Home";
import Auth from "./Auth";
import ContractPage from "./ContractPage";

export default function App() {
  const { user, loading } = useContext(AuthContext);
  const [contractId, setContractId] = useState(null);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!user) return <Auth />;

  if (contractId) {
    return (
      <ContractPage
        contractId={contractId}
        onBack={() => setContractId(null)}
      />
    );
  }

  return <Home onSelectContract={setContractId} />;
}
