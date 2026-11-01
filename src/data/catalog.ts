export type Category = { id: string; name: string; slug: string; description: string }
export type Product = {
  id: string; sku: string; slug: string; name: string; category: string;
  price: number; compareAt?: number; stock: number; image: string;
  description: string; specs: string[]; colours: string[];
  featured?: boolean; bestseller?: boolean; trending?: boolean; isNew?: boolean;
  isDemo?: boolean;
  seoTitle: string; seoDescription: string;
}

export const WHATSAPP = '+92 3170851250'
export const WHATSAPP_MESSAGE = 'Hello UK Accessories! I need assistance with your products and orders.'
export const whatsappLink = `https://wa.me/923170851250?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
export const formatPKR = (n: number) => `Rs. ${n.toLocaleString('en-PK')}`

// DEMO INVENTORY — prices below are the user's suggested sample prices.
// They are NOT verified market prices and NOT confirmed shop prices.
// Treat every product here as demo/sample until the owner approves it.
export const CATEGORIES: Category[] = [
  { id: 'cases', name: 'Phone Cases and Covers', slug: 'phone-cases-and-covers', description: 'Protective, premium cases.' },
  { id: 'earbuds', name: 'Wireless Earbuds', slug: 'wireless-earbuds', description: 'True wireless sound, on the go.' },
  { id: 'headphones', name: 'Headphones', slug: 'headphones', description: 'Over-ear and on-ear listening.' },
  { id: 'chargers', name: 'Fast Chargers', slug: 'fast-chargers', description: 'Fast, safe charging at home and on the road.' },
  { id: 'cables', name: 'Charging Cables', slug: 'charging-cables', description: 'Durable USB-C and braided cables.' },
  { id: 'powerbanks', name: 'Power Banks', slug: 'power-banks', description: 'Portable power for long days.' },
  { id: 'smartwatches', name: 'Smartwatches', slug: 'smartwatches', description: 'Fitness and everyday smartwatches.' },
  { id: 'protectors', name: 'Screen Protectors', slug: 'screen-protectors', description: 'Tempered glass protection.' },
  { id: 'holders', name: 'Phone Holders and Stands', slug: 'phone-holders-and-stands', description: 'Desk, car and everyday holders.' },
  { id: 'speakers', name: 'Bluetooth Speakers', slug: 'bluetooth-speakers', description: 'Portable speakers with clear sound.' },
  { id: 'gaming', name: 'Gaming Accessories', slug: 'gaming-accessories', description: 'Gear for mobile gaming.' },
  { id: 'gadgets', name: 'Other Tech Gadgets', slug: 'other-tech-gadgets', description: 'Useful everyday tech.' },
]

const p = (o: Omit<Product, 'image' | 'seoTitle' | 'seoDescription' | 'isDemo'> & { image: string }): Product => ({
  ...o,
  // Every local catalogue product is a demo sample until the owner approves it.
  isDemo: true,
  seoTitle: `${o.name} — UK Accessories`,
  seoDescription: `${o.name} in Pakistan. ${o.description} Demo product — price to be confirmed by the shop owner.`,
})

export const PRODUCTS: Product[] = [
  p({ id: 'p1', sku: 'UK-EB-001', slug: 'premium-wireless-earbuds', name: 'Premium Wireless Earbuds', category: 'earbuds', price: 2499, stock: 42, image: '/images/earbuds-photo.webp', colours: ['Black', 'White'], featured: true, bestseller: true, trending: true, description: 'Demo sample: compact true wireless earbuds with a charging case, clear calls and everyday battery life. Specifications are sample specifications — confirm with the owner before treating them as a product guarantee.', specs: ['Bluetooth connectivity (sample spec)', 'Charging case included', 'In-ear fit, touch controls (sample)'] }),
  p({ id: 'p2', sku: 'UK-CH-002', slug: 'magnetic-fast-wireless-charger', name: 'Magnetic Fast Wireless Charger', category: 'chargers', price: 2199, stock: 30, image: '/images/charger-photo.webp', colours: ['Black', 'White'], featured: true, description: 'Demo sample: magnetic wireless charging pad for compatible phones. Place, snap and charge — no cable fumbling.', specs: ['Magnetic alignment (sample spec)', 'USB-C input', 'Case-friendly charging (sample)'] }),
  p({ id: 'p3', sku: 'UK-PB-003', slug: '20000mah-power-bank', name: '20,000mAh Power Bank', category: 'powerbanks', price: 3999, stock: 25, image: '/images/powerbank-20k-photo.webp', colours: ['Black'], featured: true, bestseller: true, description: 'Demo sample: high-capacity portable power for phones, earbuds and watches — sized for travel days in Pakistan.', specs: ['20,000mAh capacity (sample)', 'Multiple outputs (sample)', 'LED indicator'] }),
  p({ id: 'p4', sku: 'UK-CS-004', slug: 'premium-silicone-phone-case', name: 'Premium Silicone Phone Case', category: 'cases', price: 899, stock: 120, image: '/images/case-photo.webp', colours: ['Black', 'White', 'Silver'], bestseller: true, isNew: true, description: 'Demo sample: soft-touch silicone case with raised edges for screen and camera protection.', specs: ['Soft-touch silicone (sample)', 'Raised edge protection', 'Slim, grippy fit'] }),
  p({ id: 'p5', sku: 'UK-CB-005', slug: 'usb-c-fast-charging-cable', name: 'USB-C Fast Charging Cable', category: 'cables', price: 499, stock: 200, image: '/images/cable-usbc.svg', colours: ['Black', 'White'], description: 'Demo sample: everyday USB-C cable for charging and data, built for daily use.', specs: ['USB-C to USB-C / USB-A (sample)', 'Fast charging support (sample)', '1m length (sample)'] }),
  p({ id: 'p6', sku: 'UK-SW-006', slug: 'smart-fitness-watch', name: 'Smart Fitness Watch', category: 'smartwatches', price: 4499, stock: 18, image: '/images/watch.svg', colours: ['Black', 'Silver'], featured: true, trending: true, isNew: true, description: 'Demo sample: fitness watch with step, heart-rate and notification features for everyday life.', specs: ['Fitness tracking (sample)', 'Notifications (sample)', 'Multi-day battery (sample)'] }),
  p({ id: 'p7', sku: 'UK-HP-007', slug: 'wireless-bluetooth-headphones', name: 'Wireless Bluetooth Headphones', category: 'headphones', price: 3499, stock: 22, image: '/images/headphones.svg', colours: ['Black'], bestseller: true, description: 'Demo sample: comfortable over-ear Bluetooth headphones for work, study and travel.', specs: ['Bluetooth (sample)', 'Cushioned ear cups', 'Built-in microphone'] }),
  p({ id: 'p8', sku: 'UK-SP-008', slug: 'tempered-glass-screen-protector', name: 'Tempered Glass Screen Protector', category: 'protectors', price: 399, stock: 300, image: '/images/glass.svg', colours: ['Clear'], description: 'Demo sample: tempered glass protector to guard against scratches and everyday drops. Model compatibility must be confirmed at order time.', specs: ['Tempered glass (sample)', 'Scratch resistant', 'Easy-apply kit (sample)'] }),
  p({ id: 'p9', sku: 'UK-BS-009', slug: 'portable-bluetooth-speaker', name: 'Portable Bluetooth Speaker', category: 'speakers', price: 2999, stock: 28, image: '/images/speaker.svg', colours: ['Black', 'Silver'], trending: true, description: 'Demo sample: portable speaker with clear sound for home, outdoor and travel use.', specs: ['Bluetooth (sample)', 'Portable size', 'Rechargeable battery'] }),
  p({ id: 'p10', sku: 'UK-ST-010', slug: 'adjustable-mobile-phone-stand', name: 'Adjustable Mobile Phone Stand', category: 'holders', price: 799, stock: 65, image: '/images/stand.svg', colours: ['Black', 'Silver'], description: 'Demo sample: adjustable desk stand for hands-free calls, video and reading.', specs: ['Adjustable angle', 'Foldable (sample)', 'Non-slip base'] }),
  p({ id: 'p11', sku: 'UK-CH-011', slug: '65w-fast-charging-adapter', name: '65W Fast Charging Adapter', category: 'chargers', price: 2499, stock: 35, image: '/images/adapter-65w.svg', colours: ['Black', 'White'], featured: true, description: 'Demo sample: compact 65W adapter for phones, earbuds and compatible laptops.', specs: ['65W output (sample)', 'USB-C + USB-A (sample)', 'Over-current protection (sample)'] }),
  p({ id: 'p12', sku: 'UK-GM-012', slug: 'gaming-finger-sleeves', name: 'Gaming Finger Sleeves', category: 'gaming', price: 399, stock: 150, image: '/images/sleeves.svg', colours: ['Black'], description: 'Demo sample: breathable finger sleeves for smoother mobile gaming control.', specs: ['Breathable fabric (sample)', 'Pair included', 'Anti-sweat grip (sample)'] }),
  p({ id: 'p13', sku: 'UK-HL-013', slug: 'magnetic-car-phone-holder', name: 'Magnetic Car Phone Holder', category: 'holders', price: 1199, stock: 48, image: '/images/car-holder.svg', colours: ['Black'], isNew: true, description: 'Demo sample: magnetic car holder for safe, hands-free navigation.', specs: ['Strong magnet (sample)', 'Vent / dash mount (sample)', 'One-hand placement'] }),
  p({ id: 'p14', sku: 'UK-CB-014', slug: 'premium-braided-charging-cable', name: 'Premium Braided Charging Cable', category: 'cables', price: 699, stock: 140, image: '/images/cable-braided.svg', colours: ['Black', 'Silver'], bestseller: true, description: 'Demo sample: braided cable built to resist tangles and everyday wear.', specs: ['Braided nylon (sample)', 'Reinforced connectors (sample)', '1.5m length (sample)'] }),
  p({ id: 'p15', sku: 'UK-PB-015', slug: 'mini-portable-power-bank', name: 'Mini Portable Power Bank', category: 'powerbanks', price: 1999, stock: 40, image: '/images/powerbank-mini.svg', colours: ['Black', 'White'], trending: true, isNew: true, description: 'Demo sample: pocket-sized power bank for a quick top-up on the go.', specs: ['Compact size (sample)', 'USB-C output', 'LED indicator'] }),
]

export const categoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name ?? id
export const productBySlug = (slug: string) => PRODUCTS.find(x => x.slug === slug)
