import { useMemo } from 'react'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import {
  cardRevealItem,
  reducedMotionSafeVariants,
} from '../../motion/variants.js'

function RevealItem({ as = 'div', className, children, distance = 12, ...props }) {
  const reduceMotion = useReducedMotion()

  const variants = useMemo(
    () => reducedMotionSafeVariants(cardRevealItem(distance), reduceMotion),
    [distance, reduceMotion],
  )

  const sharedProps = { className, variants, ...props }

  if (as === 'li') {
    return (
      <Motion.li {...sharedProps}>
        {children}
      </Motion.li>
    )
  }

  if (as === 'article') {
    return (
      <Motion.article {...sharedProps}>
        {children}
      </Motion.article>
    )
  }

  return (
    <Motion.div className={className} variants={variants} {...props}>
      {children}
    </Motion.div>
  )
}

export default RevealItem
