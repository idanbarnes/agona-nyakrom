import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildAdminPreviewPath } from '../../lib/adminPreview.js'
import FormActions from '../../components/ui/form-actions.jsx'
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Textarea,
  ToastMessage,
} from '../../components/ui/index.jsx'
import {
  TableEntriesSummary,
  TablePaginationFooter,
} from '../../components/ui/pagination.jsx'
import {
  bulkAdminFaqAction,
  createAdminFaq,
  deleteAdminFaq,
  listAdminFaqs,
  reorderAdminFaqs,
  toggleAdminFaq,
  updateAdminFaq,
} from '../../services/api/adminContactFaqApi.js'

const QUESTION_MAX_LENGTH = 240
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

const initialForm = {
  question: '',
  answer: '',
}

function normalizeFaqs(items = []) {
  return [...items]
    .sort(
      (left, right) =>
        Number(left.display_order ?? left.sort_order ?? 0) -
        Number(right.display_order ?? right.sort_order ?? 0),
    )
    .map((item, index) => {
      const isPublished =
        item?.status === 'published' ||
        item?.published === true ||
        item?.is_published === true ||
        item?.is_active === true

      return {
        ...item,
        display_order: index + 1,
        sort_order: index + 1,
        is_active: isPublished,
        published: isPublished,
        status: isPublished ? 'published' : 'draft',
      }
    })
}

function truncate(value, size = 90) {
  const text = String(value || '')
  if (text.length <= size) {
    return text
  }
  return `${text.slice(0, size)}...`
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PlusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function EyeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EditIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function EyeOffIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17.94 17.94A10.87 10.87 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.51" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ChevronUpIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function badgeClassForStatus(status) {
  return status === 'published'
    ? 'bg-green-100 text-green-700'
    : 'bg-slate-200 text-slate-700'
}

function AdminFaqManagerPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [formState, setFormState] = useState(initialForm)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim())
      setPage(DEFAULT_PAGE)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const loadFaqs = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const payload = await listAdminFaqs({
        page,
        limit,
        search: searchTerm,
        status: statusFilter,
      })

      const data = payload?.data ?? payload
      const collection = Array.isArray(data)
        ? { items: data, total: data.length, page, limit }
        : data

      const nextItems = normalizeFaqs(collection?.items || [])
      const nextTotal = Number(collection?.total ?? nextItems.length)

      setItems(nextItems)
      setTotal(nextTotal)

      if (page > 1 && nextItems.length === 0 && nextTotal > 0) {
        setPage((current) => Math.max(DEFAULT_PAGE, current - 1))
      }
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to load FAQs.')
      setItems([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, searchTerm, statusFilter])

  useEffect(() => {
    loadFaqs()
  }, [loadFaqs])

  const filteredItems = items

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const duplicateQuestionWarning = useMemo(() => {
    const normalizedQuestion = formState.question.trim().toLowerCase()
    if (!normalizedQuestion) {
      return ''
    }

    const hasDuplicate = items.some((item) => {
      if (editingId && item.id === editingId) {
        return false
      }
      return String(item.question || '').trim().toLowerCase() === normalizedQuestion
    })

    return hasDuplicate
      ? 'A similar question already exists. You can still save if this is intentional.'
      : ''
  }, [editingId, formState.question, items])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const totalEntries = total

  const resetModal = () => {
    setEditingId('')
    setSubmitAction('publish')
    setFormState(initialForm)
    setIsModalOpen(false)
  }

  const openCreateModal = () => {
    setEditingId('')
    setSubmitAction('publish')
    setFormState(initialForm)
    setIsModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingId(item.id)
    setSubmitAction('publish')
    setFormState({
      question: item.question || '',
      answer: item.answer || '',
    })
    setIsModalOpen(true)
  }

  const saveFaq = async (action = 'publish') => {
    setErrorMessage('')
    setSuccessMessage('')
    setSubmitAction(action)

    const question = formState.question.trim()
    const answer = formState.answer.trim()
    const status = action === 'publish' ? 'published' : 'draft'

    if (!question || !answer) {
      setErrorMessage('Question and answer are required.')
      return
    }

    if (question.length > QUESTION_MAX_LENGTH) {
      setErrorMessage(`Question must be ${QUESTION_MAX_LENGTH} characters or less.`)
      return
    }

    const payload = {
      question,
      answer,
      status,
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await updateAdminFaq(editingId, payload)
        setSuccessMessage(
          action === 'draft'
            ? 'FAQ draft saved successfully.'
            : 'FAQ published successfully.',
        )
      } else {
        await createAdminFaq(payload)
        setSuccessMessage(
          action === 'draft'
            ? 'FAQ draft saved successfully.'
            : 'FAQ published successfully.',
        )
      }

      resetModal()
      await loadFaqs()
    } catch (error) {

      setErrorMessage(error?.message || 'Unable to save FAQ.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFaq = async () => {
    if (!deleteTarget?.id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      await deleteAdminFaq(deleteTarget.id)
      setDeleteTarget(null)
      setSelectedIds((current) => current.filter((itemId) => itemId !== deleteTarget.id))
      setSuccessMessage('FAQ deleted successfully.')
      await loadFaqs()
    } catch (error) {

      setErrorMessage(error?.message || 'Unable to delete FAQ.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnpublishFaq = async (item) => {
    if (!item?.id || item?.status !== 'published') {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      await toggleAdminFaq(item.id)
      setSuccessMessage('FAQ unpublished.')
      await loadFaqs()
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to unpublish FAQ.')
    }
  }

  const persistOrder = async (nextItems) => {
    const payload = nextItems.map((item, index) => ({
      id: item.id,
      display_order: index + 1,
    }))

    await reorderAdminFaqs(payload)
  }

  const handleMove = async (faqId, direction) => {
    const visibleIds = filteredItems.map((item) => item.id)
    const currentVisibleIndex = visibleIds.indexOf(faqId)
    const targetVisibleIndex = direction === 'up' ? currentVisibleIndex - 1 : currentVisibleIndex + 1

    if (
      currentVisibleIndex < 0 ||
      targetVisibleIndex < 0 ||
      targetVisibleIndex >= visibleIds.length
    ) {
      return
    }

    const targetId = visibleIds[targetVisibleIndex]
    const sourceIndex = items.findIndex((entry) => entry.id === faqId)
    const targetIndex = items.findIndex((entry) => entry.id === targetId)

    if (sourceIndex < 0 || targetIndex < 0) {
      return
    }

    if (items[sourceIndex]?.status !== 'published') {
      return
    }

    const copy = [...items]
    const current = copy[sourceIndex]
    copy[sourceIndex] = copy[targetIndex]
    copy[targetIndex] = current

    const reordered = normalizeFaqs(copy)
    setItems(reordered)

    setErrorMessage('')
    setSuccessMessage('')

    try {
      await persistOrder(reordered)
      setSuccessMessage('FAQ order updated.')
    } catch (error) {

      setErrorMessage(error?.message || 'Unable to reorder FAQs.')
      await loadFaqs()
    }
  }

  const toggleSelected = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id)
      }
      return [...current, id]
    })
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredItems.map((item) => item.id)
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id))

    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)))
      return
    }

    const merged = new Set([...selectedIds, ...visibleIds])
    setSelectedIds(Array.from(merged))
  }

  const runBulkAction = async (action) => {
    if (!selectedIds.length) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      await bulkAdminFaqAction(action, selectedIds)
      setSelectedIds([])
      setSuccessMessage('Bulk action completed successfully.')
      await loadFaqs()
    } catch (error) {

      setErrorMessage(error?.message || 'Unable to complete bulk action.')
    } finally {
      setIsSaving(false)
    }
  }

  const allVisibleSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedSet.has(item.id))
  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Contact FAQs Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage FAQs shown on the Contact Us page.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={openCreateModal}
          >
            <PlusIcon />
            Create FAQ
          </Button>
        </div>
      </header>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? <ToastMessage type="success" message={successMessage} /> : null}

      <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              type="search"
              placeholder="Search question or answer"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search FAQs by question or answer"
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end"
            role="group"
            aria-label="Filter by publication status"
          >
            {statusFilterOptions.map((option) => {
              const isActive = statusFilter === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(option.value)
                    setPage(DEFAULT_PAGE)
                  }}
                  aria-pressed={isActive}
                  className={[
                    'inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-border bg-white text-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TableEntriesSummary totalEntries={totalEntries} />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => runBulkAction('activate')}
                disabled={!selectedIds.length || isSaving}
              >
                Bulk Publish
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => runBulkAction('deactivate')}
                disabled={!selectedIds.length || isSaving}
              >
                Bulk Draft
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={!selectedIds.length || isSaving}
              >
                Bulk Delete
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading FAQs...</p>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No FAQs found"
              description="Create your first FAQ to populate the Contact Us accordion."
              action={
                <Button type="button" variant="secondary" onClick={openCreateModal}>
                  Add FAQ
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Question</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
                </tr>
              </TableHead>
              <TableBody>
                {filteredItems.map((item, visibleIndex) => {
                  const isPublished = item.status === 'published'
                  const canMoveUp = isPublished && visibleIndex > 0
                  const canMoveDown = isPublished && visibleIndex < filteredItems.length - 1
                  const previewPath = buildAdminPreviewPath('faqs', item.id)
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedSet.has(item.id)}
                          onChange={() => toggleSelected(item.id)}
                        />
                      </TableCell>
                      <TableCell>{item.display_order}</TableCell>
                      <TableCell className="max-w-xl">
                        <p className="font-medium">{truncate(item.question, 110)}</p>
                        <p className="text-xs text-muted-foreground">{truncate(item.answer, 130)}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badgeClassForStatus(item.status)}`}
                        >
                          {item.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(item.updated_at)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {previewPath ? (
                            <button
                              type="button"
                              className={neutralIconButtonClassName}
                              aria-label={`Preview ${item.question || 'FAQ'}`}
                              title="Preview"
                              onClick={() => navigate(previewPath)}
                            >
                              <EyeIcon />
                            </button>
                          ) : (
                            <span
                              className={`${neutralIconButtonClassName} cursor-not-allowed opacity-40`}
                              aria-hidden="true"
                            >
                              <EyeIcon />
                            </span>
                          )}
                          <button
                            type="button"
                            className={neutralIconButtonClassName}
                            aria-label={`Edit ${item.question || 'FAQ'}`}
                            title="Edit"
                            onClick={() => openEditModal(item)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                            aria-label={`Delete ${item.question || 'FAQ'}`}
                            title="Delete"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <TrashIcon />
                          </button>
                          <button
                            type="button"
                            className={[
                              iconButtonClassName,
                              !isPublished
                                ? 'cursor-not-allowed !text-slate-300 opacity-60 hover:translate-y-0 hover:!bg-transparent hover:!text-slate-300'
                                : '!text-red-600 hover:!bg-red-50 hover:!text-red-700',
                            ].join(' ')}
                            aria-label={`Unpublish ${item.question || 'FAQ'}`}
                            title="Unpublish"
                            disabled={!isPublished}
                            onClick={() => handleUnpublishFaq(item)}
                          >
                            <EyeOffIcon />
                          </button>
                          <button
                            type="button"
                            className={[
                              neutralIconButtonClassName,
                              !canMoveUp
                                ? 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:bg-transparent hover:text-slate-600'
                                : '',
                            ].join(' ')}
                            aria-label={`Move up ${item.question || 'FAQ'}`}
                            title="Move Up"
                            disabled={!canMoveUp}
                            onClick={() => handleMove(item.id, 'up')}
                          >
                            <ChevronUpIcon />
                          </button>
                          <button
                            type="button"
                            className={[
                              neutralIconButtonClassName,
                              !canMoveDown
                                ? 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:bg-transparent hover:text-slate-600'
                                : '',
                            ].join(' ')}
                            aria-label={`Move down ${item.question || 'FAQ'}`}
                            title="Move Down"
                            disabled={!canMoveDown}
                            onClick={() => handleMove(item.id, 'down')}
                          >
                            <ChevronDownIcon />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && totalEntries > 0 ? (
            <TablePaginationFooter
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={resetModal}
        title={editingId ? 'Edit FAQ' : 'Add New FAQ'}
        size="lg"
      >
        <form
          className="grid gap-4 lg:grid-cols-[1fr_280px]"
          onSubmit={(event) => {
            event.preventDefault()
            void saveFaq('publish')
          }}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="faq-question">
                Question
              </label>
              <Input
                id="faq-question"
                maxLength={QUESTION_MAX_LENGTH}
                value={formState.question}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    question: event.target.value,
                  }))
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                {formState.question.length}/{QUESTION_MAX_LENGTH}
              </p>
              {duplicateQuestionWarning ? (
                <p className="text-xs text-amber-700">{duplicateQuestionWarning}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="faq-answer">
                Answer
              </label>
              <Textarea
                id="faq-answer"
                value={formState.answer}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    answer: event.target.value,
                  }))
                }
                required
              />
            </div>

          </div>

          <div className="rounded-lg border border-border bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <div className="mt-2 space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                {formState.question || 'Question preview'}
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                {formState.answer || 'Answer preview'}
              </p>
            </div>
          </div>

          <div className="col-span-full">
            <FormActions
              mode="publish"
              onCancel={resetModal}
              onAction={(action) => {
                void saveFaq(action)
              }}
              isSubmitting={isSaving}
              submitAction={submitAction}
              disableCancel={isSaving}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete FAQ"
        description="Delete this FAQ permanently?"
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFaq}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete selected FAQs"
        description="Delete all selected FAQ entries? This cannot be undone."
        confirmLabel="Delete Selected"
        variant="danger"
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={async () => {
          setBulkDeleteOpen(false)
          await runBulkAction('delete')
        }}
      />
    </section>
  )
}

export default AdminFaqManagerPage
