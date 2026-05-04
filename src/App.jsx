import { useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import Home from "./Home";
import Auth from "./Auth";
import ContractPage from "./ContractPage";
import SettingsPage from "./SettingsPage";
import PortfolioPage from "./PortfolioPage";
import LeaderboardPage from "./LeaderboardPage";

export default function App() {
  const { user, loading } = useContext(AuthContext);
  const [contractId, setContractId] = useState(null);
  const [activeTab, setActiveTab] = useState("markets");

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    if (tab !== "markets") {
      setContractId(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "grid", placeItems: "center",
      }}>
        <div className="ksc-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="ksc-brand-mark">
            <span className="dot" />
            <span className="ksc-brand">KalSC</span>
          </div>
          <span className="ksc-spinner" />
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  if (contractId) {
    return (
      <ContractPage
        contractId={contractId}
        onBack={() => setContractId(null)}
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />
    );
  }

  if (activeTab === "portfolio") {
    return (
      <PortfolioPage
        onSelectContract={setContractId}
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />
    );
  }

  if (activeTab === "leaderboard") {
    return (
      <LeaderboardPage
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />
    );
  }

  if (activeTab === "settings") {
    return (
      <SettingsPage
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />
    );
  }

  return (
    <Home
      onSelectContract={setContractId}
      activeTab={activeTab}
      onChangeTab={handleChangeTab}
    />
  );
}
