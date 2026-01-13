import { Link } from 'react-router-dom'

// Provide a consistent fallback when settings are missing or still loading.
function getSiteName(settings) {
  return settings?.site_name || settings?.siteName || 'Nyakrom Community'
}

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
      .map(([label, url]) => ({ label, url }))
      .filter((entry) => entry?.url)
  }

  return []
}

function Footer({ settings, loading, error }) {
  const siteName = getSiteName(settings)
  const socialLinks = normalizeSocialLinks(
    settings?.social_links || settings?.socialLinks,
  )
  const email = settings?.email || settings?.contact_email || settings?.contactEmail
  const phone = settings?.phone || settings?.contact_phone || settings?.contactPhone
  const address = settings?.address
  const year = new Date().getFullYear()
  const copyright =
    settings?.footer_copyright_text ||
    settings?.footerCopyrightText ||
    settings?.copyright ||
    settings?.copyright_text ||
    `${year} ${siteName}`

  return (
    <footer>
      <section>
        <h2>{siteName}</h2>
        <p>
          A public home for community stories, heritage, and local milestones in
          Nyakrom.
        </p>
      </section>

      <section>
        <h3>Quick Links</h3>
        <ul>
          <li>
            <Link to="/about/history">History</Link>
          </li>
          <li>
            <Link to="/clans">Clans</Link>
          </li>
          <li>
            <Link to="/asafo-companies">Asafo Companies</Link>
          </li>
          <li>
            <Link to="/news">News</Link>
          </li>
          <li>
            <Link to="/contact">Contact Us</Link>
          </li>
        </ul>
      </section>

      <section>
        <h3>Contact</h3>
        {email && (
          <p>
            <a href={`mailto:${email}`}>{email}</a>
          </p>
        )}
        {phone && (
          <p>
            <a href={`tel:${phone}`}>{phone}</a>
          </p>
        )}
        {address && <p>{address}</p>}
        {!settings && !loading && error && (
          <p>Contact details unavailable.</p>
        )}
      </section>

      <section>
        <h3>Social</h3>
        {socialLinks.length > 0 ? (
          <ul>
            {socialLinks.map((link, index) => (
              <li key={link.url || index}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label || link.url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No social links available.</p>
        )}
        <p>{copyright}</p>
      </section>
    </footer>
  )
}

export default Footer
