import { useMemo } from 'react'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import {
  fadeLeftItem,
  fadeUpItem,
  reducedMotionSafeVariants,
  staggerContainer,
} from '../../motion/variants.js'

function AnimatedHeroIntro({
  className,
  headline,
  subtext,
  actions,
  visual,
  entry = 'up',
  visualEntry = 'up',
}) {
  const reduceMotion = useReducedMotion()

  // Reuse these variants for future section intros with the same staged pattern.
  const containerVariants = useMemo(
    () =>
      reducedMotionSafeVariants(
        staggerContainer({ delayChildren: 0.05, staggerChildren: 0.09 }),
        reduceMotion,
        { container: true },
      ),
    [reduceMotion],
  )

  const itemVariants = useMemo(
    () =>
      reducedMotionSafeVariants(
        entry === 'left' ? fadeLeftItem(40) : fadeUpItem(12),
        reduceMotion,
      ),
    [entry, reduceMotion],
  )

  const visualVariants = useMemo(
    () =>
      reducedMotionSafeVariants(
        visualEntry === 'left' ? fadeLeftItem(26) : fadeUpItem(12),
        reduceMotion,
      ),
    [reduceMotion, visualEntry],
  )

  return (
    <Motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {headline ? <Motion.div variants={itemVariants}>{headline}</Motion.div> : null}
      {subtext ? <Motion.div variants={itemVariants}>{subtext}</Motion.div> : null}
      {actions ? <Motion.div variants={itemVariants}>{actions}</Motion.div> : null}
      {visual ? <Motion.div variants={visualVariants}>{visual}</Motion.div> : null}
    </Motion.div>
  )
}

export default AnimatedHeroIntro
