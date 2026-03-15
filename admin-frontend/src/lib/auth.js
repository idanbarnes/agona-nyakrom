const AUTH_TOKEN_KEY = 'authToken'
const AUTH_ADMIN_KEY = 'authAdmin'
const POST_LOGIN_REDIRECT_KEY = 'adminPostLoginRedirect'
const LOGIN_REASON_KEY = 'adminLoginReason'
const POST_LOGIN_WELCOME_KEY = 'adminPostLoginWelcome'
const MASTER_ADMIN_ROLE = 'master_admin'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_ADMIN_KEY)
}

export function getAuthAdmin() {
  const raw = localStorage.getItem(AUTH_ADMIN_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setAuthAdmin(admin) {
  if (!admin || typeof admin !== 'object') {
    localStorage.removeItem(AUTH_ADMIN_KEY)
    return
  }

  localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(admin))
}

function decodeBase64Url(value) {
  const normalized = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const padding = normalized.length % 4
  const padded = padding ? normalized.padEnd(normalized.length + (4 - padding), '=') : normalized

  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(padded)
  }

  return ''
}

export function getAuthClaims() {
  const token = getAuthToken()
  if (!token) {
    return null
  }

  const segments = token.split('.')
  if (segments.length < 2) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(segments[1]))
  } catch {
    return null
  }
}

export function getAuthRole() {
  return getAuthAdmin()?.role || getAuthClaims()?.role || ''
}

export function isMasterAdmin() {
  return getAuthRole() === MASTER_ADMIN_ROLE
}

export function setPostLoginRedirect(path) {
  if (!path) {
    return
  }

  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path)
}

export function consumePostLoginRedirect() {
  const path = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
  if (path) {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
  }
  return path
}

export function setLoginReason(message) {
  if (!message) {
    return
  }

  sessionStorage.setItem(LOGIN_REASON_KEY, message)
}

export function consumeLoginReason() {
  const message = sessionStorage.getItem(LOGIN_REASON_KEY)
  if (message) {
    sessionStorage.removeItem(LOGIN_REASON_KEY)
  }
  return message
}

export function markPostLoginWelcome() {
  sessionStorage.setItem(POST_LOGIN_WELCOME_KEY, '1')
}

export function consumePostLoginWelcome() {
  const value = sessionStorage.getItem(POST_LOGIN_WELCOME_KEY)
  if (value) {
    sessionStorage.removeItem(POST_LOGIN_WELCOME_KEY)
  }
  return value === '1'
}
