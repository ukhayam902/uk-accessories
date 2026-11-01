import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Minus, Plus, Search, ShieldCheck, ShoppingCart, Truck, RotateCcw, Zap } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { CATEGORIES, PRODUCTS, categoryName, formatPKR, productBySlug, whatsappLink, type Product } from '../data/catalog'
import { useShop } from '../store/shop'
import { demoMode } from '../lib/supabase'

export const DemoNote = () => <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded px-3 py-2">Demo product — price and specifications are samples, not confirmed shop prices. Product image is a representative illustration.</p>

export function ProductCard({ p }: { p: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useShop()
  const wished = wishlist.some(x => x.id === p.id)
  return (
    <motion.article whileHover={{ y: -4 }} className="border rounded-2xl overflow-hidden bg-white flex flex-col">
      <Link to={`/product/${p.slug}`}><img src={p.image} alt={p.name} loading="lazy" className="w-full aspect-square object-cover bg-[#F7F7F7]" /></Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-xs text-neutral-500">{categoryName(p.category)} • SKU {p.sku}</p>
        <Link to={`/product/${p.slug}`} className="font-semibold leading-snug">{p.name}</Link>
        <p className="text-sm text-neutral-600 line-clamp-2">{p.description}</p>
        <div className="flex gap-1 flex-wrap">{p.featured && <span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full">Featured</span>}{p.bestseller && <span className="text-[11px] bg-neutral-200 px-2 py-0.5 rounded-full">Bestseller</span>}{p.isNew && <span className="text-[11px] border px-2 py-0.5 rounded-full">New</span>}<span className="text-[11px] text-amber-700">Demo price</span></div>
        <div className="mt-auto flex items-center justify-between pt-2"><span className="font-bold text-lg">{formatPKR(p.price)}</span><span className="text-xs text-neutral-500">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span></div>
        <div className="flex gap-2"><button onClick={() => addToCart(p)} disabled={p.stock <= 0} className="flex-1 bg-black text-white rounded-full py-2 text-sm disabled:opacity-40">Add to Cart</button><button aria-label="Toggle wishlist" onClick={() => toggleWishlist(p)} className={`border rounded-full p-2 ${wished ? 'text-red-600' : ''}`}><Heart fill={wished ? 'currentColor' : 'none'} size={18} /></button></div>
      </div>
    </motion.article>
  )
}

export function Home() {
  const { products } = useShop()
  const [email, setEmail] = useState('')
  const featured = products.filter(p => p.featured)
  const best = products.filter(p => p.bestseller)
  const trending = products.filter(p => p.trending)
  const fresh = products.filter(p => p.isNew)
  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="tracking-[0.25em] text-xs text-neutral-500">PREMIUM • MINIMAL • PAKISTAN</p>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.02] mt-4">TECHNOLOGY<br />MEETS STYLE.</h1>
          <p className="text-lg text-neutral-600 mt-4">Discover premium accessories designed for your everyday life.</p>
          <div className="flex gap-3 mt-6"><Link to="/shop" className="bg-black text-white px-7 py-3 rounded-full font-semibold">Shop Now</Link><Link to="/about" className="border px-7 py-3 rounded-full font-semibold">Our Story</Link></div>
          <DemoNote />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><img src="/images/earbuds.svg" alt="Premium wireless earbuds — representative illustration" className="rounded-3xl w-full bg-[#F7F7F7]" /></motion.div>
      </section>
      <section className="max-w-7xl mx-auto px-4"><h2 className="text-2xl font-bold mb-4">Featured Collections</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{CATEGORIES.map(c => <Link key={c.id} to={`/shop?category=${c.id}`} className="border rounded-2xl p-5 hover:bg-[#F7F7F7]"><span className="font-semibold block">{c.name}</span><span className="text-sm text-neutral-500">{c.description}</span></Link>)}</div></section>
      <Section title="Best-selling products" items={best} />
      <Section title="Trending products" items={trending} />
      <Section title="New arrivals" items={fresh} />
      <section className="max-w-7xl mx-auto px-4 py-10"><div className="bg-[#080808] text-white rounded-3xl p-8 grid md:grid-cols-3 gap-6"><div><Zap className="mb-2" /><h3 className="font-bold">Cash on Delivery</h3><p className="text-neutral-300 text-sm">Pay when your order arrives in Pakistan.</p></div><div><ShieldCheck className="mb-2" /><h3 className="font-bold">Manual payment verification</h3><p className="text-neutral-300 text-sm">JazzCash / Easypaisa payments are verified by the shop — no automatic payment claim is made.</p></div><div><Truck className="mb-2" /><h3 className="font-bold">WhatsApp support</h3><p className="text-neutral-300 text-sm">Questions? <a className="underline" href={whatsappLink}>Chat on WhatsApp</a> (+92 3170851250).</p></div></div></section>
      <section className="max-w-7xl mx-auto px-4"><h2 className="text-2xl font-bold mb-2">Why Choose UK Accessories?</h2><p className="text-neutral-600 mb-4">Premium, minimalist accessories, clear PKR pricing, and human support on WhatsApp. No fake reviews are shown on this site — testimonials will only appear once real customers provide them.</p></section>
      <section className="max-w-7xl mx-auto px-4 py-8"><h2 className="text-2xl font-bold mb-2">Special offers</h2><p className="text-neutral-600">Demo offer: use code <strong>UK10</strong> at checkout for 10% off in demo mode. Real offers will be managed from the admin Coupons section once live.</p><div className="grid md:grid-cols-3 gap-3 mt-4"><div className="border rounded-2xl p-5"><h3 className="font-bold">Featured</h3><div className="grid gap-3 mt-3">{featured.slice(0, 2).map(p => <ProductCard key={p.id} p={p} />)}</div></div><div className="border rounded-2xl p-5 col-span-2"><h3 className="font-bold">Customer testimonials</h3><p className="text-neutral-600 text-sm mt-2">No customer testimonials yet. This section is intentionally empty — no reviews have been invented.</p></div></div></section>
      <section className="max-w-7xl mx-auto px-4 py-8"><h2 className="text-2xl font-bold">Newsletter</h2><p className="text-neutral-600 text-sm">Get new arrivals and offers. No spam, unsubscribe anytime.</p><form className="flex gap-2 mt-3 max-w-md" onSubmit={e => { e.preventDefault(); alert('Thanks! In demo mode this subscription is not saved to Supabase yet.') }}><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" className="border rounded-full px-4 py-2 flex-1" /><button className="bg-black text-white px-5 rounded-full">Subscribe</button></form></section>
    </div>
  )
}
function Section({ title, items }: { title: string; items: Product[] }) {
  if (!items.length) return null
  return <section className="max-w-7xl mx-auto px-4 py-8"><h2 className="text-2xl font-bold mb-4">{title}</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{items.map(p => <ProductCard key={p.id} p={p} />)}</div></section>
}

export function ShopPage() {
  const { products } = useShop()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [cat, setCat] = useState(params.get('category') || 'all')
  const [maxPrice, setMaxPrice] = useState(5000)
  const [sort, setSort] = useState('popular')
  const [visible, setVisible] = useState(8)
  const filtered = useMemo(() => {
    let list = [...products]
    if (cat !== 'all') list = list.filter(p => p.category === cat)
    if (search) list = list.filter(p => (p.name + p.description + categoryName(p.category)).toLowerCase().includes(search.toLowerCase()))
    list = list.filter(p => p.price <= maxPrice)
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'popular') list.sort((a, b) => Number(b.bestseller || false) - Number(a.bestseller || false))
    return list
  }, [products, cat, search, maxPrice, sort])
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Shop</h1><p className="text-neutral-600">All prices in PKR. Demo prices — to be confirmed by the owner.</p>
      <div className="flex flex-wrap gap-3 mt-5">
        <label className="flex items-center border rounded-full px-3 py-2 gap-2"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="outline-none text-sm" /></label>
        <select value={cat} onChange={e => { setCat(e.target.value); setParams({ category: e.target.value }) }} className="border rounded-full px-3 py-2 text-sm" aria-label="Filter by category"><option value="all">All categories</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded-full px-3 py-2 text-sm" aria-label="Sort products"><option value="popular">Sort: Popularity</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option></select>
        <label className="flex items-center gap-2 text-sm border rounded-full px-3 py-2">Max price Rs. {maxPrice}<input type="range" min={300} max={5000} step={100} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} /></label>
      </div>
      {filtered.length === 0 ? <p className="py-16 text-center text-neutral-500">No products match these filters. Try a different search or price.</p> : <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">{filtered.slice(0, visible).map(p => <ProductCard key={p.id} p={p} />)}</div>
        {visible < filtered.length && <div className="text-center mt-8"><button onClick={() => setVisible(v => v + 8)} className="bg-black text-white px-6 py-2.5 rounded-full">Load more</button></div>}
        <p className="text-center text-sm text-neutral-500 mt-4">Showing {Math.min(visible, filtered.length)} of {filtered.length} products</p>
      </>}
    </div>
  )
}

export function ProductPage() {
  const { slug } = useParams(); const p = productBySlug(slug || '')
  const { addToCart, toggleWishlist } = useShop(); const nav = useNavigate()
  const [qty, setQty] = useState(1); const [colour, setColour] = useState(p?.colours[0] || '')
  if (!p) return <div className="max-w-7xl mx-auto px-4 py-16">Product not found. <Link to="/shop" className="underline">Back to shop</Link></div>
  const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <img src={p.image} alt={p.name} className="rounded-3xl w-full bg-[#F7F7F7]" />
        <div>
          <p className="text-sm text-neutral-500">{categoryName(p.category)} • SKU {p.sku}</p>
          <h1 className="text-3xl font-bold mt-1">{p.name}</h1>
          <p className="text-2xl font-bold mt-3">{formatPKR(p.price)}</p>
          <DemoNote />
          <p className="text-neutral-700 mt-4">{p.description}</p>
          <h2 className="font-bold mt-5">Specifications</h2><ul className="list-disc ml-5 text-sm text-neutral-700">{p.specs.map(s => <li key={s}>{s}</li>)}</ul>
          <div className="mt-4"><span className="font-semibold text-sm">Colour: </span>{p.colours.map(c => <button key={c} onClick={() => setColour(c)} className={`border rounded-full px-3 py-1 text-sm mr-2 ${colour === c ? 'bg-black text-white' : ''}`}>{c}</button>)}</div>
          <p className="text-sm mt-3 flex items-center gap-2"><span className={p.stock > 0 ? 'text-green-700' : 'text-red-600'}>●</span>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</p>
          <div className="flex items-center gap-3 mt-4"><div className="flex items-center border rounded-full"><button aria-label="Decrease quantity" className="p-2" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={16} /></button><span className="w-8 text-center">{qty}</span><button aria-label="Increase quantity" className="p-2" onClick={() => setQty(q => Math.min(p.stock, q + 1))}><Plus size={16} /></button></div>
            <button onClick={() => addToCart(p, qty, colour)} className="bg-black text-white px-6 py-2.5 rounded-full flex items-center gap-2"><ShoppingCart size={18} /> Add to Cart</button>
            <button onClick={() => { addToCart(p, qty, colour); nav('/checkout') }} className="border px-6 py-2.5 rounded-full font-semibold">Buy Now</button>
            <button aria-label="Add to wishlist" onClick={() => toggleWishlist(p)} className="border rounded-full p-2.5"><Heart /></button></div>
          <div className="grid sm:grid-cols-3 gap-3 mt-6 text-sm"><div className="border rounded-xl p-3 flex gap-2"><Truck size={18} /> Shipping: COD in Pakistan; rates set by admin</div><div className="border rounded-xl p-3 flex gap-2"><RotateCcw size={18} /> Returns: see Return Policy</div><div className="border rounded-xl p-3 flex gap-2"><ShieldCheck size={18} /> Manual payment verified by shop</div></div>
        </div>
      </div>
      <h2 className="text-2xl font-bold mt-12 mb-4">Related products</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{related.map(x => <ProductCard key={x.id} p={x} />)}</div>
    </div>
  )
}

export function CartPage() {
  const { cart, setQty, removeFromCart, applyCoupon, coupon } = useShop(); const nav = useNavigate(); const [code, setCode] = useState('')
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discount = coupon === 'UK10' ? Math.round(subtotal * 0.1) : 0
  const shipping = subtotal === 0 ? 0 : subtotal - discount >= 5000 ? 0 : 250
  if (!cart.length) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><h1 className="text-3xl font-bold">Your cart is empty</h1><p className="text-neutral-600 mt-2">Browse the shop and add something you like.</p><Link to="/shop" className="inline-block mt-5 bg-black text-white px-6 py-2.5 rounded-full">Shop Now</Link></div>
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8"><div className="lg:col-span-2"><h1 className="text-3xl font-bold">Shopping Cart</h1><div className="divide-y mt-4">{cart.map(i => <div key={i.product.id} className="py-4 flex gap-4"><img src={i.product.image} alt={i.product.name} className="w-20 h-20 rounded-xl bg-[#F7F7F7]" /><div className="flex-1"><Link to={`/product/${i.product.slug}`} className="font-semibold">{i.product.name}</Link><p className="text-sm text-neutral-500">{i.colour} • {formatPKR(i.product.price)}</p><div className="flex gap-2 mt-2"><button aria-label="Decrease" onClick={() => setQty(i.product.id, i.qty - 1)} className="border rounded-full p-1"><Minus size={14} /></button><span>{i.qty}</span><button aria-label="Increase" onClick={() => setQty(i.product.id, i.qty + 1)} className="border rounded-full p-1"><Plus size={14} /></button><button onClick={() => removeFromCart(i.product.id)} className="text-red-600 text-sm ml-2">Remove</button></div></div><span className="font-bold">{formatPKR(i.product.price * i.qty)}</span></div>)}</div></div>
      <aside className="border rounded-2xl p-5 h-fit"><h2 className="font-bold">Summary</h2><div className="space-y-2 text-sm mt-3"><p className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></p><p className="flex justify-between"><span>Discount {coupon ? `(${coupon})` : ''}</span><span>-{formatPKR(discount)}</span></p><p className="flex justify-between"><span>Shipping {subtotal - discount >= 5000 ? '(free over Rs. 5,000)' : ''}</span><span>{formatPKR(shipping)}</span></p><p className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatPKR(subtotal - discount + shipping)}</span></p></div>
        <form className="flex gap-2 mt-4" onSubmit={e => { e.preventDefault(); alert(applyCoupon(code) ? 'Coupon UK10 applied (demo)' : 'Invalid coupon in demo mode. Try UK10.') }}><input value={code} onChange={e => setCode(e.target.value)} placeholder="Coupon code" className="border rounded-full px-3 py-2 flex-1 text-sm" /><button className="border rounded-full px-4 text-sm">Apply</button></form>
        <button onClick={() => nav('/checkout')} className="w-full bg-black text-white rounded-full py-3 mt-4">Proceed to Checkout</button></aside></div>
  )
}

export function CheckoutPage() {
  const { cart, placeOrder, user } = useShop()
  const [payment, setPayment] = useState('Cash on Delivery'); const [txnId, setTxnId] = useState(''); const [done, setDone] = useState<string | null>(null)
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0); const shipping = subtotal >= 5000 ? 0 : 250
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    const order = placeOrder({ items: cart, total: subtotal + shipping, payment, name: String(fd.get('name')), city: String(fd.get('city')), txnId: txnId || undefined })
    setDone(order.id)
  }
  if (done) return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><h1 className="text-3xl font-bold">Order placed — {done}</h1><p className="text-neutral-600 mt-3">Thank you! In demo mode this order is saved in this browser only. {payment === 'Cash on Delivery' ? 'Pay on delivery.' : 'Your manual payment is marked pending verification — the shop will confirm it.'}</p><Link to="/track" className="inline-block mt-5 bg-black text-white px-6 py-2.5 rounded-full">Track Order</Link></div>
  if (!cart.length) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><h1 className="text-3xl font-bold">Checkout</h1><p className="mt-2">Your cart is empty.</p><Link to="/shop" className="underline">Back to shop</Link></div>
  return (
    <div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold">Checkout</h1>{demoMode && <p className="text-sm bg-amber-50 border border-amber-200 p-3 rounded mt-3">Demo mode: orders are created in this browser. In live Supabase mode, orders must be created server-side with inventory checks (see README).</p>}
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-8 mt-6"><div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
        <Field name="name" label="Full name *" required /><Field name="phone" label="Phone number *" required /><Field name="email" label="Email *" type="email" defaultValue={user?.email || ''} required /><Field name="country" label="Country *" defaultValue="Pakistan" required /><Field name="city" label="City *" required /><Field name="postal" label="Postal code" /><div className="sm:col-span-2"><label className="text-sm font-semibold block mb-1">Complete address *</label><textarea name="address" required className="border rounded-xl w-full px-3 py-2" rows={3} /></div>
        <div className="sm:col-span-2"><label className="text-sm font-semibold block mb-1">Order notes</label><textarea name="notes" className="border rounded-xl w-full px-3 py-2" rows={2} /></div>
        <fieldset className="sm:col-span-2 border rounded-xl p-4"><legend className="font-semibold px-2">Payment method</legend>
          {['Cash on Delivery', 'JazzCash (manual)', 'Easypaisa (manual)'].map(m => <label key={m} className="flex gap-2 py-1 text-sm"><input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} />{m}</label>)}
          {payment !== 'Cash on Delivery' && <div className="bg-[#F7F7F7] rounded-xl p-4 mt-3 text-sm"><p><strong>Manual payment — no account details are published here.</strong> The shop will share JazzCash/Easypaisa details on WhatsApp after you place the order, or you can message <a className="underline" href={whatsappLink}>WhatsApp +92 3170851250</a>.</p><label className="block mt-3 font-semibold">Transaction ID (if you have already paid)</label><input value={txnId} onChange={e => setTxnId(e.target.value)} className="border rounded-xl px-3 py-2 w-full mt-1" placeholder="e.g. TRX123456" /><label className="block mt-3 font-semibold">Payment screenshot (demo: file name only, not uploaded in demo mode)</label><input type="file" accept="image/*" className="mt-1" /><p className="text-neutral-500 mt-1">Status after order: Pending verification. Admin approves or rejects it in /admin → Payments.</p></div>}
        </fieldset>
        <button className="sm:col-span-2 bg-black text-white rounded-full py-3 font-semibold">Place Order — {formatPKR(subtotal + shipping)}</button>
      </div><aside className="border rounded-2xl p-5 h-fit"><h2 className="font-bold">Order summary</h2>{cart.map(i => <p key={i.product.id} className="flex justify-between text-sm py-1"><span>{i.product.name} × {i.qty}</span><span>{formatPKR(i.product.price * i.qty)}</span></p>)}<p className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total</span><span>{formatPKR(subtotal + shipping)}</span></p></aside></form></div>
  )
}
function Field({ name, label, required, type = 'text', defaultValue }: { name: string; label: string; required?: boolean; type?: string; defaultValue?: string }) {
  return <div><label className="text-sm font-semibold block mb-1" htmlFor={name}>{label}</label><input id={name} name={name} required={required} type={type} defaultValue={defaultValue} className="border rounded-xl w-full px-3 py-2" /></div>
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login } = useShop(); const nav = useNavigate(); const [email, setEmail] = useState('')
  return <div className="max-w-md mx-auto px-4 py-16"><h1 className="text-3xl font-bold">{mode === 'login' ? 'Customer Login' : 'Customer Registration'}</h1><p className="text-sm text-neutral-600 mt-2">Demo mode: any email signs you in locally in this browser. In live mode this uses Supabase Auth (see README). No public admin registration exists — admin is set up by SQL (see README).</p>
    <form className="grid gap-4 mt-6" onSubmit={e => { e.preventDefault(); login(email); nav('/profile') }}>
      {mode === 'register' && <input required placeholder="Full name" className="border rounded-xl px-3 py-2.5" />}
      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="border rounded-xl px-3 py-2.5" />
      <input required type="password" placeholder="Password" className="border rounded-xl px-3 py-2.5" />
      <button className="bg-black text-white rounded-full py-3">{mode === 'login' ? 'Login' : 'Create account'}</button>
    </form>
    <p className="text-sm mt-4">{mode === 'login' ? <>New here? <Link to="/register" className="underline">Register</Link></> : <>Already have an account? <Link to="/login" className="underline">Login</Link></>} • <Link to="/login" className="underline">Password reset</Link> (live Supabase reset link when configured)</p>
    <button onClick={() => { login('admin@ukaccessories.demo', true); nav('/admin') }} className="mt-6 w-full border rounded-full py-2.5 text-sm">Demo: sign in as admin (demo only — not a real admin account)</button>
  </div>
}

export function ProfilePage() {
  const { user, orders, logout } = useShop(); const nav = useNavigate()
  if (!user) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Please login first</h1><Link to="/login" className="underline">Go to login</Link></div>
  return <div className="max-w-4xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold">My Profile</h1><p className="text-neutral-600">{user.name} • {user.email} {user.isAdmin && '• Admin (demo)'}</p><button onClick={() => { logout(); nav('/') }} className="border rounded-full px-4 py-2 mt-3 text-sm">Logout</button>
    <h2 className="text-xl font-bold mt-8 mb-3">My Orders</h2>{orders.length === 0 ? <p className="text-neutral-500">No orders yet.</p> : orders.map(o => <div key={o.id} className="border rounded-xl p-4 mb-3 flex justify-between"><div><p className="font-semibold">{o.id} — {o.date}</p><p className="text-sm text-neutral-600">{o.items.map(i => `${i.product.name} × ${i.qty}`).join(', ')}</p><p className="text-sm">{o.payment} • {o.paymentStatus}</p></div><span className="font-bold">{formatPKR(o.total)} • {o.status}</span></div>)}
  </div>
}

export function WishlistPage() {
  const { wishlist } = useShop()
  return <div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold">Wishlist</h1>{wishlist.length === 0 ? <p className="text-neutral-500 mt-4">Your wishlist is empty.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">{wishlist.map(p => <ProductCard key={p.id} p={p} />)}</div>}</div>
}

export function TrackPage() {
  const { orders } = useShop(); const [id, setId] = useState(''); const [found, setFound] = useState<typeof orders[0] | null>(null)
  return <div className="max-w-2xl mx-auto px-4 py-12"><h1 className="text-3xl font-bold">Order Tracking</h1><form className="flex gap-2 mt-5" onSubmit={e => { e.preventDefault(); setFound(orders.find(o => o.id === id.trim()) || null) }}><input value={id} onChange={e => setId(e.target.value)} placeholder="Order ID, e.g. UK-123456" className="border rounded-full px-4 py-2.5 flex-1" /><button className="bg-black text-white px-5 rounded-full">Track</button></form>
    {found ? <div className="border rounded-xl p-5 mt-5"><p className="font-bold">{found.id} — {found.status}</p><p className="text-sm text-neutral-600">{found.items.map(i => `${i.product.name} × ${i.qty}`).join(', ')}</p><p className="text-sm">Payment: {found.payment} ({found.paymentStatus}) • Total {formatPKR(found.total)}</p><p className="text-sm mt-2">Statuses: Pending → Confirmed → Processing → Shipped → Delivered (Cancelled / Refunded where applicable).</p></div> : id && <p className="text-neutral-500 mt-4">No demo order found with that ID in this browser.</p>}
    <h2 className="font-bold mt-8 mb-2">Your demo orders</h2>{orders.map(o => <p key={o.id} className="text-sm border rounded p-3 mb-2">{o.id} — {o.status} — {formatPKR(o.total)}</p>)}</div>
}

export function StaticPage({ title, body }: { title: string; body: string }) {
  return <div className="max-w-3xl mx-auto px-4 py-12"><h1 className="text-3xl font-bold">{title}</h1><div className="prose max-w-none mt-5 whitespace-pre-line text-neutral-700 leading-relaxed">{body}</div></div>
}

export const STATIC: Record<string, { title: string; body: string }> = {
  about: { title: 'About Us', body: 'UK Accessories is a premium mobile accessories and tech gadgets store. Slogan: Upgrade Your Tech. Elevate Your Style.\n\nPrimary market: Pakistan. Secondary: international customers (international delivery is not advertised as available until courier arrangements and rates are confirmed).\n\nSupport: WhatsApp +92 3170851250. Currency: PKR.\n\nThis site is in demo mode with sample products until the owner approves real products, prices and photos.' },
  contact: { title: 'Contact Us', body: 'WhatsApp: +92 3170851250\nMessage: Hello UK Accessories! I need assistance with your products and orders.\n\nUse the floating WhatsApp button on every page. No business email or shop address is published here because none has been confirmed for UK Accessories in this brief. Social media links are placeholders until the owner provides them.' },
  faq: { title: 'FAQ', body: 'Q: Do you offer Cash on Delivery?\nA: Yes, in Pakistan (demo checkout supports it).\n\nQ: Can I pay with JazzCash or Easypaisa?\nA: Yes, manually. Place the order, share your transaction ID, and the shop verifies it. No automatic payment integration is claimed, and no payment account details are published on this site.\n\nQ: Are prices final?\nA: No — current prices are demo samples. Confirm the price on WhatsApp before ordering if unsure.\n\nQ: Do you deliver internationally?\nA: Not advertised as available yet, until courier rates are confirmed.' },
  privacy: { title: 'Privacy Policy', body: 'We collect only the information needed to process orders: name, phone, email, address and order details. In demo mode this stays in your browser. In live mode it is stored in Supabase with Row Level Security — customers can only access their own data. We do not sell personal data. Contact us on WhatsApp +92 3170851250 for privacy requests.' },
  terms: { title: 'Terms and Conditions', body: 'By using UK Accessories you agree to these terms. Products shown are demo samples until approved. Prices are in PKR. Orders are subject to confirmation and stock availability. Manual payments are subject to verification. Nothing here promises international delivery until confirmed.' },
  shipping: { title: 'Shipping Policy', body: 'Shipping is available in Pakistan. Demo shipping: Rs. 250, free over Rs. 5,000 (demo rule — admin-configurable in live mode).\n\nDelivery estimates, zones and rates are admin-configurable in the live store and must be confirmed by the owner before they are promised to customers. International shipping is not advertised as available yet.' },
  returns: { title: 'Return and Refund Policy', body: 'If an item arrives damaged or incorrect, contact us on WhatsApp +92 3170851250 with your order ID and photos.\n\nEligible cancellations/refunds restore stock in the admin system. Manual-payment refunds are handled by the shop after verification — no automatic refund claim is made. Final return windows and conditions are set by the owner in the live store settings.' },
}
