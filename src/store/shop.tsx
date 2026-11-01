import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRODUCTS, type Product } from '../data/catalog'
import { demoMode } from '../lib/supabase'

export type CartItem = { product: Product; qty: number; colour: string }
export type Order = {
  id: string; date: string; items: CartItem[]; total: number; status: string;
  payment: string; paymentStatus: string; name: string; city: string; txnId?: string;
}
type User = { email: string; name: string; isAdmin: boolean } | null

type Shop = {
  cart: CartItem[]; wishlist: Product[]; orders: Order[]; user: User;
  products: Product[]; coupon: string | null; toast: string | null;
  addToCart: (p: Product, qty?: number, colour?: string) => void;
  removeFromCart: (id: string) => void; setQty: (id: string, qty: number) => void;
  toggleWishlist: (p: Product) => void; clearCart: () => void;
  login: (email: string, admin?: boolean) => void; logout: () => void;
  placeOrder: (o: Omit<Order, 'id' | 'date' | 'status' | 'paymentStatus'>) => Order;
  updateOrderStatus: (id: string, status: string, paymentStatus?: string) => void;
  setProducts: (p: Product[]) => void; applyCoupon: (code: string) => boolean;
  setToast: (t: string | null) => void; demoMode: boolean;
}
const Ctx = createContext<Shop | null>(null)
export const useShop = () => useContext(Ctx)!

const load = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb } catch { return fb } }

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => load('uk-cart', []))
  const [wishlist, setWishlist] = useState<Product[]>(() => load('uk-wishlist', []))
  const [orders, setOrders] = useState<Order[]>(() => load('uk-orders', []))
  const [user, setUser] = useState<User>(() => load('uk-user', null))
  const [products, setProductsState] = useState<Product[]>(PRODUCTS)
  const [coupon, setCoupon] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => { localStorage.setItem('uk-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('uk-wishlist', JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem('uk-orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => { localStorage.setItem('uk-user', JSON.stringify(user)) }, [user])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  const value = useMemo<Shop>(() => ({
    cart, wishlist, orders, user, products, coupon, toast, demoMode,
    addToCart: (p, qty = 1, colour) => { setCart(c => { const ex = c.find(i => i.product.id === p.id); return ex ? c.map(i => i.product.id === p.id ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i) : [...c, { product: p, qty, colour: colour || p.colours[0] }] }); setToast(`${p.name} added to cart`) },
    removeFromCart: id => setCart(c => c.filter(i => i.product.id !== id)),
    setQty: (id, qty) => setCart(c => qty <= 0 ? c.filter(i => i.product.id !== id) : c.map(i => i.product.id === id ? { ...i, qty: Math.min(i.product.stock, qty) } : i)),
    toggleWishlist: p => { setWishlist(w => w.some(x => x.id === p.id) ? w.filter(x => x.id !== p.id) : [...w, p]) },
    clearCart: () => setCart([]),
    login: (email, admin = false) => setUser({ email, name: email.split('@')[0], isAdmin: admin }),
    logout: () => setUser(null),
    placeOrder: (o) => {
      const order: Order = { ...o, id: `UK-${Date.now().toString().slice(-6)}`, date: new Date().toISOString().slice(0, 10), status: 'Pending', paymentStatus: o.payment === 'Cash on Delivery' ? 'Pay on delivery' : 'Pending verification' }
      setOrders(prev => [order, ...prev]); setCart([])
      // Demo-mode inventory: decrement local copy. In live Supabase mode this must
      // happen in a server-side transaction (see supabase/migrations + README).
      if (demoMode) setProductsState(prev => prev.map(pr => { const item = o.items.find(i => i.product.id === pr.id); return item ? { ...pr, stock: Math.max(0, pr.stock - item.qty) } : pr }))
      return order
    },
    updateOrderStatus: (id, status, paymentStatus) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o)),
    setProducts: setProductsState,
    applyCoupon: (code) => { if (code.trim().toUpperCase() === 'UK10') { setCoupon('UK10'); return true } return false },
    setToast,
  }), [cart, wishlist, orders, user, products, coupon, toast])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
