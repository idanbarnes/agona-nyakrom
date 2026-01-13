import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../layout/Navbar.jsx'
import Footer from '../layout/Footer.jsx'
import { getGlobalSettings } from '../api/endpoints.js'

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
      <Navbar settings={settings} loading={loading} error={error} />
      <main>
        <Outlet />
      </main>
      <Footer settings={settings} loading={loading} error={error} />
    </PublicSettingsContext.Provider>
  )
}

export default Layout
