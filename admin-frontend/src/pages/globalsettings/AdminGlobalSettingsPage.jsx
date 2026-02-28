import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  ToastMessage,
} from '../../components/ui/index.jsx'
import {
  getGlobalSettings,
  saveGlobalSettings,
} from '../../services/api/adminGlobalSettingsApi.js'
import { getAuthToken } from '../../lib/auth.js'

const EMPTY_FORM_STATE = {
  id: '',
  site_name: '',
  tagline: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  social_links: [],
  navigation_links: [],
  footer_text: '',
  published: false,
  created_at: '',
  updated_at: '',
}

const createLinkId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

function normalizeText(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value === 1
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }
  return false
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') {
    return value
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function normalizeSocialLinks(rawValue) {
  const value = parseMaybeJson(rawValue)

  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (typeof item === 'string') {
          const url = item.trim()
          if (!url) {
            return null
          }
          return { local_id: `${index}-${url}`, platform: '', url }
        }

        if (!item || typeof item !== 'object') {
          return null
        }

        const platform = normalizeText(item.platform ?? item.label ?? item.name)
        const url = normalizeText(item.url ?? item.href ?? item.link)
        if (!platform && !url) {
          return null
        }

        return {
          local_id: `${index}-${platform}-${url}`,
          platform,
          url,
        }
      })
      .filter(Boolean)
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([platform, url], index) => {
        const normalizedPlatform = normalizeText(platform).trim()
        const normalizedUrl = normalizeText(url).trim()
        if (!normalizedPlatform && !normalizedUrl) {
          return null
        }
        return {
          local_id: `${index}-${normalizedPlatform}-${normalizedUrl}`,
          platform: normalizedPlatform,
          url: normalizedUrl,
        }
      })
      .filter(Boolean)
  }

  return []
}

function normalizeNavigationLinks(rawValue) {
  const value = parseMaybeJson(rawValue)

  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (typeof item === 'string') {
          const url = item.trim()
          if (!url) {
            return null
          }
          return { local_id: `${index}-${url}`, label: '', url }
        }

        if (!item || typeof item !== 'object') {
          return null
        }

        const label = normalizeText(item.label ?? item.title ?? item.name)
        const url = normalizeText(item.url ?? item.href ?? item.path)
        if (!label && !url) {
          return null
        }

        return {
          local_id: `${index}-${label}-${url}`,
          label,
          url,
        }
      })
      .filter(Boolean)
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([label, url], index) => {
        const normalizedLabel = normalizeText(label).trim()
        const normalizedUrl = normalizeText(url).trim()
        if (!normalizedLabel && !normalizedUrl) {
          return null
        }
        return {
          local_id: `${index}-${normalizedLabel}-${normalizedUrl}`,
          label: normalizedLabel,
          url: normalizedUrl,
        }
      })
      .filter(Boolean)
  }

  return []
}

function mapApiToFormState(rawData = {}, fallbackState = EMPTY_FORM_STATE) {
  const data = rawData && typeof rawData === 'object' ? rawData : {}

  return {
    ...fallbackState,
    id: normalizeText(data.id ?? fallbackState.id),
    site_name: normalizeText(data.site_name ?? fallbackState.site_name),
    tagline: normalizeText(data.tagline ?? fallbackState.tagline),
    contact_email: normalizeText(
      data.contact_email ?? data.email ?? fallbackState.contact_email,
    ),
    contact_phone: normalizeText(
      data.contact_phone ?? data.phone ?? fallbackState.contact_phone,
    ),
    address: normalizeText(data.address ?? fallbackState.address),
    social_links: normalizeSocialLinks(
      data.social_links ?? fallbackState.social_links,
    ),
    navigation_links: normalizeNavigationLinks(
      data.navigation_links ?? fallbackState.navigation_links,
    ),
    footer_text: normalizeText(data.footer_text ?? fallbackState.footer_text),
    published: normalizeBoolean(data.published ?? fallbackState.published),
    created_at: normalizeText(
      data.created_at ?? data.createdAt ?? fallbackState.created_at,
    ),
    updated_at: normalizeText(
      data.updated_at ?? data.updatedAt ?? fallbackState.updated_at,
    ),
  }
}

function formatDateTime(rawValue) {
  if (!rawValue) {
    return '-'
  }
  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleString()
}

function sanitizeSocialLinks(links) {
  return links
    .map((link) => ({
      platform: normalizeText(link.platform).trim(),
      url: normalizeText(link.url).trim(),
    }))
    .filter((link) => link.platform || link.url)
}

function sanitizeNavigationLinks(links) {
  return links
    .map((link) => ({
      label: normalizeText(link.label).trim(),
      url: normalizeText(link.url).trim(),
    }))
    .filter((link) => link.label || link.url)
}

function AdminGlobalSettingsPage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState(EMPTY_FORM_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return () => {
        isMounted = false
      }
    }

    const fetchSettings = async () => {
      setIsLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      try {
        const payload = await getGlobalSettings()
        const data =
          payload && typeof payload === 'object' ? payload.data ?? payload : {}
        if (!isMounted) {
          return
        }
        setFormState((current) => mapApiToFormState(data, current))
      } catch (error) {
        if (!isMounted) {
          return
        }
        if (error.status === 404) {
          setFormState(EMPTY_FORM_STATE)
          return
        }
        setErrorMessage(error.message || 'Unable to load settings.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSettings()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const updateField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const addSocialLink = () => {
    setFormState((current) => ({
      ...current,
      social_links: [
        ...current.social_links,
        { local_id: createLinkId('social'), platform: '', url: '' },
      ],
    }))
  }

  const removeSocialLink = (localId) => {
    setFormState((current) => ({
      ...current,
      social_links: current.social_links.filter((link) => link.local_id !== localId),
    }))
  }

  const updateSocialLink = (localId, field, value) => {
    setFormState((current) => ({
      ...current,
      social_links: current.social_links.map((link) =>
        link.local_id === localId ? { ...link, [field]: value } : link,
      ),
    }))
  }

  const addNavigationLink = () => {
    setFormState((current) => ({
      ...current,
      navigation_links: [
        ...current.navigation_links,
        { local_id: createLinkId('navigation'), label: '', url: '' },
      ],
    }))
  }

  const removeNavigationLink = (localId) => {
    setFormState((current) => ({
      ...current,
      navigation_links: current.navigation_links.filter(
        (link) => link.local_id !== localId,
      ),
    }))
  }

  const updateNavigationLink = (localId, field, value) => {
    setFormState((current) => ({
      ...current,
      navigation_links: current.navigation_links.map((link) =>
        link.local_id === localId ? { ...link, [field]: value } : link,
      ),
    }))
  }

  const submitSettings = async ({ publish = false } = {}) => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    const payload = {
      site_name: formState.site_name.trim(),
      tagline: formState.tagline.trim(),
      contact_email: formState.contact_email.trim(),
      contact_phone: formState.contact_phone.trim(),
      address: formState.address.trim(),
      social_links: sanitizeSocialLinks(formState.social_links),
      navigation_links: sanitizeNavigationLinks(formState.navigation_links),
      footer_text: formState.footer_text.trim(),
      published: publish ? true : Boolean(formState.published),
    }

    try {
      const response = await saveGlobalSettings(payload)
      const data =
        response && typeof response === 'object' ? response.data ?? response : {}
      setFormState((current) => mapApiToFormState(data, current))
      setSuccessMessage(publish ? 'Settings published successfully.' : 'Settings saved.')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await submitSettings()
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold md:text-2xl">Global Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage site-wide configuration used across the CMS and public site.
          </p>
        </header>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold md:text-2xl">Global Settings</h1>
          <p className="text-sm text-muted-foreground">
            Update shared branding, contact information, links, and footer content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={formState.published ? 'published' : 'draft'}>
            {formState.published ? 'Published' : 'Draft'}
          </Badge>
          <Badge variant="muted">
            {formState.id ? `ID ${formState.id.slice(0, 8)}` : 'No record yet'}
          </Badge>
        </div>
      </header>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                name="site_name"
                value={formState.site_name}
                onChange={(event) => updateField('site_name', event.target.value)}
                placeholder="Agona Nyakrom Community"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                name="tagline"
                value={formState.tagline}
                onChange={(event) => updateField('tagline', event.target.value)}
                placeholder="Short phrase shown across the site"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formState.contact_email}
                  onChange={(event) =>
                    updateField('contact_email', event.target.value)
                  }
                  placeholder="info@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  value={formState.contact_phone}
                  onChange={(event) =>
                    updateField('contact_phone', event.target.value)
                  }
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                rows={3}
                value={formState.address}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="Municipal Assembly address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Social Links</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={addSocialLink}>
              Add Link
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {formState.social_links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No social links added yet.
              </p>
            ) : null}
            {formState.social_links.map((link) => (
              <div
                key={link.local_id}
                className="rounded-lg border border-border/70 bg-muted/20 p-3"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                  <Input
                    value={link.platform}
                    onChange={(event) =>
                      updateSocialLink(link.local_id, 'platform', event.target.value)
                    }
                    placeholder="Platform"
                  />
                  <Input
                    value={link.url}
                    onChange={(event) =>
                      updateSocialLink(link.local_id, 'url', event.target.value)
                    }
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeSocialLink(link.local_id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Navigation Links</CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addNavigationLink}
            >
              Add Link
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {formState.navigation_links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No navigation links added yet.
              </p>
            ) : null}
            {formState.navigation_links.map((link) => (
              <div
                key={link.local_id}
                className="rounded-lg border border-border/70 bg-muted/20 p-3"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                  <Input
                    value={link.label}
                    onChange={(event) =>
                      updateNavigationLink(link.local_id, 'label', event.target.value)
                    }
                    placeholder="Label"
                  />
                  <Input
                    value={link.url}
                    onChange={(event) =>
                      updateNavigationLink(link.local_id, 'url', event.target.value)
                    }
                    placeholder="/about"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeNavigationLink(link.local_id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer and Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="footer_text">Footer Text</Label>
              <Textarea
                id="footer_text"
                name="footer_text"
                rows={2}
                value={formState.footer_text}
                onChange={(event) => updateField('footer_text', event.target.value)}
                placeholder="Copyright and footer text"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                id="published"
                name="published"
                type="checkbox"
                checked={Boolean(formState.published)}
                onChange={(event) => updateField('published', event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              Mark this configuration as published
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created At
              </p>
              <p className="mt-1 text-sm text-foreground">
                {formatDateTime(formState.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last Updated
              </p>
              <p className="mt-1 text-sm text-foreground">
                {formatDateTime(formState.updated_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-20 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" variant="secondary" loading={isSaving}>
              {isSaving ? 'Saving...' : 'Save settings'}
            </Button>
            <Button
              type="button"
              onClick={() => submitSettings({ publish: true })}
              loading={isSaving}
            >
              {isSaving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default AdminGlobalSettingsPage
