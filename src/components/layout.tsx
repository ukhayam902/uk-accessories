import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Heart, Menu, MessageCircle, Search, ShoppingCart, User, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useShop } from '../store/shop'
import { whatsappLink } from '../data/catalog'
import { demoMode } from '../lib/supabase'

export function Logo() {
  return <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="UK Accessories home"><img src="/images/logo.svg" alt="UK Accessories logo" className="h-10 w-auto rounded-lg" /><span className="leading-none"><span className="block font-extrabold tracking-[0.18em] text-[15px] sm:text-base">UK ACCESSORIES</span><span className="block text-[10px] tracking-[0.22em] text-neutral-500 mt-1">UPGRADE YOUR TECH</span></span></Link>
}

const ICON_BTN = 'relative inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#F7F7F7] transition-colors shrink-0'

export function Layout({ children }: { children: ReactNode }) {
  const { cart, wishlist, user, categories } = useShop()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const goSearch = (value: string) => {
    setOpen(false)
    nav(value.trim() ? `/shop?search=${encodeURIComponent(value.trim())}` : '/shop')
  }
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <div className="bg-[#080808] text-white text-center text-xs sm:text-sm py-2.5 px-4 leading-relaxed">UK Accessories — Upgrade Your Tech. Elevate Your Style. <span className="text-neutral-300">• Cash on Delivery available in Pakistan</span></div>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="py-3 flex items-center gap-2 sm:gap-3 min-w-0">
            <button className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#F7F7F7] shrink-0" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <Logo />
            <nav className="hidden lg:flex gap-5 ml-6 text-sm font-medium shrink-0" aria-label="Main navigation">
              <NavLink to="/" className={({ isActive }) => isActive ? 'underline underline-offset-4 decoration-2' : 'text-neutral-600 hover:text-black'}>Home</NavLink>
              <NavLink to="/shop" className={({ isActive }) => isActive ? 'underline underline-offset-4 decoration-2' : 'text-neutral-600 hover:text-black'}>Shop All</NavLink>
              {categories.slice(0, 4).map(c => <NavLink key={c.id} to={`/shop?category=${c.id}`} className="text-neutral-600 hover:text-black">{c.name}</NavLink>)}
            </nav>
            <form className="hidden md:flex flex-1 max-w-md ml-auto items-center border border-neutral-300 rounded-full px-4 py-2 gap-2 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 transition" onSubmit={e => { e.preventDefault(); goSearch(q) }} role="search">
              <Search size={18} className="text-neutral-500 shrink-0" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="outline-none text-sm w-full bg-transparent" />
            </form>
            <div className="flex items-center gap-0.5 ml-auto md:ml-0 shrink-0">
              <Link to={user ? '/profile' : '/login'} aria-label="Account" className={ICON_BTN}><User size={22} /></Link>
              <Link to="/wishlist" aria-label="Wishlist" className={ICON_BTN}><Heart size={22} />{wishlist.length > 0 && <span className="absolute top-0.5 right-0.5 bg-black text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{wishlist.length}</span>}</Link>
              <Link to="/cart" aria-label="Shopping cart" className={ICON_BTN}><ShoppingCart size={22} />{count > 0 && <span className="absolute top-0.5 right-0.5 bg-black text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{count}</span>}</Link>
            </div>
          </div>
          <form className="md:hidden flex items-center border border-neutral-300 rounded-full px-4 py-2.5 gap-2 mb-3 focus-within:border-black" onSubmit={e => { e.preventDefault(); goSearch(q) }} role="search">
            <Search size={18} className="text-neutral-500 shrink-0" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="outline-none text-sm w-full bg-transparent" />
          </form>
        </div>
      </header>
      {open && <div className="fixed inset-0 z-50 bg-white overflow-y-auto" role="dialog" aria-label="Menu">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)} className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#F7F7F7]"><X size={24} /></button></div>
          <form className="flex items-center border border-neutral-300 rounded-full px-4 py-3 gap-2 mt-6" onSubmit={e => { e.preventDefault(); goSearch(q) }} role="search">
            <Search size={18} className="text-neutral-500 shrink-0" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="outline-none text-sm w-full bg-transparent" />
          </form>
          <nav className="grid gap-1 mt-6 text-lg font-medium" onClick={() => setOpen(false)}>
            <Link to="/" className="py-3 border-b border-neutral-100">Home</Link>
            <Link to="/shop" className="py-3 border-b border-neutral-100">Shop All</Link>
            <Link to="/cart" className="py-3 border-b border-neutral-100">Cart{count > 0 ? ` (${count})` : ''}</Link>
            <Link to="/wishlist" className="py-3 border-b border-neutral-100">Wishlist</Link>
            <Link to="/track" className="py-3 border-b border-neutral-100">Order Tracking</Link>
            <Link to={user ? '/profile' : '/login'} className="py-3 border-b border-neutral-100">{user ? 'My Profile' : 'Login / Register'}</Link>
            <Link to="/admin" className="py-3 border-b border-neutral-100">Admin</Link>
          </nav>
          <h2 className="text-xs font-bold tracking-[0.2em] text-neutral-500 mt-8 mb-2">SHOP BY COLLECTION</h2>
          <nav className="grid gap-1 text-base" onClick={() => setOpen(false)}>
            {categories.map(c => <Link key={c.id} to={`/shop?category=${c.id}`} className="py-2.5 text-neutral-700">{c.name}</Link>)}
          </nav>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-8 flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-full py-3.5 font-semibold"><MessageCircle size={20} /> Chat on WhatsApp</a>
        </div>
      </div>}
      {demoMode && <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm text-center px-4 py-2.5 leading-relaxed">Demo mode: Supabase live connection is not configured yet (anon key still missing). Cart, checkout and admin below run on demo data in this browser. Prices are demo samples, not confirmed shop prices. <Link to="/admin" className="underline font-semibold">Admin setup →</Link></div>}
      <main className="flex-1 min-w-0">{children}</main>
      <footer className="bg-[#080808] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div><Logo /><p className="text-neutral-400 text-sm mt-4 leading-relaxed">Upgrade Your Tech. Elevate Your Style.</p><p className="text-neutral-400 text-sm mt-3">WhatsApp: +92 3170851250</p><p className="text-neutral-400 text-sm">Currency: PKR • Market: Pakistan (primary)</p><p className="text-neutral-400 text-sm mt-3">Cash on Delivery available in Pakistan. Manual JazzCash / Easypaisa payments are verified by the shop.</p></div>
          <nav aria-label="Shop"><h3 className="font-bold mb-4">Shop</h3><ul className="space-y-2.5 text-neutral-300 text-sm"><li><Link to="/shop" className="hover:text-white">Shop All</Link></li>{categories.slice(0, 6).map(c => <li key={c.id}><Link to={`/shop?category=${c.id}`} className="hover:text-white">{c.name}</Link></li>)}</ul></nav>
          <nav aria-label="Help"><h3 className="font-bold mb-4">Help</h3><ul className="space-y-2.5 text-neutral-300 text-sm"><li><Link to="/faq" className="hover:text-white">FAQ</Link></li><li><Link to="/shipping" className="hover:text-white">Shipping Policy</Link></li><li><Link to="/returns" className="hover:text-white">Return and Refund Policy</Link></li><li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-white">Terms and Conditions</Link></li><li><Link to="/track" className="hover:text-white">Order Tracking</Link></li><li><Link to="/admin" className="hover:text-white">Admin</Link></li></ul></nav>
          <div><h3 className="font-bold mb-4">Social (to be added by owner)</h3><p className="text-neutral-400 text-sm leading-relaxed">Instagram, Facebook, TikTok and YouTube links are placeholders — the owner has no social links yet and none have been invented.</p><p className="text-neutral-400 text-sm mt-3 leading-relaxed">International delivery is not advertised as available until courier arrangements and rates are confirmed.</p></div>
        </div>
        <div className="border-t border-neutral-800 text-center text-xs text-neutral-500 py-5 px-4 leading-relaxed">© {new Date().getFullYear()} UK Accessories. Demo products and prices are samples until approved by the owner.</div>
      </footer>
      <a href={whatsappLink} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 bg-[#25D366] hover:bg-[#1eb85a] text-white rounded-full pl-4 pr-5 py-3.5 shadow-xl flex items-center gap-2 transition-transform hover:scale-105"><MessageCircle size={22} /> <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span></a>
    </div>
  )
}
