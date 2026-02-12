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
    <footer className="border-t border-border bg-surface">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              {siteName}
            </h2>
            <p className="text-sm text-muted-foreground">
              A public home for community stories, heritage, and local milestones
              in Nyakrom.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about-nyakrom/history"
                  className="text-muted-foreground transition hover:text-foreground hover:underline"
                >
                  History
                </Link>
              </li>
              <li>
                <Link
                  to="/clans"
                  className="text-muted-foreground transition hover:text-foreground hover:underline"
                >
                  Clans
                </Link>
              </li>
              <li>
                <Link
                  to="/asafo-companies"
                  className="text-muted-foreground transition hover:text-foreground hover:underline"
                >
                  Asafo Companies
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-muted-foreground transition hover:text-foreground hover:underline"
                >
                  News
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground transition hover:text-foreground hover:underline"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {email && (
                <p>
                  <a
                    href={`mailto:${email}`}
                    className="transition hover:text-foreground hover:underline"
                  >
                    {email}
                  </a>
                </p>
              )}
              {phone && (
                <p>
                  <a
                    href={`tel:${phone}`}
                    className="transition hover:text-foreground hover:underline"
                  >
                    {phone}
                  </a>
                </p>
              )}
              {address && <p>{address}</p>}
              {!settings && !loading && error && (
                <p>Contact details unavailable.</p>
              )}
            </div>
          </section>

          <section className="space-y-3 md:col-span-3">
            <div className="flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Social</h3>
                {socialLinks.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-4 text-sm">
                    {socialLinks.map((link, index) => (
                      <li key={link.url || index}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground transition hover:text-foreground hover:underline"
                        >
                          {link.label || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No social links available.
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{copyright}</p>
            </div>
          </section>
        </div>
      </div>
    </footer>
  )
}

export default Footer
