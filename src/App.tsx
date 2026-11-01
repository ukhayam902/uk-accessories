import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ShopProvider, useShop } from './store/shop'
import { Layout } from './components/layout'
import { AuthPage, CartPage, CheckoutPage, Home, ProductPage, ProfilePage, ShopPage, STATIC, StaticPage, TrackPage, WishlistPage } from './pages/pages'
import { AdminPage } from './pages/admin'

function Toast() {
  const { toast } = useShop()
  if (!toast) return null
  return <div role="status" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 rounded-full shadow-lg text-sm">{toast}</div>
}

export default function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {Object.entries(STATIC).map(([slug, page]) => (
              <Route key={slug} path={`/${slug}`} element={<StaticPage title={page.title} body={page.body} />} />
            ))}
            <Route path="*" element={<StaticPage title="Page not found" body="Sorry — that page does not exist. Use the menu to return to the shop." />} />
          </Routes>
        </Layout>
        <Toast />
      </BrowserRouter>
    </ShopProvider>
  )
}
