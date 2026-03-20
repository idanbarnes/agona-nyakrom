import { useEffect } from 'react'

export const SITE_NAME = 'Agona Nyakrom'

function normalizeTitle(value) {
  return String(value || '').trim()
}

export function formatDocumentTitle(title, fallbackTitle = SITE_NAME) {
  const resolvedTitle = normalizeTitle(title) || normalizeTitle(fallbackTitle) || SITE_NAME

  if (resolvedTitle.toLowerCase().includes(SITE_NAME.toLowerCase())) {
    return resolvedTitle
  }

  if (resolvedTitle.toLowerCase() === SITE_NAME.toLowerCase()) {
    return SITE_NAME
  }

  return `${resolvedTitle} | ${SITE_NAME}`
}

export function setDocumentTitle(title, fallbackTitle = SITE_NAME) {
  if (typeof document === 'undefined') {
    return
  }

  document.title = formatDocumentTitle(title, fallbackTitle)
}

export function useDocumentTitle(title, fallbackTitle = SITE_NAME) {
  useEffect(() => {
    setDocumentTitle(title, fallbackTitle)
  }, [fallbackTitle, title])
}
