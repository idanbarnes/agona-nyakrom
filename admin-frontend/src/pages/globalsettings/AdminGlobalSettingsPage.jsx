import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGlobalSettings,
  saveGlobalSettings,
} from '../../services/api/adminGlobalSettingsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

const SAFE_FIELDS = [
  'site_name',
  'contact_email',
  'contact_phone',
  'address',
  'social_links',
  'navigation_links',
  'footer_text',
  'published',
]
const MULTILINE_FIELDS = new Set([
  'address',
  'social_links',
  'navigation_links',
  'footer_text',
])
const FILE_FIELD_MATCHERS = [/logo/i, /image/i, /icon/i, /favicon/i]

function isFileField(key) {
  return FILE_FIELD_MATCHERS.some((matcher) => matcher.test(key))
}

function AdminGlobalSettingsPage() {
  const navigate = useNavigate()
  const [fieldKeys, setFieldKeys] = useState([])
  const [formState, setFormState] = useState({})
  const [existingFiles, setExistingFiles] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const fetchSettings = async () => {
      setIsLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      try {
        const payload = await getGlobalSettings()
        const data =
          payload && typeof payload === 'object' ? payload.data ?? payload : {}
        const keys = Object.keys(data || {})
        const nextKeys = keys.length
          ? Array.from(new Set([...keys, ...SAFE_FIELDS]))
          : SAFE_FIELDS
        const nextState = {}
        const nextExistingFiles = {}

        nextKeys.forEach((key) => {
          const value = data ? data[key] : undefined

          if (isFileField(key)) {
            nextState[key] = null
            if (typeof value === 'string' && value) {
              nextExistingFiles[key] = value
            }
            return
          }

          if (
            (key === 'social_links' || key === 'navigation_links') &&
            value &&
            typeof value === 'object'
          ) {
            nextState[key] = JSON.stringify(value, null, 2)
            return
          }

          if (typeof value === 'boolean') {
            nextState[key] = value
          } else if (typeof value === 'number') {
            nextState[key] = value
          } else if (value === null || value === undefined) {
            nextState[key] = ''
          } else {
            nextState[key] = String(value)
          }
        })

        setFieldKeys(nextKeys)
        setFormState(nextState)
        setExistingFiles(nextExistingFiles)
      } catch (error) {
        if (error.status === 401) {
          // Token expired; force re-authentication.
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }

        if (error.status === 404) {
          // No settings yet; show the default form.
          const emptyState = {}
          SAFE_FIELDS.forEach((key) => {
            emptyState[key] = ''
          })
          setFieldKeys(SAFE_FIELDS)
          setFormState(emptyState)
          setExistingFiles({})
          return
        }

        setErrorMessage(error.message || 'Unable to load settings.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [navigate])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const { name, files } = event.target
    const file = files?.[0] || null
    setFormState((current) => ({ ...current, [name]: file }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    let hasFile = false
    const payload = {}
    const formData = new FormData()

    fieldKeys.forEach((key) => {
      const value = formState[key]

      if (value instanceof File) {
        hasFile = true
        formData.append(key, value)
        return
      }

      if (key === 'social_links' || key === 'navigation_links') {
        if (typeof value === 'string' && value.trim()) {
          try {
            const parsed = JSON.parse(value)
            payload[key] =
              parsed && typeof parsed === 'object'
                ? JSON.stringify(parsed)
                : parsed
          } catch (error) {
            payload[key] = value
          }
        } else {
          payload[key] = value
        }
        return
      }

      payload[key] = value
    })

    if (hasFile) {
      fieldKeys.forEach((key) => {
        if (formState[key] instanceof File) {
          return
        }

        if (key === 'social_links' || key === 'navigation_links') {
          const rawValue = payload[key]
          const serialized =
            typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue)
          formData.append(key, serialized)
          return
        }

        formData.append(key, String(payload[key] ?? ''))
      })
    }

    setIsSaving(true)
    try {
      await saveGlobalSettings(hasFile ? formData : payload)
      setSuccessMessage('Settings saved.')
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Global Settings</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Global Settings</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        {fieldKeys.map((key) => {
          const label = key.replace(/_/g, ' ')
          const value = formState[key] ?? ''

          if (isFileField(key)) {
            return (
              <div key={key}>
                <label htmlFor={key}>{label}</label>
                <input id={key} name={key} type="file" onChange={handleFileChange} />
                {existingFiles[key] ? (
                  <p>
                    Current file:{' '}
                    <a href={existingFiles[key]} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </p>
                ) : null}
              </div>
            )
          }

          if (MULTILINE_FIELDS.has(key)) {
            return (
              <div key={key}>
                <label htmlFor={key}>{label}</label>
                <textarea
                  id={key}
                  name={key}
                  value={value}
                  onChange={handleChange}
                  rows={
                    key === 'social_links' || key === 'navigation_links' ? 6 : 3
                  }
                />
              </div>
            )
          }

          if (typeof value === 'boolean') {
            return (
              <label key={key} htmlFor={key}>
                <input
                  id={key}
                  name={key}
                  type="checkbox"
                  checked={value}
                  onChange={handleChange}
                />
                {label}
              </label>
            )
          }

          const inputType = typeof value === 'number' ? 'number' : 'text'

          return (
            <div key={key}>
              <label htmlFor={key}>{label}</label>
              <input
                id={key}
                name={key}
                type={inputType}
                value={value}
                onChange={handleChange}
              />
            </div>
          )
        })}

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </section>
  )
}

export default AdminGlobalSettingsPage
