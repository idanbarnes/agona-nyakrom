import SmartLink from '../components/navigation/SmartLink.jsx'
import {
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_TAGLINE,
  FOOTER_COMMUNITY_LINKS,
  FOOTER_SECTION_TITLES,
  PUBLIC_UI_LABELS,
} from '../constants/publicChrome.js'

function getSiteName(settings) {
  return settings?.site_name || settings?.siteName || DEFAULT_SITE_NAME
}

function getTagline(settings) {
  return (
    settings?.tagline ||
    settings?.site_tagline ||
    DEFAULT_SITE_TAGLINE
  )
}

function isExternalUrl(value = '') {
  return /^(https?:|mailto:|tel:)/i.test(String(value).trim())
}

function inferPlatformFromUrl(url = '') {
  const value = String(url).toLowerCase()
  if (value.includes('facebook.com')) return 'facebook'
  if (value.includes('instagram.com')) return 'instagram'
  if (value.includes('twitter.com') || value.includes('x.com')) return 'twitter'
  if (value.includes('linkedin.com')) return 'linkedin'
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube'
  if (value.includes('wa.me') || value.includes('whatsapp')) return 'whatsapp'
  return ''
}

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
          const url = entry.url || entry.link || entry.href
          return {
            label: entry.label || entry.name || entry.platform || entry.url,
            platform: entry.platform || inferPlatformFromUrl(url),
            url,
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
        platform: inferPlatformFromUrl(url),
        url,
      }))
      .filter((entry) => entry?.url)
  }

  return []
}

function normalizeNavigationLinks(input) {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input
      .map((entry) => {
        if (typeof entry === 'string') {
          const url = entry.trim()
          return url ? { label: url, url } : null
        }
        if (entry && typeof entry === 'object') {
          const label = entry.label || entry.title || entry.name || entry.url
          const url = entry.url || entry.href || entry.path
          if (!label && !url) {
            return null
          }
          return { label: label || url, url: url || '' }
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

function SocialIcon({ platform, className }) {
  if (platform === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M14 8h3V5h-3c-2.8 0-5 2.2-5 5v2H7v3h2v4h3v-4h3l1-3h-4v-2c0-1.1.9-2 2-2Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="17" cy="7" r="1" fill="currentColor" />
      </svg>
    )
  }

  if (platform === 'twitter') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="m4 4 6.6 8.8L4.4 20h2.4l4.9-5.7L16 20h4L13 10.8 18.7 4h-2.4l-4.3 5L8 4Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M6.6 8.6H3.6v11h3V8.6Zm-1.5-1.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm5.2 12.3h3v-5.8c0-1.5.8-2.6 2.2-2.6 1.3 0 2 .9 2 2.6v5.8h3v-6.6c0-3-1.7-4.6-4-4.6-1.7 0-2.7 1-3.2 1.8V8.6h-3v11Z" fill="currentColor" />
      </svg>
    )
  }

  if (platform === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M21 8.5a3 3 0 0 0-2.1-2.1C17 6 12 6 12 6s-5 0-6.9.4A3 3 0 0 0 3 8.5 31 31 0 0 0 2.6 12c0 1.2.1 2.4.4 3.5a3 3 0 0 0 2.1 2.1C7 18 12 18 12 18s5 0 6.9-.4a3 3 0 0 0 2.1-2.1c.3-1.1.4-2.3.4-3.5s-.1-2.4-.4-3.5Zm-11 5.8V9.7l4 2.3-4 2.3Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (platform === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M12 4a8 8 0 0 0-6.8 12.1L4 20l4-1.1A8 8 0 1 0 12 4Zm4.7 11.4c-.2.6-1.1 1.1-1.6 1.1-.4 0-1 .2-3.3-.8-2.8-1.2-4.6-4-4.8-4.3-.2-.3-1.2-1.6-1.2-3.1 0-1.5.8-2.2 1.1-2.5.3-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.6.2.6.8 2 .9 2.2.1.2.1.4 0 .7-.1.3-.2.4-.4.6-.2.2-.4.4-.5.5-.2.2-.3.4-.1.7.2.3.9 1.5 1.9 2.4 1.4 1.2 2.5 1.6 2.8 1.8.3.2.5.1.7-.1l.9-1.1c.2-.3.5-.3.8-.2l2 .9c.3.1.5.2.6.4.1.2.1 1-.1 1.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M8.5 15.5a3.5 3.5 0 0 1 0-5l2-2a3.5 3.5 0 0 1 5 5l-1 1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.5 8.5a3.5 3.5 0 0 1 0 5l-2 2a3.5 3.5 0 1 1-5-5l1-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RenderNavLink({ href, children, className }) {
  if (!href) {
    return <span className={className}>{children}</span>
  }

  if (isExternalUrl(href)) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <SmartLink href={href} className={className}>
      {children}
    </SmartLink>
  )
}

function Footer({ settings, loading, error }) {
  const siteName = getSiteName(settings)
  const tagline = getTagline(settings)
  const socialLinks = normalizeSocialLinks(
    settings?.social_links || settings?.socialLinks,
  )
  const navigationLinks = normalizeNavigationLinks(
    settings?.navigation_links || settings?.navigationLinks,
  )
  const email = settings?.email || settings?.contact_email || settings?.contactEmail
  const phone = settings?.phone || settings?.contact_phone || settings?.contactPhone
  const address = settings?.address
  const year = new Date().getFullYear()
  const copyright =
    settings?.footer_copyright_text ||
    settings?.footerCopyrightText ||
    settings?.footer_text ||
    settings?.footerText ||
    settings?.copyright ||
    settings?.copyright_text ||
    `${year} ${siteName}`

  const quickLinks =
    navigationLinks.length > 0
      ? navigationLinks.slice(0, 5)
      : DEFAULT_FOOTER_QUICK_LINKS

  const communityLinks = FOOTER_COMMUNITY_LINKS

  return (
    <footer className="bg-[#111827] text-[#D1D5DB]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-lg font-bold text-white shadow-[0_6px_14px_rgba(217,119,6,0.35)]">
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className="text-xl font-bold text-white">{siteName}</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-[#D1D5DB]">
              {tagline}
            </p>
            {socialLinks.length > 0 ? (
              <ul className="flex flex-wrap gap-3">
                {socialLinks.map((link, index) => {
                  const platform =
                    link.platform || inferPlatformFromUrl(link.url || '') || ''

                  return (
                    <li key={link.url || index}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label || platform || 'social link'}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#374151] text-[#D1D5DB] transition-colors hover:border-[#D97706] hover:text-[#F59E0B]"
                      >
                        <SocialIcon platform={platform} className="h-4 w-4" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </section>

          <section>
            <h3 className="mb-4 text-base font-semibold text-white">{FOOTER_SECTION_TITLES.quickLinks}</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link, index) => (
                <li key={`${link.url || link.label}-${index}`}>
                  <RenderNavLink
                    href={link.url}
                    className="text-[#D1D5DB] transition-colors hover:text-[#F59E0B]"
                  >
                    {link.label || link.url}
                  </RenderNavLink>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-base font-semibold text-white">{FOOTER_SECTION_TITLES.community}</h3>
            <ul className="space-y-2 text-sm">
              {communityLinks.map((link) => (
                <li key={link.url}>
                  <RenderNavLink
                    href={link.url}
                    className="text-[#D1D5DB] transition-colors hover:text-[#F59E0B]"
                  >
                    {link.label}
                  </RenderNavLink>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-4 text-base font-semibold text-white">{FOOTER_SECTION_TITLES.contact}</h3>
            <ul className="space-y-3 text-sm">
              {address ? (
                <li className="flex items-start gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span>{address}</span>
                </li>
              ) : null}
              {phone ? (
                <li className="flex items-center gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-[#F59E0B]"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 3h4l2 5-2.5 1.5a14 14 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2C10.7 21 3 13.3 3 5a2 2 0 0 1 2-2Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <a
                    href={`tel:${phone}`}
                    className="text-[#D1D5DB] transition-colors hover:text-[#F59E0B]"
                  >
                    {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li className="flex items-center gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-[#F59E0B]"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="m4 7 8 6 8-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <a
                    href={`mailto:${email}`}
                    className="text-[#D1D5DB] transition-colors hover:text-[#F59E0B]"
                  >
                    {email}
                  </a>
                </li>
              ) : null}
              {!address && !phone && !email && !loading && error ? (
                <li>{PUBLIC_UI_LABELS.contactDetailsUnavailable}</li>
              ) : null}
            </ul>
            <SmartLink
              href="/contact"
              className="mt-4 inline-flex h-10 items-center rounded-md bg-[#D97706] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#B45309]"
            >
              {PUBLIC_UI_LABELS.sendMessage}
            </SmartLink>
          </section>
        </div>

        <div className="mt-8 border-t border-[#1F2937] pt-8 text-center text-sm text-[#D1D5DB]">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
