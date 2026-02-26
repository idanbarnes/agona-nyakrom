import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getObituaryDetail } from '../../api/endpoints.js'
import {
  Button,
  Card,
  CardContent,
  ImageWithFallback,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import useCmsPreviewRefresh from '../../lib/useCmsPreviewRefresh.js'

const FALLBACK_IMAGE = '/share-default.svg'

function CalendarIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

function ClockIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  )
}

function MapPinIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function CrossIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3v18" />
      <path d="M8 8h8" />
    </svg>
  )
}

function Share2Icon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.7 10.7 15.3 7.3" />
      <path d="m8.7 13.3 6.6 3.4" />
    </svg>
  )
}

function ArrowLeftIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function toDate(value) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatLongDate(value) {
  const date = toDate(value)
  if (!date) {
    return null
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  const date = toDate(value)
  if (!date) {
    return null
  }

  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${dateLabel} at ${timeLabel}`
}

function formatDateTimeRange(startAt, endAt) {
  const startDate = toDate(startAt)
  if (!startDate) {
    return null
  }

  const startLabel = formatDateTime(startDate)
  const endDate = toDate(endAt)
  if (!endDate) {
    return startLabel
  }

  const sameDay = startDate.toDateString() === endDate.toDateString()
  if (sameDay) {
    const endTime = endDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
    return `${startLabel} - ${endTime}`
  }

  return `${startLabel} - ${formatDateTime(endDate)}`
}

function buildFullName(item) {
  const explicitName = String(item?.full_name || item?.name || '').trim()
  const composedName = [
    item?.first_name || item?.firstName || '',
    item?.middle_name || item?.middleName || '',
    item?.last_name || item?.lastName || '',
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ')

  const name = explicitName || composedName || 'Obituary'
  const maidenName = String(item?.maiden_name || item?.maidenName || '').trim()

  if (
    !maidenName ||
    name.toLowerCase().includes(maidenName.toLowerCase()) ||
    /\bnee\b/i.test(name)
  ) {
    return name
  }

  return `${name} (nee ${maidenName})`
}

function computeAge(rawAge, dateOfBirth, dateOfDeath) {
  if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
    const numericAge = Number(rawAge)
    if (!Number.isNaN(numericAge)) {
      return numericAge
    }
  }

  const birth = toDate(dateOfBirth)
  const death = toDate(dateOfDeath)
  if (!birth || !death) {
    return null
  }

  let age = death.getFullYear() - birth.getFullYear()
  const monthDelta = death.getMonth() - birth.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && death.getDate() < birth.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}

function parseLocation(location, address) {
  if (location && typeof location === 'object') {
    return {
      name: String(
        location.name || location.venue || location.location || location.place || '',
      ).trim(),
      address: String(
        location.address ||
          location.street_address ||
          location.streetAddress ||
          location.full_address ||
          '',
      ).trim(),
    }
  }

  const locationString = String(location || '').trim()
  const addressString = String(address || '').trim()

  if (!locationString) {
    return {
      name: '',
      address: addressString,
    }
  }

  if (addressString) {
    return {
      name: locationString,
      address: addressString,
    }
  }

  const parts = locationString.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length > 1) {
    return {
      name: parts[0],
      address: parts.slice(1).join(', '),
    }
  }

  return {
    name: locationString,
    address: '',
  }
}

function extractObituaryPayload(response) {
  const payload = response?.data || response

  if (!payload) {
    return null
  }

  return payload?.obituary || payload?.item || payload
}

function isBareFilename(value) {
  return (
    typeof value === 'string' &&
    /^[^/\\]+\.[a-z0-9]{2,6}$/i.test(value.trim())
  )
}

function normalizeObituary(rawItem) {
  if (!rawItem) {
    return null
  }

  const portraitCandidate =
    rawItem?.deceased_photo_url ||
    rawItem?.deceasedPhotoUrl ||
    rawItem?.portrait_photo_url ||
    rawItem?.portraitPhotoUrl ||
    rawItem?.photo_url ||
    rawItem?.photoUrl ||
    rawItem?.image_url ||
    rawItem?.imageUrl ||
    rawItem?.image ||
    rawItem?.photo ||
    null

  const portraitPath =
    (isBareFilename(portraitCandidate) ? null : portraitCandidate) || null

  const posterCandidate =
    rawItem?.poster_image_url ||
    rawItem?.posterImageUrl ||
    rawItem?.poster_url ||
    rawItem?.posterUrl ||
    rawItem?.poster ||
    null

  const posterPath =
    (isBareFilename(posterCandidate) ? null : posterCandidate) ||
    rawItem?.images?.original ||
    rawItem?.images?.large ||
    rawItem?.images?.medium ||
    null

  const visitation = rawItem?.visitation || {}
  const funeral = rawItem?.funeral || {}
  const burial = rawItem?.burial || {}

  const serviceDetails = {
    visitation: {
      startAt:
        visitation?.start_at ||
        visitation?.startAt ||
        visitation?.date_time ||
        visitation?.dateTime ||
        visitation?.date ||
        rawItem?.visitation_start_at ||
        rawItem?.visitation_date ||
        rawItem?.visitationDate ||
        null,
      endAt:
        visitation?.end_at ||
        visitation?.endAt ||
        rawItem?.visitation_end_at ||
        rawItem?.visitation_end_time ||
        null,
      location: visitation?.location || visitation?.venue || rawItem?.visitation_location,
      address: visitation?.address || rawItem?.visitation_address || '',
      note: visitation?.note || rawItem?.visitation_note || '',
      officiant: '',
    },
    funeral: {
      startAt:
        funeral?.start_at ||
        funeral?.startAt ||
        funeral?.date_time ||
        funeral?.dateTime ||
        funeral?.date ||
        rawItem?.funeral_date ||
        rawItem?.funeral_start_at ||
        rawItem?.funeralDate ||
        null,
      endAt: funeral?.end_at || funeral?.endAt || rawItem?.funeral_end_at || null,
      location: funeral?.location || funeral?.venue || rawItem?.funeral_location || rawItem?.location,
      address: funeral?.address || rawItem?.funeral_address || rawItem?.address || '',
      note: funeral?.note || rawItem?.funeral_note || '',
      officiant:
        funeral?.officiant || rawItem?.funeral_officiant || rawItem?.officiant || '',
    },
    burial: {
      startAt:
        burial?.start_at ||
        burial?.startAt ||
        burial?.date_time ||
        burial?.dateTime ||
        burial?.date ||
        rawItem?.burial_date ||
        rawItem?.burialDate ||
        rawItem?.funeral_end_at ||
        null,
      endAt: burial?.end_at || burial?.endAt || null,
      location: burial?.location || burial?.venue || rawItem?.burial_location || '',
      address: burial?.address || rawItem?.burial_address || '',
      note:
        burial?.time_note ||
        burial?.timeNote ||
        burial?.note ||
        rawItem?.burial_time_note ||
        rawItem?.burial_note ||
        '',
      officiant: '',
    },
  }

  return {
    id: rawItem?.id,
    fullName: buildFullName(rawItem),
    biography: rawItem?.biography || rawItem?.description || rawItem?.summary || '',
    dateOfBirth: rawItem?.date_of_birth || rawItem?.birth_date || rawItem?.dateOfBirth,
    dateOfDeath: rawItem?.date_of_death || rawItem?.death_date || rawItem?.dateOfDeath,
    age: computeAge(
      rawItem?.age,
      rawItem?.date_of_birth || rawItem?.birth_date,
      rawItem?.date_of_death || rawItem?.death_date,
    ),
    portraitUrl: resolveAssetUrl(portraitPath || FALLBACK_IMAGE),
    posterUrl: resolveAssetUrl(posterPath || FALLBACK_IMAGE),
    services: serviceDetails,
  }
}

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function ServiceSection({
  title,
  icon,
  startAt,
  endAt,
  location,
  address,
  officiant,
  note,
}) {
  const dateTimeLabel = formatDateTimeRange(startAt, endAt)
  const parsedLocation = parseLocation(location, address)

  const hasDetails =
    dateTimeLabel ||
    parsedLocation.name ||
    parsedLocation.address ||
    officiant ||
    note

  return (
    <div className="py-6 first:pt-2 last:pb-0">
      <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900 md:text-xl">
        <span className="text-neutral-900">{icon}</span>
        <h3 className="leading-none">{title}</h3>
      </div>

      {hasDetails ? (
        <div className="mt-4 space-y-2 pl-6 text-sm text-neutral-700 md:text-base">
          {dateTimeLabel ? (
            <p className="flex items-start gap-2">
              <ClockIcon className="mt-0.5 h-4 w-4 text-neutral-500" />
              <span>{dateTimeLabel}</span>
            </p>
          ) : null}

          {parsedLocation.name ? (
            <p className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 text-neutral-500" />
              <span>{parsedLocation.name}</span>
            </p>
          ) : null}

          {parsedLocation.address ? (
            <p className="pl-6 text-neutral-600">{parsedLocation.address}</p>
          ) : null}

          {officiant ? (
            <p className="pl-6 text-sm italic text-neutral-600">{`Officiant: ${officiant}`}</p>
          ) : null}

          {note ? (
            <p className="pl-6 text-sm italic text-neutral-600">{note}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 pl-6 text-sm text-neutral-500 md:text-base">
          Details to be announced.
        </p>
      )}
    </div>
  )
}

function ObituaryDetail() {
  const { id, slug } = useParams()
  const obituaryId = id || slug

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('obituary')
  const [shareMessage, setShareMessage] = useState('')

  const loadObituary = useCallback(async () => {
    if (!obituaryId) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing obituary id.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getObituaryDetail(obituaryId)
      setItem(extractObituaryPayload(response))
    } catch (err) {
      if (err?.status === 404) {
        setItem(null)
        setError(null)
      } else {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [obituaryId])

  useEffect(() => {
    setActiveTab('obituary')
    setShareMessage('')
  }, [obituaryId])

  useEffect(() => {
    loadObituary()
  }, [loadObituary])

  useCmsPreviewRefresh(loadObituary)

  const normalizedItem = useMemo(() => normalizeObituary(item), [item])

  const birthLabel = formatLongDate(normalizedItem?.dateOfBirth)
  const deathLabel = formatLongDate(normalizedItem?.dateOfDeath)
  const hasLifeDates = birthLabel || deathLabel
  const burialNote =
    normalizedItem?.services?.burial?.note ||
    (!normalizedItem?.services?.burial?.startAt &&
    (normalizedItem?.services?.burial?.location ||
      normalizedItem?.services?.burial?.address)
      ? 'Following the service'
      : '')

  const metadataLine = hasLifeDates
    ? `${birthLabel || 'Unknown'} - ${deathLabel || 'Present'}`
    : null

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') {
      return
    }

    const shareUrl = window.location.href
    const sharePayload = {
      title: normalizedItem?.fullName || 'Obituary',
      text: `In memory of ${normalizedItem?.fullName || 'our loved one'}`,
      url: shareUrl,
    }

    try {
      if (navigator?.share) {
        await navigator.share(sharePayload)
        setShareMessage('Shared successfully.')
      } else {
        await copyToClipboard(shareUrl)
        setShareMessage('Link copied to clipboard.')
      }
    } catch {
      try {
        await copyToClipboard(shareUrl)
        setShareMessage('Link copied to clipboard.')
      } catch {
        setShareMessage('Unable to share right now.')
      }
    }

    window.setTimeout(() => setShareMessage(''), 2000)
  }, [normalizedItem?.fullName])

  return (
    <section className="bg-background py-8 sm:py-10 md:py-12">
      <div className="container space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground break-words md:text-3xl">
            Obituaries
          </h1>
          <p className="text-sm text-muted-foreground">
            Honoring the lives and memories of those who have passed
          </p>
        </header>

        <div className="mx-auto max-w-7xl">
        {loading ? (
          <div className="rounded-lg border border-neutral-300 bg-white p-6 text-neutral-600">
            Loading...
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-lg border border-neutral-300 bg-white p-6">
            <p className="text-neutral-700">
              {error?.message || 'Unable to load this obituary.'}
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                className="border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                onClick={loadObituary}
              >
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && !error && !normalizedItem ? (
          <div className="rounded-lg border border-neutral-300 bg-white p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Obituary not found</h2>
            <p className="mt-2 text-neutral-600">
              This obituary may have been removed or is unavailable.
            </p>
            <div className="mt-4">
              <Button
                as={Link}
                to="/obituaries"
                variant="secondary"
                className="border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
              >
                Back to obituaries
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && !error && normalizedItem ? (
          <article className="mx-auto max-w-6xl">
            <div className="mb-4">
              <Link
                to="/obituaries"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to Obituaries</span>
              </Link>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-7 lg:p-9">
              <div className="grid gap-6 md:grid-cols-[minmax(220px,300px),1fr] md:items-start lg:gap-10">
                <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/40">
                  <div className="aspect-[4/5]">
                    <ImageWithFallback
                      src={normalizedItem.portraitUrl || FALLBACK_IMAGE}
                      fallbackSrc={FALLBACK_IMAGE}
                      alt={normalizedItem.fullName}
                      className="h-full w-full object-cover"
                      fallbackText={`${normalizedItem.fullName} portrait`}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-medium text-amber-600 md:text-xl">In Memory of</p>
                      <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
                        {normalizedItem.fullName}
                      </h2>
                      {(metadataLine || normalizedItem.age !== null) && (
                        <p className="mt-3 text-sm text-muted-foreground md:text-base">
                          {metadataLine}
                          {metadataLine && normalizedItem.age !== null ? ' \u00B7 ' : ''}
                          {normalizedItem.age !== null ? (
                            <span className="italic">{`Age: ${normalizedItem.age} Years`}</span>
                          ) : null}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant="ghost"
                        className="h-9 rounded-md bg-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-300"
                        aria-label="Share obituary"
                        onClick={handleShare}
                      >
                        <Share2Icon className="h-5 w-5" />
                        <span>Share</span>
                      </Button>
                      <p className="mt-2 min-h-5 text-right text-xs text-neutral-600" aria-live="polite">
                        {shareMessage}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-b border-neutral-300">
                    <div role="tablist" aria-label="Obituary content tabs" className="flex gap-5 sm:gap-8">
                      <button
                        type="button"
                        role="tab"
                        id="tab-obituary"
                        aria-controls="panel-obituary"
                        aria-selected={activeTab === 'obituary'}
                        onClick={() => setActiveTab('obituary')}
                        className={`border-b-2 pb-2 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 sm:pb-3 sm:text-lg ${
                          activeTab === 'obituary'
                            ? 'border-neutral-900 text-neutral-900'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        Obituary
                      </button>
                      <button
                        type="button"
                        role="tab"
                        id="tab-biography"
                        aria-controls="panel-biography"
                        aria-selected={activeTab === 'biography'}
                        onClick={() => setActiveTab('biography')}
                        className={`border-b-2 pb-2 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 sm:pb-3 sm:text-lg ${
                          activeTab === 'biography'
                            ? 'border-neutral-900 text-neutral-900'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        Biography
                      </button>
                    </div>
                  </div>

                  {activeTab === 'obituary' ? (
                    <div id="panel-obituary" role="tabpanel" aria-labelledby="tab-obituary" className="mt-6 space-y-6">
                      <div className="rounded-lg bg-neutral-100 shadow-md">
                        <ImageWithFallback
                          src={normalizedItem.posterUrl || FALLBACK_IMAGE}
                          fallbackSrc={FALLBACK_IMAGE}
                          alt={`${normalizedItem.fullName} memorial poster`}
                          className="h-auto w-full object-contain"
                        />
                      </div>

                      <Card className="rounded-2xl border border-neutral-300 bg-white">
                        <CardContent className="p-5 sm:p-7">
                          <h3 className="text-xl font-semibold text-neutral-900 md:text-2xl">
                            Service Information
                          </h3>

                          <div className="mt-4 divide-y divide-neutral-200">
                            <ServiceSection
                              title="Visitation"
                              icon={<CalendarIcon className="h-5 w-5" />}
                              startAt={normalizedItem.services.visitation.startAt}
                              endAt={normalizedItem.services.visitation.endAt}
                              location={normalizedItem.services.visitation.location}
                              address={normalizedItem.services.visitation.address}
                              officiant={normalizedItem.services.visitation.officiant}
                              note={normalizedItem.services.visitation.note}
                            />
                            <ServiceSection
                              title="Funeral Service"
                              icon={<CrossIcon className="h-5 w-5" />}
                              startAt={normalizedItem.services.funeral.startAt}
                              endAt={normalizedItem.services.funeral.endAt}
                              location={normalizedItem.services.funeral.location}
                              address={normalizedItem.services.funeral.address}
                              officiant={normalizedItem.services.funeral.officiant}
                              note={normalizedItem.services.funeral.note}
                            />
                            <ServiceSection
                              title="Burial"
                              icon={<MapPinIcon className="h-5 w-5" />}
                              startAt={normalizedItem.services.burial.startAt}
                              endAt={normalizedItem.services.burial.endAt}
                              location={normalizedItem.services.burial.location}
                              address={normalizedItem.services.burial.address}
                              officiant={normalizedItem.services.burial.officiant}
                              note={burialNote}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div
                      id="panel-biography"
                      role="tabpanel"
                      aria-labelledby="tab-biography"
                      className="mt-6"
                    >
                      <Card className="rounded-2xl border border-neutral-300 bg-white">
                        <CardContent className="space-y-4 p-5 sm:p-7">
                          <h3 className="text-2xl font-semibold text-neutral-900 md:text-3xl">Biography</h3>
                          <p className="whitespace-pre-line leading-relaxed text-neutral-700">
                            {normalizedItem.biography || 'No biography provided.'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : null}
        </div>
      </div>
    </section>
  )
}

export default ObituaryDetail
