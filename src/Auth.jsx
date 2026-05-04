import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="ksc-auth-shell">
      <div className="ksc-auth-card ksc-fade-up">
        {/* Brand */}
        <div className="ksc-brand-mark" style={{ marginBottom: 22 }}>
          <span className="dot" />
          <span className="ksc-brand">KalSC</span>
        </div>

        {isLogin ? (
          <Login onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <Register onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
