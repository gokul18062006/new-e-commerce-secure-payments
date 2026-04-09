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
          🛒 <span>SecurePay</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={loc.pathname === "/" ? "active" : ""}>
            🏠 <span>Shop</span>
          </Link>
          <Link to="/cart" className={`cart-badge ${loc.pathname === "/cart" ? "active" : ""}`}>
            🛒 <span>Cart</span>
            {count > 0 && <span className="count">{count}</span>}
          </Link>
          <Link to="/history" className={loc.pathname === "/history" ? "active" : ""}>
            📋 <span>Orders</span>
          </Link>
          <button onClick={logout} title="Logout">
            👋 <span>{user?.name || "Logout"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
