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


import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar.jsx'
import Footer from '../layout/Footer.jsx'
import { getGlobalSettings } from '../api/endpoints.js'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/index.jsx'

// Share global settings across public pages without refetching.
const PublicSettingsContext = createContext({
  settings: null,
  loading: true,
  error: null,
})

export function usePublicSettings() {
  return useContext(PublicSettingsContext)
}

function Layout() {
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

  return (
    <PublicSettingsContext.Provider value={contextValue}>
      {/* Public App Shell wrapper */}
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Shell styling only; Navbar handles its own sticky behavior. */}
        <div className="relative z-50 border-b border-border bg-background/80 backdrop-blur">
          <Navbar settings={settings} loading={loading} error={error} />
        </div>
        <main className="flex-1">
          {/* Enforce consistent page width and padding. */}
          <div className="container py-6 md:py-10">
            <div className="space-y-8 md:space-y-12">
              {/* UI kit demo (remove later) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    Demo Card
                    <Badge variant="default">New</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Reusable UI components preview.
                  </p>
                  <Button size="sm" variant="secondary">
                    Explore
                  </Button>
                </CardContent>
              </Card>
              <Outlet />
            </div>
          </div>
        </main>
        <div className="mt-auto border-t border-border bg-surface">
          <div className="container py-10">
            <Footer settings={settings} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </PublicSettingsContext.Provider>
  )
}

export default Layout
