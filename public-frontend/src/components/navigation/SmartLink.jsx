import React from 'react'
import { Link } from 'react-router-dom'
import { preloadPublicRoute } from '../../routes/routeLoaders.js'

function isExternalHref(value = '') {
  return /^(https?:|mailto:|tel:|javascript:)/i.test(String(value).trim())
}

function normalizeInternalHref(value = '') {
  const href = String(value || '').trim()
  if (!href || isExternalHref(href) || href.startsWith('#')) {
    return ''
  }

  try {
    const parsed = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) {
      return ''
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return ''
  }
}

const SmartLink = React.forwardRef(function SmartLink(
  {
    href = '',
    onMouseEnter,
    onFocus,
    onTouchStart,
    prefetch = true,
    ...props
  },
  ref,
) {
  const internalHref = normalizeInternalHref(href)
  const shouldUseRouterLink = Boolean(internalHref)

  const handlePrefetch = () => {
    if (prefetch && internalHref) {
      preloadPublicRoute(internalHref)
    }
  }

  const handleMouseEnter = (event) => {
    handlePrefetch()
    onMouseEnter?.(event)
  }

  const handleFocus = (event) => {
    handlePrefetch()
    onFocus?.(event)
  }

  const handleTouchStart = (event) => {
    handlePrefetch()
    onTouchStart?.(event)
  }

  if (shouldUseRouterLink) {
    return (
      <Link
        ref={ref}
        to={internalHref}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        onTouchStart={handleTouchStart}
        {...props}
      />
    )
  }

  return (
    <a
      ref={ref}
      href={href}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onTouchStart={handleTouchStart}
      {...props}
    />
  )
})

export default SmartLink
