import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getObituaries } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import {
  Button,
  ErrorState,
  ImageWithFallback,
  Input,
  ListSkeleton,
  Pagination,
  StateGate,
} from '../../components/ui/index.jsx'

const ITEMS_PER_PAGE = 20
const API_PAGE_SIZE = 100
const MAX_FETCH_PAGES = 100

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle
        cx="11"
        cy="11"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="m20 20-3.6-3.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function PersonIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M5 19c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function CalendarIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M8 3v4M16 3v4M3 10h18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function ShareIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle
        cx="18"
        cy="5"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="6"
        cy="12"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="18"
        cy="19"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="m8.1 11 7.8-4.5m-7.8 6 7.8 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function EmptyListIcon({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M5 6h14M5 12h14M5 18h9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function formatLongDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatYear(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.getFullYear()
}

function computeAge(rawAge, dateOfBirth, dateOfDeath) {
  if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
    const numericAge = Number(rawAge)
    if (!Number.isNaN(numericAge) && numericAge >= 0) {
      return Math.trunc(numericAge)
    }
  }

  if (!dateOfBirth || !dateOfDeath) {
    return null
  }

  const birth = new Date(dateOfBirth)
  const death = new Date(dateOfDeath)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(death.getTime())) {
    return null
  }

  let age = death.getFullYear() - birth.getFullYear()
  const monthDelta = death.getMonth() - birth.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && death.getDate() < birth.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}

// Extract list data across possible payload shapes.
function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return (
    payload.items ||
    payload.data ||
    payload.results ||
    payload.obituaries ||
    []
  )
}

function extractTotal(payload) {
  if (!payload) {
    return null
  }

  if (typeof payload?.total === 'number') {
    return payload.total
  }

  if (typeof payload?.meta?.total === 'number') {
    return payload.meta.total
  }

  if (typeof payload?.pagination?.total === 'number') {
    return payload.pagination.total
  }

  return null
}

function getDisplayName(item) {
  const name = String(item?.full_name || item?.name || '').trim()
  return name || 'Unnamed'
}

function getLifespanLabel(item) {
  const birthYear = formatYear(item?.date_of_birth || item?.birth_date)
  const deathYear = formatYear(item?.date_of_death || item?.death_date)

  if (!birthYear && !deathYear) {
    return null
  }

  return `${birthYear || 'Unknown'} - ${deathYear || 'Present'}`
}

function getImagePath(item) {
  const deceasedCandidate =
    item?.deceased_photo_url ||
    item?.deceasedPhotoUrl ||
    item?.portrait_photo_url ||
    item?.portraitPhotoUrl ||
    item?.photo_url ||
    item?.photoUrl ||
    null

  if (
    typeof deceasedCandidate === 'string' &&
    /^[^/\\]+\.[a-z0-9]{2,6}$/i.test(deceasedCandidate.trim())
  ) {
    return null
  }

  return deceasedCandidate || null
}

function getItemKey(item) {
  return item?.id || item?.slug || getDisplayName(item)
}

function dedupeItems(items) {
  const seen = new Set()
  const uniqueItems = []

  for (const item of items) {
    const key = getItemKey(item)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    uniqueItems.push(item)
  }

  return uniqueItems
}

function buildSharePayload(item, url) {
  const description = item?.summary || item?.biography || ''
  const snippet = description.slice(0, 160)
  return {
    title: getDisplayName(item),
    text: snippet || `Remembering ${getDisplayName(item)}`,
    url,
  }
}

function ShareMenu({ url, title, text }) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text || title)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
      <div className="space-y-1">
        <a
          href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center rounded-lg border border-transparent px-3 text-xs font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
        >
          WhatsApp
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center rounded-lg border border-transparent px-3 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center rounded-lg border border-transparent px-3 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-900 hover:text-white"
        >
          X
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-9 w-full items-center rounded-lg border border-transparent px-3 text-left text-xs font-medium text-gray-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

function MetaDetail({ icon, label, value, toneClasses }) {
  if (!value) {
    return null
  }

  return (
    <div className="flex min-w-[12rem] items-center">
      <span
        className={`mr-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClasses}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
          {label}
        </p>
        <p className="truncate text-sm text-gray-700 sm:text-base">{value}</p>
      </div>
    </div>
  )
}

function ObituaryCard({ item }) {
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef(null)

  const itemName = getDisplayName(item)
  const thumbnail = getImagePath(item)
  const lifespan = getLifespanLabel(item)
  const funeralDate = formatLongDate(item?.funeral_date || item?.funeral_start_at)
  const age = computeAge(
    item?.age,
    item?.date_of_birth || item?.birth_date,
    item?.date_of_death || item?.death_date,
  )
  const ageLabel = age !== null ? String(age) : null

  const canViewDetails = Boolean(item?.slug)
  const detailsPath = canViewDetails ? `/obituary/${item.slug}` : '/obituaries'
  const shareUrl = new URL(detailsPath, window.location.origin).toString()
  const sharePayload = buildSharePayload(item, shareUrl)

  useEffect(() => {
    if (!shareOpen) {
      return undefined
    }

    const handleOutsideClick = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShareOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShareOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [shareOpen])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(sharePayload)
        setShareOpen(false)
        return
      } catch {
        setShareOpen((current) => !current)
        return
      }
    }

    setShareOpen((current) => !current)
  }

  return (
    <li>
      <article className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition hover:shadow-[0_16px_28px_rgba(15,23,42,0.08)] sm:p-6 md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
          <div className="relative h-56 w-full overflow-hidden rounded-2xl sm:h-auto sm:w-48 md:w-56">
            <ImageWithFallback
              src={thumbnail ? resolveAssetUrl(thumbnail) : null}
              alt={itemName}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              fallbackText={itemName}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="space-y-2.5">
              <h2 className="text-xl font-semibold leading-tight text-gray-900 sm:text-2xl">
                {itemName}
              </h2>
              {lifespan ? (
                <p className="text-base font-medium tracking-wide text-gray-600">
                  {lifespan}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 pt-1">
                <MetaDetail
                  icon={<PersonIcon className="h-[18px] w-[18px]" />}
                  label="Age"
                  value={ageLabel}
                  toneClasses="bg-blue-50 text-blue-600"
                />
                <MetaDetail
                  icon={<CalendarIcon className="h-[18px] w-[18px]" />}
                  label="FUNERAL SERVICE"
                  value={funeralDate}
                  toneClasses="bg-amber-50 text-amber-600"
                />
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  as={Link}
                  to={detailsPath}
                  disabled={!canViewDetails}
                  className="h-10 rounded-lg border-transparent bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  View Full Obituary
                </Button>

                <div className="relative" ref={shareRef}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    onClick={handleShare}
                    aria-label={`Share obituary for ${itemName}`}
                    aria-expanded={shareOpen}
                    aria-haspopup="menu"
                  >
                    <ShareIcon className="h-[18px] w-[18px]" />
                  </Button>

                  {shareOpen ? (
                    <ShareMenu
                      url={shareUrl}
                      title={sharePayload.title}
                      text={sharePayload.text}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </li>
  )
}

function EmptyListState({ isSearch, onClearSearch }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <EmptyListIcon />
      </span>
      <h3 className="text-lg font-semibold text-gray-900">
        {isSearch ? 'No matching obituaries' : 'No obituaries available'}
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        {isSearch
          ? 'Try a different name or clear your search to see all obituaries.'
          : 'Please check back later for new memorials.'}
      </p>
      {isSearch ? (
        <div className="mt-5">
          <Button
            variant="ghost"
            className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={onClearSearch}
          >
            Clear search
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ObituaryList() {
  const [allItems, setAllItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadObituaries = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const firstResponse = await getObituaries({ page: 1, limit: API_PAGE_SIZE })
      const firstPayload = firstResponse?.data || firstResponse
      let items = extractItems(firstPayload)
      let total = extractTotal(firstPayload)
      let page = 2
      let previousPageCount = items.length

      while (page <= MAX_FETCH_PAGES) {
        const reachedTotal = typeof total === 'number' && items.length >= total
        const reachedLastPage = total === null && previousPageCount < API_PAGE_SIZE

        if (reachedTotal || reachedLastPage) {
          break
        }

        const nextResponse = await getObituaries({ page, limit: API_PAGE_SIZE })
        const nextPayload = nextResponse?.data || nextResponse
        const nextItems = extractItems(nextPayload)
        const nextTotal = extractTotal(nextPayload)

        if (typeof nextTotal === 'number') {
          total = nextTotal
        }

        if (nextItems.length === 0) {
          break
        }

        items = [...items, ...nextItems]
        previousPageCount = nextItems.length
        page += 1
      }

      setAllItems(dedupeItems(items))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadObituaries()
  }, [loadObituaries])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery],
  )

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return allItems
    }

    return allItems.filter((item) =>
      getDisplayName(item).toLowerCase().includes(normalizedQuery),
    )
  }, [allItems, normalizedQuery])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE)),
    [filteredItems.length],
  )

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages))
  }, [totalPages])

  const visibleItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [currentPage, filteredItems])

  const noData = !loading && !error && allItems.length === 0
  const noMatches = !loading && !error && allItems.length > 0 && filteredItems.length === 0

  return (
    <section className="bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100 py-8 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl border border-gray-200 bg-white px-6 py-10 shadow-sm md:px-8">
            <h1 className="font-serif text-4xl font-semibold text-gray-900 sm:text-5xl">
              Obituaries
            </h1>
            <p className="mt-3 text-base text-gray-600 sm:text-lg">
              Honoring the lives and memories of those who have passed
            </p>
          </header>

           
            <div className="relative max-w-2xl">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <SearchIcon className="h-5 w-5" />
              </span>
              <Input
                id="obituaries-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name..."
                className="h-12 rounded-xl border-gray-200 bg-white pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-0"
              />
            </div>

          <StateGate
            loading={loading}
            error={error}
            isEmpty={noData || noMatches}
            skeleton={<ListSkeleton rows={5} showAvatar />}
            errorFallback={
              <ErrorState
                message={error?.message || 'Unable to load obituaries.'}
                onRetry={loadObituaries}
              />
            }
            empty={
              <EmptyListState
                isSearch={noMatches}
                onClearSearch={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
              />
            }
          >
            <div className="space-y-6">
              <ul className="space-y-6">
                {visibleItems.map((item) => (
                  <ObituaryCard key={getItemKey(item)} item={item} />
                ))}
              </ul>

              {totalPages > 1 ? (
                <div className="space-y-2">
                  <p className="text-center text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={setCurrentPage}
                  />
                </div>
              ) : null}

            </div>
          </StateGate>
        </div>
      </div>
    </section>
  )
}

export default ObituaryList
