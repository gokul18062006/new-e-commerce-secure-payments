import { useState, useEffect } from "react";
import { getPaymentHistory } from "../services/api";
import { useNavigate } from "react-router-dom";

interface Txn {
  id: string; amount: number; status: string; risk_level: string;
  transaction_hash: string; bank_ref: string; timestamp: string; completed_at: string;
}

export default function History() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    getPaymentHistory()
      .then((res) => setTxns(res.data.transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading-screen"><div className="spinner" /><p>Loading history...</p></div></div>;

  return (
    <div className="page">
      <h1 className="page-title">Transaction History</h1>
      <p className="page-subtitle">All your payment records with SHA-256 integrity hashes</p>

      {txns.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No transactions yet</h3>
          <p>Make your first purchase to see it here</p>
          <button className="btn btn-primary" onClick={() => nav("/")} style={{ marginTop: 16 }}>Start Shopping</button>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="txn-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Bank Ref</th>
                <th>Transaction Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t, i) => (
                <tr key={t.id} className="fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <td>{new Date(t.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>₹{t.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${t.status === "success" ? "badge-success" : t.status === "failed" ? "badge-danger" : "badge-warning"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.risk_level === "low" ? "badge-success" : t.risk_level === "medium" ? "badge-warning" : "badge-danger"}`}>
                      {t.risk_level}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{t.bank_ref || "—"}</td>
                  <td><span className="txn-hash" title={t.transaction_hash}>{t.transaction_hash || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 32, padding: 16, background: "rgba(16,185,129,0.06)", borderRadius: 12, fontSize: "0.8rem", color: "#9d9dab", textAlign: "center" }}>
        🔐 Each transaction is verified with SHA-256 cryptographic hashing for tamper-proof integrity
      </div>
    </div>
  );
}
