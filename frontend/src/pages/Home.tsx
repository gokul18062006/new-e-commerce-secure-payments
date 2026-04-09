import { useState, useEffect } from "react";
import { getProducts } from "../services/api";
import { useCart } from "../context/CartContext";

interface Product {
  _id: string; name: string; price: number; category: string;
  description: string; emoji: string; color: string;
}

const CATEGORIES = ["all", "electronics", "fashion", "home"];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    getProducts(category === "all" ? undefined : category)
      .then((res) => setProducts(res.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const handleAdd = async (id: string) => {
    setAddingId(id);
    try { await addItem(id); } catch (e) { console.error(e); }
    finally { setTimeout(() => setAddingId(null), 600); }
  };

  return (
    <div className="page">
      <div className="hero">
        <h1>Shop with <span className="gradient">Confidence</span> 🛡️</h1>
        <p>Every transaction is protected with AES-256 encryption, SHA-256 integrity hashing, and real-time fraud detection.</p>
      </div>

      <div className="category-filters">
        {CATEGORIES.map((c) => (
          <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
            {c === "all" ? "🌟 All" : c === "electronics" ? "💻 Electronics" : c === "fashion" ? "👗 Fashion" : "🏠 Home"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading products...</p></div>
      ) : (
        <div className="product-grid">
          {products.map((p, i) => (
            <div key={p._id} className="product-card fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="product-card-image" style={{ background: `linear-gradient(135deg, ${p.color}22, ${p.color}44)` }}>
                {p.emoji}
              </div>
              <div className="product-card-body">
                <h3>{p.name}</h3>
                <p className="description">{p.description}</p>
                <div className="product-card-footer">
                  <span className="product-price">₹{p.price.toLocaleString()}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAdd(p._id)}
                    disabled={addingId === p._id}>
                    {addingId === p._id ? "✓ Added!" : "Add 🛒"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
