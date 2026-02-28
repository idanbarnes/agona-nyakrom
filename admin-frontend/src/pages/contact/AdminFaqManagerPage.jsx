import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildAdminPreviewPath } from '../../lib/adminPreview.js'
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Textarea,
  ToastMessage,
} from '../../components/ui/index.jsx'
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
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

const initialForm = {
  question: '',
  answer: '',
  status: 'draft',
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

  const loadFaqs = async () => {
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
  }

  useEffect(() => {
    loadFaqs()
  }, [page, limit, searchTerm, statusFilter])

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
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1
  const endItem = total === 0 ? 0 : Math.min(startItem + filteredItems.length - 1, total)

  const resetModal = () => {
    setEditingId('')
    setFormState(initialForm)
    setIsModalOpen(false)
  }

  const openCreateModal = () => {
    setEditingId('')
    setFormState(initialForm)
    setIsModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingId(item.id)
    setFormState({
      question: item.question || '',
      answer: item.answer || '',
      status: item.status || (item.is_active ? 'published' : 'draft'),
    })
    setIsModalOpen(true)
  }

  const saveFaq = async (forcedStatus) => {
    setErrorMessage('')
    setSuccessMessage('')

    const question = formState.question.trim()
    const answer = formState.answer.trim()
    const status = forcedStatus || formState.status || 'draft'

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
        setSuccessMessage('FAQ updated successfully.')
      } else {
        await createAdminFaq(payload)
        setSuccessMessage('FAQ created successfully.')
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

  const handleToggleFaq = async (faqId) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await toggleAdminFaq(faqId)
      setSuccessMessage('FAQ status updated.')
      await loadFaqs()
    } catch (error) {

      setErrorMessage(error?.message || 'Unable to update FAQ status.')
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

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">FAQ Manager</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage FAQs shown on the Contact Us page.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Add FAQ
        </Button>
      </div>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? <ToastMessage type="success" message={successMessage} /> : null}

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              placeholder="Search question or answer"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {statusFilterOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={statusFilter === option.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(option.value)
                    setPage(DEFAULT_PAGE)
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
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
            <p className="text-xs text-muted-foreground">
              Showing {startItem} to {endItem} of {total}
            </p>
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
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleMove(item.id, 'up')}
                            disabled={visibleIndex === 0}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleMove(item.id, 'down')}
                            disabled={visibleIndex === filteredItems.length - 1}
                          >
                            Down
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleFaq(item.id)}
                          >
                            {item.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </Button>
                          {previewPath ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => navigate(previewPath)}
                            >
                              Preview
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(DEFAULT_PAGE, current - 1))}
              >
                Previous
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
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
            saveFaq()
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

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="faq-status">
                Status
              </label>
              <Select
                id="faq-status"
                value={formState.status}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
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

          <div className="col-span-full flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={resetModal}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={isSaving}
              onClick={() => saveFaq('draft')}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              loading={isSaving}
              onClick={() => saveFaq('published')}
            >
              Save & Publish
            </Button>
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
