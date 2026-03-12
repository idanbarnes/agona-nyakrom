import { useEffect, useMemo, useRef, useState } from 'react'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import {
  gridStaggerContainer,
  reducedMotionSafeVariants,
} from '../../motion/variants.js'

function StaggerGridReveal({
  as = 'div',
  className,
  children,
  amount = 0.02,
  delayChildren = 0.04,
  staggerChildren = 0.07,
  ...props
}) {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const [hasEnteredView, setHasEnteredView] = useState(false)

  // Reuse this wrapper for any card grid that should reveal once with tight stagger.
  const variants = useMemo(
    () =>
      reducedMotionSafeVariants(
        gridStaggerContainer({ delayChildren, staggerChildren }),
        reduceMotion,
        { container: true },
      ),
    [delayChildren, reduceMotion, staggerChildren],
  )

  useEffect(() => {
    if (hasEnteredView || reduceMotion) {
      return undefined
    }

    const checkVisibility = () => {
      const element = containerRef.current
      if (!element) {
        return
      }

      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth
      const intersectsViewport =
        rect.bottom > 0 &&
        rect.top < viewportHeight &&
        rect.right > 0 &&
        rect.left < viewportWidth

      if (intersectsViewport) {
        setHasEnteredView(true)
      }
    }

    checkVisibility()

    window.addEventListener('scroll', checkVisibility, { passive: true })
    window.addEventListener('resize', checkVisibility)
    window.addEventListener('orientationchange', checkVisibility)

    return () => {
      window.removeEventListener('scroll', checkVisibility)
      window.removeEventListener('resize', checkVisibility)
      window.removeEventListener('orientationchange', checkVisibility)
    }
  }, [hasEnteredView, reduceMotion])

  const isShown = reduceMotion || hasEnteredView

  const sharedProps = {
    ref: containerRef,
    className,
    variants,
    initial: 'hidden',
    animate: isShown ? 'show' : undefined,
    whileInView: reduceMotion ? undefined : 'show',
    onViewportEnter: () => setHasEnteredView(true),
    // Keep threshold low because long single-column mobile grids can never hit high intersection ratios.
    viewport: { once: true, amount },
    ...props,
  }

  if (as === 'ul') {
    return (
      <Motion.ul {...sharedProps}>
        {children}
      </Motion.ul>
    )
  }

  if (as === 'section') {
    return (
      <Motion.section {...sharedProps}>
        {children}
      </Motion.section>
    )
  }

  return <Motion.div {...sharedProps}>{children}</Motion.div>
}

export default StaggerGridReveal
