import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Heart, Menu, MessageCircle, Search, ShoppingCart, User, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useShop } from '../store/shop'
import { whatsappLink } from '../data/catalog'
import { demoMode } from '../lib/supabase'

export function Logo() {
  return <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="UK Accessories home"><img src="/images/logo.svg" alt="UK Accessories logo" className="h-10 w-auto rounded" /><span className="hidden sm:block leading-none"><span className="block font-extrabold tracking-[0.2em]">UK ACCESSORIES</span><span className="text-[10px] tracking-widest text-neutral-500">UPGRADE YOUR TECH</span></span></Link>
}

export function Layout({ children }: { children: ReactNode }) {
  const { cart, wishlist, user, categories } = useShop()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const count = cart.reduce((s, i) => s + i.qty, 0)
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="bg-[#080808] text-white text-center text-xs sm:text-sm py-2 px-3">UK Accessories — Upgrade Your Tech. Elevate Your Style. • Cash on Delivery available in Pakistan</div>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
          <Logo />
          <nav className="hidden lg:flex gap-5 ml-6 text-sm font-medium" aria-label="Main navigation">
            <NavLink to="/" className={({ isActive }) => isActive ? 'underline underline-offset-4' : ''}>Home</NavLink>
            <NavLink to="/shop" className={({ isActive }) => isActive ? 'underline underline-offset-4' : ''}>Shop All</NavLink>
            {categories.slice(0, 5).map(c => <NavLink key={c.id} to={`/shop?category=${c.id}`}>{c.name}</NavLink>)}
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <form className="hidden md:flex flex-1 max-w-sm ml-auto items-center border rounded-full px-3 py-1.5" onSubmit={e => { e.preventDefault(); nav(`/shop?search=${encodeURIComponent(q)}`) }} role="search">
            <Search size={18} className="text-neutral-500" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="outline-none px-2 text-sm w-full" />
          </form>
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <Link to={user ? '/profile' : '/login'} aria-label="Account"><User /></Link>
            <Link to="/wishlist" aria-label="Wishlist" className="relative"><Heart />{wishlist.length > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full px-1.5">{wishlist.length}</span>}</Link>
            <Link to="/cart" aria-label="Shopping cart" className="relative"><ShoppingCart />{count > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full px-1.5">{count}</span>}</Link>
          </div>
        </div>
      </header>
      {open && <div className="fixed inset-0 z-50 bg-white p-5 overflow-auto"><div className="flex justify-between"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)}><X /></button></div><nav className="grid gap-4 mt-8 text-lg" onClick={() => setOpen(false)}><Link to="/">Home</Link><Link to="/shop">Shop All</Link>{categories.map(c => <Link key={c.id} to={`/shop?category=${c.id}`}>{c.name}</Link>)}<Link to="/about">About Us</Link><Link to="/contact">Contact Us</Link><Link to="/faq">FAQ</Link><Link to="/admin">Admin</Link></nav></div>}
      {demoMode && <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm text-center px-4 py-2">Demo mode: Supabase live connection is not configured yet (anon key still missing). Cart, checkout and admin below run on demo data in this browser. Prices are demo samples, not confirmed shop prices. <Link to="/admin" className="underline font-semibold">Admin setup →</Link></div>}
      <main>{children}</main>
      <footer className="bg-[#080808] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
          <div><Logo /><p className="text-neutral-400 text-sm mt-4">Upgrade Your Tech. Elevate Your Style.</p><p className="text-neutral-400 text-sm mt-2">WhatsApp: +92 3170851250</p><p className="text-neutral-400 text-sm">Currency: PKR • Market: Pakistan (primary)</p></div>
          <nav aria-label="Shop"><h3 className="font-bold mb-3">Shop</h3><ul className="space-y-2 text-neutral-300 text-sm"><li><Link to="/shop">Shop All</Link></li>{categories.slice(0, 6).map(c => <li key={c.id}><Link to={`/shop?category=${c.id}`}>{c.name}</Link></li>)}</ul></nav>
          <nav aria-label="Help"><h3 className="font-bold mb-3">Help</h3><ul className="space-y-2 text-neutral-300 text-sm"><li><Link to="/faq">FAQ</Link></li><li><Link to="/shipping">Shipping Policy</Link></li><li><Link to="/returns">Return and Refund Policy</Link></li><li><Link to="/privacy">Privacy Policy</Link></li><li><Link to="/terms">Terms and Conditions</Link></li><li><Link to="/track">Order Tracking</Link></li></ul></nav>
          <div><h3 className="font-bold mb-3">Social (to be added by owner)</h3><p className="text-neutral-400 text-sm">Instagram, Facebook, TikTok and YouTube links are placeholders — the owner has no social links yet and none have been invented.</p><p className="text-neutral-400 text-sm mt-3">International delivery is not advertised as available until courier arrangements and rates are confirmed.</p></div>
        </div>
        <div className="border-t border-neutral-800 text-center text-xs text-neutral-500 py-4 px-4">© {new Date().getFullYear()} UK Accessories. Demo products and prices are samples until approved by the owner.</div>
      </footer>
      <a href={whatsappLink} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 bg-[#25D366] text-white rounded-full p-4 shadow-lg flex items-center gap-2"><MessageCircle /> <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span></a>
    </div>
  )
}
