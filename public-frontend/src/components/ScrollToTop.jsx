import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scroll to top on route change unless a hash anchor is present.
export default function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  return null
}
