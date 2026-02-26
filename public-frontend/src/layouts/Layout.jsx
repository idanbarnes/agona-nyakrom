// import { createContext, useContext, useEffect, useMemo, useState } from 'react'
// import { Outlet } from 'react-router-dom'
// import Navbar from '../layout/Navbar.jsx'
// import Footer from '../layout/Footer.jsx'
// import { getGlobalSettings } from '../api/endpoints.js'

// // Share global settings across public pages without refetching.
// const PublicSettingsContext = createContext({
//   settings: null,
//   loading: true,
//   error: null,
// })

// export function usePublicSettings() {
//   return useContext(PublicSettingsContext)
// }

// function Layout() {
//   const [settings, setSettings] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   useEffect(() => {
//     let isMounted = true

//     const loadSettings = async () => {
//       setLoading(true)
//       setError(null)

//       try {
//         const response = await getGlobalSettings()
//         if (!isMounted) {
//           return
//         }

//         setSettings(response?.data || response)
//       } catch (err) {
//         if (isMounted) {
//           setError(err)
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false)
//         }
//       }
//     }

//     loadSettings()

//     return () => {
//       isMounted = false
//     }
//   }, [])

//   const contextValue = useMemo(
//     () => ({ settings, loading, error }),
//     [error, loading, settings],
//   )

//   return (
//     <PublicSettingsContext.Provider value={contextValue}>
//       <Navbar settings={settings} loading={loading} error={error} />
//       <main>
//         <Outlet />
//       </main>
//       <Footer settings={settings} loading={loading} error={error} />
//     </PublicSettingsContext.Provider>
//   )
// }

// export default Layout


import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../layout/Navbar.jsx'
import Footer from '../layout/Footer.jsx'
import { getGlobalSettings } from '../api/endpoints.js'
import { PublicSettingsContext } from './publicSettingsContext.js'

function Layout() {
  const location = useLocation()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getGlobalSettings()
        if (!isMounted) {
          return
        }

        setSettings(response?.data || response)
      } catch (err) {
        if (isMounted) {
          setError(err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const contextValue = useMemo(
    () => ({ settings, loading, error }),
    [error, loading, settings],
  )

  const previewContext = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    const previewToken = String(searchParams.get('preview_token') || '').trim()
    const previewChannel = String(searchParams.get('preview_channel') || '').trim()
    const rawCmsOrigin = String(searchParams.get('cms_origin') || '').trim()
    let cmsOrigin = ''

    if (rawCmsOrigin) {
      try {
        cmsOrigin = new URL(rawCmsOrigin).origin
      } catch {
        cmsOrigin = ''
      }
    }

    return {
      previewToken,
      previewChannel,
      cmsOrigin,
    }
  }, [location.search])

  const isEmbeddedPreview = useMemo(() => {
    const hasPreviewToken = Boolean(previewContext.previewToken)

    if (!hasPreviewToken) {
      return false
    }

    try {
      return window.self !== window.top
    } catch {
      return true
    }
  }, [previewContext.previewToken])

  useEffect(() => {
    if (!isEmbeddedPreview || !previewContext.cmsOrigin) {
      return undefined
    }

    const postToParent = (type, payload = {}) => {
      if (!window.parent || window.parent === window) {
        return
      }

      window.parent.postMessage(
        {
          source: 'public-preview-iframe',
          type,
          channel: previewContext.previewChannel || null,
          payload,
          sent_at: Date.now(),
        },
        previewContext.cmsOrigin,
      )
    }

    postToParent('PREVIEW_READY', {
      path: `${location.pathname}${location.search}`,
    })

    const handleMessage = (event) => {
      if (event.origin !== previewContext.cmsOrigin) {
        return
      }

      if (event.source !== window.parent) {
        return
      }

      const data = event.data || {}
      if (data.source !== 'admin-cms-preview') {
        return
      }

      if (
        previewContext.previewChannel &&
        data.channel !== previewContext.previewChannel
      ) {
        return
      }

      if (data.type === 'CMS_PREVIEW_REFRESH') {
        const refreshEvent = new CustomEvent('cms-preview-refresh', {
          detail: data.payload || {},
          cancelable: true,
        })
        window.dispatchEvent(refreshEvent)

        const handled = refreshEvent.defaultPrevented
        postToParent('PREVIEW_ACK', {
          requested_type: data.type,
          handled,
          fallback_reload: !handled,
        })

        if (!handled) {
          window.location.reload()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [
    isEmbeddedPreview,
    location.pathname,
    location.search,
    previewContext.cmsOrigin,
    previewContext.previewChannel,
  ])

  return (
    <PublicSettingsContext.Provider value={contextValue}>
      {isEmbeddedPreview ? (
        <main className="min-h-screen bg-background text-foreground">
          <Outlet />
        </main>
      ) : (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navbar settings={settings} loading={loading} error={error} />
          <main className="flex-1">
            <Outlet />
          </main>
          <div className="mt-auto border-t border-border bg-surface">
            <div className="container py-10">
              <Footer settings={settings} loading={loading} error={error} />
            </div>
          </div>
        </div>
      )}
    </PublicSettingsContext.Provider>
  )
}

export default Layout
