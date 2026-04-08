import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import Home from "./Home";
import Auth from "./Auth";

export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  return user ? <Home /> : <Auth />;
}