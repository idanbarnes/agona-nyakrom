import { useMemo } from 'react'
import { usePublicSettings } from '../layouts/publicSettingsContext.js'

// Normalize social links so the UI can render them consistently.
function normalizeSocialLinks(input) {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input
      .map((entry) => {
        if (typeof entry === 'string') {
          return { label: entry, url: entry }
        }

        if (entry && typeof entry === 'object') {
          return {
            label: entry.label || entry.name || entry.platform || entry.url,
            url: entry.url || entry.link || entry.href,
          }
        }

        return null
      })
      .filter((entry) => entry?.url)
  }

  if (typeof input === 'object') {
    return Object.entries(input)
      .map(([label, url]) => ({
        label,
        url,
      }))
      .filter((entry) => entry?.url)
  }

  return []
}

// Consider several flags that backends use for publish state.
function isUnpublished(settings) {
  return (
    settings?.published === false ||
    settings?.is_published === false ||
    settings?.status === 'draft'
  )
}

function Contact() {
  const { settings, loading, error } = usePublicSettings()
  const sectionClassName = 'container space-y-4 py-6 md:py-10'
  const titleClassName =
    'text-2xl font-semibold text-foreground break-words md:text-3xl'

  const socialLinks = useMemo(
    () => normalizeSocialLinks(settings?.social_links || settings?.socialLinks),
    [settings],
  )

  if (loading) {
    return (
      <section className={sectionClassName}>
        <h1 className={titleClassName}>Contact</h1>
        <p className="text-sm text-muted-foreground">
          Loading contact information...
        </p>
      </section>
    )
  }

  if (error) {
    if (error?.status === 404) {
      return (
        <section className={sectionClassName}>
          <h1 className={titleClassName}>Contact</h1>
          <p className="text-sm text-muted-foreground">
            Contact details are not available yet.
          </p>
        </section>
      )
    }

    return (
      <section className={sectionClassName}>
        <h1 className={titleClassName}>Contact</h1>
        <p className="text-sm text-muted-foreground">
          Unable to load contact information.
        </p>
        <pre className="text-sm text-muted-foreground">
          {error?.message || String(error)}
        </pre>
      </section>
    )
  }

  if (!settings || isUnpublished(settings)) {
    return (
      <section className={sectionClassName}>
        <h1 className={titleClassName}>Contact</h1>
        <p className="text-sm text-muted-foreground">
          Contact details are not available yet.
        </p>
      </section>
    )
  }

  const siteName = settings?.site_name || settings?.siteName
  const contactEmail = settings?.contact_email || settings?.contactEmail
  const contactPhone = settings?.contact_phone || settings?.contactPhone
  const address = settings?.address

  return (
    <section className={sectionClassName}>
      <h1 className={titleClassName}>Contact</h1>
      {siteName && (
        <p className="text-sm text-muted-foreground">
          <strong>Site:</strong> {siteName}
        </p>
      )}
      {contactEmail && (
        <p className="text-sm text-muted-foreground">
          <strong>Email:</strong>{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      )}
      {contactPhone && (
        <p className="text-sm text-muted-foreground">
          <strong>Phone:</strong>{' '}
          <a href={`tel:${contactPhone}`}>{contactPhone}</a>
        </p>
      )}
      {address && (
        <p className="text-sm text-muted-foreground">
          <strong>Address:</strong> {address}
        </p>
      )}
      {socialLinks.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Social Links
          </h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {socialLinks.map((link, index) => (
              <li key={link.url || index}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label || link.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No social links available.
        </p>
      )}
    </section>
  )
}

export default Contact
