import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  resetReadDepth,
  trackApprovedClick,
  trackReadDepthForScroll,
  trackRouteView,
} from '../lib/analytics.js'

function AnalyticsRouteTracker() {
  const location = useLocation()

  useEffect(() => {
    const pathKey = `${location.pathname}${location.search}`
    resetReadDepth(pathKey)
    trackRouteView(location)

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        trackReadDepthForScroll(pathKey)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [location])

  useEffect(() => {
    const onClick = (event) => {
      const anchor = event.target?.closest?.('a[href]')
      if (anchor) {
        trackApprovedClick(anchor)
      }
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}

export default AnalyticsRouteTracker
