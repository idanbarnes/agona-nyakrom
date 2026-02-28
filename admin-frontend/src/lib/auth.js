const AUTH_TOKEN_KEY = 'authToken'
const POST_LOGIN_REDIRECT_KEY = 'adminPostLoginRedirect'
const LOGIN_REASON_KEY = 'adminLoginReason'
const POST_LOGIN_WELCOME_KEY = 'adminPostLoginWelcome'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
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
