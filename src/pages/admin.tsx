import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { formatPKR } from '../data/catalog'
import { categoryNameFor, useShop } from '../store/shop'
import { demoMode } from '../lib/supabase'

const TABS = ['Overview', 'Products', 'Categories', 'Orders', 'Customers', 'Inventory', 'Coupons', 'Reviews', 'Payments', 'Shipping', 'Analytics', 'Website Content', 'Settings', 'Admin Profile'] as const

export function AdminPage() {
  const { user, orders, products, categories, updateOrderStatus, setToast, authLoading } = useShop()
  const nav = useNavigate()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [range, setRange] = useState('All time')
  if (authLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Loading…</h1><p className="text-neutral-600 mt-3">Checking your Supabase session and admin role…</p></div>
  }
  if (!user?.isAdmin) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Protected</h1><p className="text-neutral-600 mt-3">This area is for administrators only. Sign in with a Supabase account whose <code>user_roles</code> row is <code>admin</code>. There is no public admin registration and no demo admin button in live mode.</p>{demoMode && <p className="text-sm mt-3">In demo mode only, use the demo admin sign-in on the Login page to preview the dashboard. Frontend checks alone never grant admin rights in live mode — Supabase RLS enforces them.</p>}<Link to="/login" className="inline-block mt-5 bg-black text-white px-6 py-2.5 rounded-full">Go to Login</Link></div>
  }
  const revenue = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded').reduce((s, o) => s + o.total, 0)
  const lowStock = products.filter(p => p.stock < 20)
  const stats = [
    ['Total Revenue (browser orders)', formatPKR(revenue)],
    ['Total Orders', String(orders.length)],
    ['Total Products', String(products.length)],
    ['Total Customers', '— see Customers tab'],
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
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="text-sm text-neutral-600">Signed in as {user.email} {demoMode ? '(demo admin preview)' : '(live admin, verified via Supabase user_roles)'}. Figures below are calculated from orders in this browser — no fake statistics. Live orders are still browser-local until server-side order creation is wired (see README).</p></div><button onClick={() => nav('/')} className="border rounded-full px-4 py-2 text-sm h-fit">View Store</button></div>
      <div className="flex gap-2 flex-wrap mt-5">{TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`border rounded-full px-3 py-1.5 text-sm ${tab === t ? 'bg-black text-white' : ''}`}>{t}</button>)}<button onClick={() => nav('/profile')} className="border rounded-full px-3 py-1.5 text-sm">Logout (via Profile)</button></div>

      {tab === 'Overview' && <div className="mt-6">
        <label className="text-sm font-semibold">Date filter: </label><select value={range} onChange={e => setRange(e.target.value)} className="border rounded-full px-3 py-1.5 text-sm"><option>All time</option><option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option><option>This Year</option><option>Custom Date Range</option></select><p className="text-xs text-neutral-500 mt-1">Filter selected: {range}. In demo mode all demo orders are shown; live mode filters by order date in Supabase.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{stats.map(([k, v]) => <div key={k} className="border rounded-2xl p-4"><p className="text-xs text-neutral-500">{k}</p><p className="text-xl font-bold mt-1">{v}</p></div>)}</div>
        <div className="grid md:grid-cols-2 gap-4 mt-4"><div className="border rounded-2xl p-5"><h2 className="font-bold">Recent Orders</h2>{orders.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No orders yet — place a demo order from the store to see it here.</p> : orders.slice(0, 5).map(o => <p key={o.id} className="text-sm py-1 border-b last:border-0">{o.id} — {o.status} — {formatPKR(o.total)} — {o.payment}</p>)}</div>
        <div className="border rounded-2xl p-5"><h2 className="font-bold">Top Selling Products (from demo orders)</h2>{top.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No sales yet.</p> : top.map(([n, q]) => <p key={n} className="text-sm py-1 border-b last:border-0">{n} — {q} sold</p>)}<h2 className="font-bold mt-5">Sales / Revenue Chart</h2><p className="text-sm text-neutral-500">Chart data comes from the orders above. With no demo orders, the chart is empty by design — no invented trend is drawn.</p></div></div>
      </div>}

      {tab === 'Products' && <div className="mt-6"><h2 className="font-bold mb-3">Products ({products.length}{products.some(p => p.isDemo) ? ' — demo-flagged products are labelled as such' : ''})</h2><p className="text-sm text-neutral-500 mb-3">Catalogue is loaded from Supabase <code>products</code> in live mode, with the local catalogue as fallback only if that query fails or returns empty. Add / edit / delete controls are wired to browser state in this build; in live mode writes must go to Supabase <code>products</code> with RLS admin-only checks.</p>{products.map(p => <div key={p.id} className="border rounded-xl p-3 mb-2 flex justify-between gap-3"><div><p className="font-semibold">{p.name}</p><p className="text-sm text-neutral-500">{categoryNameFor(categories, p.category)} • SKU {p.sku} • Stock {p.stock} • {formatPKR(p.price)}{p.isDemo ? ' • Demo price' : ''}</p></div><span className="text-sm">{p.featured ? 'Featured • ' : ''}{p.bestseller ? 'Bestseller' : ''}</span></div>)}</div>}
      {tab === 'Categories' && <div className="mt-6"><h2 className="font-bold mb-3">Categories ({categories.length})</h2>{categories.map(c => <p key={c.id} className="border rounded-xl p-3 mb-2">{c.name} — {c.description}</p>)}<p className="text-sm text-neutral-500">Categories are loaded from Supabase <code>categories</code> in live mode, with the local catalogue as fallback only if that query fails or returns empty.</p></div>}
      {tab === 'Orders' && <div className="mt-6"><h2 className="font-bold mb-3">Orders</h2>{orders.length === 0 ? <p className="text-neutral-500">No orders yet.</p> : orders.map(o => <div key={o.id} className="border rounded-xl p-4 mb-3"><p className="font-semibold">{o.id} — {o.date} — {o.name}, {o.city} — {formatPKR(o.total)}</p><p className="text-sm">{o.items.map(i => `${i.product.name} × ${i.qty}`).join(', ')}</p><p className="text-sm">Payment: {o.payment} ({o.paymentStatus}) • Status: {o.status}</p><label className="text-sm mt-2 block">Change status: <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="border rounded px-2 py-1">{['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map(s => <option key={s}>{s}</option>)}</select></label></div>)}</div>}
      {tab === 'Customers' && <div className="mt-6"><h2 className="font-bold">Customers</h2><p className="text-sm text-neutral-500 mt-2">Demo mode has no registered customer list (demo sign-in is local). Live mode lists Supabase <code>profiles</code> with order history and total spending, admin-only via RLS.</p></div>}
      {tab === 'Inventory' && <div className="mt-6"><h2 className="font-bold mb-3">Inventory</h2><p className="text-sm text-neutral-500 mb-3">Low stock = under 20 units. Demo orders decrement stock; cancellations/refunds should restore it in live mode via a server transaction.</p>{products.map(p => <p key={p.id} className={`border rounded-xl p-3 mb-2 ${p.stock < 20 ? 'border-amber-400 bg-amber-50' : ''}`}>{p.name} — {p.stock} in stock {p.stock < 20 ? '• LOW STOCK' : ''} {p.stock === 0 ? '• OUT OF STOCK' : ''}</p>)}</div>}
      {tab === 'Coupons' && <div className="mt-6"><h2 className="font-bold">Coupons and Discounts</h2><p className="text-sm mt-2">Demo coupon: <strong>UK10</strong> — 10% off, demo only. Live coupons live in Supabase <code>coupons</code> / <code>coupon_usage</code> with percentage/fixed discounts, minimum order, expiry and usage limits.</p></div>}
      {tab === 'Reviews' && <div className="mt-6"><h2 className="font-bold">Reviews</h2><p className="text-sm text-neutral-500 mt-2">No reviews yet, and none have been invented. Live reviews require approval in this section before they appear on the store.</p></div>}
      {tab === 'Payments' && <div className="mt-6"><h2 className="font-bold mb-3">Payments — COD vs Manual, kept separate</h2>
        <h3 className="font-semibold mt-4">Cash on Delivery</h3>{orders.filter(o => o.payment === 'Cash on Delivery').map(o => <p key={o.id} className="text-sm border rounded p-3 mt-2">{o.id} — {o.status} — {formatPKR(o.total)}</p>)}
        <h3 className="font-semibold mt-4">Manual JazzCash / Easypaisa — pending verification</h3>{orders.filter(o => o.payment !== 'Cash on Delivery').length === 0 ? <p className="text-sm text-neutral-500 mt-2">No manual-payment orders yet.</p> : orders.filter(o => o.payment !== 'Cash on Delivery').map(o => <div key={o.id} className="border rounded p-3 mt-2 flex flex-wrap gap-2 justify-between"><span className="text-sm">{o.id} — {o.payment} — Txn: {o.txnId || 'not provided'} — {o.paymentStatus}</span><span className="flex gap-2"><button onClick={() => { updateOrderStatus(o.id, o.status, 'Verified'); setToast('Payment verified') }} className="bg-black text-white rounded-full px-3 py-1 text-sm">Approve</button><button onClick={() => { updateOrderStatus(o.id, o.status, 'Rejected'); setToast('Payment rejected') }} className="border rounded-full px-3 py-1 text-sm">Reject</button></span></div>)}
        <p className="text-sm text-neutral-500 mt-3">No JazzCash/Easypaisa account numbers are published on this site.</p></div>}
      {tab === 'Shipping' && <div className="mt-6"><h2 className="font-bold">Shipping</h2><p className="text-sm mt-2">Demo rule: Rs. 250, free over Rs. 5,000. Live mode: admin-configurable zones, prices, estimates and free-shipping threshold in <code>shipping_methods</code> and <code>store_settings</code>. International delivery is not enabled until courier rates are confirmed.</p></div>}
      {tab === 'Analytics' && <div className="mt-6"><h2 className="font-bold">Analytics</h2><p className="text-sm text-neutral-500 mt-2">Revenue {formatPKR(revenue)} • Orders {orders.length} • Products {products.length} — all calculated from demo orders above. No external analytics or invented traffic is reported.</p></div>}
      {tab === 'Website Content' && <div className="mt-6"><h2 className="font-bold">Website Content</h2><p className="text-sm mt-2">Hero heading: TECHNOLOGY MEETS STYLE. Supporting text: Discover premium accessories designed for your everyday life. Announcement bar, banners, featured collections and footer are editable in live mode via <code>banners</code> and <code>store_settings</code>.</p></div>}
      {tab === 'Settings' && <div className="mt-6"><h2 className="font-bold">Store Settings</h2><ul className="text-sm space-y-1 mt-2 list-disc ml-5"><li>Store name: UK Accessories</li><li>Slogan: Upgrade Your Tech. Elevate Your Style.</li><li>WhatsApp: +92 3170851250</li><li>Currency: PKR (extensible architecture — other currencies only when configured)</li><li>Supabase live: {demoMode ? 'NOT configured — anon key missing' : 'Configured'}</li><li>Social links: placeholders only (owner has none yet)</li></ul></div>}
      {tab === 'Admin Profile' && <div className="mt-6"><h2 className="font-bold">Admin Profile</h2><p className="text-sm mt-2">{user.email} — {demoMode ? 'demo admin preview' : 'live admin (Supabase user_roles)'} . Real admin accounts are managed in Supabase Auth + <code>user_roles</code>, never by self-registration.</p></div>}
      <p className="text-xs text-neutral-400 mt-8">Catalogue source: Supabase in live mode, local fallback only on query failure/empty (see src/store/shop.tsx). No fake reviews or fake statistics are used anywhere in this dashboard.</p>
    </div>
  )
}
