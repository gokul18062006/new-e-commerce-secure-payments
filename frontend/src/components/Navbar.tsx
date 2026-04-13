import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useEffect } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count, fetchCart } = useCart();
  const loc = useLocation();

  useEffect(() => { fetchCart(); }, [fetchCart]);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon" style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--gradient-primary)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' 
          }}>🛡️</div>
          <span>SecurePay</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={loc.pathname === "/" ? "active" : ""}>
             <span>Shop</span>
          </Link>
          <Link to="/cart" className={`cart-badge ${loc.pathname === "/cart" ? "active" : ""}`}>
             <span>Cart</span>
            {count > 0 && <span className="count" style={{ 
              background: 'var(--accent-rose)', 
              boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)' 
            }}>{count}</span>}
          </Link>
          <Link to="/history" className={loc.pathname === "/history" ? "active" : ""}>
             <span>Orders</span>
          </Link>
          <button onClick={logout} className="logout-btn" style={{ marginLeft: '12px' }}>
             <span>{user?.name || "Logout"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
