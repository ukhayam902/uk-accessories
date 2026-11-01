import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, CheckCircle2, ChevronDown, Heart, MessageCircle, Minus, Package, Plus, RotateCcw, Search, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { formatPKR, whatsappLink, type Product } from '../data/catalog'
import { categoryNameFor, useShop } from '../store/shop'
import { FAQ_JSON_LD, SITE_URL, productJsonLd, useSeo } from '../lib/seo'
import { demoMode } from '../lib/supabase'

const INPUT = 'border border-neutral-300 rounded-xl w-full px-3.5 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition bg-white'
const BTN_BLACK = 'bg-black text-white rounded-full font-semibold hover:bg-[#171717] transition-colors disabled:opacity-50'
const BTN_OUTLINE = 'border border-neutral-300 rounded-full font-semibold hover:border-black transition-colors'
const CARD = 'border border-neutral-200 rounded-3xl bg-white shadow-sm'

export const DemoNote = () => <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3.5 py-2.5 leading-relaxed">Demo product — price and specifications are samples, not confirmed shop prices. Product image is a representative image.</p>

export function StatusPill({ status }: { status: string }) {
  const cls = status === 'Delivered' ? 'bg-green-100 text-green-800'
    : status === 'Cancelled' || status === 'Refunded' ? 'bg-red-100 text-red-800'
    : status === 'Pending' ? 'bg-amber-100 text-amber-800'
    : 'bg-neutral-100 text-neutral-800'
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{status}</span>
}

export function ProductCard({ p }: { p: Product }) {
  const { addToCart, toggleWishlist, wishlist, categories } = useShop()
  const nav = useNavigate()
  const wished = wishlist.some(x => x.id === p.id)
  const stockLabel = p.stock <= 0 ? 'Out of stock' : p.stock < 20 ? `Only ${p.stock} left` : 'In stock'
  const stockCls = p.stock <= 0 ? 'text-red-600' : p.stock < 20 ? 'text-amber-700' : 'text-green-700'
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="border border-neutral-200 rounded-3xl overflow-hidden bg-white flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="relative bg-[#F7F7F7]">
        <Link to={`/product/${p.slug}`} aria-label={p.name}><img src={p.image} alt={`${p.name} — representative image`} loading="lazy" className="w-full aspect-square object-contain p-3 sm:p-6 transition-transform duration-300 hover:scale-105" /></Link>
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1.5 flex-wrap">{p.featured && <span className="text-[11px] font-semibold bg-black text-white px-2.5 py-1 rounded-full">Featured</span>}{p.bestseller && <span className="text-[11px] font-semibold bg-white border border-neutral-200 px-2.5 py-1 rounded-full">Bestseller</span>}{p.isNew && <span className="text-[11px] font-semibold bg-white border border-neutral-200 px-2.5 py-1 rounded-full">New</span>}</div>
        <button aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => toggleWishlist(p)} className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center ${wished ? 'text-red-600' : 'text-neutral-700'}`}><Heart fill={wished ? 'currentColor' : 'none'} size={18} /></button>
      </div>
      <div className="p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2.5 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">{categoryNameFor(categories, p.category)}</p>
        <Link to={`/product/${p.slug}`} className="font-semibold text-sm sm:text-[17px] leading-snug hover:underline line-clamp-2">{p.name}</Link>
        <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 leading-relaxed">{p.description}</p>
        {p.isDemo && <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full w-fit">Demo price — to be confirmed</span>}
        <div className="mt-auto pt-1 sm:pt-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-1"><span className="flex items-baseline gap-2"><span className="font-extrabold text-base sm:text-xl">{formatPKR(p.price)}</span>{p.compareAt && <span className="text-sm text-neutral-400 line-through">{formatPKR(p.compareAt)}</span>}</span><span className={`text-xs font-medium ${stockCls}`}>{stockLabel}</span></div>
        <div className="flex flex-col gap-2 mt-1">
          <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`${BTN_BLACK} w-full py-2.5 sm:py-3 text-xs sm:text-sm disabled:opacity-40`}>{p.stock <= 0 ? 'Out of stock' : 'Add to Cart'}</button>
          <button onClick={() => { addToCart(p); nav('/checkout') }} disabled={p.stock <= 0} className={`${BTN_OUTLINE} w-full py-2.5 sm:py-3 text-xs sm:text-sm disabled:opacity-40`}>Buy Now</button>
        </div>
      </div>
    </motion.article>
  )
}


function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}>{children}</div>
}

function HeroShowcase({ heroProduct, products }: { heroProduct?: Product; products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [active, setActive] = useState(false)
  const watch = products.find(x => x.slug === 'smart-fitness-watch')
  const earbuds = products.find(x => x.slug === 'premium-wireless-earbuds')
  const phoneCase = products.find(x => x.slug === 'premium-silicone-phone-case')
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ rx: -py * 14, ry: px * 16 })
    setActive(true)
  }
  const reset = () => { setTilt({ rx: 0, ry: 0 }); setActive(false) }
  if (!heroProduct) return null
  return (
    <div style={{ perspective: '1100px' }} onMouseMove={onMove} onMouseLeave={reset}>
      <div
        ref={ref}
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transformStyle: 'preserve-3d', transition: active ? 'transform 0.12s ease-out' : 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        className="relative"
      >
        <Link to={`/product/${heroProduct.slug}`} className="block bg-white text-[#080808] border border-neutral-200 rounded-[2rem] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="bg-[#F7F7F7]"><img src={heroProduct.image} alt={`${heroProduct.name} — representative image`} className="w-full aspect-[4/3] object-contain p-8 sm:p-10" /></div>
          <div className="px-6 pb-6 pt-1 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">Featured</p><p className="font-bold text-lg leading-snug mt-1">{heroProduct.name}</p><p className="text-sm text-neutral-500 mt-0.5">Representative image • {formatPKR(heroProduct.price)}</p></div><span className="shrink-0 bg-black text-white rounded-full px-4 py-2 text-sm font-semibold">View</span></div>
        </Link>
        {watch && <div aria-hidden className="hero-float absolute -left-3 sm:-left-6 top-8 sm:top-12"><div style={{ transform: 'translateZ(70px)' }} className="bg-white text-[#080808] border border-neutral-200 rounded-2xl shadow-xl p-2.5 flex items-center gap-2"><img src={watch.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" /><span className="text-xs font-semibold leading-tight pr-1">Smart<br />Watch</span></div></div>}
        {earbuds && <div aria-hidden className="hero-float-slow absolute -right-2 sm:-right-5 bottom-24 sm:bottom-28"><div style={{ transform: 'translateZ(55px)' }} className="bg-[#171717] text-white border border-white/10 rounded-2xl shadow-xl p-2.5 flex items-center gap-2"><img src={earbuds.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" /><span className="text-xs font-semibold leading-tight pr-1">Wireless<br />Earbuds</span></div></div>}
        {phoneCase && <div aria-hidden className="hero-float absolute right-6 sm:right-10 -bottom-4"><div style={{ transform: 'translateZ(40px)' }} className="bg-white text-[#080808] border border-neutral-200 rounded-full shadow-xl px-3.5 py-2 text-xs font-semibold">Silicone Case • {formatPKR(phoneCase.price)}</div></div>}
      </div>
      <p className="text-xs text-neutral-400 mt-8 text-center">Move your mouse over the showcase to tilt it — product images are representative images.</p>
    </div>
  )
}

function SectionHeader({ title, subtitle, actionTo, actionLabel }: { title: string; subtitle?: string; actionTo?: string; actionLabel?: string }) {
  return <div className="flex flex-wrap items-end justify-between gap-3 mb-5"><div><h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h2>{subtitle && <p className="text-neutral-600 mt-1.5 text-sm sm:text-base">{subtitle}</p>}</div>{actionTo && <Link to={actionTo} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline shrink-0">{actionLabel || 'View all'} <ArrowRight size={16} /></Link>}</div>
}
function Section({ title, subtitle, items, actionTo }: { title: string; subtitle?: string; items: Product[]; actionTo?: string }) {
  if (!items.length) return null
  return <Reveal><section className="max-w-7xl mx-auto px-3 sm:px-4 py-10 sm:py-12"><SectionHeader title={title} subtitle={subtitle} actionTo={actionTo} actionLabel="View all" /><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">{items.map(p => <ProductCard key={p.id} p={p} />)}</div></section></Reveal>
}

export function Home() {
  const { products } = useShop()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const featured = products.filter(p => p.featured)
  const best = products.filter(p => p.bestseller)
  const trending = products.filter(p => p.trending)
  const fresh = products.filter(p => p.isNew)
  const heroProduct = featured[0] ?? products[0]
  useSeo({ title: 'UK Accessories Pakistan — Mobile Accessories, Wireless Earbuds, Smartwatches | Upgrade Your Tech. Elevate Your Style.', description: 'UK Accessories Pakistan — premium mobile accessories in PKR: wireless earbuds, smartwatches, power banks, fast chargers, phone cases and screen protectors. Cash on Delivery in Pakistan, manual JazzCash/Easypaisa payment verification, WhatsApp support +92 3170851250.', path: '/', ogImage: `${SITE_URL}/images/earbuds-photo.webp` })
  return (
    <div>
      <section className="bg-[#080808] text-white overflow-hidden relative">
        <div aria-hidden className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-[#C0C0C0]/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 tracking-[0.2em] text-[11px] font-semibold text-neutral-300">PREMIUM • MINIMAL • PAKISTAN</p>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight mt-6">TECHNOLOGY<br />MEETS <span className="text-[#C0C0C0]">STYLE.</span></h1>
            <p className="text-lg sm:text-xl text-neutral-300 mt-6 leading-relaxed max-w-lg">Discover premium accessories designed for your everyday life.</p>
            <div className="flex flex-wrap gap-3 mt-8"><Link to="/shop" className="bg-white text-black rounded-full font-semibold hover:bg-[#F7F7F7] transition-colors px-8 py-3.5 inline-flex items-center gap-2">Shop Now <ArrowRight size={18} /></Link><a href={whatsappLink} target="_blank" rel="noreferrer" className="border border-white/30 rounded-full font-semibold hover:border-white transition-colors px-8 py-3.5 inline-flex items-center gap-2"><MessageCircle size={18} /> WhatsApp Us</a></div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-8 text-sm text-neutral-300">
              <li className="flex items-center gap-2"><Truck size={18} /> Cash on Delivery in Pakistan</li>
              <li className="flex items-center gap-2"><MessageCircle size={18} /> WhatsApp support: +92 3170851250</li>
              <li className="flex items-center gap-2"><ShieldCheck size={18} /> Manual payments verified by the shop</li>
            </ul>
            {featured.length > 0 && featured[0].isDemo && <div className="mt-6 max-w-lg"><DemoNote /></div>}
            <a href="#style-it-your-way" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-neutral-300 hover:text-white transition-colors" aria-label="Scroll down to see more">Scroll <ChevronDown size={18} className="hero-scroll-cue" /></a>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <HeroShowcase heroProduct={heroProduct} products={products} />
          </motion.div>
        </div>
      </section>
      <Reveal><section id="style-it-your-way" className="max-w-7xl mx-auto px-4 py-10 sm:py-12 scroll-mt-24"><SectionHeader title="Style it your way" subtitle="Worn. Styled. Everyday." actionTo="/shop" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link to="/product/smart-fitness-watch" className="border border-neutral-200 rounded-3xl bg-white overflow-hidden hover:shadow-md transition-shadow block"><img src="/images/owner-watch-studio.webp" alt="Smart Fitness Watch worn on the wrist" loading="lazy" className="w-full aspect-[4/5] object-cover bg-[#F7F7F7]" /><div className="p-4"><p className="font-semibold leading-snug text-sm sm:text-base">Smart Fitness Watch</p><p className="text-xs sm:text-sm text-neutral-500 mt-1">Worn on the wrist, every day.</p><span className="text-xs sm:text-sm font-semibold mt-2 inline-flex items-center gap-1">Shop <ArrowRight size={14} /></span></div></Link>
        <Link to="/product/premium-wireless-earbuds" className="border border-neutral-200 rounded-3xl bg-white overflow-hidden hover:shadow-md transition-shadow block"><img src="/images/owner-earbuds-studio.webp" alt="Premium Wireless Earbuds worn in the ears" loading="lazy" className="w-full aspect-[4/5] object-cover bg-[#F7F7F7]" /><div className="p-4"><p className="font-semibold leading-snug text-sm sm:text-base">Premium Wireless Earbuds</p><p className="text-xs sm:text-sm text-neutral-500 mt-1">Worn in the ears, on the go.</p><span className="text-xs sm:text-sm font-semibold mt-2 inline-flex items-center gap-1">Shop <ArrowRight size={14} /></span></div></Link>
        <Link to="/product/wireless-bluetooth-headphones" className="border border-neutral-200 rounded-3xl bg-white overflow-hidden hover:shadow-md transition-shadow block"><img src="/images/owner-headphones-studio.webp" alt="Wireless Bluetooth Headphones worn over the ears" loading="lazy" className="w-full aspect-[4/5] object-cover bg-[#F7F7F7]" /><div className="p-4"><p className="font-semibold leading-snug text-sm sm:text-base">Wireless Bluetooth Headphones</p><p className="text-xs sm:text-sm text-neutral-500 mt-1">Worn over the ears, for work and travel.</p><span className="text-xs sm:text-sm font-semibold mt-2 inline-flex items-center gap-1">Shop <ArrowRight size={14} /></span></div></Link>
        <Link to="/product/premium-silicone-phone-case" className="border border-neutral-200 rounded-3xl bg-white overflow-hidden hover:shadow-md transition-shadow block"><img src="/images/owner-accessories-studio.webp" alt="Watch and earbuds worn, holding a phone in a silicone case" loading="lazy" className="w-full aspect-[4/5] object-cover bg-[#F7F7F7]" /><div className="p-4"><p className="font-semibold leading-snug text-sm sm:text-base">Watch + Earbuds + Silicone Case</p><p className="text-xs sm:text-sm text-neutral-500 mt-1">A full everyday carry, styled together.</p><span className="text-xs sm:text-sm font-semibold mt-2 inline-flex items-center gap-1">Shop <ArrowRight size={14} /></span></div></Link>
      </div><p className="text-xs text-neutral-500 mt-4">Studio-style images — representative looks, not exact photos of every model.</p></section></Reveal>
      
      <Section title="Featured products" subtitle="Hand-picked highlights from the catalogue." items={featured} actionTo="/shop" />
      <Section title="Best-selling products" subtitle="The items customers reach for most." items={best} actionTo="/shop" />
      <Section title="Trending products" subtitle="What's popular right now." items={trending} actionTo="/shop" />
      <Section title="New arrivals" subtitle="Fresh additions to the store." items={fresh} actionTo="/shop" />
      <Reveal><section className="max-w-7xl mx-auto px-4 py-10 sm:py-12"><div className="bg-[#080808] text-white rounded-3xl p-7 sm:p-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Why Choose UK Accessories?</h2>
        <p className="text-neutral-300 mt-2 max-w-2xl leading-relaxed">Premium, minimalist accessories, clear PKR pricing, and human support on WhatsApp. No fake reviews are shown on this site — testimonials will only appear once real customers provide them.</p>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mt-7">
          <div className="bg-[#171717] rounded-2xl p-5"><Truck className="mb-3 text-white" /><h3 className="font-bold">Cash on Delivery</h3><p className="text-neutral-300 text-sm mt-1.5 leading-relaxed">Pay when your order arrives in Pakistan.</p></div>
          <div className="bg-[#171717] rounded-2xl p-5"><ShieldCheck className="mb-3 text-white" /><h3 className="font-bold">Manual payment verification</h3><p className="text-neutral-300 text-sm mt-1.5 leading-relaxed">JazzCash / Easypaisa payments are verified by the shop — no automatic payment claim is made.</p></div>
          <div className="bg-[#171717] rounded-2xl p-5"><MessageCircle className="mb-3 text-white" /><h3 className="font-bold">WhatsApp support</h3><p className="text-neutral-300 text-sm mt-1.5 leading-relaxed">Questions? <a className="underline" href={whatsappLink}>Chat on WhatsApp</a> (+92 3170851250).</p></div>
        </div>
      </div></section></Reveal>
      <Reveal><section className="max-w-7xl mx-auto px-4 py-10 sm:py-12"><SectionHeader title="Special offers" subtitle="Real offers are managed from the admin Coupons section once live." />
        <div className="grid md:grid-cols-5 gap-4 sm:gap-5">
          <div className="md:col-span-2 bg-black text-white rounded-3xl p-6 sm:p-7 flex flex-col"><p className="text-xs font-semibold tracking-[0.2em] text-neutral-400">DEMO OFFER</p><p className="text-3xl font-extrabold mt-3">UK10</p><p className="text-neutral-300 text-sm mt-2 leading-relaxed">Use code <strong className="text-white">UK10</strong> at checkout for 10% off in demo mode.</p><Link to="/shop" className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">Shop the offer <ArrowRight size={16} /></Link></div>
          <div className={`${CARD} md:col-span-3 p-6 sm:p-7`}><h3 className="font-bold text-lg">Customer testimonials</h3><p className="text-neutral-600 text-sm mt-2 leading-relaxed">No customer testimonials yet. This section is intentionally empty — no reviews have been invented.</p><div className="flex items-center gap-3 mt-5 bg-[#F7F7F7] rounded-2xl p-4"><Zap size={20} className="shrink-0" /><p className="text-sm text-neutral-700 leading-relaxed">Fast chargers, power banks, cases and more — every product card shows its stock and a clear PKR price.</p></div></div>
        </div>
      </section></Reveal>
      <Reveal><section className="max-w-7xl mx-auto px-4 pb-4"><div className="bg-[#F7F7F7] border border-neutral-200 rounded-3xl p-6 sm:p-8"><h2 className="text-2xl font-extrabold tracking-tight">Newsletter</h2><p className="text-neutral-600 text-sm mt-1.5">Get new arrivals and offers. No spam, unsubscribe anytime.</p>
        {subscribed ? <p role="status" className="mt-4 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm">Thanks! In demo mode this subscription is not saved to Supabase yet.</p> : <form className="flex flex-col sm:flex-row gap-2 mt-4 max-w-md" onSubmit={e => { e.preventDefault(); setSubscribed(true) }}><label htmlFor="newsletter-email" className="sr-only">Email address</label><input id="newsletter-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" className={INPUT} /><button className={`${BTN_BLACK} px-6 py-3 text-sm shrink-0`}>Subscribe</button></form>}
      </div></section></Reveal>
    </div>
  )
}

export function ShopPage() {
  const { products, categories } = useShop()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [cat, setCat] = useState(params.get('category') || 'all')
  const [maxPrice, setMaxPrice] = useState(5000)
  const [sort, setSort] = useState('popular')
  const [visible, setVisible] = useState(8)
  useSeo({ title: 'Shop Mobile Accessories in Pakistan — UK Accessories | Earbuds, Smartwatches, Power Banks, Chargers', description: 'Shop mobile accessories in Pakistan at UK Accessories: wireless earbuds, smartwatches, power banks, fast chargers, charging cables, phone cases and screen protectors in PKR. Cash on Delivery in Pakistan.', path: '/shop' })
  const filtered = useMemo(() => {
    let list = [...products]
    if (cat !== 'all') list = list.filter(p => p.category === cat)
    if (search) list = list.filter(p => (p.name + p.description + categoryNameFor(categories, p.category)).toLowerCase().includes(search.toLowerCase()))
    list = list.filter(p => p.price <= maxPrice)
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'popular') list.sort((a, b) => Number(b.bestseller || false) - Number(a.bestseller || false))
    return list
  }, [products, categories, cat, search, maxPrice, sort])
  const resetFilters = () => { setSearch(''); setCat('all'); setMaxPrice(5000); setSort('popular'); setVisible(8); setParams({}) }
  const hasFilters = search !== '' || cat !== 'all' || maxPrice < 5000
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Shop</h1><p className="text-neutral-600 mt-2">All prices in PKR.{products.some(p => p.isDemo) ? ' Demo prices — to be confirmed by the owner.' : ''} <span className="font-medium text-black">{filtered.length} product{filtered.length === 1 ? '' : 's'} found.</span></p>
      <div className={`${CARD} p-4 sm:p-5 mt-6`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center border border-neutral-300 rounded-full px-4 py-2.5 gap-2 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 transition"><Search size={16} className="text-neutral-500 shrink-0" /><span className="sr-only">Search products</span><input value={search} onChange={e => { setSearch(e.target.value); setVisible(8) }} placeholder="Search products…" className="outline-none text-sm w-full bg-transparent" /></label>
          <label className="sr-only" htmlFor="shop-category">Filter by category</label>
          <select id="shop-category" value={cat} onChange={e => { setCat(e.target.value); setVisible(8); setParams(e.target.value === 'all' ? {} : { category: e.target.value }) }} className="border border-neutral-300 rounded-full px-4 py-2.5 text-sm bg-white w-full"><option value="all">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label className="sr-only" htmlFor="shop-sort">Sort products</label>
          <select id="shop-sort" value={sort} onChange={e => setSort(e.target.value)} className="border border-neutral-300 rounded-full px-4 py-2.5 text-sm bg-white w-full"><option value="popular">Sort: Popularity</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option></select>
          <label className="flex items-center gap-3 text-sm border border-neutral-300 rounded-full px-4 py-2.5">Max price <strong>Rs. {maxPrice.toLocaleString('en-PK')}</strong><input aria-label="Maximum price" type="range" min={300} max={5000} step={100} value={maxPrice} onChange={e => { setMaxPrice(Number(e.target.value)); setVisible(8) }} className="flex-1 min-w-0" /></label>
        </div>
        {hasFilters && <div className="flex flex-wrap items-center gap-2 mt-4">
          {search && <button onClick={() => setSearch('')} className="bg-black text-white rounded-full px-3.5 py-1.5 text-xs font-semibold">Search: “{search}” ✕</button>}
          {cat !== 'all' && <button onClick={() => { setCat('all'); setParams({}) }} className="bg-black text-white rounded-full px-3.5 py-1.5 text-xs font-semibold">{categoryNameFor(categories, cat)} ✕</button>}
          {maxPrice < 5000 && <button onClick={() => setMaxPrice(5000)} className="bg-black text-white rounded-full px-3.5 py-1.5 text-xs font-semibold">Under Rs. {maxPrice.toLocaleString('en-PK')} ✕</button>}
          <button onClick={resetFilters} className="underline text-sm font-medium ml-1">Clear all filters</button>
        </div>}
      </div>
      {filtered.length === 0 ? <div className={`${CARD} py-16 px-6 text-center mt-6`}><Package size={40} className="mx-auto text-neutral-400" /><h2 className="text-xl font-bold mt-4">No products match these filters</h2><p className="text-neutral-500 text-sm mt-1.5">Try a different search, category or price.</p><button onClick={resetFilters} className={`${BTN_BLACK} px-6 py-3 text-sm mt-5`}>Clear filters</button></div> : <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-6">{filtered.slice(0, visible).map(p => <ProductCard key={p.id} p={p} />)}</div>
        {visible < filtered.length && <div className="text-center mt-10"><button onClick={() => setVisible(v => v + 8)} className={`${BTN_BLACK} px-8 py-3.5 text-sm`}>Load more</button></div>}
        <p className="text-center text-sm text-neutral-500 mt-4">Showing {Math.min(visible, filtered.length)} of {filtered.length} products</p>
      </>}
    </div>
  )
}

export function ProductPage() {
  const { slug } = useParams()
  const { addToCart, toggleWishlist, wishlist, products, categories } = useShop(); const nav = useNavigate()
  const p = products.find(x => x.slug === slug)
  useSeo({ title: p ? `${p.name} Price in Pakistan — ${formatPKR(p.price)} | UK Accessories` : 'Product not found — UK Accessories', description: p ? `${p.name} in Pakistan for ${formatPKR(p.price)}. ${categoryNameFor(categories, p.category)} at UK Accessories. Cash on Delivery in Pakistan; confirm price on WhatsApp +92 3170851250 before ordering.` : 'This product does not exist at UK Accessories.', path: p ? `/product/${p.slug}` : undefined, ogType: 'product', ogImage: p ? `${SITE_URL}${p.image}` : undefined, noindex: !p, jsonLd: p ? productJsonLd({ name: p.name, slug: p.slug, image: p.image, description: p.description, categoryName: categoryNameFor(categories, p.category), price: p.price, stock: p.stock, sku: p.sku }) : undefined })
  const [qty, setQty] = useState(1); const [colour, setColour] = useState(p?.colours[0] || '')
  if (!p) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Product not found</h1><Link to="/shop" className="underline mt-3 inline-block">Back to shop</Link></div>
  const wished = wishlist.some(x => x.id === p.id)
  const related = products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500 mb-6 flex flex-wrap gap-1.5"><Link to="/" className="hover:underline">Home</Link><span>/</span><Link to="/shop" className="hover:underline">Shop</Link><span>/</span><Link to={`/shop?category=${p.category}`} className="hover:underline">{categoryNameFor(categories, p.category)}</Link><span>/</span><span className="text-neutral-900 font-medium">{p.name}</span></nav>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative bg-[#F7F7F7] border border-neutral-200 rounded-3xl overflow-hidden">
            <img src={p.image} alt={`${p.name} — representative image`} className="w-full aspect-square object-contain p-8 sm:p-12" />
            <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap">{p.featured && <span className="text-[11px] font-semibold bg-black text-white px-2.5 py-1 rounded-full">Featured</span>}{p.bestseller && <span className="text-[11px] font-semibold bg-white border border-neutral-200 px-2.5 py-1 rounded-full">Bestseller</span>}{p.isNew && <span className="text-[11px] font-semibold bg-white border border-neutral-200 px-2.5 py-1 rounded-full">New</span>}</div>
          </div>
          <p className="text-xs text-neutral-500 mt-3 text-center">Representative image — not an exact photo of this model.</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">{categoryNameFor(categories, p.category)} • SKU {p.sku}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 leading-tight">{p.name}</h1>
          <div className="flex flex-wrap items-baseline gap-3 mt-4"><span className="text-3xl font-extrabold">{formatPKR(p.price)}</span>{p.compareAt && <span className="text-lg text-neutral-400 line-through">{formatPKR(p.compareAt)}</span>}{p.isDemo && <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">Demo price</span>}</div>
          {p.isDemo && <div className="mt-4"><DemoNote /></div>}
          <p className="text-neutral-700 mt-5 leading-relaxed">{p.description}</p>
          {p.specs.length > 0 && <div className="mt-6"><h2 className="font-bold">Specifications</h2><ul className="grid sm:grid-cols-2 gap-2 mt-3">{p.specs.map(s => <li key={s} className="flex gap-2 text-sm text-neutral-700 bg-[#F7F7F7] border border-neutral-200 rounded-xl px-3.5 py-2.5"><Check size={16} className="shrink-0 mt-0.5" />{s}</li>)}</ul></div>}
          <div className="mt-6"><span className="font-semibold text-sm">Colour: {colour}</span><div className="flex flex-wrap gap-2 mt-2.5">{p.colours.map(c => <button key={c} onClick={() => setColour(c)} aria-pressed={colour === c} className={`min-h-11 px-4 rounded-full text-sm font-medium border transition-colors ${colour === c ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>{c}</button>)}</div></div>
          <p className="text-sm mt-5 flex items-center gap-2"><span className={p.stock > 0 ? 'text-green-700' : 'text-red-600'}>●</span><span className="font-medium">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span></p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="flex items-center border border-neutral-300 rounded-full"><button aria-label="Decrease quantity" className="w-11 h-11 flex items-center justify-center disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={16} /></button><span className="w-8 text-center font-semibold">{qty}</span><button aria-label="Increase quantity" className="w-11 h-11 flex items-center justify-center disabled:opacity-40" disabled={qty >= p.stock} onClick={() => setQty(q => Math.min(p.stock, q + 1))}><Plus size={16} /></button></div>
            <button onClick={() => addToCart(p, qty, colour)} disabled={p.stock <= 0} className={`${BTN_BLACK} px-7 py-3.5 text-sm flex items-center gap-2`}><ShoppingCart size={18} /> Add to Cart</button>
            <button onClick={() => { addToCart(p, qty, colour); nav('/checkout') }} disabled={p.stock <= 0} className={`${BTN_OUTLINE} px-7 py-3.5 text-sm`}>Buy Now</button>
            <button aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => toggleWishlist(p)} className={`w-12 h-12 rounded-full border flex items-center justify-center ${wished ? 'text-red-600 border-red-200' : 'border-neutral-300'}`}><Heart fill={wished ? 'currentColor' : 'none'} /></button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-7 text-sm">
            <div className={`${CARD} !rounded-2xl p-4 flex gap-2.5`}><Truck size={18} className="shrink-0" /><span>Shipping: COD in Pakistan; rates set by admin</span></div>
            <div className={`${CARD} !rounded-2xl p-4 flex gap-2.5`}><RotateCcw size={18} className="shrink-0" /><span>Returns: see Return Policy</span></div>
            <div className={`${CARD} !rounded-2xl p-4 flex gap-2.5`}><ShieldCheck size={18} className="shrink-0" /><span>Manual payment verified by shop</span></div>
          </div>
        </div>
      </div>
      {related.length > 0 && <section className="py-10 sm:py-12"><SectionHeader title="Related products" actionTo={`/shop?category=${p.category}`} /><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">{related.map(x => <ProductCard key={x.id} p={x} />)}</div></section>}
      <ReviewForm productId={p.id} />
    </div>
  )
}

export function ReviewForm({ productId }: { productId: string }) {
  const { user, submitReview } = useShop()
  const [rating, setRating] = useState(5); const [body, setBody] = useState(''); const [msg, setMsg] = useState<string | null>(null)
  if (demoMode) return <div className={`${CARD} p-6 sm:p-7 mt-4`}><h2 className="text-xl font-bold mb-2">Reviews</h2><p className="text-neutral-600 text-sm leading-relaxed">Reviews are saved in live mode only. No reviews have been invented for this product.</p></div>
  return <div className={`${CARD} p-6 sm:p-7 mt-4`}><h2 className="text-xl font-bold mb-2">Write a review</h2>
    {!user ? <p className="text-neutral-600 text-sm">Please <Link to="/login" className="underline font-medium">sign in</Link> to write a review. Reviews stay pending until an admin approves them.</p> : <>
      {msg && <p role="status" className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-xl px-3.5 py-2.5 mb-3">{msg}</p>}
      <form className="grid gap-3 max-w-xl" onSubmit={async e => { e.preventDefault(); const res = await submitReview(productId, rating, body); if (res.error) setMsg(res.error); else { setMsg('Thanks! Your review is pending admin approval.'); setBody('') } }}>
        <label className="text-sm font-semibold" htmlFor="review-rating">Rating</label>
        <select id="review-rating" value={rating} onChange={e => setRating(Number(e.target.value))} className="border border-neutral-300 rounded-xl px-3.5 py-3 text-sm w-fit bg-white">{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</select>
        <label className="text-sm font-semibold" htmlFor="review-body">Your review</label>
        <textarea id="review-body" required value={body} onChange={e => setBody(e.target.value)} placeholder="Your review…" rows={4} className={INPUT} />
        <button className={`${BTN_BLACK} py-3 px-7 text-sm w-fit`}>Submit review</button>
      </form>
    </>}
  </div>
}

export function CartPage() {
  const { cart, setQty, removeFromCart, applyCoupon, coupon, couponDiscount, shippingFor } = useShop(); const nav = useNavigate(); const [code, setCode] = useState(''); const [couponMsg, setCouponMsg] = useState<string | null>(null)
  useSeo({ title: 'Shopping Cart — UK Accessories', description: 'Your UK Accessories shopping cart. Prices in PKR, Cash on Delivery in Pakistan.', path: '/cart', noindex: true })
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discount = couponDiscount(subtotal)
  const shipping = shippingFor(subtotal - discount)
  if (!cart.length) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-14 px-6`}><ShoppingCart size={44} className="mx-auto text-neutral-400" /><h1 className="text-3xl font-extrabold tracking-tight mt-4">Your cart is empty</h1><p className="text-neutral-600 mt-2">Browse the shop and add something you like.</p><Link to="/shop" className={`${BTN_BLACK} inline-block mt-6 px-8 py-3.5 text-sm`}>Shop Now</Link></div></div>
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start"><div className="min-w-0"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Shopping Cart</h1><p className="text-neutral-600 mt-2">{cart.length} item{cart.length === 1 ? '' : 's'} • All prices in PKR</p><div className="grid gap-3 mt-6">{cart.map(i => <div key={i.product.id} className={`${CARD} p-4 flex gap-4 items-start`}><Link to={`/product/${i.product.slug}`} className="shrink-0"><img src={i.product.image} alt={`${i.product.name} — representative image`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#F7F7F7] object-contain p-2" /></Link><div className="flex-1 min-w-0"><Link to={`/product/${i.product.slug}`} className="font-semibold leading-snug hover:underline block">{i.product.name}</Link><p className="text-sm text-neutral-500 mt-0.5">{i.colour} • {formatPKR(i.product.price)}</p><div className="flex flex-wrap items-center gap-2 mt-3"><div className="flex items-center border border-neutral-300 rounded-full"><button aria-label="Decrease quantity" onClick={() => setQty(i.product.id, i.qty - 1)} className="w-9 h-9 flex items-center justify-center"><Minus size={14} /></button><span className="w-7 text-center text-sm font-semibold">{i.qty}</span><button aria-label="Increase quantity" onClick={() => setQty(i.product.id, i.qty + 1)} className="w-9 h-9 flex items-center justify-center"><Plus size={14} /></button></div><button onClick={() => removeFromCart(i.product.id)} className="text-red-600 text-sm font-medium px-2 py-2">Remove</button></div></div><span className="font-bold shrink-0">{formatPKR(i.product.price * i.qty)}</span></div>)}</div></div>
      <aside className={`${CARD} p-6 lg:sticky lg:top-24`}><h2 className="font-bold text-lg">Summary</h2><div className="space-y-2.5 text-sm mt-4"><p className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></p><p className="flex justify-between"><span>Discount {coupon ? `(${coupon})` : ''}</span><span>-{formatPKR(discount)}</span></p><p className="flex justify-between"><span>Shipping</span><span>{formatPKR(shipping)}</span></p><p className="flex justify-between font-bold text-base border-t border-neutral-200 pt-3"><span>Total</span><span>{formatPKR(subtotal - discount + shipping)}</span></p></div>
        <form className="flex gap-2 mt-5" onSubmit={e => { e.preventDefault(); const ok = applyCoupon(code); setCouponMsg(ok ? `Coupon ${code.trim().toUpperCase()} applied.` : 'Invalid or expired coupon.') }}><label htmlFor="cart-coupon" className="sr-only">Coupon code</label><input id="cart-coupon" value={code} onChange={e => setCode(e.target.value)} placeholder="Coupon code" className={`${INPUT} !py-2.5`} /><button className={`${BTN_OUTLINE} px-5 text-sm shrink-0`}>Apply</button></form>
        {couponMsg && <p role="status" className="text-sm mt-3 bg-[#F7F7F7] border border-neutral-200 rounded-xl px-3.5 py-2.5">{couponMsg}</p>}
        <button onClick={() => nav('/checkout')} className={`${BTN_BLACK} w-full py-3.5 mt-5 text-sm`}>Proceed to Checkout</button>
        <p className="text-xs text-neutral-500 mt-3 text-center leading-relaxed">Cash on Delivery available in Pakistan. Questions? <a className="underline" href={whatsappLink}>WhatsApp +92 3170851250</a></p></aside></div>
  )
}

export function CheckoutPage() {
  const { cart, placeOrder, placeOrderLive, couponDiscount, shippingFor, user } = useShop()
  const [payment, setPayment] = useState('Cash on Delivery'); const [txnId, setTxnId] = useState(''); const [done, setDone] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null); const [orderError, setOrderError] = useState<string | null>(null); const [placing, setPlacing] = useState(false)
  useSeo({ title: 'Checkout — UK Accessories', description: 'Checkout at UK Accessories. Cash on Delivery in Pakistan or manual JazzCash/Easypaisa payment verified by the shop.', path: '/checkout', noindex: true })
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discount = couponDiscount(subtotal); const shipping = shippingFor(subtotal - discount); const total = subtotal - discount + shipping
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setOrderError(null); setPlacing(true)
    try {
      const fd = new FormData(e.currentTarget)
      if (demoMode) {
        const order = placeOrder({ items: cart, total, payment, name: String(fd.get('name')), city: String(fd.get('city')), txnId: txnId || undefined })
        setDone(order.id); return
      }
      // Live mode: the server creates the order (create_order in migration
      // 003), validates prices/stock, and decrements stock atomically.
      // On failure the cart is kept and the error is shown — no fake order.
      const res = await placeOrderLive({
        name: String(fd.get('name')), city: String(fd.get('city')), phone: String(fd.get('phone')),
        email: String(fd.get('email')), country: String(fd.get('country')), address: String(fd.get('address')),
        postalCode: String(fd.get('postal') || ''), notes: String(fd.get('notes') || ''),
        payment, txnId: txnId || undefined, screenshot,
      })
      if (res.error || !res.order) { setOrderError(res.error || 'Order could not be created. Your cart was kept.'); return }
      setDone(res.order.id)
    } finally { setPlacing(false) }
  }
  if (done) return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><CheckCircle2 size={48} className="mx-auto text-green-700" /><h1 className="text-3xl font-extrabold tracking-tight mt-4">Order placed — {done}</h1><p className="text-neutral-600 mt-3 leading-relaxed">Thank you! {demoMode ? 'In demo mode this order is saved in this browser only.' : 'Your order is saved in Supabase and the shop can see it in /admin → Orders.'} {payment === 'Cash on Delivery' ? 'Pay on delivery.' : 'Your manual payment is marked pending verification — the shop will confirm it.'}</p><div className="flex flex-wrap justify-center gap-3 mt-6"><Link to="/track" className={`${BTN_BLACK} px-7 py-3 text-sm`}>Track Order</Link><Link to="/shop" className={`${BTN_OUTLINE} px-7 py-3 text-sm`}>Continue shopping</Link></div></div></div>
  if (!cart.length) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1><p className="mt-2 text-neutral-600">Your cart is empty.</p><Link to="/shop" className="underline mt-4 inline-block font-medium">Back to shop</Link></div></div>
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Checkout</h1>
      <ol className="flex flex-wrap gap-2 mt-5 text-sm" aria-label="Checkout steps"><li><Link to="/cart" className="inline-flex items-center gap-1.5 bg-[#F7F7F7] border border-neutral-200 rounded-full px-3.5 py-1.5 font-medium"><Check size={14} /> 1. Cart</Link></li><li><span className="inline-flex items-center gap-1.5 bg-black text-white rounded-full px-3.5 py-1.5 font-semibold">2. Checkout</span></li><li><span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] border border-neutral-200 rounded-full px-3.5 py-1.5 text-neutral-500">3. Done</span></li></ol>
      {demoMode && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 mt-5">Demo mode: orders are created in this browser only.</p>}
      {orderError && <p role="alert" className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mt-5">{orderError}</p>}
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 mt-6 items-start"><div className="grid gap-5 min-w-0">
        <div className={CARD}><div className="p-5 sm:p-6"><h2 className="font-bold text-lg mb-4">Contact &amp; delivery</h2><div className="grid sm:grid-cols-2 gap-4">
          <Field name="name" label="Full name *" required /><Field name="phone" label="Phone number *" required /><Field name="email" label="Email *" type="email" defaultValue={user?.email || ''} required /><Field name="country" label="Country *" defaultValue="Pakistan" required /><Field name="city" label="City *" required /><Field name="postal" label="Postal code" /><div className="sm:col-span-2"><label className="text-sm font-semibold block mb-1.5" htmlFor="address">Complete address *</label><textarea id="address" name="address" required className={INPUT} rows={3} /></div>
          <div className="sm:col-span-2"><label className="text-sm font-semibold block mb-1.5" htmlFor="notes">Order notes</label><textarea id="notes" name="notes" className={INPUT} rows={2} /></div>
        </div></div></div>
        <fieldset className={CARD}><div className="p-5 sm:p-6"><legend className="font-bold text-lg px-1">Payment method</legend>
          <div className="grid gap-2.5 mt-1">{['Cash on Delivery', 'JazzCash (manual)', 'Easypaisa (manual)'].map(m => <label key={m} className={`flex items-center gap-3 border rounded-2xl px-4 py-3.5 text-sm font-medium cursor-pointer transition-colors ${payment === m ? 'border-black bg-[#F7F7F7]' : 'border-neutral-300 hover:border-neutral-500'}`}><input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} className="accent-black w-4 h-4" />{m}{m === 'Cash on Delivery' && <span className="ml-auto text-xs font-semibold bg-green-100 text-green-800 rounded-full px-2.5 py-1">Recommended</span>}</label>)}</div>
          {payment !== 'Cash on Delivery' && <div className="bg-[#F7F7F7] border border-neutral-200 rounded-2xl p-4 sm:p-5 mt-4 text-sm leading-relaxed"><p><strong>Manual payment — no account details are published here.</strong> The shop will share JazzCash/Easypaisa details on WhatsApp after you place the order, or you can message <a className="underline font-medium" href={whatsappLink}>WhatsApp +92 3170851250</a>.</p><label className="block mt-4 font-semibold" htmlFor="txn">Transaction ID (if you have already paid)</label><input id="txn" value={txnId} onChange={e => setTxnId(e.target.value)} className={`${INPUT} mt-1.5`} placeholder="e.g. TRX123456" /><label className="block mt-4 font-semibold" htmlFor="shot">Payment screenshot</label><input id="shot" type="file" accept="image/*" onChange={e => setScreenshot(e.target.files?.[0] ?? null)} className="mt-1.5 text-sm" /><p className="text-neutral-500 mt-2">{demoMode ? 'Demo mode: the file name only is kept in this browser.' : 'Signed-in customers: the screenshot is uploaded to private Supabase Storage for admin verification. Guests: please share the screenshot on WhatsApp after ordering.'} Status after order: Pending verification. Admin approves or rejects it in /admin → Payments.</p></div>}
        </div></fieldset>
        <button disabled={placing} className={`${BTN_BLACK} py-4 text-sm sm:text-base`}>{placing ? 'Placing order…' : `Place Order — ${formatPKR(total)}`}</button>
      </div><aside className={`${CARD} p-6 lg:sticky lg:top-24`}><h2 className="font-bold text-lg">Order summary</h2>{cart.map(i => <p key={i.product.id} className="flex justify-between gap-3 text-sm py-1.5"><span className="min-w-0">{i.product.name} × {i.qty}</span><span className="shrink-0">{formatPKR(i.product.price * i.qty)}</span></p>)}<p className="flex justify-between text-sm py-1.5"><span>Discount</span><span>-{formatPKR(discount)}</span></p><p className="flex justify-between text-sm py-1.5"><span>Shipping</span><span>{formatPKR(shipping)}</span></p><p className="flex justify-between font-bold border-t border-neutral-200 pt-3 mt-2"><span>Total</span><span>{formatPKR(total)}</span></p><p className="text-xs text-neutral-500 mt-4 leading-relaxed">No payment account details are published on this site. Manual payments stay pending until the shop verifies them.</p></aside></form></div>
  )
}
function Field({ name, label, required, type = 'text', defaultValue }: { name: string; label: string; required?: boolean; type?: string; defaultValue?: string }) {
  return <div><label className="text-sm font-semibold block mb-1.5" htmlFor={name}>{label}</label><input id={name} name={name} required={required} type={type} defaultValue={defaultValue} className={INPUT} /></div>
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, loginWithPassword, register, resetPassword } = useShop(); const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)
  useSeo({ title: mode === 'login' ? 'Customer Login — UK Accessories' : 'Customer Registration — UK Accessories', description: 'Sign in or register at UK Accessories Pakistan to track orders and manage your account.', path: mode === 'login' ? '/login' : '/register', noindex: true })
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null); setInfo(null); setBusy(true)
    try {
      if (mode === 'login') {
        const res = await loginWithPassword(email, password)
        if (res.error) { setError(res.error); return }
        nav(res.user?.isAdmin ? '/admin' : '/profile')
      } else {
        const res = await register(name, email, password)
        if (res.error) { setError(res.error); return }
        if (res.needsConfirmation) { setInfo('Account created. Please check your email to confirm it, then sign in.'); return }
        nav('/profile')
      }
    } finally { setBusy(false) }
  }
  const doReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null); setInfo(null); setBusy(true)
    try {
      const res = await resetPassword(email)
      if (res.error) setError(res.error)
      else setInfo(demoMode ? 'Demo mode: password reset is not sent in this browser.' : 'Password reset link sent — check your email.')
    } finally { setBusy(false) }
  }
  return <div className="max-w-md mx-auto px-4 py-12 sm:py-16"><div className={`${CARD} p-6 sm:p-8`}><h1 className="text-3xl font-extrabold tracking-tight">{mode === 'login' ? 'Customer Login' : 'Customer Registration'}</h1>
    <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{demoMode
      ? 'Demo mode: any email signs you in locally in this browser.'
      : 'Sign in with your Supabase account. Admin access comes only from a user_roles row in Supabase — there is no public admin registration and no admin flag set from this page.'}</p>
    {error && <p role="alert" className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mt-4">{error}</p>}
    {info && <p role="status" className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mt-4">{info}</p>}
    <form className="grid gap-4 mt-6" onSubmit={submit}>
      {mode === 'register' && <div><label className="text-sm font-semibold block mb-1.5" htmlFor="auth-name">Full name</label><input id="auth-name" required placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className={INPUT} /></div>}
      <div><label className="text-sm font-semibold block mb-1.5" htmlFor="auth-email">Email</label><input id="auth-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT} /></div>
      <div><label className="text-sm font-semibold block mb-1.5" htmlFor="auth-password">Password</label><input id="auth-password" required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={INPUT} /></div>
      <button disabled={busy} className={`${BTN_BLACK} py-3.5 text-sm`}>{busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}</button>
    </form>
    <p className="text-sm mt-5 text-center">{mode === 'login' ? <>New here? <Link to="/register" className="underline font-medium">Register</Link></> : <>Already have an account? <Link to="/login" className="underline font-medium">Login</Link></>} • <button onClick={() => setShowReset(s => !s)} className="underline font-medium">Password reset</button></p>
    {showReset && <form className="grid gap-3 mt-5 bg-[#F7F7F7] border border-neutral-200 rounded-2xl p-4" onSubmit={doReset}>
      <p className="text-sm text-neutral-600 leading-relaxed">{demoMode ? 'Demo mode: reset links are not sent.' : 'Enter your email and we will send a Supabase password reset link.'}</p>
      <label className="text-sm font-semibold" htmlFor="reset-email">Email</label>
      <input id="reset-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={INPUT} />
      <button disabled={busy} className={`${BTN_OUTLINE} py-3 text-sm`}>Send reset link</button>
    </form>}
    {demoMode && <button onClick={() => { login('admin@ukaccessories.demo', true); nav('/admin') }} className={`${BTN_OUTLINE} mt-6 w-full py-3 text-sm`}>Demo: sign in as admin (demo only — not a real admin account)</button>}
  </div></div>
}

export function ProfilePage() {
  const { user, orders, logout, authLoading } = useShop(); const nav = useNavigate()
  useSeo({ title: 'My Profile — UK Accessories', description: 'Your UK Accessories profile and orders.', path: '/profile', noindex: true })
  if (authLoading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><h1 className="text-2xl font-bold">Loading your profile…</h1><p className="text-neutral-500 text-sm mt-2">Checking your session.</p></div></div>
  if (!user) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><h1 className="text-2xl font-bold">Please login first</h1><p className="text-neutral-500 text-sm mt-2">Sign in to see your profile and orders.</p><Link to="/login" className={`${BTN_BLACK} inline-block px-7 py-3 text-sm mt-5`}>Go to login</Link></div></div>
  return <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
    <div className={`${CARD} p-6 sm:p-7 flex flex-wrap gap-4 items-center`}><span className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-extrabold shrink-0">{(user.name || user.email).charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{user.name}</h1><p className="text-neutral-600 text-sm mt-0.5 truncate">{user.email} {user.isAdmin && <span className="ml-1 font-semibold text-black">• {demoMode ? 'Admin (demo)' : 'Admin'}</span>}</p></div><button onClick={() => { logout(); nav('/') }} className={`${BTN_OUTLINE} px-5 py-2.5 text-sm shrink-0`}>Logout</button></div>
    <h2 className="text-xl font-bold mt-10 mb-4">My Orders</h2>{orders.length === 0 ? <div className={`${CARD} p-6 text-center`}><Package size={36} className="mx-auto text-neutral-400" /><p className="text-neutral-500 mt-3">No orders yet.</p><Link to="/shop" className={`${BTN_BLACK} inline-block px-6 py-3 text-sm mt-4`}>Shop Now</Link></div> : <div className="grid gap-3">{orders.map(o => <div key={o.id} className={`${CARD} p-5 flex flex-wrap justify-between gap-3`}><div className="min-w-0"><p className="font-semibold">{o.id} — {o.date}</p><p className="text-sm text-neutral-600 mt-1">{o.items.map(i => `${i.product.name} × ${i.qty}`).join(', ')}</p><p className="text-sm text-neutral-500 mt-1">{o.payment} • {o.paymentStatus}</p></div><div className="text-right shrink-0"><p className="font-bold">{formatPKR(o.total)}</p><div className="mt-2"><StatusPill status={o.status} /></div></div></div>)}</div>}
  </div>
}

export function WishlistPage() {
  const { wishlist } = useShop()
  useSeo({ title: 'Wishlist — UK Accessories', description: 'Your saved UK Accessories products.', path: '/wishlist', noindex: true })
  return <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Wishlist</h1><p className="text-neutral-600 mt-2">{wishlist.length === 0 ? 'Save products you like and find them here.' : `${wishlist.length} saved item${wishlist.length === 1 ? '' : 's'}.`}</p>{wishlist.length === 0 ? <div className={`${CARD} py-14 px-6 text-center mt-6`}><Heart size={40} className="mx-auto text-neutral-400" /><p className="text-neutral-500 mt-3">Your wishlist is empty.</p><Link to="/shop" className={`${BTN_BLACK} inline-block px-7 py-3 text-sm mt-5`}>Shop Now</Link></div> : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-6">{wishlist.map(p => <ProductCard key={p.id} p={p} />)}</div>}</div>
}

const TRACK_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

export function TrackPage() {
  const { orders } = useShop(); const [id, setId] = useState(''); const [found, setFound] = useState<typeof orders[0] | null>(null); const [searched, setSearched] = useState(false)
  useSeo({ title: 'Order Tracking — UK Accessories', description: 'Track your UK Accessories order by order ID.', path: '/track', noindex: true })
  const stepIndex = found ? TRACK_STEPS.indexOf(found.status) : -1
  return <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Order Tracking</h1><p className="text-neutral-600 mt-2">Enter your order ID to check its status.</p>
    <div className={CARD}><form className="flex flex-col sm:flex-row gap-2 p-4 sm:p-5" onSubmit={e => { e.preventDefault(); setSearched(true); setFound(orders.find(o => o.id === id.trim()) || null) }}><label htmlFor="track-id" className="sr-only">Order ID</label><input id="track-id" value={id} onChange={e => setId(e.target.value)} placeholder="Order ID, e.g. UK-123456" className={`${INPUT} flex-1`} /><button className={`${BTN_BLACK} px-7 py-3 text-sm shrink-0`}>Track</button></form></div>
    {found && <div className={`${CARD} p-5 sm:p-6 mt-5`}>
      <div className="flex flex-wrap justify-between gap-3 items-start"><div><p className="font-bold text-lg">{found.id}</p><p className="text-sm text-neutral-600 mt-1">{found.items.map(i => `${i.product.name} × ${i.qty}`).join(', ')}</p><p className="text-sm text-neutral-500 mt-1">Payment: {found.payment} ({found.paymentStatus}) • Total {formatPKR(found.total)}</p></div><StatusPill status={found.status} /></div>
      {(found.status === 'Cancelled' || found.status === 'Refunded') ? <p className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mt-5">This order is {found.status.toLowerCase()}. For refund questions, contact the shop on WhatsApp +92 3170851250.</p> : <ol className="mt-6 space-y-0">{TRACK_STEPS.map((s, i) => <li key={s} className="flex gap-3"><span className="flex flex-col items-center"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < stepIndex ? 'bg-black text-white' : i === stepIndex ? 'bg-black text-white ring-4 ring-black/10' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}>{i < stepIndex || i === stepIndex ? <Check size={14} /> : i + 1}</span>{i < TRACK_STEPS.length - 1 && <span className={`w-0.5 flex-1 min-h-5 ${i < stepIndex ? 'bg-black' : 'bg-neutral-200'}`} />}</span><span className={`py-1 text-sm pb-5 ${i === stepIndex ? 'font-bold' : i < stepIndex ? 'text-neutral-700' : 'text-neutral-400'}`}>{s}{i === stepIndex ? ' — current status' : ''}</span></li>)}</ol>}
    </div>}
    {searched && !found && <p className="text-neutral-600 bg-[#F7F7F7] border border-neutral-200 rounded-2xl px-4 py-3.5 mt-5 text-sm leading-relaxed">No order found with that ID here. Signed-in customers see their Supabase orders below; guest live orders appear here in the browser they were placed in.</p>}
    <h2 className="font-bold text-lg mt-10 mb-3">Your orders</h2>{orders.length === 0 ? <p className="text-neutral-500 text-sm">No orders in this browser yet.</p> : <div className="grid gap-3">{orders.map(o => <div key={o.id} className={`${CARD} !rounded-2xl p-4 flex flex-wrap justify-between gap-3 items-center`}><span className="text-sm"><strong>{o.id}</strong> — {formatPKR(o.total)}</span><span className="flex items-center gap-2"><StatusPill status={o.status} /><button onClick={() => { setId(o.id); setSearched(true); setFound(o) }} className={`${BTN_OUTLINE} px-4 py-2 text-xs`}>Track</button></span></div>)}</div>}
  </div>
}

export function StaticPage({ title, body }: { title: string; body: string }) {
  const isFaq = title === 'FAQ'
  useSeo({ title: `${title} — UK Accessories Pakistan`, description: `${title} at UK Accessories Pakistan. ${body.split('\n')[0].slice(0, 140)}`, jsonLd: isFaq ? FAQ_JSON_LD : undefined })
  return <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1><div className={`${CARD} p-6 sm:p-8 mt-6 whitespace-pre-line text-neutral-700 leading-relaxed`}>{body}</div></div>
}

export const STATIC: Record<string, { title: string; body: string }> = {
  about: { title: 'About Us', body: 'UK Accessories is an online mobile accessories and tech gadgets store serving customers in Pakistan. It sells wireless earbuds, headphones, fast chargers, charging cables, power banks, smartwatches, phone cases and screen protectors, with prices in PKR. Orders in Pakistan can be paid by Cash on Delivery, or by manual JazzCash/Easypaisa payment verified by the shop over WhatsApp (+92 3170851250). International delivery is not advertised as available yet.\n\nSlogan: Upgrade Your Tech. Elevate Your Style.\n\nPrimary market: Pakistan. Secondary: international customers (international delivery is not advertised as available until courier arrangements and rates are confirmed).\n\nSupport: WhatsApp +92 3170851250. Currency: PKR.\n\nPrices shown are sample prices — confirm the price on WhatsApp before ordering if unsure (see FAQ). Product images are representative images, not exact photos of every model.' },
  contact: { title: 'Contact Us', body: 'WhatsApp: +92 3170851250\nMessage: Hello UK Accessories! I need assistance with your products and orders.\n\nUse the floating WhatsApp button on every page. No business email or shop address is published here because none has been confirmed for UK Accessories in this brief. Social media links are placeholders until the owner provides them.' },
  faq: { title: 'FAQ', body: 'Q: Do you offer Cash on Delivery?\nA: Yes, in Pakistan (demo checkout supports it).\n\nQ: Can I pay with JazzCash or Easypaisa?\nA: Yes, manually. Place the order, share your transaction ID, and the shop verifies it. No automatic payment integration is claimed, and no payment account details are published on this site.\n\nQ: Are prices final?\nA: No — current prices are demo samples. Confirm the price on WhatsApp before ordering if unsure.\n\nQ: Do you deliver internationally?\nA: Not advertised as available yet, until courier rates are confirmed.\n\nQ: What is UK Accessories?\nA: UK Accessories is an online mobile accessories and tech gadgets store serving customers in Pakistan. Its slogan is Upgrade Your Tech. Elevate Your Style.\n\nQ: What products does UK Accessories sell?\nA: Wireless earbuds, headphones, fast chargers, charging cables, power banks, smartwatches, phone cases and screen protectors, priced in PKR. See /shop for the current product list and prices.\n\nQ: How do I order on WhatsApp?\nA: Message UK Accessories on WhatsApp at +92 3170851250 with: Hello UK Accessories! I need assistance with your products and orders.\n\nQ: What is the shipping policy?\nA: Shipping is available in Pakistan. Demo shipping is Rs. 250, free over Rs. 5,000 (a demo rule, admin-configurable in the live store). Delivery estimates, zones and rates must be confirmed by the owner before they are promised.\n\nQ: What if my item arrives damaged or incorrect?\nA: Contact UK Accessories on WhatsApp (+92 3170851250) with your order ID and photos. Manual-payment refunds are handled by the shop after verification.' },
  privacy: { title: 'Privacy Policy', body: 'We collect only the information needed to process orders: name, phone, email, address and order details. In demo mode this stays in your browser. In live mode it is stored in Supabase with Row Level Security — customers can only access their own data. We do not sell personal data. Contact us on WhatsApp +92 3170851250 for privacy requests.' },
  terms: { title: 'Terms and Conditions', body: 'By using UK Accessories you agree to these terms. Products shown are demo samples until approved. Prices are in PKR. Orders are subject to confirmation and stock availability. Manual payments are subject to verification. Nothing here promises international delivery until confirmed.' },
  shipping: { title: 'Shipping Policy', body: 'Shipping is available in Pakistan. Demo shipping: Rs. 250, free over Rs. 5,000 (demo rule — admin-configurable in live mode).\n\nDelivery estimates, zones and rates are admin-configurable in the live store and must be confirmed by the owner before they are promised to customers. International shipping is not advertised as available yet.' },
  returns: { title: 'Return and Refund Policy', body: 'If an item arrives damaged or incorrect, contact us on WhatsApp +92 3170851250 with your order ID and photos.\n\nEligible cancellations/refunds restore stock in the admin system. Manual-payment refunds are handled by the shop after verification — no automatic refund claim is made. Final return windows and conditions are set by the owner in the live store settings.' },
}
