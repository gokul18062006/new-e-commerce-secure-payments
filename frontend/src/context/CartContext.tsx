import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import * as api from "../services/api";

interface CartItem {
  product_id: string; name: string; price: number;
  emoji: string; color: string; quantity: number;
}
interface CartCtx {
  items: CartItem[]; total: number; count: number; loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartCtx>({} as CartCtx);
export const useCart = () => useContext(CartContext);

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.getCart();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { /* not logged in */ }
    finally { setLoading(false); }
  }, []);

  const addItem = async (productId: string) => {
    await api.addToCart(productId);
    await fetchCart();
  };
  const updateQty = async (productId: string, qty: number) => {
    await api.updateCartItem(productId, qty);
    await fetchCart();
  };
  const removeItem = async (productId: string) => {
    await api.removeFromCart(productId);
    await fetchCart();
  };
  const clear = async () => {
    await api.clearCart();
    setItems([]); setTotal(0);
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, total, count, loading, fetchCart, addItem, updateQty, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}
