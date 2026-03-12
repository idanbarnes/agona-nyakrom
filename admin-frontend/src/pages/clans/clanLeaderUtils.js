export const LEADER_TYPE_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'past', label: 'Past' },
]

export const LEADER_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...LEADER_TYPE_OPTIONS,
]

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path
  }

  const base = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://localhost:5000' : '')
  ).replace(/\/$/, '')

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalizedPath}` : normalizedPath
}

const TYPE_SORT_ORDER = {
  current: 0,
  past: 1,
}

const resolveLeaderType = (value) => (value === 'past' ? 'past' : 'current')

export function createClanLeaderDraft(overrides = {}) {
  return {
    id:
      overrides.id ||
      `leader-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: resolveLeaderType(overrides.type),
    name: overrides.name || '',
    title: overrides.title || '',
    position: overrides.position || '',
    image: overrides.image || null,
    existingImageUrl: overrides.existingImageUrl || '',
    display_order: Number(overrides.display_order || overrides.displayOrder || 0),
    created_at: overrides.created_at || overrides.createdAt || null,
    updated_at: overrides.updated_at || overrides.updatedAt || null,
    error: overrides.error || '',
  }
}

export function getClanLeaderImageUrl(leader) {
  const rawPath =
    leader?.existingImageUrl ||
    leader?.image_url ||
    leader?.imageUrl ||
    leader?.image ||
    leader?.images?.thumbnail ||
    leader?.images?.medium ||
    leader?.images?.large ||
    leader?.images?.original ||
    ''

  return resolveAssetUrl(rawPath)
}

export function normalizeClanLeader(leader) {
  return createClanLeaderDraft({
    ...leader,
    existingImageUrl: getClanLeaderImageUrl(leader),
  })
}

export function getClanLeaderTypeLabel(type) {
  return resolveLeaderType(type) === 'past' ? 'Past' : 'Current'
}

export function sortClanLeaders(leaders) {
  return [...leaders].sort((left, right) => {
    const leftType = resolveLeaderType(left?.type)
    const rightType = resolveLeaderType(right?.type)
    const typeDiff = TYPE_SORT_ORDER[leftType] - TYPE_SORT_ORDER[rightType]
    if (typeDiff !== 0) {
      return typeDiff
    }

    const leftOrder = Number(left?.display_order || 0)
    const rightOrder = Number(right?.display_order || 0)
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    const leftDate = new Date(left?.created_at || left?.createdAt || 0).getTime()
    const rightDate = new Date(right?.created_at || right?.createdAt || 0).getTime()
    if (leftDate !== rightDate) {
      return leftDate - rightDate
    }

    return String(left?.id || '').localeCompare(String(right?.id || ''))
  })
}

export function reindexClanLeaders(leaders) {
  const counters = { current: 0, past: 0 }

  return sortClanLeaders(leaders).map((leader) => {
    const type = resolveLeaderType(leader?.type)
    counters[type] += 1

    return {
      ...leader,
      type,
      display_order: counters[type],
    }
  })
}

export function getNextLeaderDisplayOrder(leaders, type, excludeLeaderId = null) {
  return (
    leaders.filter(
      (leader) =>
        resolveLeaderType(leader?.type) === resolveLeaderType(type) &&
        leader?.id !== excludeLeaderId,
    ).length + 1
  )
}

export function moveClanLeader(leaders, leaderId, direction) {
  const orderedLeaders = reindexClanLeaders(leaders)
  const activeLeader = orderedLeaders.find((leader) => leader.id === leaderId)
  if (!activeLeader) {
    return orderedLeaders
  }

  const sameTypeLeaders = orderedLeaders.filter(
    (leader) => resolveLeaderType(leader.type) === resolveLeaderType(activeLeader.type),
  )
  const currentIndex = sameTypeLeaders.findIndex((leader) => leader.id === leaderId)
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= sameTypeLeaders.length) {
    return orderedLeaders
  }

  const swappedLeader = sameTypeLeaders[nextIndex]

  return reindexClanLeaders(
    orderedLeaders.map((leader) => {
      if (leader.id === activeLeader.id) {
        return {
          ...leader,
          display_order: swappedLeader.display_order,
        }
      }

      if (leader.id === swappedLeader.id) {
        return {
          ...leader,
          display_order: activeLeader.display_order,
        }
      }

      return leader
    }),
  )
}

export function buildClanLeaderReorderPayload(leaders) {
  const orderedLeaders = reindexClanLeaders(leaders)

  return {
    current: orderedLeaders
      .filter((leader) => resolveLeaderType(leader.type) === 'current')
      .map((leader) => leader.id),
    past: orderedLeaders
      .filter((leader) => resolveLeaderType(leader.type) === 'past')
      .map((leader) => leader.id),
  }
}
