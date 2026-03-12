const EASE_OUT = [0.22, 1, 0.36, 1]

export function fadeUpItem(distance = 12) {
  return {
    hidden: { opacity: 0, y: distance },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: EASE_OUT,
      },
    },
  }
}

export function fadeLeftItem(distance = 40) {
  return {
    hidden: { opacity: 0, x: -distance },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: EASE_OUT,
      },
    },
  }
}

export function staggerContainer({
  delayChildren = 0,
  staggerChildren = 0.08,
} = {}) {
  return {
    hidden: {},
    show: {
      transition: {
        delayChildren,
        staggerChildren,
      },
    },
  }
}

export function reducedMotionSafeVariants(
  variants,
  reduceMotion,
  { container = false, fadeDuration = 0.2 } = {},
) {
  if (!reduceMotion) {
    return variants
  }

  if (container) {
    return {
      hidden: {},
      show: {},
    }
  }

  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: fadeDuration,
        ease: 'easeOut',
      },
    },
  }
}

export function cardRevealItem(distance = 12) {
  return {
    hidden: { opacity: 0, y: distance },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.58,
        ease: EASE_OUT,
      },
    },
  }
}

export function gridStaggerContainer({
  delayChildren = 0.04,
  staggerChildren = 0.07,
} = {}) {
  return {
    hidden: {},
    show: {
      transition: {
        delayChildren,
        staggerChildren,
      },
    },
  }
}

export function dropdownInOut(reduceMotion = false) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.16, ease: 'easeOut' } },
      exit: { opacity: 0, transition: { duration: 0.14, ease: 'easeOut' } },
    }
  }

  return {
    hidden: { opacity: 0, scale: 0.98, y: 4 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.18, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: 4,
      transition: { duration: 0.16, ease: 'easeOut' },
    },
  }
}

export function mobileMenuPanelInOut(reduceMotion = false) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
      exit: { opacity: 0, transition: { duration: 0.16, ease: 'easeOut' } },
    }
  }

  return {
    hidden: { opacity: 0, x: 16 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.22, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      x: 16,
      transition: { duration: 0.18, ease: EASE_OUT },
    },
  }
}

export function backdropFadeInOut(reduceMotion = false) {
  const enterDuration = reduceMotion ? 0.16 : 0.2
  const exitDuration = reduceMotion ? 0.14 : 0.18

  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: enterDuration, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      transition: { duration: exitDuration, ease: 'easeOut' },
    },
  }
}
