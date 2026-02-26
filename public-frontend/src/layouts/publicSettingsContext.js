import { createContext, useContext } from 'react'

export const PublicSettingsContext = createContext({
  settings: null,
  loading: true,
  error: null,
})

export function usePublicSettings() {
  return useContext(PublicSettingsContext)
}

