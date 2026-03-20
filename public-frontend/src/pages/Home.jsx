// Public homepage blocks are rendered here from GET /api/public/homepage; admin controls blocks via /admin/homepage-sections.
import {
  Suspense,
  createElement,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import {
  getAnnouncementsEvents,
  getCarousel,
  getHomepage,
  getNews,
} from '../api/endpoints.js'
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  ImageWithFallback,
  Skeleton,
} from '../components/ui/index.jsx'
import AnimatedHeroIntro from '../components/motion/AnimatedHeroIntro.jsx'
import SmartLink from '../components/navigation/SmartLink.jsx'
import { resolveAssetUrl } from '../lib/apiBase.js'
import { cn } from '../lib/cn.js'
import { usePublicSettings } from '../layouts/publicSettingsContext.js'
import { schedulePublicRoutePrefetch } from '../routes/routeLoaders.js'

const RevealItem = lazy(() => import('../components/motion/RevealItem.jsx'))
const StaggerGridReveal = lazy(
  () => import('../components/motion/StaggerGridReveal.jsx'),
)
const RichTextRenderer = lazy(() => import('../components/RichTextRenderer.jsx'))

function pickFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())
}

function normalizeFeatured(featured) {
  if (Array.isArray(featured)) {
    return featured
  }

  if (featured && typeof featured === 'object') {
    return Object.entries(featured).map(([key, value]) => ({
      title: key,
      items: value,
    }))
  }

  return []
}

// Extract slide data across possible payload shapes.
function normalizeSlides(payload) {
  if (!payload) {
    return []
  }

  const data = payload?.data || payload

  const arrayCandidates = [
    data,
    data?.items,
    data?.slides,
    data?.heroSlides,
    data?.carouselSlides,
  ]

  for (const candidate of arrayCandidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  if (data && typeof data === 'object') {
    const singleCandidate =
      data?.slide ||
      data?.heroSlide ||
      data?.carouselSlide

    if (singleCandidate && typeof singleCandidate === 'object') {
      return [singleCandidate]
    }

    if (
      data?.title ||
      data?.subtitle ||
      data?.caption ||
      data?.image ||
      data?.image_url
    ) {
      return [data]
    }
  }

  return []
}

// Prefer processed banner variants, falling back through common image sizes.
function selectSlideImages(slide) {
  const images = slide?.images || {}

  const desktop =
    images.desktop ||
    images.large ||
    images.original ||
    slide?.image ||
    slide?.image_url ||
    ''
  const tablet =
    images.tablet ||
    images.medium ||
    images.large ||
    images.original ||
    slide?.image ||
    slide?.image_url ||
    ''
  const mobile =
    images.mobile ||
    images.thumbnail ||
    images.medium ||
    images.large ||
    images.original ||
    slide?.image ||
    slide?.image_url ||
    ''

  return { desktop, tablet, mobile }
}

function selectSectionImage(section) {
  const images = section?.images || {}

  return (
    images.large ||
    images.medium ||
    images.thumbnail ||
    images.original ||
    section?.image ||
    section?.image_url ||
    ''
  )
}

function formatItemLabel(item) {
  if (!item) {
    return ''
  }

  if (typeof item === 'string' || typeof item === 'number') {
    return String(item)
  }

  return (
    item.title ||
    item.name ||
    item.slug ||
    item.id ||
    JSON.stringify(item)
  )
}

function selectItemImage(item) {
  if (!item || typeof item !== 'object') {
    return ''
  }

  const images = item?.images || {}

  return (
    images.medium ||
    images.thumbnail ||
    images.large ||
    images.original ||
    item?.image ||
    item?.image_url ||
    item?.thumbnail ||
    item?.thumbnail_url ||
    ''
  )
}

function splitParagraphs(value) {
  if (!value || typeof value !== 'string') {
    return []
  }

  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function stripHtml(value) {
  if (!value || typeof value !== 'string') {
    return ''
  }

  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncateText(value, maxLength = 150) {
  if (!value) {
    return ''
  }

  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trimEnd()}...`
}

function getHallOfFameStoryText(item) {
  const rawStory =
    item?.body ||
    item?.bio ||
    item?.achievements ||
    item?.excerpt ||
    ''
  const story = truncateText(stripHtml(rawStory), 165)
  return story
}

const BLOCK_VARIANT_CLASSES = {
  default: 'bg-transparent',
  muted: 'bg-muted/50',
  accent: 'bg-accent/70',
  image_bg: 'bg-muted/40',
}

const CONTAINER_WIDTH_CLASSES = {
  standard: 'mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10',
  wide: 'mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10',
  full_bleed: 'w-full px-4 sm:px-6 lg:px-10',
}

const GATEWAY_GRID_MOBILE = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

const GATEWAY_GRID_TABLET = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

const GATEWAY_GRID_DESKTOP = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

const DEFAULT_SECTION_PADDING = 'py-12 md:py-16 lg:py-24'
const CAROUSEL_AUTOPLAY_MS = 5500
const SWIPE_OFFSET_THRESHOLD = 72
const SWIPE_VELOCITY_THRESHOLD = 520

function Section({
  as = 'section',
  children,
  className,
  containerClassName,
  fullBleed = false,
  themeVariant = 'default',
  backgroundClassName,
  paddingClassName,
}) {
  const sectionClasses = cn(
    paddingClassName || DEFAULT_SECTION_PADDING,
    BLOCK_VARIANT_CLASSES[themeVariant] || BLOCK_VARIANT_CLASSES.default,
    backgroundClassName,
    className,
  )
  const resolvedContainerClass = cn(
    fullBleed ? '' : CONTAINER_WIDTH_CLASSES.standard,
    containerClassName,
  )

  return createElement(
    as,
    { className: sectionClasses },
    <div className={resolvedContainerClass}>{children}</div>,
  )
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString()
}

function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return payload.items || payload.data || payload.results || payload.news || []
}

function selectFlyerImage(item) {
  if (!item || typeof item !== 'object') {
    return ''
  }

  return (
    item?.flyer_image_path ||
    item?.flyerImagePath ||
    item?.flyer_image ||
    item?.flyer ||
    ''
  )
}

function normalizeEventState(event) {
  const state = event?.state
  if (state) {
    return String(state).toUpperCase()
  }

  if (!event?.event_date) {
    return 'COMING_SOON'
  }

  const today = new Date()
  const eventDate = new Date(event.event_date)
  if (Number.isNaN(eventDate.getTime())) {
    return 'COMING_SOON'
  }

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const eventStart = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  )

  return eventStart.getTime() >= todayStart.getTime() ? 'UPCOMING' : 'PAST'
}

function sortEventsByDate(events = [], direction = 'asc') {
  const multiplier = direction === 'desc' ? -1 : 1
  return [...events].sort((a, b) => {
    const aDate = a?.event_date ? new Date(a.event_date) : null
    const bDate = b?.event_date ? new Date(b.event_date) : null
    const aTime = aDate && !Number.isNaN(aDate.getTime()) ? aDate.getTime() : 0
    const bTime = bDate && !Number.isNaN(bDate.getTime()) ? bDate.getTime() : 0
    return (aTime - bTime) * multiplier
  })
}

function selectHighlightEvents(payload) {
  if (!payload) {
    return []
  }

  let upcoming = []
  let comingSoon = []
  let past = []

  if (Array.isArray(payload)) {
    payload.forEach((event) => {
      const state = normalizeEventState(event)
      if (state === 'UPCOMING') {
        upcoming.push(event)
      } else if (state === 'PAST') {
        past.push(event)
      } else {
        comingSoon.push(event)
      }
    })
  } else {
    upcoming = Array.isArray(payload.upcoming) ? payload.upcoming : []
    comingSoon = Array.isArray(payload.comingSoon) ? payload.comingSoon : []
    past = Array.isArray(payload.past) ? payload.past : []
  }

  const sortedUpcoming = sortEventsByDate(upcoming, 'asc')
  const sortedComingSoon = [...comingSoon].sort((a, b) => {
    const aDate = a?.created_at ? new Date(a.created_at) : null
    const bDate = b?.created_at ? new Date(b.created_at) : null
    const aTime = aDate && !Number.isNaN(aDate.getTime()) ? aDate.getTime() : 0
    const bTime = bDate && !Number.isNaN(bDate.getTime()) ? bDate.getTime() : 0
    return bTime - aTime
  })
  const sortedPast = sortEventsByDate(past, 'desc')

  return [...sortedUpcoming, ...sortedComingSoon, ...sortedPast].slice(0, 3)
}

function getEventBadgeLabel(event) {
  const state = normalizeEventState(event)
  if (state === 'PAST') {
    return 'Past'
  }
  if (state === 'COMING_SOON') {
    return 'Coming Soon'
  }
  return 'Upcoming'
}

function getEventMetaLabel(event) {
  const state = normalizeEventState(event)
  if (state === 'COMING_SOON') {
    return 'Coming Soon'
  }

  const dateLabel = formatDate(event?.event_date)
  return dateLabel || 'Coming Soon'
}

function CategoryIcon({ type, className }) {
  if (type === 'events') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8ZM6 6v2h12V6H6Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'announcements') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M3 10v4a1 1 0 0 0 1 1h2l3 5h2l-1-5h4l5 3V6l-5 3H4a1 1 0 0 0-1 1Zm13 4h-5V10h5v4Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 3v2h10V7H7Zm0 4v2h10v-2H7Zm0 4v2h6v-2H7Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CategoryPlaceholder({ type, className, label }) {
  const background =
    type === 'events'
      ? 'bg-[#F3EFE8]'
      : type === 'announcements'
        ? 'bg-[#F7F1E8]'
        : 'bg-muted/40'

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-[12px] text-muted-foreground',
        background,
        className,
      )}
    >
      <CategoryIcon type={type} className="h-6 w-6" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

function resolveGatewayIcon(item) {
  if (!item) {
    return '➜'
  }

  const key = item.icon_key || item.iconKey || ''
  const normalized = String(key).toLowerCase()
  const mapping = {
    history: '🏛️',
    clans: '🧬',
    clan: '🧬',
    asafo: '🛡️',
    obituaries: '🕊️',
    hall_of_fame: '🏆',
    hall: '🏆',
    landmarks: '📍',
    news: '📰',
    updates: '📰',
    announcements: '📣',
    events: '📅',
  }

  return mapping[normalized] || item.badge || '➜'
}

const DEFAULT_WHO_WE_ARE_STATS = [
  { icon_key: 'users', label: 'Population', value: '50,000+' },
  { icon_key: 'heart', label: 'Clans', value: '12' },
  { icon_key: 'award', label: 'Asafo Companies', value: '7' },
  { icon_key: 'trending_up', label: 'Years of History', value: '300+' },
]

const DEFAULT_WHO_WE_ARE_GALLERY = [
  { image_id: '', alt_text: 'Kente Cloth Ceremony' },
  { image_id: '', alt_text: 'Historical Monument' },
  { image_id: '', alt_text: 'Elder Wisdom' },
  { image_id: '', alt_text: 'Traditional Festival' },
]

function normalizeWhoWeAreStats(rawStats) {
  const source =
    Array.isArray(rawStats) && rawStats.length > 0
      ? rawStats
      : DEFAULT_WHO_WE_ARE_STATS

  return DEFAULT_WHO_WE_ARE_STATS.map((fallback, index) => {
    const item = source[index] || {}
    return {
      icon_key: String(item?.icon_key || fallback.icon_key).trim().toLowerCase(),
      label: item?.label || fallback.label,
      value: item?.value || fallback.value,
    }
  })
}

function normalizeWhoWeAreGallery(rawGallery) {
  const source =
    Array.isArray(rawGallery) && rawGallery.length > 0
      ? rawGallery
      : DEFAULT_WHO_WE_ARE_GALLERY

  return DEFAULT_WHO_WE_ARE_GALLERY.map((fallback, index) => {
    const item = source[index] || {}
    return {
      image_id:
        item?.image_id ||
        item?.imageId ||
        item?.image_url ||
        item?.imageUrl ||
        item?.url ||
        item?.src ||
        fallback.image_id,
      alt_text: item?.alt_text || item?.altText || item?.alt || fallback.alt_text,
    }
  })
}

function WhoWeAreStatIcon({ iconKey, className }) {
  if (iconKey === 'heart') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M20.8 6.5a5 5 0 0 0-7.1 0L12 8.2l-1.7-1.7a5 5 0 1 0-7.1 7.1l1.7 1.7L12 22l7.1-6.7 1.7-1.7a5 5 0 0 0 0-7.1Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (iconKey === 'award') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="m9.5 13.5-2 7L12 18l4.5 2.5-2-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (iconKey === 'trending_up') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M3 17 10 10l4 4 7-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 7h7v7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M15 21v-6a3 3 0 0 0-6 0v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 21v-3a3 3 0 0 1 3-3M19 21v-3a3 3 0 0 0-3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Home() {
  const [homepage, setHomepage] = useState(null)
  const [slides, setSlides] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState(1)
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false)
  const [carouselLoading, setCarouselLoading] = useState(true)
  const [carouselError, setCarouselError] = useState(null)
  const [highlightNews, setHighlightNews] = useState([])
  const [highlightEvents, setHighlightEvents] = useState([])
  const [highlightAnnouncements, setHighlightAnnouncements] = useState([])
  const [highlightLoading, setHighlightLoading] = useState(true)
  const [highlightError, setHighlightError] = useState(null)
  const [error, setError] = useState(null)
  const reduceMotion = useReducedMotion()
  const { settings } = usePublicSettings()

  useEffect(() => {
    let isMounted = true

    const loadHomepage = async () => {
      setError(null)
      setCarouselLoading(true)
      setCarouselError(null)

      const [homepageResult, carouselResult] = await Promise.allSettled([
        getHomepage(),
        getCarousel(),
      ])

      if (!isMounted) {
        return
      }

      if (homepageResult.status === 'fulfilled') {
        setHomepage(homepageResult.value?.data ?? homepageResult.value)
      } else {
        setError(homepageResult.reason)
      }

      if (carouselResult.status === 'fulfilled') {
        setSlides(normalizeSlides(carouselResult.value))
      } else {
        setCarouselError(carouselResult.reason)
      }

      setCarouselLoading(false)
    }

    loadHomepage()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    schedulePublicRoutePrefetch([
      '/news',
      '/announcements-events',
      '/about/who-we-are',
      '/contact',
    ])
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadHighlights = async () => {
      setHighlightLoading(true)
      setHighlightError(null)

      const [newsResult, announcementsEventsResult] = await Promise.allSettled([
        getNews({ page: 1, limit: 3 }),
        getAnnouncementsEvents({
          announcements_limit: 3,
          coming_soon_limit: 3,
          upcoming_limit: 3,
          past_limit: 3,
        }),
      ])

      if (!isMounted) {
        return
      }

      if (newsResult.status === 'fulfilled') {
        const payload = newsResult.value?.data || newsResult.value
        const items = extractItems(payload)
        const publishedItems = items.filter(
          (item) =>
            item?.published !== false &&
            item?.status !== 'draft' &&
            item?.status !== 'unpublished',
        )
        setHighlightNews(publishedItems.slice(0, 3))
      } else {
        setHighlightNews([])
      }

      if (announcementsEventsResult.status === 'fulfilled') {
        const payload =
          announcementsEventsResult.value?.data || announcementsEventsResult.value
        const eventsPayload = payload?.events || {}
        const announcementsPayload = payload?.announcements || []

        setHighlightEvents(selectHighlightEvents(eventsPayload))
        setHighlightAnnouncements(
          Array.isArray(announcementsPayload)
            ? announcementsPayload.slice(0, 3)
            : [],
        )
      } else {
        setHighlightEvents([])
        setHighlightAnnouncements([])
      }

      if (
        newsResult.status === 'rejected' &&
        announcementsEventsResult.status === 'rejected'
      ) {
        setHighlightError(newsResult.reason || announcementsEventsResult.reason)
      }

      setHighlightLoading(false)
    }

    loadHighlights()

    return () => {
      isMounted = false
    }
  }, [])

  const slideCount = slides.length
  const safeActiveSlide =
    slideCount > 0 ? ((activeSlide % slideCount) + slideCount) % slideCount : 0

  const goToSlide = useCallback(
    (nextIndex) => {
      if (slideCount === 0) {
        return
      }

      const wrappedIndex = ((nextIndex % slideCount) + slideCount) % slideCount
      const direction =
        wrappedIndex === safeActiveSlide ? slideDirection : wrappedIndex > safeActiveSlide ? 1 : -1

      setSlideDirection(direction)
      setActiveSlide(wrappedIndex)
    },
    [safeActiveSlide, slideCount, slideDirection],
  )

  const goToNextSlide = useCallback(() => {
    if (slideCount < 2) {
      return
    }

    setSlideDirection(1)
    setActiveSlide((prev) => (prev + 1) % slideCount)
  }, [slideCount])

  const goToPreviousSlide = useCallback(() => {
    if (slideCount < 2) {
      return
    }

    setSlideDirection(-1)
    setActiveSlide((prev) => (prev - 1 + slideCount) % slideCount)
  }, [slideCount])

  useEffect(() => {
    if (slideCount < 2 || reduceMotion || isAutoplayPaused) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setSlideDirection(1)
      setActiveSlide((prev) => (prev + 1) % slideCount)
    }, CAROUSEL_AUTOPLAY_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [slideCount, reduceMotion, isAutoplayPaused])

  const hero = homepage?.hero || homepage?.heroSection || {}
  const heroTitle = pickFirstString(
    hero.title,
    homepage?.heroTitle,
    homepage?.title,
  )
  const heroSubtitle = pickFirstString(
    hero.subtitle,
    hero.tagline,
    homepage?.heroSubtitle,
    homepage?.subtitle,
  )
  const heroCtaText = pickFirstString(
    hero.ctaText,
    hero.cta?.text,
    homepage?.ctaText,
    homepage?.cta?.text,
  )
  const heroCtaLink = pickFirstString(
    hero.ctaLink,
    hero.cta?.link,
    homepage?.ctaLink,
    homepage?.cta?.link,
  )

  const sections = useMemo(() => {
    const rawSections =
      homepage?.sections ||
      homepage?.homepageSections ||
      homepage?.contentSections ||
      []

    return Array.isArray(rawSections) ? rawSections : []
  }, [homepage])

  const blocks = useMemo(() => {
    const rawBlocks = homepage?.blocks || homepage?.homepageBlocks || []
    return Array.isArray(rawBlocks) ? rawBlocks : []
  }, [homepage])

  const featuredBlocks = useMemo(() => {
    const featured =
      homepage?.featured ||
      homepage?.featuredBlocks ||
      homepage?.featuredContent ||
      homepage?.featuredSections
    return normalizeFeatured(featured)
  }, [homepage])

  const activeSlideData = slides[safeActiveSlide]
  const activeSlideKey =
    activeSlideData?.id ||
    activeSlideData?.slug ||
    activeSlideData?.image ||
    activeSlideData?.image_url ||
    safeActiveSlide
  const slideTitle = pickFirstString(
    activeSlideData?.title,
    activeSlideData?.name,
  )
  const slideSubtitle = pickFirstString(
    activeSlideData?.subtitle,
    activeSlideData?.caption,
  )
  const slideCtaText = pickFirstString(
    activeSlideData?.cta_text,
    activeSlideData?.ctaText,
  )
  const slideCtaUrl = pickFirstString(
    activeSlideData?.cta_url,
    activeSlideData?.ctaUrl,
  )
  const slideSecondaryCtaText = pickFirstString(
    activeSlideData?.secondary_cta_text,
    activeSlideData?.secondaryCtaText,
  )
  const slideSecondaryCtaUrl = pickFirstString(
    activeSlideData?.secondary_cta_url,
    activeSlideData?.secondaryCtaUrl,
  )
  const slideImages = selectSlideImages(activeSlideData)
  const primarySlideImage =
    slideImages.desktop || slideImages.tablet || slideImages.mobile
  const slideImageUrl = primarySlideImage ? resolveAssetUrl(primarySlideImage) : ''
  const slideSrcSet = [
    slideImages.mobile ? `${resolveAssetUrl(slideImages.mobile)} 768w` : null,
    slideImages.tablet ? `${resolveAssetUrl(slideImages.tablet)} 1280w` : null,
    slideImages.desktop ? `${resolveAssetUrl(slideImages.desktop)} 1920w` : null,
  ]
    .filter(Boolean)
    .join(', ')
  const slideTransition = reduceMotion
    ? { duration: 0.2, ease: 'easeOut' }
    : { duration: 0.45, ease: 'easeInOut' }

  const showHero =
    heroTitle ||
    heroSubtitle ||
    (heroCtaText && heroCtaLink) ||
    settings?.siteName

  if (error) {
    return (
      <section className="container space-y-3 py-6 md:py-10">
        <p className="text-sm text-muted-foreground">
          Unable to load homepage data.
        </p>
        <pre className="text-sm text-muted-foreground">
          {error?.message || String(error)}
        </pre>
      </section>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <Section
        paddingClassName="pt-0 pb-12 md:pb-16 lg:pb-20"
        containerClassName="w-full"
        fullBleed
      >
        {carouselLoading ? (
          <div className="overflow-hidden rounded-none bg-surface shadow-sm">
            <div className="flex h-[65vh] flex-col justify-end p-6 md:h-[75vh] md:p-10 lg:h-[90vh]">
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3 bg-muted/70" />
                <Skeleton className="h-4 w-1/2 bg-muted/70" />
                <Skeleton className="h-11 w-36 bg-muted/70" />
              </div>
            </div>
          </div>
        ) : slides.length === 0 ? (
          <div className="rounded-none border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-sm text-muted-foreground">
            No slides available.
          </div>
        ) : (
          <article
            className="group/carousel relative h-[65vh] overflow-hidden rounded-none bg-surface shadow-xl shadow-black/10 md:h-[75vh] lg:h-[90vh]"
            role="region"
            aria-roledescription="carousel"
            aria-label="Homepage hero carousel"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                goToNextSlide()
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                goToPreviousSlide()
              }
            }}
          >
            <AnimatePresence initial={false} mode="wait">
              <Motion.div
                key={activeSlideKey}
                className="absolute inset-0"
                initial={{
                  opacity: 0,
                  scale: reduceMotion ? 1 : 1.015,
                }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: reduceMotion ? 1 : 0.985,
                }}
                transition={slideTransition}
                drag={slideCount > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  const offsetX = info?.offset?.x || 0
                  const velocityX = info?.velocity?.x || 0

                  if (
                    offsetX <= -SWIPE_OFFSET_THRESHOLD ||
                    velocityX <= -SWIPE_VELOCITY_THRESHOLD
                  ) {
                    goToNextSlide()
                    return
                  }

                  if (
                    offsetX >= SWIPE_OFFSET_THRESHOLD ||
                    velocityX >= SWIPE_VELOCITY_THRESHOLD
                  ) {
                    goToPreviousSlide()
                    return
                  }
                }}
                onClick={(event) => {
                  const isInteractiveTarget = event.target.closest(
                    'a, button, [role="button"], [data-carousel-control="true"]',
                  )

                  if (!isInteractiveTarget && slideCount > 1 && !reduceMotion) {
                    setIsAutoplayPaused((prev) => !prev)
                  }
                }}
                style={{ touchAction: 'pan-y' }}
              >
                <ImageWithFallback
                  src={slideImageUrl}
                  alt={slideTitle || 'Carousel slide'}
                  fallbackText="No image"
                  srcSet={slideSrcSet || undefined}
                  sizes="(max-width: 768px) 768px, (max-width: 1024px) 1280px, 1920px"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/45 to-black/20" />
                <div className="absolute inset-0 flex items-end">
                  <AnimatedHeroIntro
                    className="max-w-full space-y-4 px-6 pt-6 pb-20 text-white md:max-w-[60%] md:p-10"
                    entry="left"
                    visualEntry="up"
                    headline={
                      slideTitle ? (
                        <h1 className="text-4xl font-bold leading-tight break-words md:text-5xl lg:text-[56px]">
                          {slideTitle}
                        </h1>
                      ) : null
                    }
                    subtext={
                      slideSubtitle ? (
                        <p className="text-base text-white/90 md:text-lg">{slideSubtitle}</p>
                      ) : null
                    }
                    actions={
                      slideCtaText && slideCtaUrl ? (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            as={SmartLink}
                            href={slideCtaUrl}
                            variant="primary"
                            className="h-12 rounded-full px-6 text-base shadow-lg shadow-black/25 transition hover:bg-[#B45309]"
                          >
                            {slideCtaText}
                          </Button>
                          {slideSecondaryCtaText && slideSecondaryCtaUrl ? (
                            <Button
                              as={SmartLink}
                              href={slideSecondaryCtaUrl}
                              variant="ghost"
                              className="h-12 rounded-full border border-white/55 bg-white/8 px-6 text-base text-white backdrop-blur-sm transition hover:bg-white/20"
                            >
                              {slideSecondaryCtaText}
                            </Button>
                          ) : null}
                        </div>
                      ) : null
                    }
                    visual={
                      <div
                        aria-hidden="true"
                        className="h-1.5 w-20 rounded-full bg-white/55 shadow-[0_0_18px_rgba(255,255,255,0.2)]"
                      />
                    }
                  />
                </div>
              </Motion.div>
            </AnimatePresence>

            <p className="sr-only" aria-live="polite" aria-atomic="true">
              Slide {safeActiveSlide + 1} of {slideCount}
              {slideTitle ? `: ${slideTitle}` : ''}
            </p>

            {slideCount > 1 ? (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden items-center pl-3 opacity-0 transition-opacity duration-300 md:flex md:group-hover/carousel:opacity-100 md:focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={goToPreviousSlide}
                    data-carousel-control="true"
                    className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white backdrop-blur-sm transition-[background-color,transform] duration-200 ease-out hover:-translate-y-[1px] hover:bg-black/40 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                    aria-label="Previous slide"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                      <path
                        d="m15 5-7 7 7 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden items-center pr-3 opacity-0 transition-opacity duration-300 md:flex md:group-hover/carousel:opacity-100 md:focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={goToNextSlide}
                    data-carousel-control="true"
                    className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white backdrop-blur-sm transition-[background-color,transform] duration-200 ease-out hover:-translate-y-[1px] hover:bg-black/40 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                    aria-label="Next slide"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                      <path
                        d="m9 5 7 7-7 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 px-3 md:bottom-4 md:px-5 lg:bottom-5">
              <nav
                aria-label="Carousel slide indicators"
                className="mx-auto flex w-fit items-center justify-center"
              >
                <div className="pointer-events-auto flex items-center gap-1">
                  {slides.map((slide, index) => (
                    <button
                      key={slide?.id || slide?.slug || index}
                      type="button"
                      onClick={() => goToSlide(index)}
                      data-carousel-control="true"
                      className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 md:h-8 md:w-8"
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === safeActiveSlide ? 'true' : undefined}
                    >
                      <span
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-300',
                          index === safeActiveSlide
                            ? 'w-6 bg-white/95'
                            : 'w-4 bg-white/45 hover:bg-white/65',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </nav>
            </div>

          </article>
        )}
        {carouselError && (
          <ErrorState
            className="mt-4"
            title="Slides are unavailable"
            message="Slides are unavailable right now, but the homepage is loaded."
          />
        )}
      </Section>

      <Suspense
        fallback={
          <Section paddingClassName="py-10 md:py-12 lg:py-16">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
          </Section>
        }
      >
        {showHero && (
          <Section paddingClassName="py-10 md:py-12 lg:py-16">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl space-y-2">
                {heroTitle && (
                  <h2 className="text-3xl font-semibold leading-snug break-words md:text-4xl">
                    {heroTitle}
                  </h2>
                )}
                {heroSubtitle && (
                  <p className="text-base text-muted-foreground md:text-lg">
                    {heroSubtitle}
                  </p>
                )}
              </div>
              {heroCtaText && heroCtaLink && (
                <Button
                  as={SmartLink}
                  href={heroCtaLink}
                  variant="ghost"
                  className="h-11 rounded-full border border-primary/20 px-5 text-primary transition hover:bg-[#FDEAD2]"
                >
                  {heroCtaText}
                </Button>
              )}
            </div>
            {settings?.siteName && (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Site:</span>{' '}
                {settings.siteName}
              </p>
            )}
          </Section>
        )}

        {blocks.length > 0 && (
          <div className="space-y-0">
            {blocks.map((block) => {
            const themeVariant = block.theme_variant || 'default'
            const containerClass =
              CONTAINER_WIDTH_CLASSES[block.container_width] ||
              CONTAINER_WIDTH_CLASSES.standard
            const isFullBleed = block.container_width === 'full_bleed'

            const sectionTitle = pickFirstString(block.title, '')
            const sectionSubtitle = pickFirstString(block.subtitle, '')
            const sectionBody = pickFirstString(block.body, '')
            const ctaLabel = pickFirstString(block.cta_label, '')
            const ctaHref = pickFirstString(block.cta_href, '')

            if (block.block_type === 'welcome') {
              const imageUrl = block.media_image_id
                ? resolveAssetUrl(block.media_image_id)
                : ''
              const hasImage = Boolean(imageUrl) && block.layout_variant !== 'text_only'
              const imagePositionClass =
                block.layout_variant === 'image_right'
                  ? 'lg:flex-row'
                  : 'lg:flex-row-reverse'
              const paragraphs = splitParagraphs(sectionBody)
              const messageLabel = sectionSubtitle || 'Message from Leadership'
              const messageTitle = sectionTitle || 'A Vision for Our Future'
              const leaderName = ctaLabel || 'Nana Kwame Asante'
              const leaderRole = ctaHref || 'Paramount Chief of Nyakrom'

              return (
                <Section
                  key={block.id}
                  themeVariant={themeVariant}
                  backgroundClassName="bg-[#F2EFE4]"
                  containerClassName={containerClass}
                  fullBleed={isFullBleed}
                >
                  <div
                    className={`flex flex-col gap-8 ${imagePositionClass} ${
                      hasImage ? 'lg:items-start' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E7DAB2] px-4 py-2 text-sm font-medium text-[#B45309]">
                        <span aria-hidden="true">&quot;</span>
                        <span>{messageLabel}</span>
                        <span aria-hidden="true">&quot;</span>
                      </span>
                      <h2 className="text-3xl font-semibold leading-tight break-words text-foreground md:text-5xl">
                        {messageTitle}
                      </h2>
                      <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-[1.05rem]">
                        {paragraphs.length > 0 ? (
                          paragraphs.map((paragraph, index) => (
                            <p key={`${block.id}-paragraph-${index}`}>{paragraph}</p>
                          ))
                        ) : (
                          <p>
                            {sectionBody ||
                              'Share your leadership message for the Nyakrom community here.'}
                          </p>
                        )}
                      </div>
                      <div className="pt-2">
                        <div className="mb-4 h-px bg-[#DDC88A]" />
                        <p className="text-2xl font-medium text-foreground">{leaderName}</p>
                        <p className="text-lg text-[#B45309]">{leaderRole}</p>
                      </div>
                    </div>
                    {hasImage && (
                      <div className="flex-1">
                        <div className="aspect-[5/4] w-full overflow-hidden rounded-[20px] bg-surface shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
                          <ImageWithFallback
                            src={imageUrl}
                            alt={block.media_alt_text || 'Welcome image'}
                            fallbackText="No image"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )
            }

            if (block.block_type === 'editorial_feature') {
              const imageUrl = block.media_image_id
                ? resolveAssetUrl(block.media_image_id)
                : ''
              const hasImage = Boolean(imageUrl) && block.layout_variant !== 'text_only'
              const imagePositionClass =
                block.layout_variant === 'image_left'
                  ? 'lg:flex-row-reverse'
                  : 'lg:flex-row'

              return (
                <Section
                  key={block.id}
                  themeVariant={themeVariant}
                  backgroundClassName="bg-[#FDEAD2]"
                  containerClassName={containerClass}
                  fullBleed={isFullBleed}
                >
                  <div
                    className={`flex flex-col gap-10 ${imagePositionClass} ${
                      hasImage ? 'lg:items-center' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-primary/80">
                        <span className="h-px w-10 bg-primary/70" />
                        <span>Editorial Feature</span>
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-3xl font-semibold leading-snug break-words md:text-4xl">
                          {sectionTitle || 'Editorial Feature'}
                        </h2>
                        {sectionSubtitle && (
                          <p className="text-base text-muted-foreground md:text-lg">
                            {sectionSubtitle}
                          </p>
                        )}
                      </div>
                      {sectionBody && (
                        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                          {sectionBody}
                        </p>
                      )}
                      {ctaLabel && ctaHref && (
                        <Button
                          as={SmartLink}
                          href={ctaHref}
                          variant="primary"
                          className="h-12 rounded-full px-6 text-base shadow-sm transition hover:bg-[#B45309] hover:shadow-lg"
                        >
                          {ctaLabel}
                        </Button>
                      )}
                    </div>
                    {hasImage && (
                      <div className="flex-1">
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-[18px] border border-border/70 bg-surface shadow-md">
                          <ImageWithFallback
                            src={imageUrl}
                            alt={block.media_alt_text || sectionTitle || 'Editorial image'}
                            fallbackText="No image"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )
            }

            if (block.block_type === 'who_we_are') {
              const primaryCtaLabel = ctaLabel || 'Learn More About Us'
              const primaryCtaHref = ctaHref || '/about/who-we-are'
              const paragraphOne = pickFirstString(
                block.who_we_are_paragraph_one,
                sectionBody,
                '',
              )
              const stats = normalizeWhoWeAreStats(block.who_we_are_stats)
              const gallery = normalizeWhoWeAreGallery(block.who_we_are_gallery)

              return (
                <Section
                  key={block.id}
                  themeVariant={themeVariant}
                  backgroundClassName="bg-white"
                  containerClassName={containerClass}
                  fullBleed={isFullBleed}
                  paddingClassName="py-20"
                >
                  <div className="mb-16 text-center">
                    <h2 className="text-4xl font-medium text-foreground">
                      {sectionTitle || 'Who We Are'}
                    </h2>
                    <p className="mx-auto mt-4 max-w-3xl text-xl text-muted-foreground">
                      {sectionSubtitle ||
                        'A vibrant community rooted in tradition, united in purpose, and committed to excellence'}
                    </p>
                  </div>

                  <div className="mb-16 grid grid-cols-2 gap-8 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                      <div key={`${block.id}-stat-${index}`} className="text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3C7]">
                          <WhoWeAreStatIcon
                            iconKey={stat.icon_key}
                            className="h-8 w-8 text-[#D97706]"
                          />
                        </div>
                        <p className="mb-2 text-3xl font-medium text-[#D97706]">
                          {stat.value}
                        </p>
                        <p className="text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                    <div className="space-y-6">
                      <div className="text-muted-foreground [&_.rich-text-content]:text-lg [&_.rich-text-content]:leading-relaxed">
                        <RichTextRenderer html={paragraphOne} />
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <SmartLink
                          href={primaryCtaHref}
                          className="rounded-md bg-[#D97706] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#B45309]"
                        >
                          {primaryCtaLabel}
                        </SmartLink>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        {[gallery[0], gallery[1]].map((item, index) => {
                          const imageUrl = item?.image_id
                            ? resolveAssetUrl(item.image_id)
                            : ''
                          const aspectClass = index === 0 ? 'aspect-square' : 'aspect-[4/3]'
                          return (
                            <div
                              key={`${block.id}-gallery-left-${index}`}
                              className={`${aspectClass} overflow-hidden rounded-lg bg-muted/30`}
                            >
                              {imageUrl ? (
                                <ImageWithFallback
                                  src={imageUrl}
                                  alt={item?.alt_text || `Who We Are image ${index + 1}`}
                                  fallbackText="No image"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="space-y-4 pt-8">
                        {[gallery[2], gallery[3]].map((item, index) => {
                          const imageUrl = item?.image_id
                            ? resolveAssetUrl(item.image_id)
                            : ''
                          const aspectClass = index === 0 ? 'aspect-[4/3]' : 'aspect-square'
                          return (
                            <div
                              key={`${block.id}-gallery-right-${index}`}
                              className={`${aspectClass} overflow-hidden rounded-lg bg-muted/30`}
                            >
                              {imageUrl ? (
                                <ImageWithFallback
                                  src={imageUrl}
                                  alt={item?.alt_text || `Who We Are image ${index + 3}`}
                                  fallbackText="No image"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Section>
              )
            }

            if (block.block_type === 'hall_of_fame_spotlight') {
              const items = Array.isArray(block.hof_items) ? block.hof_items : []
              const showCta = block.hof_show_cta !== false
              const ctaText = block.hof_cta_label || 'View All Members'
              const ctaLink = block.hof_cta_href || '/hall-of-fame'

              return (
                <Section
                  key={block.id}
                  themeVariant={themeVariant}
                  backgroundClassName="bg-gradient-to-b from-white to-[#FFF6EB]"
                  containerClassName={containerClass}
                  fullBleed={isFullBleed}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl space-y-3">
                      <h2 className="text-4xl font-semibold leading-tight break-words md:text-5xl">
                        {sectionTitle || 'Hall of Fame Spotlight'}
                      </h2>
                      <p className="text-base text-muted-foreground md:text-lg">
                        {sectionSubtitle ||
                          'Celebrating the extraordinary individuals who have shaped our community through dedication, service, and achievement.'}
                      </p>
                    </div>
                    {showCta && (
                      <SmartLink
                        href={ctaLink}
                        className="hidden h-12 items-center gap-2 self-start rounded-md bg-[#D97706] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#B45309] md:inline-flex"
                      >
                        <span>{ctaText}</span>
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="h-5 w-5"
                        >
                          <path
                            d="m13 5 7 7-7 7M4 12h16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </SmartLink>
                    )}
                  </div>

                  <StaggerGridReveal className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    {items.map((item, index) => {
                      const imagePath = selectItemImage(item)
                      const imageUrl = imagePath ? resolveAssetUrl(imagePath) : ''
                      const memberName = item?.name || item?.title || 'Honoree'
                      const memberRole = item?.title || ''
                      const memberStory = getHallOfFameStoryText(item)
                      const href = item?.href || '/hall-of-fame'

                      return (
                        <RevealItem key={item?.id || item?.href || index}>
                          <SmartLink
                            href={href}
                            className="group block h-full rounded-lg border border-border/70 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div className="relative h-80 overflow-hidden rounded-t-lg bg-muted/40">
                              {imageUrl ? (
                                <ImageWithFallback
                                  src={imageUrl}
                                  alt={`${memberName} portrait`}
                                  fallbackText="No image"
                                  className="h-full w-full transform-gpu object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                  No image
                                </div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-70" />

                            </div>

                            <div className="flex min-h-[14rem] flex-col p-6">
                              <h3 className="text-2xl font-semibold text-foreground transition-colors group-hover:text-[#D97706]">
                                {memberName}
                              </h3>
                              {memberRole && (
                                <p className="mt-2 text-sm text-[#B45309]">
                                  {memberRole}
                                </p>
                              )}

                              {memberStory && (
                                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                                  {memberStory}
                                </p>
                              )}

                              <div className="mt-4 border-t border-border/70 pt-4">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#D97706] transition-all group-hover:gap-3">
                                  Read Full Story
                                  <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  >
                                    <path
                                      d="m13 5 7 7-7 7M4 12h16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </SmartLink>
                        </RevealItem>
                      )
                    })}
                  </StaggerGridReveal>

                  {showCta && (
                    <div className="mt-10 text-center md:hidden">
                      <SmartLink
                        href={ctaLink}
                        className="inline-flex h-12 items-center gap-2 rounded-md bg-[#D97706] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#B45309]"
                      >
                        <span>{ctaText}</span>
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="h-5 w-5"
                        >
                          <path
                            d="m13 5 7 7-7 7M4 12h16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </SmartLink>
                    </div>
                  )}
                </Section>
              )
            }

            if (block.block_type === 'news_highlight') {
              const clampTwo = {
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }

              const cards = [
                {
                  key: 'news',
                  title: 'News',
                  type: 'news',
                  items: highlightNews,
                  listHref: '/news',
                  detailBase: '/news',
                },
                {
                  key: 'events',
                  title: 'Events',
                  type: 'events',
                  items: highlightEvents,
                  listHref: '/announcements-events',
                  detailBase: '/events',
                },
                {
                  key: 'announcements',
                  title: 'Announcements',
                  type: 'announcements',
                  items: highlightAnnouncements,
                  listHref: '/announcements-events',
                  detailBase: '/announcements',
                },
              ]

              const resolvedTitle = sectionTitle || 'News Highlights'

              return (
                <Section
                  key={block.id}
                  themeVariant={themeVariant}
                  backgroundClassName="bg-[#D9ECEA]"
                  containerClassName={containerClass}
                  fullBleed={isFullBleed}
                >
                  <div className="mb-8 space-y-2">
                    <h2 className="text-3xl font-semibold leading-snug break-words md:text-4xl">
                      {resolvedTitle}
                    </h2>
                    {sectionSubtitle ? (
                      <p className="text-base text-muted-foreground md:text-lg">
                        {sectionSubtitle}
                      </p>
                    ) : null}
                  </div>

                  <StaggerGridReveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => {
                      const items = Array.isArray(card.items) ? card.items : []
                      const featured = items[0]
                      const compactItems = items.slice(1, 3)
                      const missingCompactCount = Math.max(0, 2 - compactItems.length)

                      return (
                        <RevealItem key={card.key}>
                          <Card className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-border/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDEAD2] text-primary">
                                <CategoryIcon
                                  type={card.type}
                                  className="h-4 w-4"
                                />
                              </span>
                              <h3 className="text-base font-semibold text-foreground">
                                {card.title}
                              </h3>
                            </div>

                            <CardContent className="flex flex-1 flex-col gap-4 px-5 py-4">
                              {highlightLoading && items.length === 0 ? (
                                <div className="space-y-4">
                                  <Skeleton className="aspect-[16/9] w-full rounded-[14px]" />
                                  <Skeleton className="h-4 w-5/6" />
                                  <Skeleton className="h-4 w-4/6" />
                                  <div className="space-y-3">
                                    <Skeleton className="h-14 w-full rounded-md" />
                                    <Skeleton className="h-14 w-full rounded-md" />
                                  </div>
                                </div>
                              ) : items.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                                  <CategoryPlaceholder
                                    type={card.type}
                                    className="h-20 w-20 rounded-full"
                                    label={`No ${card.title} posted yet.`}
                                  />
                                  <p>{`No ${card.title.toLowerCase()} posted yet.`}</p>
                                  {highlightError ? (
                                    <p className="text-xs text-muted-foreground">
                                      Unable to load updates right now.
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <>
                                  <SmartLink
                                    href={
                                      featured?.slug
                                        ? `${card.detailBase}/${featured.slug}`
                                        : card.listHref
                                    }
                                    className="group block"
                                    aria-label={
                                      featured?.excerpt
                                        ? `${featured?.title}: ${featured.excerpt}`
                                        : featured?.title || `View ${card.title}`
                                    }
                                  >
                                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[14px]">
                                      {(() => {
                                        const imagePath =
                                          card.type === 'news'
                                            ? selectItemImage(featured)
                                            : selectFlyerImage(featured)
                                        const imageUrl = imagePath
                                          ? resolveAssetUrl(imagePath)
                                          : ''
                                        const altText =
                                          card.type === 'news'
                                            ? featured?.image_alt_text ||
                                              `${featured?.title || card.title} image`
                                            : featured?.flyer_alt_text ||
                                              `${featured?.title || card.title} flyer`

                                        return imageUrl ? (
                                          <ImageWithFallback
                                            src={imageUrl}
                                            alt={altText}
                                            fallbackText={featured?.title || card.title}
                                            className="h-full w-full transform-gpu object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                                          />
                                        ) : (
                                          <CategoryPlaceholder
                                            type={card.type}
                                            label={`No ${card.title} image`}
                                          />
                                        )
                                      })()}
                                      {card.type === 'events' && featured ? (
                                        <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                                          {getEventBadgeLabel(featured)}
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="mt-3 space-y-1">
                                      {card.type === 'events' && featured ? (
                                        <p className="text-xs text-muted-foreground">
                                          {getEventMetaLabel(featured)}
                                        </p>
                                      ) : null}
                                      <p
                                        className="text-base font-semibold text-foreground"
                                        style={clampTwo}
                                      >
                                        {featured?.title || `Latest ${card.title}`}
                                      </p>
                                    </div>
                                  </SmartLink>

                                  <div className="space-y-2">
                                    {compactItems.map((item, index) => {
                                      const imagePath =
                                        card.type === 'news'
                                          ? selectItemImage(item)
                                          : selectFlyerImage(item)
                                      const imageUrl = imagePath
                                        ? resolveAssetUrl(imagePath)
                                        : ''
                                      const altText =
                                        card.type === 'news'
                                          ? item?.image_alt_text ||
                                            `${item?.title || card.title} image`
                                          : item?.flyer_alt_text ||
                                            `${item?.title || card.title} flyer`
                                      const href = item?.slug
                                        ? `${card.detailBase}/${item.slug}`
                                        : card.listHref

                                      return (
                                        <SmartLink
                                          key={item?.id || item?.slug || index}
                                          href={href}
                                          className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                          aria-label={
                                            item?.excerpt
                                              ? `${item?.title}: ${item.excerpt}`
                                              : item?.title || `View ${card.title}`
                                          }
                                        >
                                          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-md">
                                            {imageUrl ? (
                                              <ImageWithFallback
                                                src={imageUrl}
                                                alt={altText}
                                                fallbackText={item?.title || card.title}
                                                className="h-full w-full transform-gpu object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                                              />
                                            ) : (
                                              <CategoryPlaceholder
                                                type={card.type}
                                                className="rounded-md"
                                                label={`No ${card.title} image`}
                                              />
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p
                                              className="text-sm font-medium text-foreground"
                                              style={clampTwo}
                                            >
                                              {item?.title || `More ${card.title}`}
                                            </p>
                                            {card.type === 'events' ? (
                                              <p className="mt-1 text-xs text-muted-foreground">
                                                {getEventMetaLabel(item)}
                                              </p>
                                            ) : null}
                                          </div>
                                        </SmartLink>
                                      )
                                    })}
                                    {Array.from({ length: missingCompactCount }).map(
                                      (_, index) => (
                                        <div
                                          key={`placeholder-${card.key}-${index}`}
                                          className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground"
                                        >
                                          <div className="h-14 w-16 shrink-0 rounded-md bg-muted/30" />
                                          <span>{`No more ${card.title.toLowerCase()} yet`}</span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </>
                              )}
                            </CardContent>

                            <div className="mt-auto border-t border-border/70 px-5 py-3">
                              <div className="flex justify-end">
                                <SmartLink
                                  href={card.listHref}
                                  className="text-sm font-semibold text-primary transition hover:underline"
                                >
                                  {`View all ${card.title}`}
                                </SmartLink>
                              </div>
                            </div>
                          </Card>
                        </RevealItem>
                      )
                    })}
                  </StaggerGridReveal>
                </Section>
              )
            }

            if (block.block_type === 'cultural_break') {
              const backgroundImage = block.background_image_id
                ? resolveAssetUrl(block.background_image_id)
                : ''
              const overlayStrength = block.background_overlay_strength || 'medium'
              const overlayClass =
                overlayStrength === 'high'
                  ? 'bg-black/60'
                  : overlayStrength === 'low'
                    ? 'bg-black/25'
                    : 'bg-black/40'

              const backgroundClass =
                block.background_style === 'gradient'
                  ? 'bg-gradient-to-r from-primary/10 via-primary/20 to-primary/5'
                  : 'bg-white/70'

              return (
                <Section
                  key={block.id}
                  themeVariant={themeVariant}
                  backgroundClassName="bg-[#F6E6D8]"
                  containerClassName={containerClass}
                  fullBleed={isFullBleed}
                >
                  <div
                    className={`relative overflow-hidden rounded-[20px] border border-border/60 ${
                      block.background_style === 'image' && backgroundImage
                        ? 'bg-cover bg-center'
                        : backgroundClass
                    }`}
                    style={
                      block.background_style === 'image' && backgroundImage
                        ? { backgroundImage: `url(${backgroundImage})` }
                        : undefined
                    }
                  >
                    {block.background_style === 'image' && backgroundImage && (
                      <div className={`absolute inset-0 ${overlayClass}`} />
                    )}
                    <div
                      className={`relative mx-auto max-w-3xl space-y-4 px-6 py-12 text-center md:px-12 md:py-16 ${
                        block.background_style === 'image' ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      <p className="text-2xl font-semibold leading-relaxed md:text-4xl">
                        &quot;{block.quote_text}&quot;
                      </p>
                      {block.quote_author && (
                        <p
                          className={`text-sm md:text-base ${
                            block.background_style === 'image'
                              ? 'text-white/80'
                              : 'text-muted-foreground'
                          }`}
                        >
                          - {block.quote_author}
                        </p>
                      )}
                    </div>
                  </div>
                </Section>
              )
            }

            if (block.block_type === 'gateway_links') {
              const items = Array.isArray(block.gateway_items)
                ? block.gateway_items
                : []
              const mobileClass =
                GATEWAY_GRID_MOBILE[block.gateway_columns_mobile] ||
                GATEWAY_GRID_MOBILE[1]
              const tabletClass =
                GATEWAY_GRID_TABLET[block.gateway_columns_tablet] ||
                GATEWAY_GRID_TABLET[2]
              const desktopClass =
                GATEWAY_GRID_DESKTOP[block.gateway_columns_desktop] ||
                GATEWAY_GRID_DESKTOP[3]

              return (
                <Section
                  key={block.id}
                  themeVariant={themeVariant}
                  backgroundClassName="bg-white"
                  containerClassName={containerClass}
                  fullBleed={isFullBleed}
                >
                  <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-2xl space-y-2">
                      <h2 className="text-3xl font-semibold leading-snug break-words md:text-4xl">
                        {sectionTitle || 'Explore Nyakrom'}
                      </h2>
                      {sectionSubtitle && (
                        <p className="text-base text-muted-foreground md:text-lg">
                          {sectionSubtitle}
                        </p>
                      )}
                    </div>
                    {ctaLabel && ctaHref && (
                      <Button
                        as={SmartLink}
                        href={ctaHref}
                        variant="ghost"
                        className="h-11 rounded-full border border-primary/20 px-5 text-primary transition hover:bg-[#FDEAD2]"
                      >
                        {ctaLabel}
                      </Button>
                    )}
                  </div>

                  <StaggerGridReveal
                    className={`mt-8 grid gap-6 ${mobileClass} ${tabletClass} ${desktopClass}`}
                  >
                    {items.map((item, index) => {
                      const imageUrl = item?.image_id
                        ? resolveAssetUrl(item.image_id)
                        : ''
                      return (
                        <RevealItem key={item?.href || index}>
                          <SmartLink
                            href={item?.href || '#'}
                            className="group flex h-full flex-col justify-between rounded-[16px] border border-[#E7DED3] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#dcccb7] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#FDEAD2] text-xl">
                                {imageUrl ? (
                                  <ImageWithFallback
                                    src={imageUrl}
                                    alt={item?.label || 'Gateway link'}
                                    fallbackText=""
                                    className="h-full w-full transform-gpu rounded-2xl object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                                  />
                                ) : (
                                  <span>{resolveGatewayIcon(item)}</span>
                                )}
                              </div>
                              {item?.badge && (
                                <span className="rounded-full bg-[#FDEAD2] px-2.5 py-1 text-xs font-medium text-primary">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div className="mt-5 space-y-2">
                              <p className="text-xl font-semibold text-foreground">
                                {item?.label || 'Explore'}
                              </p>
                              {item?.description && (
                                <p className="text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="mt-5 text-sm font-medium text-primary transition group-hover:translate-x-1">
                              Learn more -&gt;
                            </div>
                          </SmartLink>
                        </RevealItem>
                      )
                    })}
                  </StaggerGridReveal>
                </Section>
              )
            }

            return null
            })}
          </div>
        )}

        {blocks.length === 0 && sections.length > 0 && (
          <div>
            {sections.map((section, index) => {
            const sectionTitle = pickFirstString(
              section?.title,
              section?.name,
              `Section ${index + 1}`,
            )
            const sectionSubtitle = pickFirstString(
              section?.subtitle,
              section?.summary,
            )
            const sectionBody = pickFirstString(
              section?.content,
              section?.description,
            )
            const sectionImage = selectSectionImage(section)
            const sectionImageUrl = sectionImage
              ? resolveAssetUrl(sectionImage)
              : ''

            return (
              <Section
                key={section?.id || section?.slug || index}
                backgroundClassName="bg-white"
              >
                <div className="grid gap-8 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)] lg:items-start">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-semibold leading-snug break-words md:text-3xl">
                        {sectionTitle}
                      </h2>
                      {sectionSubtitle && (
                        <p className="mt-2 text-base text-muted-foreground">
                          {sectionSubtitle}
                        </p>
                      )}
                    </div>
                    {sectionBody && (
                      <Card className="rounded-[16px] border border-border/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                        <CardContent className="space-y-2">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {sectionBody}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <div>
                    <Card className="overflow-hidden rounded-[16px] border border-border/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                      {sectionImageUrl ? (
                        <div className="aspect-[4/3] w-full overflow-hidden bg-muted/40">
                          <ImageWithFallback
                            src={sectionImageUrl}
                            alt={sectionTitle}
                            fallbackText="No image"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center bg-muted/40 text-sm text-muted-foreground">
                          No image available
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </Section>
            )
            })}
          </div>
        )}

        {featuredBlocks.length > 0 && (
          <div>
            {featuredBlocks.map((block, index) => {
            const blockTitle = pickFirstString(
              block?.title,
              block?.name,
              `Featured ${index + 1}`,
            )
            const blockSubtitle = pickFirstString(
              block?.subtitle,
              block?.summary,
            )
            return (
              <Section
                key={block?.id || block?.title || index}
                backgroundClassName="bg-white"
              >
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold leading-snug break-words md:text-3xl">
                      {blockTitle}
                    </h2>
                    {blockSubtitle && (
                      <p className="mt-2 text-base text-muted-foreground">
                        {blockSubtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  {Array.isArray(block?.items) ? (
                    <StaggerGridReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {block.items.map((item, itemIndex) => {
                        const itemLabel = formatItemLabel(item)
                        const itemImagePath = selectItemImage(item)
                        const itemImageUrl = itemImagePath
                          ? resolveAssetUrl(itemImagePath)
                          : ''

                        return (
                          <RevealItem key={item?.id || item?.slug || itemIndex}>
                            <Card className="group overflow-hidden rounded-[16px] border border-border/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                              {itemImageUrl && (
                                <div className="aspect-[4/3] w-full overflow-hidden bg-muted/40">
                                  <ImageWithFallback
                                    src={itemImageUrl}
                                    alt={itemLabel || 'Featured item'}
                                    fallbackText="No image"
                                    className="h-full w-full transform-gpu object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                                  />
                                </div>
                              )}
                              <CardContent className="space-y-2">
                                <p className="text-lg font-semibold text-foreground">
                                  {itemLabel}
                                </p>
                              </CardContent>
                            </Card>
                          </RevealItem>
                        )
                      })}
                    </StaggerGridReveal>
                  ) : (
                    <Card className="rounded-[16px] border border-border/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {formatItemLabel(block?.items)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </Section>
            )
            })}
          </div>
        )}
      </Suspense>
    </div>
  )
}

export default Home
