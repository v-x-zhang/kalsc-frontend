import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Validate the stored user still exists in the DB before trusting it.
        fetch(`/api/users/${parsed.user_id}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("stale");
          })
          .then((fresh) => {
            // Refresh balance/email from server in case they changed.
            const merged = { ...parsed, ...fresh };
            setUser(merged);
            localStorage.setItem("user", JSON.stringify(merged));
          })
          .catch(() => {
            localStorage.removeItem("user");
          })
          .finally(() => setLoading(false));
        return;
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const parseErrorMessage = async (res, fallback) => {
    const text = await res.text();
    if (!text) return fallback;

    try {
      const json = JSON.parse(text);
      return json.message || json.error || fallback;
    } catch {
      return fallback;
    }
  };

  const register = async (username, password, balance, email) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, balance, email }),
      });

      if (!res.ok) {
        const message = await parseErrorMessage(res, "Invalid registration details.");
        throw new Error(message);
      }

      const data = await res.json();
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      return { success: true };
    } catch (err) {
      const message = err.message && /json/i.test(err.message)
        ? "Invalid registration details."
        : err.message;
      return { success: false, error: message };
    }
  };

  const login = async (username, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const message = await parseErrorMessage(res, "Invalid username or password.");
        throw new Error(message);
      }

      const data = await res.json();
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      return { success: true };
    } catch (err) {
      const message = err.message && /json/i.test(err.message)
        ? "Invalid username or password."
        : err.message;
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
