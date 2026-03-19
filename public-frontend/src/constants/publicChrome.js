export const DEFAULT_SITE_NAME = 'Nyakrom Community'
export const DEFAULT_SITE_TAGLINE = 'Preserving our heritage, building our future.'

export const ABOUT_SECTION_LABEL = 'About Nyakrom'

export const ABOUT_PAGE_TITLES = {
  history: 'History',
  'who-we-are': 'Who We Are',
  'about-agona-nyakrom-town': 'About Agona Nyakrom Town',
}

export const PUBLIC_NAV_ITEMS = [
  { label: 'Home', to: '/' },
  {
    label: ABOUT_SECTION_LABEL,
    children: [
      { label: 'History', to: '/about/history' },
      { label: 'Who We Are', to: '/about/who-we-are' },
      { label: 'About Agona Nyakrom Town', to: '/about/about-agona-nyakrom-town' },
      { label: 'Leadership & Governance', to: '/about/leadership-governance' },
      { label: 'Landmarks', to: '/landmarks' },
    ],
  },
  { label: 'Clans', to: '/clans' },
  { label: 'Asafo Companies', to: '/asafo-companies' },
  { label: 'Hall of Fame', to: '/hall-of-fame' },
  { label: 'Obituaries', to: '/obituaries' },
  { label: 'News', to: '/news' },
  { label: 'Announcements & Events', to: '/announcements-events' },
  { label: 'Contact Us', to: '/contact' },
]

export const FOOTER_SECTION_TITLES = {
  quickLinks: 'Quick Links',
  community: 'Community',
  contact: 'Contact Us',
}

export const DEFAULT_FOOTER_QUICK_LINKS = [
  { label: 'Our History', url: '/about/history' },
  { label: 'Who We Are', url: '/about/who-we-are' },
  { label: 'Leadership', url: '/about/leadership-governance' },
  { label: 'Hall of Fame', url: '/hall-of-fame' },
  { label: 'FAQs', url: '/contact?tab=faqs' },
]

export const FOOTER_COMMUNITY_LINKS = [
  { label: 'News', url: '/news' },
  { label: 'Announcements & Events', url: '/announcements-events' },
  { label: 'Clans', url: '/clans' },
  { label: 'Asafo Companies', url: '/asafo-companies' },
  { label: 'Obituaries', url: '/obituaries' },
]

export const PUBLIC_UI_LABELS = {
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  closeMenuOverlay: 'Close menu overlay',
  mobileNavigationMenu: 'Mobile navigation menu',
  loadingSiteSettings: 'Loading site settings...',
  sendMessage: 'Send Message',
  contactDetailsUnavailable: 'Contact details unavailable.',
  contentNotAvailableTitle: 'Content not available',
  contentNotAvailableDescription:
    'This page has not been published yet or is temporarily unavailable.',
  unableToLoadContentTitle: 'Unable to load content',
  unableToLoadContentMessage: 'Please try again shortly.',
}
