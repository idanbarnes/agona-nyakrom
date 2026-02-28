import { useCallback, useEffect, useMemo, useState } from 'react'
import { getContactFaqs, getContactInfo } from '../api/endpoints.js'
import ContactInfoCard from '../components/contact/ContactInfoCard.jsx'
import FaqAccordion from '../components/contact/FaqAccordion.jsx'
import SectionHeader from '../components/contact/SectionHeader.jsx'
import { Skeleton } from '../components/ui/index.jsx'
import useCmsPreviewRefresh from '../lib/useCmsPreviewRefresh.js'

const CONTACT_CACHE_TTL_MS = 60 * 1000

let cachedContactSections = null
let cachedAt = 0
let inFlightRequest = null

function toText(value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).trim()
}

function extractData(response) {
  if (!response) {
    return null
  }

  return response?.data ?? response
}

function sortByDisplayOrder(items = []) {
  return [...items].sort(
    (left, right) =>
      Number(left?.display_order ?? left?.sort_order ?? 0) -
      Number(right?.display_order ?? right?.sort_order ?? 0),
  )
}

function normalizeContactInfo(response) {
  const data = extractData(response) || {}

  return {
    section_title: toText(data.section_title),
    section_subtitle: toText(data.section_subtitle),
    emails: sortByDisplayOrder(Array.isArray(data.emails) ? data.emails : []),
    phones: sortByDisplayOrder(Array.isArray(data.phones) ? data.phones : []),
    address:
      data.address && typeof data.address === 'object'
        ? data.address
        : {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: '',
          },
    office_hours:
      data.office_hours && typeof data.office_hours === 'object'
        ? data.office_hours
        : {
            days: '',
            hours: '',
            timezone: '',
          },
  }
}

function normalizeFaqs(response) {
  const data = extractData(response)
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.faqs)
        ? data.faqs
        : []

  return sortByDisplayOrder(rawItems)
    .map((item, index) => ({
      id: item?.id || `faq-${index + 1}`,
      question: toText(item?.question),
      answer: toText(item?.answer),
    }))
    .filter((item) => item.question && item.answer)
}

function formatAddressLines(address = {}) {
  const street = toText(address.street)
  const city = toText(address.city)
  const state = toText(address.state)
  const zip = toText(address.zip)
  const country = toText(address.country)

  let locality = [city, state].filter(Boolean).join(', ')
  if (zip) {
    locality = locality ? `${locality} ${zip}` : zip
  }
  if (country) {
    locality = locality ? `${locality}, ${country}` : country
  }

  if (street && locality) {
    return [street, locality]
  }
  if (street) {
    return [street]
  }
  if (locality) {
    return [locality]
  }

  return []
}

function formatContactCards(contact) {
  const emailLines = contact?.emails
    ?.map((entry) => toText(entry?.email))
    .filter(Boolean)
    .slice(0, 2)

  const primaryPhone = contact?.phones?.[0]
  const phoneLines = [
    toText(primaryPhone?.number),
    toText(primaryPhone?.availability),
  ].filter(Boolean)

  if (phoneLines.length < 2 && contact?.phones?.[1]) {
    phoneLines.push(toText(contact.phones[1]?.number))
  }

  const visitLines = formatAddressLines(contact?.address).slice(0, 2)

  const officeHours = contact?.office_hours || {}
  const daysLine = toText(officeHours.days)
  const hours = toText(officeHours.hours)
  const timezone = toText(officeHours.timezone)
  const hoursLine = [hours, timezone ? `(${timezone})` : '']
    .filter(Boolean)
    .join(' ')

  const officeHourLines = [daysLine, hoursLine].filter(Boolean).slice(0, 2)

  return [
    {
      key: 'email',
      title: 'Email Us',
      lines: emailLines,
      badgeClassName: 'bg-[#E8F0FE] text-[#2563EB]',
      icon: <MailIcon className="h-6 w-6" />,
    },
    {
      key: 'phone',
      title: 'Call Us',
      lines: phoneLines.slice(0, 2),
      badgeClassName: 'bg-[#E9F9EF] text-[#16A34A]',
      icon: <PhoneIcon className="h-6 w-6" />,
    },
    {
      key: 'location',
      title: 'Visit Us',
      lines: visitLines,
      badgeClassName: 'bg-[#FDECEC] text-[#DC2626]',
      icon: <LocationIcon className="h-6 w-6" />,
    },
    {
      key: 'hours',
      title: 'Office Hours',
      lines: officeHourLines,
      badgeClassName: 'bg-[#F3ECFF] text-[#7C3AED]',
      icon: <ClockIcon className="h-6 w-6" />,
    },
  ]
}

function hasFreshCache() {
  if (!cachedContactSections) {
    return false
  }

  return Date.now() - cachedAt < CONTACT_CACHE_TTL_MS
}

async function loadContactSections({ force = false } = {}) {
  if (!force && hasFreshCache()) {
    return cachedContactSections
  }

  if (!force && inFlightRequest) {
    return inFlightRequest
  }

  inFlightRequest = Promise.allSettled([getContactInfo(), getContactFaqs()])
    .then(([contactResult, faqResult]) => {
      const snapshot = {
        contact: null,
        faqs: [],
        contactError: null,
        faqError: null,
      }

      if (contactResult.status === 'fulfilled') {
        snapshot.contact = normalizeContactInfo(contactResult.value)
      } else {
        snapshot.contactError = contactResult.reason
      }

      if (faqResult.status === 'fulfilled') {
        snapshot.faqs = normalizeFaqs(faqResult.value)
      } else {
        snapshot.faqError = faqResult.reason
      }

      if (!snapshot.contactError && !snapshot.faqError) {
        cachedContactSections = snapshot
        cachedAt = Date.now()
      }

      return snapshot
    })
    .finally(() => {
      inFlightRequest = null
    })

  return inFlightRequest
}

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Zm1.8.1 5.7 4.5a.8.8 0 0 0 1 0l5.7-4.5a1 1 0 0 0-.7-.2h-11c-.3 0-.5.1-.7.2Zm12.2 1.6-4.7 3.7a2.8 2.8 0 0 1-3.5 0L5 8.2v9.3c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V8.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6.9 3h2.2c.5 0 .9.3 1 .8l.8 3.2c.1.4 0 .8-.3 1.1l-1.5 1.5a13 13 0 0 0 5.8 5.8l1.5-1.5c.3-.3.7-.4 1.1-.3l3.2.8c.5.1.8.5.8 1v2.2c0 .8-.6 1.4-1.4 1.4A17.7 17.7 0 0 1 5.5 4.4C5.5 3.6 6.1 3 6.9 3Z"
        fill="currentColor"
      />
    </svg>
  )
}

function LocationIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3a7 7 0 0 1 7 7c0 5.3-7 11-7 11s-7-5.7-7-11a7 7 0 0 1 7-7Zm0 3.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm-1 3a1 1 0 0 1 2 0v3.6l2.3 1.4a1 1 0 0 1-1 1.8l-2.8-1.7a1 1 0 0 1-.5-.9V8Z"
        fill="currentColor"
      />
    </svg>
  )
}

function Contact() {
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState(null)
  const [faqs, setFaqs] = useState([])
  const [contactError, setContactError] = useState(null)
  const [faqError, setFaqError] = useState(null)

  const fetchPageData = useCallback(async ({ force = false } = {}) => {
    setLoading(true)

    try {
      const snapshot = await loadContactSections({ force })
      setContact(snapshot.contact)
      setFaqs(snapshot.faqs)
      setContactError(snapshot.contactError)
      setFaqError(snapshot.faqError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        const snapshot = await loadContactSections()
        if (!isMounted) {
          return
        }

        setContact(snapshot.contact)
        setFaqs(snapshot.faqs)
        setContactError(snapshot.contactError)
        setFaqError(snapshot.faqError)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [])

  useCmsPreviewRefresh(() => fetchPageData({ force: true }))

  const sectionTitle = toText(contact?.section_title) || 'Get in Touch'
  const sectionSubtitle =
    toText(contact?.section_subtitle) ||
    'Have questions or feedback? Reach out to us and our team will respond shortly.'

  const cards = useMemo(() => formatContactCards(contact), [contact])

  return (
    <section className="bg-[#F8F4EE] py-14 sm:py-16 lg:py-20">
      <div className="container max-w-6xl space-y-16 md:space-y-20">
        <section className="space-y-8 sm:space-y-10">
          <SectionHeader title={sectionTitle} subtitle={sectionSubtitle} />

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`contact-card-skeleton-${index}`}
                  className="rounded-2xl border border-border/70 bg-surface p-6 shadow-sm"
                >
                  <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-full max-w-[180px]" />
                    <Skeleton className="h-4 w-4/5 max-w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : contactError ? (
            <p className="text-center text-sm text-muted-foreground">
              Unable to load contact information right now.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <ContactInfoCard
                  key={card.key}
                  icon={card.icon}
                  title={card.title}
                  lines={card.lines}
                  badgeClassName={card.badgeClassName}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-8 sm:space-y-10">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Find quick answers to common questions"
          />

          <div className="mx-auto w-full max-w-3xl">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`faq-skeleton-${index}`}
                    className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6"
                  >
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-4 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : faqError ? (
              <p className="text-center text-sm text-muted-foreground">
                Unable to load FAQs right now.
              </p>
            ) : faqs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No FAQs available yet.
              </p>
            ) : (
              <FaqAccordion items={faqs} singleOpen />
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Contact
