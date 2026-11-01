import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRODUCTS, CATEGORIES, type Product, type Category } from '../data/catalog'
import { demoMode, supabase } from '../lib/supabase'

export type CartItem = { product: Product; qty: number; colour: string }
export type Order = {
  id: string; date: string; items: CartItem[]; total: number; status: string;
  payment: string; paymentStatus: string; name: string; city: string; txnId?: string;
}
export type User = { id?: string; email: string; name: string; isAdmin: boolean } | null
export type AuthResult = { error?: string; user?: NonNullable<User>; needsConfirmation?: boolean }

type Shop = {
  cart: CartItem[]; wishlist: Product[]; orders: Order[]; user: User;
  products: Product[]; categories: Category[]; coupon: string | null; toast: string | null;
  authLoading: boolean;
  addToCart: (p: Product, qty?: number, colour?: string) => void;
  removeFromCart: (id: string) => void; setQty: (id: string, qty: number) => void;
  toggleWishlist: (p: Product) => void; clearCart: () => void;
  login: (email: string, admin?: boolean) => void; logout: () => void;
  loginWithPassword: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  placeOrder: (o: Omit<Order, 'id' | 'date' | 'status' | 'paymentStatus'>) => Order;
  updateOrderStatus: (id: string, status: string, paymentStatus?: string) => void;
  setProducts: (p: Product[]) => void; applyCoupon: (code: string) => boolean;
  setToast: (t: string | null) => void; demoMode: boolean;
}
const Ctx = createContext<Shop | null>(null)
export const useShop = () => useContext(Ctx)!
export const categoryNameFor = (categories: Category[], id: string) =>
  categories.find(c => c.id === id)?.name ?? CATEGORIES.find(c => c.id === id)?.name ?? id

const load = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb } catch { return fb } }

// Map a Supabase products row onto the app Product shape.
// The DB has no specs column, so specs (and any missing field) come from the
// local catalogue entry for the same id/slug when one exists. New DB-only
// products get an empty specs list rather than invented specifications.
// isDemo comes from the DB is_demo flag — demo labels are shown only for
// products where is_demo is true, never for approved live products.
const mapDbProduct = (row: Record<string, unknown>): Product => {
  const local = PRODUCTS.find(x => x.id === row.id || x.slug === row.slug)
  const colours = Array.isArray(row.colours) && row.colours.length ? (row.colours as string[]) : (local?.colours ?? ['Black'])
  return {
    id: String(row.id),
    sku: String(row.sku ?? local?.sku ?? ''),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category_id),
    price: Number(row.price ?? local?.price ?? 0),
    compareAt: row.compare_at != null ? Number(row.compare_at) : undefined,
    stock: Number(row.stock ?? local?.stock ?? 0),
    image: String(row.image_url || local?.image || '/images/earbuds.svg'),
    description: String(row.description ?? local?.description ?? ''),
    specs: local?.specs ?? [],
    colours,
    featured: Boolean(row.featured),
    bestseller: Boolean(row.bestseller),
    trending: Boolean(row.trending),
    isNew: Boolean(row.is_new),
    isDemo: Boolean(row.is_demo),
    seoTitle: String(row.seo_title ?? local?.seoTitle ?? `${row.name} — UK Accessories`),
    seoDescription: String(row.seo_description ?? local?.seoDescription ?? ''),
  }
}

async function fetchRole(userId: string): Promise<boolean> {
  if (!supabase) return false
  // Admin status is read from public.user_roles, never from a client button.
  // RLS on user_roles must allow a user to read their own row (see migration
  // notes in README); if the read fails, the user is treated as non-admin.
  try {
    const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).single()
    if (error || !data) return false
    return (data as { role?: string }).role === 'admin'
  } catch { return false }
}

async function fetchProfileName(userId: string, email: string): Promise<string> {
  if (!supabase) return email.split('@')[0]
  try {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
    const name = (data as { full_name?: string } | null)?.full_name
    return name || email.split('@')[0]
  } catch { return email.split('@')[0] }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => load('uk-cart', []))
  const [wishlist, setWishlist] = useState<Product[]>(() => load('uk-wishlist', []))
  const [orders, setOrders] = useState<Order[]>(() => load('uk-orders', []))
  // Live mode: the user comes from Supabase session restore only, never from
  // localStorage, so a stale demo sign-in can never resurrect an admin flag.
  const [user, setUser] = useState<User>(() => (demoMode ? load('uk-user', null) : null))
  const [authLoading, setAuthLoading] = useState<boolean>(() => !demoMode)
  const [products, setProductsState] = useState<Product[]>(PRODUCTS)
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [coupon, setCoupon] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => { localStorage.setItem('uk-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('uk-wishlist', JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem('uk-orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => { if (demoMode) localStorage.setItem('uk-user', JSON.stringify(user)) }, [user])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  // Live catalogue: Supabase products/categories first, local catalogue only
  // as a fallback when the query fails or returns empty (see code note below).
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('products').select('*').eq('published', true).order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name'),
        ])
        if (cancelled) return
        if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
          setProductsState((prodRes.data as Record<string, unknown>[]).map(mapDbProduct))
        }
        // Fallback (intentional, documented): if the Supabase product query
        // fails or returns empty, the local catalogue stays in place so the
        // shop is never blank. The same applies to categories below.
        if (!catRes.error && catRes.data && catRes.data.length > 0) {
          setCategories((catRes.data as Record<string, unknown>[]).map(r => ({
            id: String(r.id), name: String(r.name), slug: String(r.slug),
            description: String(r.description ?? ''),
          })))
        }
      } catch {
        // Network/query failure: keep the local catalogue fallback.
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Live session restore: getSession on load + onAuthStateChange afterwards.
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    let cancelled = false
    const applySession = async (userId: string, email: string) => {
      const [isAdmin, name] = await Promise.all([fetchRole(userId), fetchProfileName(userId, email)])
      if (!cancelled) setUser({ id: userId, email, name, isAdmin })
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const s = data.session
      if (s?.user?.email) await applySession(s.user.id, s.user.email)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT' || !session?.user?.email) { setUser(null); return }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await applySession(session.user.id, session.user.email)
      }
    })
    return () => { cancelled = true; listener.subscription.unsubscribe() }
  }, [])

  const value = useMemo<Shop>(() => ({
    cart, wishlist, orders, user, products, categories, coupon, toast, demoMode, authLoading,
    addToCart: (p, qty = 1, colour) => { setCart(c => { const ex = c.find(i => i.product.id === p.id); return ex ? c.map(i => i.product.id === p.id ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i) : [...c, { product: p, qty, colour: colour || p.colours[0] }] }); setToast(`${p.name} added to cart`) },
    removeFromCart: id => setCart(c => c.filter(i => i.product.id !== id)),
    setQty: (id, qty) => setCart(c => qty <= 0 ? c.filter(i => i.product.id !== id) : c.map(i => i.product.id === id ? { ...i, qty: Math.min(i.product.stock, qty) } : i)),
    toggleWishlist: p => { setWishlist(w => w.some(x => x.id === p.id) ? w.filter(x => x.id !== p.id) : [...w, p]) },
    clearCart: () => setCart([]),
    // Legacy demo-only sign-in. In live mode this is a no-op: an admin flag
    // must never be set from a button — only from Supabase Auth + user_roles.
    login: (email, admin = false) => {
      if (!demoMode) { setToast('Please sign in with your Supabase account.'); return }
      setUser({ email, name: email.split('@')[0], isAdmin: admin })
    },
    logout: async () => {
      if (supabase) { try { await supabase.auth.signOut() } catch { /* fall through to local clear */ } }
      setUser(null)
      try { localStorage.removeItem('uk-user') } catch { /* ignore */ }
    },
    loginWithPassword: async (email, password) => {
      if (!supabase) { setUser({ email, name: email.split('@')[0], isAdmin: false }); return { user: { email, name: email.split('@')[0], isAdmin: false } } }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user?.email) return { error: error?.message || 'Sign-in failed. Please check your email and password.' }
      const [isAdmin, name] = await Promise.all([fetchRole(data.user.id), fetchProfileName(data.user.id, data.user.email)])
      const u = { id: data.user.id, email: data.user.email, name, isAdmin }
      setUser(u)
      return { user: u }
    },
    register: async (name, email, password) => {
      if (!supabase) { setUser({ email, name, isAdmin: false }); return { user: { email, name, isAdmin: false } } }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) return { error: error.message }
      if (!data.session) return { needsConfirmation: true }
      const u = { id: data.user!.id, email, name, isAdmin: false }
      setUser(u)
      return { user: u }
    },
    resetPassword: async (email) => {
      if (!supabase) return {}
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
      if (error) return { error: error.message }
      return {}
    },
    placeOrder: (o) => {
      const order: Order = { ...o, id: `UK-${Date.now().toString().slice(-6)}`, date: new Date().toISOString().slice(0, 10), status: 'Pending', paymentStatus: o.payment === 'Cash on Delivery' ? 'Pay on delivery' : 'Pending verification' }
      setOrders(prev => [order, ...prev]); setCart([])
      // Demo-mode inventory: decrement local copy. In live Supabase mode this must
      // happen in a server-side transaction (see supabase/migrations + README).
      // Live orders are still browser-local until that server step is built.
      if (demoMode) setProductsState(prev => prev.map(pr => { const item = o.items.find(i => i.product.id === pr.id); return item ? { ...pr, stock: Math.max(0, pr.stock - item.qty) } : pr }))
      return order
    },
    updateOrderStatus: (id, status, paymentStatus) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o)),
    setProducts: setProductsState,
    applyCoupon: (code) => { if (code.trim().toUpperCase() === 'UK10') { setCoupon('UK10'); return true } return false },
    setToast,
  }), [cart, wishlist, orders, user, products, categories, coupon, toast, authLoading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
