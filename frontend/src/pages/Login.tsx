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
      setError(err.response?.data?.detail || "Authentication sequence failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass fade-in-up">
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '24px', 
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '2.5rem', margin: '0 auto 24px' 
        }}>🛡️</div>
        
        <h1>{isRegister ? "Join the Network" : "Secure Access"}</h1>
        <p className="subtitle" style={{ marginBottom: '32px' }}>
          {isRegister ? "Create your encrypted profile" : "Verify your identity to proceed"}
        </p>

        {error && <div className="error" style={{ 
          padding: '12px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', 
          color: 'var(--accent-rose)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' 
        }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isRegister && (
            <div className="input-group">
              <input 
                className="input-field" type="text" placeholder="Full Identity Name"
                value={name} onChange={(e) => setName(e.target.value)} required 
              />
            </div>
          )}
          <div className="input-group">
            <input 
              className="input-field" type="email" placeholder="Access Email"
              value={email} onChange={(e) => setEmail(e.target.value)} required 
            />
          </div>
          <div className="input-group">
            <input 
              className="input-field" type="password" placeholder="Security Token (Password)"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} 
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: "100%", padding: '16px' }}>
            {loading ? <div className="spinner" /> : (isRegister ? "Initialize Account" : "Authorize Access")}
          </button>
        </form>

        <div className="toggle" style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-400)' }}>
            {isRegister ? "Already part of the network?" : "New to the platform?"}
          </span>{" "}
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ 
              background: 'none', border: 'none', color: 'var(--accent-emerald)', 
              fontWeight: '700', cursor: 'pointer', outline: 'none' 
            }}
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </div>

        <div style={{ 
          marginTop: 32, padding: '16px', borderTop: '1px solid var(--glass-border)', 
          fontSize: "0.75rem", color: "var(--text-500)", textAlign: "center" 
        }}>
          Protocol: SHA-256 Hashing | AES-256 Encryption
        </div>
      </div>
    </div>
  );
}
