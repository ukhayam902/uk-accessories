import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Client-side routing keeps the browser's scroll position, so without this
// a product page opened from a scrolled-down Home/Shop page would land at
// the footer instead of the top. This resets the scroll on every route
// change — including a change of product slug (Related products) or of the
// query string (e.g. /shop category filter) — instantly, not animated.
// It deliberately depends only on pathname + search, NOT on hash: the hero
// "Scroll" cue is a plain in-page anchor (<a href="#style-it-your-way">),
// a hash-only navigation, and must keep its native anchor jump untouched.
export default function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])
  return null
}
