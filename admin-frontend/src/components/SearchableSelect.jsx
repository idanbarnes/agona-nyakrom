import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/cn.js'
import { Input, Label } from './ui/index.jsx'

function getSelectedOption(value, options) {
  if (!value) return ''
  const normalized = String(value).trim().toLowerCase()
  const match = options.find(
    (option) => option.toLowerCase() === normalized,
  )
  return match || ''
}

export default function SearchableSelect({
  label,
  options = [],
  value = '',
  onSelect,
  placeholder = 'Search...',
  helperText,
}) {
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const selectedOption = useMemo(
    () => getSelectedOption(value, options),
    [options, value],
  )
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(selectedOption)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption)
      setActiveIndex(-1)
    }
  }, [isOpen, selectedOption])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options
    return options.filter((option) =>
      option.toLowerCase().includes(normalizedQuery),
    )
  }, [options, query])

  useEffect(() => {
    setActiveIndex(filteredOptions.length ? 0 : -1)
  }, [filteredOptions.length])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target)) return
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFocus = () => {
    setIsOpen(true)
  }

  const handleChange = (event) => {
    setQuery(event.target.value)
    setIsOpen(true)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      if (!filteredOptions.length) return
      setActiveIndex((prev) => (prev + 1) % filteredOptions.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      if (!filteredOptions.length) return
      setActiveIndex((prev) =>
        prev <= 0 ? filteredOptions.length - 1 : prev - 1,
      )
    }

    if (event.key === 'Enter') {
      if (!isOpen) return
      if (activeIndex < 0 || activeIndex >= filteredOptions.length) return
      event.preventDefault()
      const selected = filteredOptions[activeIndex]
      if (selected) {
        onSelect?.(selected)
        setQuery(selected)
        setIsOpen(false)
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
    }
  }

  const handleSelect = (option) => {
    onSelect?.(option)
    setQuery(option)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const showCustom = value && !selectedOption

  return (
    <div ref={containerRef} className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {isOpen ? (
          <div className="absolute z-50 mt-2 w-full rounded-md border border-border bg-surface shadow-lg">
            <div
              role="listbox"
              className="max-h-56 overflow-y-auto py-1"
            >
              {filteredOptions.length ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-left text-sm text-foreground hover:bg-accent',
                      index === activeIndex ? 'bg-accent' : '',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No results
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {showCustom ? (
        <p className="text-xs text-muted-foreground">Custom tag</p>
      ) : null}
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}
