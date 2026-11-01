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
export type LiveCoupon = { code: string; discountType: string; discountValue: number; minOrder: number; active: boolean; expiresAt?: string | null; usageLimit?: number | null; usedCount: number }
export type LiveReview = { id: string; productId: string; productName: string; rating: number; body: string; status: string; createdAt: string }
export type LiveShipping = { id: string; name: string; price: number; freeOver?: number | null; zone: string; estimateDays?: string | null; active: boolean }
export type LiveBanner = { id: string; title: string; subtitle?: string | null; imageUrl?: string | null; linkUrl?: string | null; active: boolean; sortOrder: number }
export type StoreSettings = { storeName: string; slogan: string; whatsapp: string; currency: string; announcement?: string | null; instagramUrl?: string | null; facebookUrl?: string | null; tiktokUrl?: string | null; youtubeUrl?: string | null }
export type CustomerSummary = { id: string; email: string; name: string; orderCount: number; totalSpent: number }
export type CheckoutInput = { name: string; city: string; phone: string; email: string; country: string; address: string; postalCode?: string; notes?: string; payment: string; txnId?: string; screenshot?: File | null }

type Shop = {
  cart: CartItem[]; wishlist: Product[]; orders: Order[]; user: User;
  products: Product[]; categories: Category[]; coupon: string | null; toast: string | null;
  authLoading: boolean;
  liveCoupons: LiveCoupon[]; liveReviews: LiveReview[]; shippingMethods: LiveShipping[];
  storeSettings: StoreSettings | null; banners: LiveBanner[]; customers: CustomerSummary[];
  liveDataError: string | null; refreshLiveData: () => Promise<void>;
  couponDiscount: (subtotal: number) => number; shippingFor: (subtotalAfterDiscount: number) => number;
  placeOrderLive: (input: CheckoutInput) => Promise<{ order?: Order; error?: string }>;
  submitReview: (productId: string, rating: number, body: string) => Promise<{ error?: string }>;
  updateOrderStatusLive: (id: string, status: string, paymentStatus?: string, tracking?: string, notes?: string) => Promise<{ error?: string }>;
  updatePaymentLive: (orderId: string, status: string) => Promise<{ error?: string }>;
  saveProductLive: (p: Partial<Product> & { id?: string }) => Promise<{ error?: string }>;
  deleteProductLive: (id: string) => Promise<{ error?: string }>;
  approveProductLive: (id: string) => Promise<{ error?: string }>;
  saveCategoryLive: (c: { id: string; name: string; slug: string; description: string }) => Promise<{ error?: string }>;
  deleteCategoryLive: (id: string) => Promise<{ error?: string }>;
  saveCouponLive: (c: LiveCoupon) => Promise<{ error?: string }>;
  deleteCouponLive: (code: string) => Promise<{ error?: string }>;
  updateReviewLive: (id: string, status: string) => Promise<{ error?: string }>;
  deleteReviewLive: (id: string) => Promise<{ error?: string }>;
  saveShippingLive: (m: LiveShipping) => Promise<{ error?: string }>;
  deleteShippingLive: (id: string) => Promise<{ error?: string }>;
  saveSettingsLive: (s: StoreSettings) => Promise<{ error?: string }>;
  saveBannerLive: (b: Partial<LiveBanner> & { title: string }) => Promise<{ error?: string }>;
  deleteBannerLive: (id: string) => Promise<{ error?: string }>;
  updateStockLive: (id: string, stock: number) => Promise<{ error?: string }>;
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

// Best-effort: a signed-in user must have a profiles row, otherwise orders
// (orders.user_id -> profiles.id) and other FKs fail. The admin's row was
// created by SQL; customers who register in-app get one here. Failures are
// ignored on purpose — a missing profile must never block sign-in or the
// admin-role check, which runs independently in parallel.
async function ensureProfile(userId: string, email: string, name: string): Promise<void> {
  if (!supabase) return
  try {
    await supabase.from('profiles').upsert({ id: userId, email, full_name: name }, { onConflict: 'id' })
  } catch { /* ignore: profile creation is not sign-in critical */ }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => load('uk-cart', []))
  const [wishlist, setWishlist] = useState<Product[]>(() => load('uk-wishlist', []))
  // In live mode orders come from Supabase (fetched below), not from a
  // stale browser copy — a guest's live order is appended locally after
  // the server confirms it, so it still appears in Track/Profile.
  const [orders, setOrders] = useState<Order[]>(() => (demoMode ? load('uk-orders', []) : []))
  // Live mode: the user comes from Supabase session restore only, never from
  // localStorage, so a stale demo sign-in can never resurrect an admin flag.
  const [user, setUser] = useState<User>(() => (demoMode ? load('uk-user', null) : null))
  const [authLoading, setAuthLoading] = useState<boolean>(() => !demoMode)
  // Live mode starts empty and is filled by the Supabase fetch below, so
  // a deleted demo catalogue never flashes as the shop on first render.
  // Demo mode keeps the local catalogue as its data source.
  const [products, setProductsState] = useState<Product[]>(() => (demoMode ? PRODUCTS : []))
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [coupon, setCoupon] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [liveCoupons, setLiveCoupons] = useState<LiveCoupon[]>([])
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([])
  const [shippingMethods, setShippingMethods] = useState<LiveShipping[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)
  const [banners, setBanners] = useState<LiveBanner[]>([])
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [liveDataError, setLiveDataError] = useState<string | null>(null)
  useEffect(() => { localStorage.setItem('uk-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('uk-wishlist', JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem('uk-orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => { if (demoMode) localStorage.setItem('uk-user', JSON.stringify(user)) }, [user])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  // Live catalogue: Supabase products/categories first. In live mode a
  // successful product query that returns 0 rows means the shop is empty
  // (e.g. after all demo products are deleted) and must set products to [],
  // NOT fall back to the local catalogue. The local catalogue is kept only
  // when the query errors, or when there is no Supabase client / demo mode.
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
        if (!prodRes.error && prodRes.data) {
          setProductsState((prodRes.data as Record<string, unknown>[]).map(mapDbProduct))
        }
        // Categories are never deleted in the demo-removal flow, so the
        // category fallback below is unchanged: only a failed/empty
        // category query keeps the local categories.
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

  // Live data (orders, coupons, reviews, shipping, settings, banners,
  // customers). Runs when the session/user changes. Admins see all orders
  // and profiles; customers see only their own orders (RLS enforces both).
  // Guest visitors keep browser-local orders only — their live server
  // orders are appended locally after placeOrderLive succeeds.
  const fetchLiveData = async (forUser: User) => {
    if (!supabase) return
    try {
      const prodQuery = supabase.from('products').select('*').order('created_at', { ascending: false })
      const prodRes = forUser?.isAdmin ? await prodQuery : await prodQuery.eq('published', true)
      // Same empty-shop rule as the initial fetch: a successful query with
      // 0 rows sets products to [] (mappedProducts = []), and productById
      // must then also be empty — it must NOT fall back to PRODUCTS.
      // Only a query error (mappedProducts = null) keeps the local fallback,
      // so order/review lookups still resolve names for existing orders.
      const mappedProducts = !prodRes.error && prodRes.data
        ? (prodRes.data as Record<string, unknown>[]).map(mapDbProduct)
        : null
      if (mappedProducts) setProductsState(mappedProducts)
      const productById = new Map<string, Product>()
      ;(mappedProducts ?? PRODUCTS).forEach(p => productById.set(p.id, p))
      const mapDbOrder = (row: Record<string, unknown>, items: Record<string, unknown>[]): Order => ({
        id: String(row.id),
        date: String(row.created_at ?? '').slice(0, 10),
        items: items.map(it => {
          const prod = productById.get(String(it.product_id)) ?? {
            id: String(it.product_id), sku: String(it.product_id), slug: String(it.product_id), name: String(it.product_id),
            category: 'gadgets', price: Number(it.unit_price ?? 0), stock: 0, image: '/images/earbuds.svg',
            description: '', specs: [], colours: [String(it.colour ?? 'Black')],
            seoTitle: String(it.product_id), seoDescription: '',
          }
          return { product: prod, qty: Number(it.qty ?? 0), colour: String(it.colour ?? prod.colours[0] ?? 'Black') }
        }),
        total: Number(row.total ?? 0),
        status: String(row.status ?? 'Pending'),
        payment: String(row.payment_method ?? 'Cash on Delivery'),
        paymentStatus: String(row.payment_status ?? 'Pending verification'),
        name: String(row.customer_name ?? ''),
        city: String(row.city ?? ''),
        txnId: undefined,
      })
      let dbOrders: Order[] = []
      if (forUser?.isAdmin) {
        const ordRes = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
        if (!ordRes.error && ordRes.data) {
          const ids = (ordRes.data as Record<string, unknown>[]).map(r => String(r.id))
          const itemsRes = ids.length ? await supabase.from('order_items').select('*').in('order_id', ids) : { data: [] as Record<string, unknown>[], error: null }
          const byOrder = new Map<string, Record<string, unknown>[]>()
          ;((itemsRes.data ?? []) as Record<string, unknown>[]).forEach(it => {
            const arr = byOrder.get(String(it.order_id)) ?? []
            arr.push(it); byOrder.set(String(it.order_id), arr)
          })
          dbOrders = (ordRes.data as Record<string, unknown>[]).map(r => mapDbOrder(r, byOrder.get(String(r.id)) ?? []))
          // Payment transaction ids (manual orders) for the Payments tab.
          const payRes = ids.length ? await supabase.from('payments').select('order_id,transaction_id,status').in('order_id', ids) : { data: [] as Record<string, unknown>[], error: null }
          const payByOrder = new Map<string, Record<string, unknown>>()
          ;((payRes.data ?? []) as Record<string, unknown>[]).forEach(p => payByOrder.set(String(p.order_id), p))
          dbOrders = dbOrders.map(o => {
            const p = payByOrder.get(o.id)
            return p ? { ...o, txnId: String(p.transaction_id ?? ''), paymentStatus: String(p.status ?? o.paymentStatus) } : o
          })
        }
        const profRes = await supabase.from('profiles').select('id,email,full_name')
        if (!profRes.error && profRes.data) {
          const totals = new Map<string, { count: number; total: number }>()
          dbOrders.forEach(o => {
            // Admin orders do not carry user_id in the mapped shape; totals
            // per customer are computed from the raw rows below instead.
            void o
          })
          const rawOrders = await supabase.from('orders').select('user_id,total,status').limit(1000)
          if (!rawOrders.error && rawOrders.data) {
            ;(rawOrders.data as Record<string, unknown>[]).forEach(r => {
              if (!r.user_id) return
              const cur = totals.get(String(r.user_id)) ?? { count: 0, total: 0 }
              cur.count += 1
              if (r.status !== 'Cancelled' && r.status !== 'Refunded') cur.total += Number(r.total ?? 0)
              totals.set(String(r.user_id), cur)
            })
          }
          setCustomers((profRes.data as Record<string, unknown>[]).map(r => {
            const t = totals.get(String(r.id)) ?? { count: 0, total: 0 }
            return { id: String(r.id), email: String(r.email ?? ''), name: String(r.full_name ?? r.email ?? ''), orderCount: t.count, totalSpent: t.total }
          }))
        }
      } else if (forUser?.id) {
        const ordRes = await supabase.from('orders').select('*').eq('user_id', forUser.id).order('created_at', { ascending: false }).limit(100)
        if (!ordRes.error && ordRes.data) {
          const ids = (ordRes.data as Record<string, unknown>[]).map(r => String(r.id))
          const itemsRes = ids.length ? await supabase.from('order_items').select('*').in('order_id', ids) : { data: [] as Record<string, unknown>[], error: null }
          const byOrder = new Map<string, Record<string, unknown>[]>()
          ;((itemsRes.data ?? []) as Record<string, unknown>[]).forEach(it => {
            const arr = byOrder.get(String(it.order_id)) ?? []
            arr.push(it); byOrder.set(String(it.order_id), arr)
          })
          dbOrders = (ordRes.data as Record<string, unknown>[]).map(r => mapDbOrder(r, byOrder.get(String(r.id)) ?? []))
        }
      }
      if (forUser) setOrders(dbOrders)
      const coupRes = await supabase.from('coupons').select('*').order('code')
      if (!coupRes.error && coupRes.data) setLiveCoupons((coupRes.data as Record<string, unknown>[]).map(r => ({
        code: String(r.code), discountType: String(r.discount_type), discountValue: Number(r.discount_value ?? 0),
        minOrder: Number(r.min_order ?? 0), active: Boolean(r.active), expiresAt: r.expires_at as string | null,
        usageLimit: r.usage_limit as number | null, usedCount: Number(r.used_count ?? 0),
      })))
      const revRes = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(100)
      if (!revRes.error && revRes.data) setLiveReviews((revRes.data as Record<string, unknown>[]).map(r => ({
        id: String(r.id), productId: String(r.product_id), productName: productById.get(String(r.product_id))?.name ?? String(r.product_id),
        rating: Number(r.rating ?? 0), body: String(r.body ?? ''), status: String(r.status ?? 'pending'), createdAt: String(r.created_at ?? '').slice(0, 10),
      })))
      const shipRes = await supabase.from('shipping_methods').select('*').order('price')
      if (!shipRes.error && shipRes.data) setShippingMethods((shipRes.data as Record<string, unknown>[]).map(r => ({
        id: String(r.id), name: String(r.name), price: Number(r.price ?? 0), freeOver: r.free_over as number | null,
        zone: String(r.zone ?? 'Pakistan'), estimateDays: r.estimate_days as string | null, active: Boolean(r.active),
      })))
      const setRes = await supabase.from('store_settings').select('*').eq('id', 1).single()
      if (!setRes.error && setRes.data) {
        const s = setRes.data as Record<string, unknown>
        setStoreSettings({
          storeName: String(s.store_name ?? 'UK Accessories'), slogan: String(s.slogan ?? 'Upgrade Your Tech. Elevate Your Style.'),
          whatsapp: String(s.whatsapp ?? '+92 3170851250'), currency: String(s.currency ?? 'PKR'),
          announcement: s.announcement as string | null, instagramUrl: s.instagram_url as string | null,
          facebookUrl: s.facebook_url as string | null, tiktokUrl: s.tiktok_url as string | null, youtubeUrl: s.youtube_url as string | null,
        })
      }
      const banRes = await supabase.from('banners').select('*').order('sort_order')
      if (!banRes.error && banRes.data) setBanners((banRes.data as Record<string, unknown>[]).map(r => ({
        id: String(r.id), title: String(r.title), subtitle: r.subtitle as string | null, imageUrl: r.image_url as string | null,
        linkUrl: r.link_url as string | null, active: Boolean(r.active), sortOrder: Number(r.sort_order ?? 0),
      })))
      setLiveDataError(null)
    } catch (e) {
      setLiveDataError(e instanceof Error ? e.message : 'Live data could not be loaded.')
    }
  }
  useEffect(() => {
    if (supabase) void fetchLiveData(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.isAdmin])

  // Live session restore: getSession on load + onAuthStateChange afterwards.
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    let cancelled = false
    const applySession = async (userId: string, email: string) => {
      // Role and name are fetched in parallel so a slow/missing profiles
      // row can never block the admin-role check (the old failure mode).
      const [isAdmin, name] = await Promise.all([fetchRole(userId), fetchProfileName(userId, email)])
      if (!cancelled) setUser({ id: userId, email, name, isAdmin })
      await ensureProfile(userId, email, name)
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const s = data.session
      if (s?.user?.email) await applySession(s.user.id, s.user.email)
    }).catch(() => {
      // A failed session read must never leave /admin stuck on Loading…
      if (!cancelled) setUser(null)
    }).finally(() => {
      if (!cancelled) setAuthLoading(false)
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
      await ensureProfile(u.id, email, name)
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
      // Demo-mode inventory: decrement local copy. In live Supabase mode
      // orders go through placeOrderLive + the create_order() server function
      // (migration 003), which validates stock and decrements it atomically.
      if (demoMode) setProductsState(prev => prev.map(pr => { const item = o.items.find(i => i.product.id === pr.id); return item ? { ...pr, stock: Math.max(0, pr.stock - item.qty) } : pr }))
      return order
    },
    updateOrderStatus: (id, status, paymentStatus) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o)),
    setProducts: setProductsState,
    applyCoupon: (code) => {
      const upper = code.trim().toUpperCase()
      const live = liveCoupons.find(c => c.code.toUpperCase() === upper && c.active)
      if (live || upper === 'UK10') { setCoupon(upper); return true }
      return false
    },
    liveCoupons, liveReviews, shippingMethods, storeSettings, banners, customers, liveDataError,
    refreshLiveData: () => fetchLiveData(user),
    couponDiscount: (subtotal) => {
      if (!coupon) return 0
      const live = liveCoupons.find(c => c.code.toUpperCase() === coupon.toUpperCase() && c.active)
      if (live) {
        if (subtotal < live.minOrder) return 0
        if (live.expiresAt && new Date(live.expiresAt).getTime() < Date.now()) return 0
        return live.discountType === 'percent' ? Math.round(subtotal * live.discountValue / 100) : Math.min(live.discountValue, subtotal)
      }
      return coupon === 'UK10' ? Math.round(subtotal * 0.1) : 0
    },
    shippingFor: (afterDiscount) => {
      if (afterDiscount <= 0) return 0
      const method = shippingMethods.find(m => m.active)
      if (method) return method.freeOver != null && afterDiscount >= method.freeOver ? 0 : method.price
      return afterDiscount >= 5000 ? 0 : 250
    },
    placeOrderLive: async (input) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      try {
        const itemsJson = cart.map(i => ({ product_id: i.product.id, qty: i.qty, colour: i.colour }))
        if (!itemsJson.length) return { error: 'Your cart is empty.' }
        const { data, error } = await supabase.rpc('create_order', {
          p_customer_name: input.name, p_city: input.city, p_payment_method: input.payment,
          p_txn_id: input.txnId ?? '', p_items: itemsJson, p_shipping: 0, p_coupon: coupon,
          p_notes: input.notes ?? '',
        })
        if (error || !data) return { error: error?.message || 'Order could not be created. Your cart was kept.' }
        const orderId = String(data)
        if (user?.id) {
          try {
            await supabase.from('addresses').insert({
              user_id: user.id, full_name: input.name, phone: input.phone, email: input.email,
              country: input.country, city: input.city, address: input.address, postal_code: input.postalCode || null,
            })
          } catch { /* address is a convenience copy; the order itself already succeeded */ }
        }
        if (input.screenshot && user?.id && input.payment !== 'Cash on Delivery') {
          try {
            const path = `${orderId}/${Date.now()}-${input.screenshot.name}`
            const up = await supabase.storage.from('payment-screenshots').upload(path, input.screenshot)
            if (!up.error) await supabase.from('payments').update({ screenshot_url: path }).eq('order_id', orderId)
          } catch { /* screenshot upload failure must not undo a confirmed order; share it on WhatsApp */ }
        }
        const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
        const liveCoupon = liveCoupons.find(c => coupon && c.code.toUpperCase() === coupon.toUpperCase() && c.active)
        const discount = coupon ? (liveCoupon
          ? (liveCoupon.discountType === 'percent' ? Math.round(subtotal * liveCoupon.discountValue / 100) : Math.min(liveCoupon.discountValue, subtotal))
          : (coupon === 'UK10' ? Math.round(subtotal * 0.1) : 0)) : 0
        const method = shippingMethods.find(m => m.active)
        const shipping = subtotal - discount <= 0 ? 0 : (method ? (method.freeOver != null && subtotal - discount >= method.freeOver ? 0 : method.price) : (subtotal - discount >= 5000 ? 0 : 250))
        const order: Order = {
          id: orderId, date: new Date().toISOString().slice(0, 10), items: cart,
          total: subtotal - discount + shipping, status: 'Pending',
          payment: input.payment, paymentStatus: input.payment === 'Cash on Delivery' ? 'Pay on delivery' : 'Pending verification',
          name: input.name, city: input.city, txnId: input.txnId,
        }
        setOrders(prev => [order, ...prev.filter(o => o.id !== orderId)])
        setCart([])
        await fetchLiveData(user)
        return { order }
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Order could not be created. Your cart was kept.' }
      }
    },
    submitReview: async (productId, rating, body) => {
      if (!supabase) return { error: 'Reviews are only saved in live mode.' }
      if (!user?.id) return { error: 'Please sign in to write a review.' }
      if (rating < 1 || rating > 5 || !body.trim()) return { error: 'Please choose a rating from 1 to 5 and write a review.' }
      const { error } = await supabase.from('reviews').insert({ product_id: productId, user_id: user.id, rating, body: body.trim(), status: 'pending' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    updateOrderStatusLive: async (id, status, paymentStatus, tracking, notes) => {
      if (!supabase) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o))
        return {}
      }
      const prev = orders.find(o => o.id === id)
      if ((status === 'Cancelled' || status === 'Refunded') && prev && prev.status !== 'Cancelled' && prev.status !== 'Refunded') {
        for (const item of prev.items) {
          try {
            const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product.id).single()
            if (prod) await supabase.from('products').update({ stock: Number((prod as Record<string, unknown>).stock ?? 0) + item.qty }).eq('id', item.product.id)
          } catch { /* stock restore is best-effort; the status change still applies */ }
        }
      }
      const updates: Record<string, unknown> = { status }
      if (tracking !== undefined) updates.tracking_number = tracking
      if (notes !== undefined) updates.internal_notes = notes
      if (paymentStatus) updates.payment_status = paymentStatus
      const { error } = await supabase.from('orders').update(updates).eq('id', id)
      if (error) return { error: error.message }
      if (paymentStatus) {
        try { await supabase.from('payments').update({ status: paymentStatus }).eq('order_id', id) } catch { /* payment row may not exist for COD */ }
      }
      setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o))
      await fetchLiveData(user)
      return {}
    },
    updatePaymentLive: async (orderId, status) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error: payErr } = await supabase.from('payments').update({ status }).eq('order_id', orderId)
      if (payErr) return { error: payErr.message }
      const { error: ordErr } = await supabase.from('orders').update({ payment_status: status }).eq('id', orderId)
      if (ordErr) return { error: ordErr.message }
      await fetchLiveData(user)
      return {}
    },
    saveProductLive: async (p) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const slug = (p.slug || p.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `product-${Date.now()}`
      const row = {
        id: p.id ?? slug, sku: p.sku ?? `UK-${slug.toUpperCase().slice(0, 20)}`, slug,
        name: p.name ?? 'Untitled product', category_id: p.category ?? 'gadgets',
        price: p.price ?? 0, compare_at: p.compareAt ?? null, stock: p.stock ?? 0,
        description: p.description ?? '', image_url: p.image ?? '/images/earbuds.svg',
        colours: p.colours ?? ['Black'], featured: Boolean(p.featured), bestseller: Boolean(p.bestseller),
        trending: Boolean(p.trending), is_new: Boolean(p.isNew),
        is_demo: p.isDemo ?? true, published: true,
        seo_title: p.seoTitle ?? p.name ?? slug, seo_description: p.seoDescription ?? '',
      }
      const { error } = p.id
        ? await supabase.from('products').update(row).eq('id', p.id)
        : await supabase.from('products').insert(row)
      if (error) return { error: error.message }
      try { await supabase.from('inventory').upsert({ product_id: row.id, quantity: row.stock }, { onConflict: 'product_id' }) } catch { /* inventory mirror is best-effort */ }
      await fetchLiveData(user)
      return {}
    },
    deleteProductLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    approveProductLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('products').update({ is_demo: false }).eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveCategoryLive: async (c) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('categories').upsert({ id: c.id, name: c.name, slug: c.slug, description: c.description }, { onConflict: 'id' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteCategoryLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveCouponLive: async (c) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('coupons').upsert({
        code: c.code.toUpperCase(), discount_type: c.discountType, discount_value: c.discountValue,
        min_order: c.minOrder, active: c.active, expires_at: c.expiresAt || null,
        usage_limit: c.usageLimit ?? null,
      }, { onConflict: 'code' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteCouponLive: async (code) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('coupons').delete().eq('code', code)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    updateReviewLive: async (id, status) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteReviewLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveShippingLive: async (m) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('shipping_methods').upsert({
        id: m.id, name: m.name, price: m.price, free_over: m.freeOver ?? null,
        zone: m.zone, estimate_days: m.estimateDays ?? null, active: m.active,
      }, { onConflict: 'id' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteShippingLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('shipping_methods').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveSettingsLive: async (s) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('store_settings').upsert({
        id: 1, store_name: s.storeName, slogan: s.slogan, whatsapp: s.whatsapp, currency: s.currency,
        announcement: s.announcement ?? null, instagram_url: s.instagramUrl ?? null, facebook_url: s.facebookUrl ?? null,
        tiktok_url: s.tiktokUrl ?? null, youtube_url: s.youtubeUrl ?? null,
      }, { onConflict: 'id' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveBannerLive: async (b) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const row = {
        ...(b.id ? { id: b.id } : {}), title: b.title, subtitle: b.subtitle ?? null,
        image_url: b.imageUrl ?? null, link_url: b.linkUrl ?? null, active: b.active ?? true,
        sort_order: b.sortOrder ?? 0,
      }
      const { error } = b.id
        ? await supabase.from('banners').update(row).eq('id', b.id)
        : await supabase.from('banners').insert(row)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteBannerLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    updateStockLive: async (id, stock) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('products').update({ stock }).eq('id', id)
      if (error) return { error: error.message }
      try { await supabase.from('inventory').upsert({ product_id: id, quantity: stock }, { onConflict: 'product_id' }) } catch { /* best-effort */ }
      await fetchLiveData(user)
      return {}
    },
    setToast,
  }), [cart, wishlist, orders, user, products, categories, coupon, toast, authLoading, liveCoupons, liveReviews, shippingMethods, storeSettings, banners, customers, liveDataError])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
