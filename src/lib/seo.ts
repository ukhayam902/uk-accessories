import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const SITE_URL = 'https://uk-accessories.vercel.app'
export const SITE_NAME = 'UK Accessories'

function setMetaByAttr(attr: string, value: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, value)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Per-route SEO for this React SPA. index.html carries the site-level
 * Organization / WebSite / Store JSON-LD; this helper only sets the
 * document title, description, canonical and OG/Twitter meta for the
 * current route, plus optional per-page JSON-LD (Product, BreadcrumbList,
 * FAQPage). It never invents facts — callers pass only confirmed copy.
 * Pages that must not be indexed (login, profile, cart, checkout,
 * wishlist, tracking, admin) pass noindex: true.
 */
export function useSeo(opts: {
  title: string
  description: string
  path?: string
  ogType?: string
  ogImage?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}) {
  const location = useLocation()
  const path = opts.path ?? location.pathname
  const url = `${SITE_URL}${path === '/' ? '/' : path}`
  useEffect(() => {
    document.title = opts.title
    setMetaByAttr('name', 'description', opts.description)
    setMetaByAttr('property', 'og:title', opts.title)
    setMetaByAttr('property', 'og:description', opts.description)
    setMetaByAttr('property', 'og:type', opts.ogType ?? 'website')
    setMetaByAttr('property', 'og:url', url)
    setMetaByAttr('name', 'twitter:title', opts.title)
    setMetaByAttr('name', 'twitter:description', opts.description)
    if (opts.ogImage) {
      setMetaByAttr('property', 'og:image', opts.ogImage)
      setMetaByAttr('name', 'twitter:image', opts.ogImage)
    }
    setMetaByAttr('name', 'robots', opts.noindex ? 'noindex, nofollow' : 'index, follow')
    setLink('canonical', url)
    let script: HTMLScriptElement | null = null
    if (opts.jsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-page-seo', 'true')
      script.textContent = JSON.stringify(opts.jsonLd)
      document.head.appendChild(script)
    }
    return () => {
      if (script) script.remove()
    }
    // Re-run on route/product change only; opts fields are stable literals per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, opts.title, opts.description])
}

export function productJsonLd(p: {
  name: string
  slug: string
  image: string
  description: string
  categoryName: string
  price: number
  stock: number
  sku: string
}) {
  const url = `${SITE_URL}/product/${p.slug}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      image: [`${SITE_URL}${p.image}`],
      description: p.description,
      sku: p.sku,
      brand: { '@type': 'Brand', name: SITE_NAME },
      category: p.categoryName,
      url,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'PKR',
        price: String(p.price),
        availability:
          p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
        { '@type': 'ListItem', position: 3, name: p.categoryName, item: `${SITE_URL}/shop` },
        { '@type': 'ListItem', position: 4, name: p.name, item: url },
      ],
    },
  ]
}

export const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do you offer Cash on Delivery?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, in Pakistan. Cash on Delivery is available for orders in Pakistan.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I pay with JazzCash or Easypaisa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, manually. Place the order, share your transaction ID, and the shop verifies it. No automatic payment integration is claimed, and no payment account details are published on this site.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are prices final?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — current prices are sample prices. Confirm the price on WhatsApp (+92 3170851250) before ordering if unsure.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you deliver internationally?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not advertised as available yet, until courier rates are confirmed.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is UK Accessories?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'UK Accessories is an online mobile accessories and tech gadgets store serving customers in Pakistan. Its slogan is Upgrade Your Tech. Elevate Your Style.',
      },
    },
    {
      '@type': 'Question',
      name: 'What products does UK Accessories sell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Wireless earbuds, headphones, fast chargers, charging cables, power banks, smartwatches, phone cases and screen protectors, priced in PKR. See https://uk-accessories.vercel.app/shop for the current product list and prices.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I order on WhatsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Message UK Accessories on WhatsApp at +92 3170851250 with: Hello UK Accessories! I need assistance with your products and orders.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the shipping policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Shipping is available in Pakistan. Demo shipping is Rs. 250, free over Rs. 5,000 (a demo rule, admin-configurable in the live store). Delivery estimates, zones and rates must be confirmed by the owner before they are promised.',
      },
    },
    {
      '@type': 'Question',
      name: 'What if my item arrives damaged or incorrect?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Contact UK Accessories on WhatsApp (+92 3170851250) with your order ID and photos. Manual-payment refunds are handled by the shop after verification.',
      },
    },
  ],
}
