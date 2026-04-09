import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { initiatePayment, verifyOTP } from "../services/api";

type Stage = "upi" | "otp" | "processing" | "success" | "failed";

export default function Checkout() {
  const { items, total, fetchCart, clear } = useCart();
  const nav = useNavigate();
  const [stage, setStage] = useState<Stage>("upi");
  const [upi, setUpi] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [txnId, setTxnId] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await initiatePayment(upi, total);
      setTxnId(res.data.transaction_id);
      setOtpHint(res.data.otp_hint);
      setStage("otp");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Payment initiation failed");
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter complete 6-digit OTP"); return; }
    setError("");
    setStage("processing");
    try {
      const res = await verifyOTP(txnId, code);
      setResult(res.data);
      setStage(res.data.success ? "success" : "failed");
      if (res.data.success) await clear();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Verification failed");
      setStage("otp");
    }
  };

  if (items.length === 0 && stage === "upi") {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="icon">🛒</div>
          <h3>Nothing to checkout</h3>
          <button className="btn btn-primary" onClick={() => nav("/")} style={{ marginTop: 16 }}>Go Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center" }}>
      <div className="checkout-card fade-in-up" style={{ width: "100%", maxWidth: 500 }}>

        {/* ── UPI INPUT ── */}
        {stage === "upi" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: "3rem", marginBottom: 8 }}>💳</div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Secure UPI Payment</h2>
              <p style={{ color: "#9d9dab", fontSize: "0.9rem" }}>Total: <strong style={{ color: "#10b981" }}>₹{total.toLocaleString()}</strong></p>
            </div>
            {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleInitiate}>
              <div className="input-group">
                <label>UPI ID</label>
                <input className="input-field" placeholder="yourname@upi" value={upi}
                  onChange={(e) => setUpi(e.target.value)} required />
                <span style={{ fontSize: "0.75rem", color: "#5a5a6e" }}>Format: name@bankname (e.g. gokul@upi)</span>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: "rgba(139,92,246,0.08)", borderRadius: 12, fontSize: "0.8rem", color: "#9d9dab" }}>
                🔐 <strong>Security:</strong> Your UPI ID will be AES-256 encrypted before transmission
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                style={{ width: "100%", marginTop: 20 }}>
                {loading ? <span className="spinner" /> : "Generate OTP 🔑"}
              </button>
            </form>
          </>
        )}

        {/* ── OTP ENTRY ── */}
        {stage === "otp" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: "3rem", marginBottom: 8 }}>🔢</div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Enter OTP</h2>
              <p style={{ color: "#9d9dab", fontSize: "0.9rem" }}>6-digit code sent to your UPI app</p>
            </div>
            {otpHint && (
              <div style={{ textAlign: "center", padding: 12, background: "rgba(16,185,129,0.1)", borderRadius: 12, marginBottom: 16, fontSize: "0.85rem" }}>
                🧪 <strong>Demo OTP:</strong> <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1.1rem", color: "#10b981" }}>{otpHint}</span>
              </div>
            )}
            {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="otp-container">
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => { otpRefs.current[i] = el; }} className="otp-box"
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)} />
              ))}
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleVerify}
              style={{ width: "100%" }}>
              Verify & Pay ₹{total.toLocaleString()} 🚀
            </button>
          </>
        )}

        {/* ── PROCESSING ── */}
        {stage === "processing" && (
          <div className="payment-status">
            <div className="spinner" style={{ width: 48, height: 48, margin: "0 auto 16px", borderWidth: 4 }} />
            <h2>Processing Payment...</h2>
            <p style={{ color: "#9d9dab" }}>Verifying OTP → Bank validation → Generating hash</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {stage === "success" && result && (
          <div className="payment-status">
            <div className="icon">✅</div>
            <h2 style={{ color: "#10b981" }}>Payment Successful!</h2>
            <p style={{ color: "#9d9dab" }}>₹{result.amount?.toLocaleString()} paid via UPI</p>
            {result.bank_ref && <p style={{ fontSize: "0.85rem", color: "#9d9dab" }}>Bank Ref: {result.bank_ref}</p>}
            {result.transaction_hash && (
              <div className="hash">
                <div style={{ fontSize: "0.7rem", color: "#5a5a6e", marginBottom: 4 }}>SHA-256 Transaction Hash</div>
                {result.transaction_hash}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => nav("/")}>Continue Shopping 🛍️</button>
              <button className="btn btn-secondary" onClick={() => nav("/history")}>View History 📋</button>
            </div>
          </div>
        )}

        {/* ── FAILED ── */}
        {stage === "failed" && (
          <div className="payment-status">
            <div className="icon" style={{ animation: "shake 0.5s ease" }}>❌</div>
            <h2 style={{ color: "#ef4444" }}>Payment Failed</h2>
            <p style={{ color: "#9d9dab" }}>{result?.message || "Bank declined the transaction"}</p>
            <button className="btn btn-primary" onClick={() => { setStage("upi"); setOtp(["","","","","",""]); setError(""); }}
              style={{ marginTop: 24 }}>
              Try Again 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
