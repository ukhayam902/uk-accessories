import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { formatPKR } from '../data/catalog'
import { categoryNameFor, useShop } from '../store/shop'
import { demoMode } from '../lib/supabase'

const TABS = ['Overview', 'Products', 'Categories', 'Orders', 'Customers', 'Inventory', 'Coupons', 'Reviews', 'Payments', 'Shipping', 'Analytics', 'Website Content', 'Settings', 'Admin Profile'] as const
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded']

export function AdminPage() {
  const {
    user, orders, products, categories, updateOrderStatus, setToast, authLoading,
    liveCoupons, liveReviews, shippingMethods, storeSettings, banners, customers, liveDataError, refreshLiveData,
    updateOrderStatusLive, updatePaymentLive, saveProductLive, deleteProductLive, approveProductLive,
    saveCategoryLive, deleteCategoryLive, saveCouponLive, deleteCouponLive,
    updateReviewLive, deleteReviewLive, saveShippingLive, deleteShippingLive,
    saveSettingsLive, saveBannerLive, deleteBannerLive, updateStockLive, setProducts, logout,
  } = useShop()
  const nav = useNavigate()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [range, setRange] = useState('All time')
  // HOOKS MUST COME BEFORE ANY EARLY RETURN. Previously useMemo below ran
  // only after the authLoading / non-admin returns, so a direct load of
  // /admin (Loading… first, then dashboard) changed the hook count between
  // renders and React unmounted the whole tree as a blank page. Post-login
  // navigation worked only because authLoading was already false on mount.
  // All hooks and derived values are therefore computed unconditionally here.
  const revenue = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded').reduce((s, o) => s + o.total, 0)
  const lowStock = products.filter(p => p.stock < 20)
  const stats = [
    [demoMode ? 'Total Revenue (browser orders)' : 'Total Revenue (live orders)', formatPKR(revenue)],
    ['Total Orders', String(orders.length)],
    ['Total Products', String(products.length)],
    ['Total Customers', demoMode ? '— see Customers tab' : String(customers.length)],
    ['Pending Orders', String(orders.filter(o => o.status === 'Pending').length)],
    ['Completed / Delivered', String(orders.filter(o => o.status === 'Delivered').length)],
    ['Cancelled Orders', String(orders.filter(o => o.status === 'Cancelled').length)],
    ['Low Stock Products', String(lowStock.length)],
  ]
  const top = useMemo(() => {
    const m = new Map<string, number>()
    orders.forEach(o => o.items.forEach(i => m.set(i.product.name, (m.get(i.product.name) || 0) + i.qty)))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [orders])
  const [busy, setBusy] = useState<string | null>(null)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [prodForm, setProdForm] = useState({ id: '', name: '', price: '', stock: '', category: 'cases', description: '', featured: false, bestseller: false })
  const [catForm, setCatForm] = useState({ id: '', name: '', slug: '', description: '' })
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', discountValue: '', minOrder: '', active: true })
  const [shipForm, setShipForm] = useState({ id: '', name: '', price: '', freeOver: '', zone: 'Pakistan', estimateDays: '', active: true })
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', linkUrl: '', sortOrder: '0', active: true })
  const [settingsForm, setSettingsForm] = useState({ storeName: 'UK Accessories', slogan: 'Upgrade Your Tech. Elevate Your Style.', whatsapp: '+92 3170851250', currency: 'PKR', announcement: '', instagramUrl: '', facebookUrl: '', tiktokUrl: '', youtubeUrl: '' })
  const [tracking, setTracking] = useState<Record<string, string>>({})
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({})
  useEffect(() => {
    if (storeSettings) setSettingsForm({
      storeName: storeSettings.storeName, slogan: storeSettings.slogan, whatsapp: storeSettings.whatsapp,
      currency: storeSettings.currency, announcement: storeSettings.announcement ?? '',
      instagramUrl: storeSettings.instagramUrl ?? '', facebookUrl: storeSettings.facebookUrl ?? '',
      tiktokUrl: storeSettings.tiktokUrl ?? '', youtubeUrl: storeSettings.youtubeUrl ?? '',
    })
  }, [storeSettings])
  const run = async (label: string, fn: () => Promise<{ error?: string }>) => {
    setBusy(label); setFormMsg(null)
    const res = await fn()
    setBusy(null)
    if (res.error) setFormMsg(`${label} failed: ${res.error}`)
    else { setFormMsg(`${label} saved.`); setToast(`${label} saved.`) }
    return !res.error
  }
  const inputCls = 'border rounded px-3 py-2 text-sm w-full'
  if (authLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Loading…</h1><p className="text-neutral-600 mt-3">Checking your Supabase session and admin role… If this stays here, reload the page — your session is stored by Supabase, it is not lost.</p></div>
  }
  if (!user) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Sign in first</h1><p className="text-neutral-600 mt-3">You are not signed in on this device/browser, so /admin cannot show the dashboard yet — this is not a denial of your account. Sign in at /login first (with the admin Supabase account), then return to /admin and it will open. If you just signed in on another device, sign in here too: sessions are per-browser.</p><Link to="/login" className="inline-block mt-5 bg-black text-white px-6 py-2.5 rounded-full">Go to Login</Link></div>
  }
  if (!user.isAdmin) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Protected</h1><p className="text-neutral-600 mt-3">You are signed in as {user.email}, but that account does not have an <code>admin</code> row in Supabase <code>user_roles</code>, so it cannot open the dashboard. Ask an existing admin (or run the SQL in README “First admin setup”) to set that account's role to admin, then sign out and sign in again.</p>{demoMode && <p className="text-sm mt-3">In demo mode only, use the demo admin sign-in on the Login page to preview the dashboard. Frontend checks alone never grant admin rights in live mode — Supabase RLS enforces them.</p>}<Link to="/login" className="inline-block mt-5 bg-black text-white px-6 py-2.5 rounded-full">Go to Login</Link></div>
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="text-sm text-neutral-600">Signed in as {user.email} {demoMode ? '(demo admin preview)' : '(live admin, verified via Supabase user_roles)'}. {demoMode ? 'Figures below are calculated from orders in this browser — no fake statistics.' : 'Figures below are calculated from live Supabase orders — no fake statistics.'}</p></div><button onClick={() => nav('/')} className="border rounded-full px-4 py-2 text-sm h-fit">View Store</button></div>
      <div className="flex gap-2 flex-wrap mt-5">{TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`border rounded-full px-3 py-1.5 text-sm ${tab === t ? 'bg-black text-white' : ''}`}>{t}</button>)}<button onClick={async () => { await logout(); nav('/login') }} className="border rounded-full px-3 py-1.5 text-sm">Logout</button></div>
      {!demoMode && liveDataError && <p className="mt-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">Live data could not be loaded: {liveDataError} <button onClick={() => void refreshLiveData()} className="underline font-semibold ml-2">Retry</button></p>}
      {!demoMode && <button onClick={() => void refreshLiveData()} className="mt-4 border rounded-full px-3 py-1.5 text-sm">Refresh live data</button>}
      {formMsg && <p className="mt-4 bg-neutral-100 border rounded-xl px-4 py-3 text-sm">{formMsg}</p>}
      {busy && <p className="mt-4 text-sm text-neutral-500">Working: {busy}…</p>}

      {tab === 'Overview' && <div className="mt-6">
        <label className="text-sm font-semibold">Date filter: </label><select value={range} onChange={e => setRange(e.target.value)} className="border rounded-full px-3 py-1.5 text-sm"><option>All time</option><option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option><option>This Year</option><option>Custom Date Range</option></select><p className="text-xs text-neutral-500 mt-1">Filter selected: {range}. {demoMode ? 'In demo mode all browser orders are shown.' : 'Live mode lists Supabase orders (all customers, admin-only).'}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{stats.map(([k, v]) => <div key={k} className="border rounded-2xl p-4"><p className="text-xs text-neutral-500">{k}</p><p className="text-xl font-bold mt-1">{v}</p></div>)}</div>
        <div className="grid md:grid-cols-2 gap-4 mt-4"><div className="border rounded-2xl p-5"><h2 className="font-bold">Recent Orders</h2>{orders.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No orders yet.</p> : orders.slice(0, 5).map(o => <p key={o.id} className="text-sm py-1 border-b last:border-0">{o.id} — {o.status} — {formatPKR(o.total)} — {o.payment}</p>)}</div>
        <div className="border rounded-2xl p-5"><h2 className="font-bold">Top Selling Products (from orders above)</h2>{top.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No sales yet.</p> : top.map(([n, q]) => <p key={n} className="text-sm py-1 border-b last:border-0">{n} — {q} sold</p>)}<h2 className="font-bold mt-5">Sales / Revenue Chart</h2><p className="text-sm text-neutral-500">Chart data comes from the orders above. With no orders, the chart is empty by design — no invented trend is drawn.</p></div></div>
      </div>}

      {tab === 'Products' && <div className="mt-6"><h2 className="font-bold mb-3">Products ({products.length}{products.some(p => p.isDemo) ? ' — demo-flagged products are labelled as such' : ''})</h2>
        <div className="border rounded-2xl p-4 mb-4">
          <h3 className="font-semibold">{prodForm.id ? 'Edit product' : 'Add product'}</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input className={inputCls} placeholder="Product name" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} />
            <input className={inputCls} placeholder="Price (PKR)" type="number" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: e.target.value })} />
            <input className={inputCls} placeholder="Stock" type="number" value={prodForm.stock} onChange={e => setProdForm({ ...prodForm, stock: e.target.value })} />
            <select className={inputCls} value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <textarea className={`${inputCls} sm:col-span-2`} placeholder="Description" value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} />
          </div>
          <label className="text-sm mr-4"><input type="checkbox" checked={prodForm.featured} onChange={e => setProdForm({ ...prodForm, featured: e.target.checked })} /> Featured</label>
          <label className="text-sm"><input type="checkbox" checked={prodForm.bestseller} onChange={e => setProdForm({ ...prodForm, bestseller: e.target.checked })} /> Bestseller</label>
          <div className="flex gap-2 mt-3">
            <button disabled={busy !== null} onClick={async () => {
              if (!prodForm.name.trim()) { setFormMsg('Enter a product name first.'); return }
              const payload = { name: prodForm.name.trim(), price: Number(prodForm.price) || 0, stock: Number(prodForm.stock) || 0, category: prodForm.category, description: prodForm.description, featured: prodForm.featured, bestseller: prodForm.bestseller }
              if (demoMode) {
                setProducts(prodForm.id ? products.map(p => p.id === prodForm.id ? { ...p, ...payload } : p) : [...products, { id: prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), sku: `UK-${prodForm.name.toUpperCase().slice(0, 20)}`, slug: prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), image: '/images/earbuds.svg', specs: [], colours: ['Black'], seoTitle: prodForm.name, seoDescription: '', isDemo: true, ...payload }])
                setFormMsg('Product saved in this browser only (demo mode).'); setProdForm({ id: '', name: '', price: '', stock: '', category: 'cases', description: '', featured: false, bestseller: false })
              } else if (await run('Product', () => saveProductLive(prodForm.id ? { ...payload, id: prodForm.id, slug: products.find(p => p.id === prodForm.id)?.slug } : payload))) {
                setProdForm({ id: '', name: '', price: '', stock: '', category: 'cases', description: '', featured: false, bestseller: false })
              }
            }} className="bg-black text-white rounded-full px-4 py-2 text-sm">Save product</button>
            {prodForm.id && <button onClick={() => setProdForm({ id: '', name: '', price: '', stock: '', category: 'cases', description: '', featured: false, bestseller: false })} className="border rounded-full px-4 py-2 text-sm">Cancel edit</button>}
          </div>
          {demoMode && <p className="text-sm text-neutral-500 mt-2">Demo mode: product edits stay in this browser. In live mode the same form writes to Supabase <code>products</code> (RLS admin-only).</p>}
        </div>
        {products.map(p => <div key={p.id} className="border rounded-xl p-3 mb-2 flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{p.name}</p><p className="text-sm text-neutral-500">{categoryNameFor(categories, p.category)} • SKU {p.sku} • Stock {p.stock} • {formatPKR(p.price)}{p.isDemo ? ' • Demo price — approve only after the owner confirms it' : ''}</p></div><span className="flex gap-2 text-sm">
          <button onClick={() => setProdForm({ id: p.id, name: p.name, price: String(p.price), stock: String(p.stock), category: p.category, description: p.description, featured: Boolean(p.featured), bestseller: Boolean(p.bestseller) })} className="border rounded-full px-3 py-1">Edit</button>
          {!demoMode && p.isDemo && <button onClick={() => void run('Approve product', () => approveProductLive(p.id))} className="border rounded-full px-3 py-1">Approve (remove demo label)</button>}
          <button onClick={async () => { if (!window.confirm(`Delete ${p.name}?`)) return; if (demoMode) { setProducts(products.filter(x => x.id !== p.id)); setFormMsg('Product deleted in this browser only (demo mode).') } else await run('Delete product', () => deleteProductLive(p.id)) }} className="border rounded-full px-3 py-1">Delete</button>
        </span></div>)}
      </div>}

      {tab === 'Categories' && <div className="mt-6"><h2 className="font-bold mb-3">Categories ({categories.length})</h2>
        <div className="border rounded-2xl p-4 mb-4"><h3 className="font-semibold">{catForm.id ? 'Edit category' : 'Add category'}</h3><div className="grid sm:grid-cols-3 gap-3 mt-3">
          <input className={inputCls} placeholder="Name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
          <input className={inputCls} placeholder="Slug (e.g. wireless-earbuds)" value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} />
          <input className={inputCls} placeholder="Description" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
        </div><button disabled={busy !== null} onClick={async () => {
          if (!catForm.name.trim()) { setFormMsg('Enter a category name first.'); return }
          if (demoMode) { setFormMsg('Category edits need live mode — Supabase categories are read-only in this demo preview.'); return }
          const slug = catForm.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          if (await run('Category', () => saveCategoryLive({ id: catForm.id || slug, name: catForm.name.trim(), slug, description: catForm.description }))) setCatForm({ id: '', name: '', slug: '', description: '' })
        }} className="bg-black text-white rounded-full px-4 py-2 text-sm mt-3">Save category</button></div>
        {categories.map(c => <p key={c.id} className="border rounded-xl p-3 mb-2 flex flex-wrap justify-between gap-2"><span>{c.name} — {c.description}</span><span className="flex gap-2 text-sm"><button onClick={() => setCatForm({ id: c.id, name: c.name, slug: c.slug, description: c.description })} className="border rounded-full px-3 py-1">Edit</button>{!demoMode && <button onClick={async () => { if (window.confirm(`Delete category ${c.name}? Products in it keep their category id.`)) await run('Delete category', () => deleteCategoryLive(c.id)) }} className="border rounded-full px-3 py-1">Delete</button>}</span></p>)}
        <p className="text-sm text-neutral-500">Categories are loaded from Supabase <code>categories</code> in live mode, with the local catalogue as fallback only if that query fails or returns empty.</p></div>}

      {tab === 'Orders' && <div className="mt-6"><h2 className="font-bold mb-3">Orders</h2>{orders.length === 0 ? <p className="text-neutral-500">No orders yet.</p> : orders.map(o => <div key={o.id} className="border rounded-xl p-4 mb-3"><p className="font-semibold">{o.id} — {o.date} — {o.name}, {o.city} — {formatPKR(o.total)}</p><p className="text-sm">{o.items.map(i => `${i.product.name} × ${i.qty}`).join(', ')}</p><p className="text-sm">Payment: {o.payment} ({o.paymentStatus}) • Status: {o.status}</p>
        <label className="text-sm mt-2 block">Change status: <select value={o.status} onChange={e => { if (demoMode) { updateOrderStatus(o.id, e.target.value); setFormMsg('Order status changed in this browser only (demo mode).') } else void run('Order status', () => updateOrderStatusLive(o.id, e.target.value)) }} className="border rounded px-2 py-1">{ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
        {!demoMode && <div className="flex gap-2 mt-2"><input className="border rounded px-3 py-1.5 text-sm" placeholder="Tracking number (optional)" value={tracking[o.id] ?? ''} onChange={e => setTracking({ ...tracking, [o.id]: e.target.value })} /><button onClick={() => void run('Tracking number', () => updateOrderStatusLive(o.id, o.status, undefined, tracking[o.id] ?? '', undefined))} className="border rounded-full px-3 py-1.5 text-sm">Save tracking</button></div>}
      </div>)}</div>}

      {tab === 'Customers' && <div className="mt-6"><h2 className="font-bold">Customers</h2>{demoMode ? <p className="text-sm text-neutral-500 mt-2">Demo mode has no registered customer list (demo sign-in is local). Live mode lists Supabase <code>profiles</code> with order history and total spending, admin-only via RLS.</p> : customers.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No customer profiles yet.</p> : customers.map(c => <p key={c.id} className="border rounded-xl p-3 mb-2 text-sm">{c.name} — {c.email} — {c.orderCount} order(s) — {formatPKR(c.totalSpent)} total spent (cancelled/refunded excluded)</p>)}</div>}

      {tab === 'Inventory' && <div className="mt-6"><h2 className="font-bold mb-3">Inventory</h2><p className="text-sm text-neutral-500 mb-3">Low stock = under 20 units. {demoMode ? 'Demo orders decrement browser stock.' : 'Live orders decrement stock in the server transaction; cancelling/refunding restores it (admin-side increment).'}</p>{products.map(p => <div key={p.id} className={`border rounded-xl p-3 mb-2 flex flex-wrap gap-2 justify-between items-center ${p.stock < 20 ? 'border-amber-400 bg-amber-50' : ''}`}><span>{p.name} — {p.stock} in stock {p.stock < 20 ? '• LOW STOCK' : ''} {p.stock === 0 ? '• OUT OF STOCK' : ''}</span><span className="flex gap-2"><input className="border rounded px-2 py-1 text-sm w-24" type="number" placeholder="New stock" value={stockDraft[p.id] ?? ''} onChange={e => setStockDraft({ ...stockDraft, [p.id]: e.target.value })} /><button onClick={async () => { const v = Number(stockDraft[p.id]); if (Number.isNaN(v) || v < 0) { setFormMsg('Enter a stock number of 0 or more.'); return } if (demoMode) { setProducts(products.map(x => x.id === p.id ? { ...x, stock: v } : x)); setFormMsg('Stock changed in this browser only (demo mode).') } else await run('Stock', () => updateStockLive(p.id, v)) }} className="border rounded-full px-3 py-1 text-sm">Save</button></span></div>)}</div>}

      {tab === 'Coupons' && <div className="mt-6"><h2 className="font-bold">Coupons and Discounts</h2>
        <div className="border rounded-2xl p-4 my-4"><h3 className="font-semibold">Add coupon</h3><div className="grid sm:grid-cols-2 gap-3 mt-3">
          <input className={inputCls} placeholder="Code (e.g. UK10)" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} />
          <select className={inputCls} value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}><option value="percent">Percent %</option><option value="fixed">Fixed Rs.</option></select>
          <input className={inputCls} placeholder="Discount value" type="number" value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
          <input className={inputCls} placeholder="Minimum order (Rs.)" type="number" value={couponForm.minOrder} onChange={e => setCouponForm({ ...couponForm, minOrder: e.target.value })} />
        </div><label className="text-sm mt-3 block"><input type="checkbox" checked={couponForm.active} onChange={e => setCouponForm({ ...couponForm, active: e.target.checked })} /> Active</label>
        <button disabled={busy !== null} onClick={async () => {
          if (!couponForm.code.trim()) { setFormMsg('Enter a coupon code first.'); return }
          if (demoMode) { setFormMsg('Coupon edits need live mode. Demo coupon UK10 (10% off) is demo only.'); return }
          if (await run('Coupon', () => saveCouponLive({ code: couponForm.code.trim(), discountType: couponForm.discountType, discountValue: Number(couponForm.discountValue) || 0, minOrder: Number(couponForm.minOrder) || 0, active: couponForm.active, expiresAt: null, usageLimit: null, usedCount: 0 }))) setCouponForm({ code: '', discountType: 'percent', discountValue: '', minOrder: '', active: true })
        }} className="bg-black text-white rounded-full px-4 py-2 text-sm mt-3">Save coupon</button></div>
        {demoMode ? <p className="text-sm mt-2">Demo coupon: <strong>UK10</strong> — 10% off, demo only.</p> : liveCoupons.length === 0 ? <p className="text-sm text-neutral-500">No live coupons yet.</p> : liveCoupons.map(c => <p key={c.code} className="border rounded-xl p-3 mb-2 text-sm flex flex-wrap justify-between gap-2"><span>{c.code} — {c.discountType === 'percent' ? `${c.discountValue}% off` : `${formatPKR(c.discountValue)} off`} — min {formatPKR(c.minOrder)} — used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''} — {c.active ? 'Active' : 'Inactive'}</span><button onClick={() => void run('Delete coupon', () => deleteCouponLive(c.code))} className="border rounded-full px-3 py-1">Delete</button></p>)}
        <p className="text-sm text-neutral-500 mt-2">Live coupons live in Supabase <code>coupons</code> / <code>coupon_usage</code> with percentage/fixed discounts, minimum order, expiry and usage limits.</p></div>}

      {tab === 'Reviews' && <div className="mt-6"><h2 className="font-bold">Reviews</h2>{demoMode ? <p className="text-sm text-neutral-500 mt-2">Reviews are saved in live mode only, and none have been invented. Live reviews require approval in this section before they appear on the store.</p> : liveReviews.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No reviews yet, and none have been invented.</p> : liveReviews.map(r => <div key={r.id} className="border rounded-xl p-3 mb-2"><p className="font-semibold text-sm">{r.productName} — {r.rating}/5 — {r.status} — {r.createdAt}</p><p className="text-sm">{r.body}</p><span className="flex gap-2 mt-2 text-sm"><button onClick={() => void run('Review', () => updateReviewLive(r.id, 'approved'))} className="bg-black text-white rounded-full px-3 py-1">Approve</button><button onClick={() => void run('Review', () => updateReviewLive(r.id, 'rejected'))} className="border rounded-full px-3 py-1">Reject</button><button onClick={() => void run('Delete review', () => deleteReviewLive(r.id))} className="border rounded-full px-3 py-1">Delete</button></span></div>)}
      </div>}

      {tab === 'Payments' && <div className="mt-6"><h2 className="font-bold mb-3">Payments — COD vs Manual, kept separate</h2>
        <h3 className="font-semibold mt-4">Cash on Delivery</h3>{orders.filter(o => o.payment === 'Cash on Delivery').map(o => <p key={o.id} className="text-sm border rounded p-3 mt-2">{o.id} — {o.status} — {formatPKR(o.total)} — {o.paymentStatus}</p>)}
        <h3 className="font-semibold mt-4">Manual JazzCash / Easypaisa — pending verification</h3>{orders.filter(o => o.payment !== 'Cash on Delivery').length === 0 ? <p className="text-sm text-neutral-500 mt-2">No manual-payment orders yet.</p> : orders.filter(o => o.payment !== 'Cash on Delivery').map(o => <div key={o.id} className="border rounded p-3 mt-2 flex flex-wrap gap-2 justify-between"><span className="text-sm">{o.id} — {o.payment} — Txn: {o.txnId || 'not provided'} — {o.paymentStatus}</span><span className="flex gap-2"><button onClick={() => { if (demoMode) { updateOrderStatus(o.id, o.status, 'Verified'); setToast('Payment verified') } else void run('Payment', () => updatePaymentLive(o.id, 'Verified')) }} className="bg-black text-white rounded-full px-3 py-1 text-sm">Approve</button><button onClick={() => { if (demoMode) { updateOrderStatus(o.id, o.status, 'Rejected'); setToast('Payment rejected') } else void run('Payment', () => updatePaymentLive(o.id, 'Rejected')) }} className="border rounded-full px-3 py-1 text-sm">Reject</button></span></div>)}
        <p className="text-sm text-neutral-500 mt-3">No JazzCash/Easypaisa account numbers are published on this site. Manual-payment screenshots (signed-in customers) are stored in the private <code>payment-screenshots</code> bucket; guest customers share the screenshot on WhatsApp.</p></div>}

      {tab === 'Shipping' && <div className="mt-6"><h2 className="font-bold">Shipping</h2>
        <div className="border rounded-2xl p-4 my-4"><h3 className="font-semibold">{shipForm.id ? 'Edit shipping method' : 'Add shipping method'}</h3><div className="grid sm:grid-cols-2 gap-3 mt-3">
          <input className={inputCls} placeholder="Name (e.g. Standard Delivery)" value={shipForm.name} onChange={e => setShipForm({ ...shipForm, name: e.target.value })} />
          <input className={inputCls} placeholder="Price (Rs.)" type="number" value={shipForm.price} onChange={e => setShipForm({ ...shipForm, price: e.target.value })} />
          <input className={inputCls} placeholder="Free over (Rs., optional)" type="number" value={shipForm.freeOver} onChange={e => setShipForm({ ...shipForm, freeOver: e.target.value })} />
          <input className={inputCls} placeholder="Zone (e.g. Pakistan)" value={shipForm.zone} onChange={e => setShipForm({ ...shipForm, zone: e.target.value })} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Estimate (e.g. 2-4 days)" value={shipForm.estimateDays} onChange={e => setShipForm({ ...shipForm, estimateDays: e.target.value })} />
        </div><label className="text-sm mt-3 block"><input type="checkbox" checked={shipForm.active} onChange={e => setShipForm({ ...shipForm, active: e.target.checked })} /> Active (checkout uses the first active method)</label>
        <button disabled={busy !== null} onClick={async () => {
          if (!shipForm.name.trim()) { setFormMsg('Enter a shipping method name first.'); return }
          if (demoMode) { setFormMsg('Shipping edits need live mode. Demo rule: Rs. 250, free over Rs. 5,000.'); return }
          const id = shipForm.id || `ship-${Date.now()}`
          if (await run('Shipping method', () => saveShippingLive({ id, name: shipForm.name.trim(), price: Number(shipForm.price) || 0, freeOver: shipForm.freeOver ? Number(shipForm.freeOver) : null, zone: shipForm.zone || 'Pakistan', estimateDays: shipForm.estimateDays || null, active: shipForm.active }))) setShipForm({ id: '', name: '', price: '', freeOver: '', zone: 'Pakistan', estimateDays: '', active: true })
        }} className="bg-black text-white rounded-full px-4 py-2 text-sm mt-3">Save shipping method</button></div>
        {demoMode ? <p className="text-sm mt-2">Demo rule: Rs. 250, free over Rs. 5,000.</p> : shippingMethods.length === 0 ? <p className="text-sm text-neutral-500">No live shipping methods yet — add one above, otherwise checkout falls back to Rs. 250 / free over Rs. 5,000.</p> : shippingMethods.map(m => <p key={m.id} className="border rounded-xl p-3 mb-2 text-sm flex flex-wrap justify-between gap-2"><span>{m.name} — {formatPKR(m.price)}{m.freeOver != null ? ` — free over ${formatPKR(m.freeOver)}` : ''} — {m.zone}{m.estimateDays ? ` — ${m.estimateDays}` : ''} — {m.active ? 'Active' : 'Inactive'}</span><span className="flex gap-2"><button onClick={() => setShipForm({ id: m.id, name: m.name, price: String(m.price), freeOver: m.freeOver != null ? String(m.freeOver) : '', zone: m.zone, estimateDays: m.estimateDays ?? '', active: m.active })} className="border rounded-full px-3 py-1">Edit</button><button onClick={() => void run('Delete shipping method', () => deleteShippingLive(m.id))} className="border rounded-full px-3 py-1">Delete</button></span></p>)}
        <p className="text-sm text-neutral-500 mt-2">International delivery is not enabled until courier rates are confirmed.</p></div>}

      {tab === 'Analytics' && <div className="mt-6"><h2 className="font-bold">Analytics</h2><p className="text-sm text-neutral-500 mt-2">Revenue {formatPKR(revenue)} • Orders {orders.length} • Products {products.length} — all calculated from {demoMode ? 'browser' : 'live Supabase'} orders above. No external analytics or invented traffic is reported.</p></div>}

      {tab === 'Website Content' && <div className="mt-6"><h2 className="font-bold">Website Content</h2><p className="text-sm mt-2">Hero heading: TECHNOLOGY MEETS STYLE. Supporting text: Discover premium accessories designed for your everyday life. Announcement bar, banners, featured collections and footer are editable in live mode via <code>banners</code> and <code>store_settings</code>.</p>
        <div className="border rounded-2xl p-4 my-4"><h3 className="font-semibold">Add banner</h3><div className="grid sm:grid-cols-2 gap-3 mt-3">
          <input className={inputCls} placeholder="Title" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} />
          <input className={inputCls} placeholder="Subtitle (optional)" value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
          <input className={inputCls} placeholder="Link URL (optional)" value={bannerForm.linkUrl} onChange={e => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} />
          <input className={inputCls} placeholder="Sort order" type="number" value={bannerForm.sortOrder} onChange={e => setBannerForm({ ...bannerForm, sortOrder: e.target.value })} />
        </div><label className="text-sm mt-3 block"><input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm({ ...bannerForm, active: e.target.checked })} /> Active</label>
        <button disabled={busy !== null} onClick={async () => {
          if (!bannerForm.title.trim()) { setFormMsg('Enter a banner title first.'); return }
          if (demoMode) { setFormMsg('Banner edits need live mode.'); return }
          if (await run('Banner', () => saveBannerLive({ title: bannerForm.title.trim(), subtitle: bannerForm.subtitle || null, linkUrl: bannerForm.linkUrl || null, sortOrder: Number(bannerForm.sortOrder) || 0, active: bannerForm.active }))) setBannerForm({ title: '', subtitle: '', linkUrl: '', sortOrder: '0', active: true })
        }} className="bg-black text-white rounded-full px-4 py-2 text-sm mt-3">Save banner</button></div>
        {demoMode ? <p className="text-sm text-neutral-500">Banners are stored in Supabase <code>banners</code> in live mode.</p> : banners.length === 0 ? <p className="text-sm text-neutral-500">No live banners yet.</p> : banners.map(b => <p key={b.id} className="border rounded-xl p-3 mb-2 text-sm flex flex-wrap justify-between gap-2"><span>{b.title}{b.subtitle ? ` — ${b.subtitle}` : ''} — {b.active ? 'Active' : 'Inactive'}</span><button onClick={() => void run('Delete banner', () => deleteBannerLive(b.id))} className="border rounded-full px-3 py-1">Delete</button></p>)}
      </div>}

      {tab === 'Settings' && <div className="mt-6"><h2 className="font-bold">Store Settings</h2>
        {demoMode ? <ul className="text-sm space-y-1 mt-2 list-disc ml-5"><li>Store name: UK Accessories</li><li>Slogan: Upgrade Your Tech. Elevate Your Style.</li><li>WhatsApp: +92 3170851250</li><li>Currency: PKR (extensible architecture — other currencies only when configured)</li><li>Supabase live: NOT configured — anon key missing</li><li>Social links: placeholders only (owner has none yet)</li></ul> : <>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input className={inputCls} placeholder="Store name" value={settingsForm.storeName} onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })} />
            <input className={inputCls} placeholder="Slogan" value={settingsForm.slogan} onChange={e => setSettingsForm({ ...settingsForm, slogan: e.target.value })} />
            <input className={inputCls} placeholder="WhatsApp" value={settingsForm.whatsapp} onChange={e => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })} />
            <input className={inputCls} placeholder="Currency" value={settingsForm.currency} onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })} />
            <input className={`${inputCls} sm:col-span-2`} placeholder="Announcement bar text (optional)" value={settingsForm.announcement} onChange={e => setSettingsForm({ ...settingsForm, announcement: e.target.value })} />
            <input className={inputCls} placeholder="Instagram URL (optional — leave empty if none)" value={settingsForm.instagramUrl} onChange={e => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })} />
            <input className={inputCls} placeholder="Facebook URL (optional — leave empty if none)" value={settingsForm.facebookUrl} onChange={e => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })} />
            <input className={inputCls} placeholder="TikTok URL (optional — leave empty if none)" value={settingsForm.tiktokUrl} onChange={e => setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })} />
            <input className={inputCls} placeholder="YouTube URL (optional — leave empty if none)" value={settingsForm.youtubeUrl} onChange={e => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })} />
          </div>
          <button disabled={busy !== null} onClick={() => void run('Settings', () => saveSettingsLive({ storeName: settingsForm.storeName, slogan: settingsForm.slogan, whatsapp: settingsForm.whatsapp, currency: settingsForm.currency, announcement: settingsForm.announcement || null, instagramUrl: settingsForm.instagramUrl || null, facebookUrl: settingsForm.facebookUrl || null, tiktokUrl: settingsForm.tiktokUrl || null, youtubeUrl: settingsForm.youtubeUrl || null }))} className="bg-black text-white rounded-full px-4 py-2 text-sm mt-3">Save settings</button>
          <p className="text-sm text-neutral-500 mt-2">Saved to Supabase <code>store_settings</code> (id 1). Social links stay empty until the owner supplies real ones — none are invented here.</p>
        </>}
      </div>}

      {tab === 'Admin Profile' && <div className="mt-6"><h2 className="font-bold">Admin Profile</h2><p className="text-sm mt-2">{user.email} — {demoMode ? 'demo admin preview' : 'live admin (Supabase user_roles)'} . Real admin accounts are managed in Supabase Auth + <code>user_roles</code>, never by self-registration. To change this account's password, use the password-reset flow or Supabase Dashboard → Authentication → Users; the app never stores passwords.</p><button onClick={async () => { await logout(); nav('/login') }} className="mt-4 bg-black text-white rounded-full px-4 py-2 text-sm">Logout</button></div>}
      <p className="text-xs text-neutral-400 mt-8">Catalogue source: Supabase in live mode, local fallback only on query failure/empty (see src/store/shop.tsx). No fake reviews or fake statistics are used anywhere in this dashboard.</p>
    </div>
  )
}
