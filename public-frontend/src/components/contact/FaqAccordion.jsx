import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn.js'

function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6.7 9.3a1 1 0 0 1 1.4 0L12 13.2l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0L6.7 10.7a1 1 0 0 1 0-1.4Z"
        fill="currentColor"
      />
    </svg>
  )
}

function FaqItem({ item, itemId, isOpen, onToggle }) {
  const answerId = `${itemId}-answer`

  return (
    <article className="rounded-2xl border border-border/70 bg-surface/95 shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition duration-200 hover:shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 rounded-2xl px-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6"
        aria-expanded={isOpen}
        aria-controls={answerId}
      >
        <span className="text-lg font-semibold leading-7 text-foreground md:text-xl">
          {item.question}
        </span>

        <ChevronIcon
          className={cn(
            'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300',
            isOpen ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>

      <div
        id={answerId}
        className={cn(
          'grid transition-all duration-300 ease-out',
          isOpen ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden px-5 pb-5 sm:px-6 sm:pb-6">
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            {item.answer}
          </p>
        </div>
      </div>
    </article>
  )
}

function FaqAccordion({ items = [], singleOpen = true, defaultOpenId }) {
  const [openIds, setOpenIds] = useState([])
  const itemIds = useMemo(
    () => items.map((item, index) => String(item.id || item.question || index)),
    [items],
  )
  const fallbackId = useMemo(
    () => String(defaultOpenId || itemIds[0] || ''),
    [defaultOpenId, itemIds],
  )
  const activeOpenIds = useMemo(() => {
    const validIdSet = new Set(itemIds)
    const filteredOpenIds = openIds.filter((id) => validIdSet.has(id))

    if (filteredOpenIds.length > 0) {
      return singleOpen ? [filteredOpenIds[0]] : filteredOpenIds
    }

    return fallbackId ? [fallbackId] : []
  }, [fallbackId, itemIds, openIds, singleOpen])

  const toggleItem = (itemId) => {
    setOpenIds((current) => {
      if (singleOpen) {
        return current[0] === itemId ? [] : [itemId]
      }

      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId)
      }

      return [...current, itemId]
    })
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const itemId = String(item.id || item.question || index)
        const isOpen = activeOpenIds.includes(itemId)

        return (
          <FaqItem
            key={itemId}
            item={item}
            itemId={itemId}
            isOpen={isOpen}
            onToggle={() => toggleItem(itemId)}
          />
        )
      })}
    </div>
  )
}

export default FaqAccordion
