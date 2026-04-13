import { useState, useEffect } from "react";
import { getProducts } from "../services/api";
import { useCart } from "../context/CartContext";

interface Product {
  _id: string; name: string; price: number; category: string;
  description: string; emoji: string; color: string;
}

const CATEGORIES = [
  { id: "all", label: "All Items", icon: "🌟" },
  { id: "electronics", label: "Tech", icon: "💻" },
  { id: "fashion", label: "Style", icon: "👗" },
  { id: "home", label: "Living", icon: "🏠" }
];

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
    finally { setTimeout(() => setAddingId(null), 800); }
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="fade-in-up">
          <h1>Experience <span className="gradient">Secure</span> Luxury</h1>
          <p>Discover a curated collection of premium products, protected by industry-leading encryption and decentralized protocols.</p>
        </div>
      </header>

      <div className="category-filters fade-in-up" style={{ animationDelay: "0.2s" }}>
        {CATEGORIES.map((c) => (
          <button 
            key={c.id} 
            className={category === c.id ? "active" : ""} 
            onClick={() => setCategory(c.id)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
          <p>Curating your experience...</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p, i) => (
            <div 
              key={p._id} 
              className="product-card glass glass-hover fade-in-up" 
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <div 
                className="product-card-image" 
                style={{ 
                  background: `radial-gradient(circle at center, ${p.color}33 0%, transparent 70%)`,
                  color: p.color
                }}
              >
                {p.emoji}
              </div>
              <div className="product-card-body">
                <h3>{p.name}</h3>
                <p className="description">{p.description}</p>
                <div className="product-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                  <span className="product-price">₹{p.price.toLocaleString()}</span>
                  <button 
                    className={`btn btn-sm ${addingId === p._id ? 'btn-secondary' : 'btn-primary'}`} 
                    onClick={() => handleAdd(p._id)}
                    disabled={addingId === p._id}
                  >
                    {addingId === p._id ? "✓ Secured" : "Acquire 🛒"}
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
