/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Modal, ToastMessage } from '../components/ui/index.jsx'
import {
  clearAuthToken,
  getAuthToken,
  setLoginReason,
  setPostLoginRedirect,
} from '../lib/auth.js'
import {
  installApiFetchInterceptor,
  onApiUnauthorized,
} from '../lib/apiClient.js'

const LAST_ACTIVITY_KEY = 'admin.session.lastActivityAt'
const ACTIVE_TAB_KEY = 'admin.session.activeTab'
const EVENT_KEY = 'admin.session.event'
const CHANNEL_NAME = 'admin-auth'

const WARNING_WINDOW_MS = 5 * 60 * 1000
const MODAL_WINDOW_MS = 60 * 1000
const ACTIVITY_THROTTLE_MS = 3000

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'

const AdminSessionContext = createContext(null)

function getTabId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseJson(value) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function formatSeconds(remainingMs) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatMinutes(remainingMs) {
  const minutes = Math.ceil(Math.max(0, remainingMs) / 60000)
  if (minutes <= 1) {
    return 'less than 1 minute'
  }
  return `${minutes} minutes`
}

function reasonMessageFromCode(reason) {
  switch (reason) {
    case 'inactive_timeout':
      return 'You were logged out after being inactive for too long.'
    case 'session_expired':
      return SESSION_EXPIRED_MESSAGE
    case 'manual_logout':
      return 'You have been logged out.'
    default:
      return 'Your session ended. Please sign in again.'
  }
}

export function AdminSessionProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const tabIdRef = useRef(getTabId())
  const broadcastRef = useRef(null)
  const lastActivityRef = useRef(0)
  const lastActivityWriteRef = useRef(0)
  const warningBroadcastedRef = useRef(false)
  const isLoggingOutRef = useRef(false)
  const hasExpiredModalOpenRef = useRef(false)
  const [sessionState, setSessionState] = useState('active')
  const [remainingMs, setRemainingMs] = useState(DEFAULT_TIMEOUT_MS)
  const [expiredMessage, setExpiredMessage] = useState(SESSION_EXPIRED_MESSAGE)
  const [hideWarningModal, setHideWarningModal] = useState(false)

  const inactivityTimeoutMs = toNumber(
    import.meta.env.VITE_ADMIN_INACTIVITY_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  )
  const hasAuthToken = Boolean(getAuthToken())
  const isInactivityTrackingEnabled =
    hasAuthToken && Number.isFinite(inactivityTimeoutMs) && inactivityTimeoutMs > 0

  const postCrossTabEvent = useCallback((type, payload = {}) => {
    if (typeof window === 'undefined') {
      return
    }

    const event = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tabId: tabIdRef.current,
      type,
      payload,
      sentAt: Date.now(),
    }

    const serialized = JSON.stringify(event)
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage(event)
      } catch {
        // Fall back to storage event below.
      }
    }

    window.localStorage.setItem(EVENT_KEY, serialized)
  }, [])

  const claimActiveTab = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const focusedAt = Date.now()
    window.localStorage.setItem(
      ACTIVE_TAB_KEY,
      JSON.stringify({ tabId: tabIdRef.current, focusedAt }),
    )
    postCrossTabEvent('focus', { tabId: tabIdRef.current, focusedAt })
  }, [postCrossTabEvent])

  const isEnforcerTab = useCallback(() => {
    if (typeof window === 'undefined') {
      return false
    }

    if (document.visibilityState !== 'visible') {
      return false
    }

    const activeTab = parseJson(window.localStorage.getItem(ACTIVE_TAB_KEY))
    return activeTab?.tabId === tabIdRef.current
  }, [])

  const openSessionExpiredModal = useCallback((message = SESSION_EXPIRED_MESSAGE) => {
    if (!getAuthToken()) {
      return
    }

    if (hasExpiredModalOpenRef.current) {
      return
    }

    hasExpiredModalOpenRef.current = true
    setExpiredMessage(message)
    setSessionState('expired')
    setHideWarningModal(false)
  }, [])

  const hardLogout = useCallback(
    (
      reason = 'manual_logout',
      options = {
        broadcast: true,
        redirect: true,
        preserveRoute: false,
      },
    ) => {
      const {
        broadcast = true,
        redirect = true,
        preserveRoute = false,
      } = options || {}

      if (isLoggingOutRef.current) {
        return
      }
      isLoggingOutRef.current = true

      const reasonMessage = reasonMessageFromCode(reason)
      if (preserveRoute) {
        const nextRoute = `${location.pathname}${location.search}${location.hash}`
        if (nextRoute && nextRoute !== '/login') {
          setPostLoginRedirect(nextRoute)
        }
      }
      setLoginReason(reasonMessage)
      clearAuthToken()
      hasExpiredModalOpenRef.current = false
      setSessionState('active')
      setRemainingMs(inactivityTimeoutMs)
      setHideWarningModal(false)

      if (broadcast) {
        postCrossTabEvent('logout', {
          reason,
          preserveRoute,
        })
      }

      if (redirect) {
        navigate('/login', {
          replace: true,
          state: {
            reasonMessage,
          },
        })
      }

      window.setTimeout(() => {
        isLoggingOutRef.current = false
      }, 0)
    },
    [
      inactivityTimeoutMs,
      location.hash,
      location.pathname,
      location.search,
      navigate,
      postCrossTabEvent,
    ],
  )

  const extendSession = useCallback(() => {
    if (!getAuthToken() || typeof window === 'undefined') {
      return
    }

    const now = Date.now()
    lastActivityRef.current = now
    lastActivityWriteRef.current = now
    warningBroadcastedRef.current = false
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
    setSessionState('active')
    setRemainingMs(inactivityTimeoutMs)
    setHideWarningModal(false)
    claimActiveTab()
    postCrossTabEvent('extend', { lastActivityAt: now })
  }, [claimActiveTab, inactivityTimeoutMs, postCrossTabEvent])

  const recordActivity = useCallback(
    (options = {}) => {
      if (!isInactivityTrackingEnabled || typeof window === 'undefined') {
        return
      }

      const { force = false } = options
      if (document.visibilityState !== 'visible' && !force) {
        return
      }

      const now = Date.now()
      if (!force && now - lastActivityWriteRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }

      lastActivityRef.current = now
      lastActivityWriteRef.current = now
      warningBroadcastedRef.current = false
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
      setSessionState((current) => (current === 'expired' ? current : 'active'))
      setRemainingMs(inactivityTimeoutMs)
      setHideWarningModal(false)
      postCrossTabEvent('activity', { lastActivityAt: now })
    },
    [inactivityTimeoutMs, isInactivityTrackingEnabled, postCrossTabEvent],
  )

  const openWarningModal = useCallback(() => {
    setSessionState((current) => (current === 'expired' ? current : 'warning'))
    setHideWarningModal(false)
  }, [])

  const closeWarningModal = useCallback(() => {
    setHideWarningModal(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const teardownFetchInterceptor = installApiFetchInterceptor()
    const unsubscribeUnauthorized = onApiUnauthorized(() => {
      openSessionExpiredModal(SESSION_EXPIRED_MESSAGE)
    })

    return () => {
      unsubscribeUnauthorized()
      teardownFetchInterceptor()
    }
  }, [openSessionExpiredModal])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleCrossTabEvent = (eventPayload) => {
      if (!eventPayload || eventPayload.tabId === tabIdRef.current) {
        return
      }

      switch (eventPayload.type) {
        case 'activity':
        case 'extend': {
          const sharedActivityAt = toNumber(eventPayload.payload?.lastActivityAt, 0)
          if (sharedActivityAt > 0) {
            lastActivityRef.current = Math.max(lastActivityRef.current, sharedActivityAt)
          }
          setSessionState((current) => (current === 'expired' ? current : 'active'))
          setRemainingMs(inactivityTimeoutMs)
          setHideWarningModal(false)
          warningBroadcastedRef.current = false
          break
        }
        case 'warning': {
          setSessionState((current) => (current === 'expired' ? current : 'warning'))
          if (Number.isFinite(eventPayload.payload?.remainingMs)) {
            setRemainingMs(Math.max(0, Number(eventPayload.payload.remainingMs)))
          }
          break
        }
        case 'logout': {
          hardLogout(eventPayload.payload?.reason || 'session_expired', {
            broadcast: false,
            redirect: true,
            preserveRoute: Boolean(eventPayload.payload?.preserveRoute),
          })
          break
        }
        default:
          break
      }
    }

    const handleStorage = (event) => {
      if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        const nextValue = toNumber(event.newValue, 0)
        if (nextValue > 0) {
          lastActivityRef.current = Math.max(lastActivityRef.current, nextValue)
        }
        return
      }

      if (event.key !== EVENT_KEY || !event.newValue) {
        return
      }

      handleCrossTabEvent(parseJson(event.newValue))
    }

    window.addEventListener('storage', handleStorage)

    let channel = null
    if (typeof window.BroadcastChannel === 'function') {
      channel = new window.BroadcastChannel(CHANNEL_NAME)
      broadcastRef.current = channel
      channel.onmessage = (messageEvent) => {
        handleCrossTabEvent(messageEvent.data)
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorage)
      if (channel) {
        channel.close()
      }
      broadcastRef.current = null
    }
  }, [hardLogout, inactivityTimeoutMs])

  useEffect(() => {
    if (!isInactivityTrackingEnabled || typeof window === 'undefined') {
      return undefined
    }

    const knownActivity = toNumber(window.localStorage.getItem(LAST_ACTIVITY_KEY), 0)
    if (knownActivity > 0) {
      lastActivityRef.current = knownActivity
    } else {
      const now = Date.now()
      lastActivityRef.current = now
      lastActivityWriteRef.current = now
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
      postCrossTabEvent('activity', { lastActivityAt: now })
    }

    claimActiveTab()

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']
    const handleActivity = () => {
      recordActivity()
    }
    const handleFocus = () => {
      claimActiveTab()
      recordActivity({ force: true })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus()
      }
    }

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    )
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity),
      )
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [
    claimActiveTab,
    inactivityTimeoutMs,
    isInactivityTrackingEnabled,
    postCrossTabEvent,
    recordActivity,
  ])

  useEffect(() => {
    if (!isInactivityTrackingEnabled || typeof window === 'undefined') {
      return undefined
    }

    const tick = () => {
      const sharedActivity = toNumber(window.localStorage.getItem(LAST_ACTIVITY_KEY), 0)
      if (sharedActivity > 0) {
        lastActivityRef.current = Math.max(lastActivityRef.current, sharedActivity)
      }

      const elapsedMs = Date.now() - lastActivityRef.current
      const nextRemaining = Math.max(0, inactivityTimeoutMs - elapsedMs)
      setRemainingMs(nextRemaining)

      if (nextRemaining <= 0) {
        if (isEnforcerTab()) {
          hardLogout('inactive_timeout', {
            broadcast: true,
            redirect: true,
            preserveRoute: true,
          })
        }
        return
      }

      if (nextRemaining <= WARNING_WINDOW_MS) {
        setSessionState((current) => (current === 'expired' ? current : 'warning'))

        if (!warningBroadcastedRef.current) {
          postCrossTabEvent('warning', { remainingMs: nextRemaining })
          warningBroadcastedRef.current = true
        }
      } else {
        warningBroadcastedRef.current = false
        setSessionState((current) => (current === 'expired' ? current : 'active'))
      }
    }

    const interval = window.setInterval(tick, 1000)
    tick()

    return () => {
      window.clearInterval(interval)
    }
  }, [
    hardLogout,
    inactivityTimeoutMs,
    isEnforcerTab,
    isInactivityTrackingEnabled,
    postCrossTabEvent,
  ])

  const isWarning = sessionState === 'warning'
  const isExpired = sessionState === 'expired'
  const showWarningToast =
    isWarning && remainingMs > MODAL_WINDOW_MS && remainingMs <= WARNING_WINDOW_MS
  const showWarningModal = isWarning && remainingMs <= MODAL_WINDOW_MS && !hideWarningModal

  const contextValue = useMemo(
    () => ({
      sessionState,
      remainingMs,
      openWarningModal,
      closeWarningModal,
      extendSession,
      hardLogout,
    }),
    [
      closeWarningModal,
      extendSession,
      hardLogout,
      openWarningModal,
      remainingMs,
      sessionState,
    ],
  )

  return (
    <AdminSessionContext.Provider value={contextValue}>
      {children}

      {showWarningToast ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[70] w-full max-w-sm">
          <div className="pointer-events-auto space-y-3">
            <ToastMessage
              type="warning"
              title="Session expiring soon"
              message={`You will be logged out in about ${formatMinutes(remainingMs)}.`}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={extendSession}
              >
                Continue session
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={showWarningModal}
        onClose={closeWarningModal}
        closeOnOverlayClick={false}
        title="Session ending soon"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                hardLogout('manual_logout', {
                  broadcast: true,
                  redirect: true,
                  preserveRoute: false,
                })
              }}
            >
              Log out now
            </Button>
            <Button type="button" variant="primary" onClick={extendSession}>
              Continue session
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Your admin session is about to expire due to inactivity.
        </p>
        <p className="text-sm font-semibold text-foreground">
          Time remaining: {formatSeconds(remainingMs)}
        </p>
      </Modal>

      <Modal
        open={isExpired}
        onClose={() => {}}
        closeOnOverlayClick={false}
        title="Session expired"
        footer={
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              hardLogout('session_expired', {
                broadcast: true,
                redirect: true,
                preserveRoute: true,
              })
            }}
          >
            Go to login
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">{expiredMessage}</p>
      </Modal>
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession() {
  const value = useContext(AdminSessionContext)
  if (!value) {
    throw new Error('useAdminSession must be used within AdminSessionProvider.')
  }
  return value
}
