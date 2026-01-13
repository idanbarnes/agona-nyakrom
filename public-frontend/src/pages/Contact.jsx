import { useMemo } from 'react'
import { usePublicSettings } from '../layouts/Layout.jsx'

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

  const socialLinks = useMemo(
    () => normalizeSocialLinks(settings?.social_links || settings?.socialLinks),
    [settings],
  )

  if (loading) {
    return (
      <section>
        <h1>Contact</h1>
        <p>Loading contact information...</p>
      </section>
    )
  }

  if (error) {
    if (error?.status === 404) {
      return (
        <section>
          <h1>Contact</h1>
          <p>Contact details are not available yet.</p>
        </section>
      )
    }

    return (
      <section>
        <h1>Contact</h1>
        <p>Unable to load contact information.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  if (!settings || isUnpublished(settings)) {
    return (
      <section>
        <h1>Contact</h1>
        <p>Contact details are not available yet.</p>
      </section>
    )
  }

  const siteName = settings?.site_name || settings?.siteName
  const contactEmail = settings?.contact_email || settings?.contactEmail
  const contactPhone = settings?.contact_phone || settings?.contactPhone
  const address = settings?.address

  return (
    <section>
      <h1>Contact</h1>
      {siteName && (
        <p>
          <strong>Site:</strong> {siteName}
        </p>
      )}
      {contactEmail && (
        <p>
          <strong>Email:</strong>{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      )}
      {contactPhone && (
        <p>
          <strong>Phone:</strong>{' '}
          <a href={`tel:${contactPhone}`}>{contactPhone}</a>
        </p>
      )}
      {address && (
        <p>
          <strong>Address:</strong> {address}
        </p>
      )}
      {socialLinks.length > 0 ? (
        <section>
          <h2>Social Links</h2>
          <ul>
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
        <p>No social links available.</p>
      )}
    </section>
  )
}

export default Contact
