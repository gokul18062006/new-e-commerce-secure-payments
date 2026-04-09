import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { registerUser, loginUser } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = isRegister
        ? await registerUser(email, password, name)
        : await loginUser(email, password);
      login(res.data.access_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: 8 }}>🔐</div>
        <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
        <p className="subtitle">
          {isRegister ? "Join SecurePay for secure shopping" : "Sign in to your account"}
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input id="name" className="input-field" type="text" placeholder="Gokul"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" className="input-field" type="email" placeholder="you@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" className="input-field" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ width: "100%", marginTop: 8 }}>
            {loading ? <span className="spinner" /> : (isRegister ? "Create Account 🚀" : "Sign In 🔑")}
          </button>
        </form>

        <div className="toggle">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Sign In" : "Register"}
          </button>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: "rgba(16,185,129,0.08)", borderRadius: 12, fontSize: "0.8rem", color: "#9d9dab", textAlign: "center" }}>
          🔒 Protected with JWT Authentication &amp; Bcrypt Password Hashing
        </div>
      </div>
    </div>
  );
}
