import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const { items, total, loading, fetchCart, updateQty, removeItem } = useCart();
  const nav = useNavigate();

  useEffect(() => { fetchCart(); }, [fetchCart]);

  if (loading) return <div className="page"><div className="loading-screen"><div className="spinner" /><p>Loading cart...</p></div></div>;

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse our products and add items to get started</p>
          <button className="btn btn-primary" onClick={() => nav("/")} style={{ marginTop: 20 }}>
            Start Shopping 🛍️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Shopping Cart</h1>
      <p className="page-subtitle">{items.length} item{items.length > 1 ? "s" : ""} in your cart</p>

      <div className="cart-layout">
        <div>
          {items.map((item) => (
            <div key={item.product_id} className="cart-item fade-in-up">
              <div className="cart-item-emoji" style={{ background: `${item.color}22` }}>
                {item.emoji}
              </div>
              <div className="cart-item-details">
                <h4>{item.name}</h4>
                <span className="price">₹{item.price.toLocaleString()}</span>
              </div>
              <div className="cart-item-qty">
                <button onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
              </div>
              <div style={{ fontWeight: 700, minWidth: 80, textAlign: "right" }}>
                ₹{(item.price * item.quantity).toLocaleString()}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.product_id)}
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}>✕</button>
            </div>
          ))}
        </div>

        <div className="order-summary glass-card">
          <h3>Order Summary</h3>
          {items.map((i) => (
            <div className="row" key={i.product_id}>
              <span className="label">{i.name} × {i.quantity}</span>
              <span>₹{(i.price * i.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="row total">
            <span>Total</span>
            <span className="value">₹{total.toLocaleString()}</span>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 20 }}
            onClick={() => nav("/checkout")}>
            Proceed to Checkout 💳
          </button>
          <div style={{ marginTop: 12, textAlign: "center", fontSize: "0.75rem", color: "#5a5a6e" }}>
            🔒 Secured with AES-256 Encryption
          </div>
        </div>
      </div>
    </div>
  );
}
