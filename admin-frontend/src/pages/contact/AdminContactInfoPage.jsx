import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Textarea,
  ToastMessage,
} from '../../components/ui/index.jsx'
import {
  getAdminContact,
  updateAdminContact,
} from '../../services/api/adminContactFaqApi.js'

const timezoneOptions = [
  'GMT',
  'UTC',
  'WAT',
  'EST',
  'CST',
  'MST',
  'PST',
]

const initialState = {
  section_title: 'Get in Touch',
  section_subtitle: 'Have questions or feedback? Reach out to us.',
  emails: [],
  phones: [],
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  },
  office_hours: {
    days: 'Monday - Friday',
    hours: '9:00 AM - 6:00 PM',
    timezone: 'GMT',
  },
}

function withNormalizedOrder(items) {
  return (items || []).map((item, index) => ({
    ...item,
    display_order: index + 1,
  }))
}

function moveItem(items, index, direction) {
  const nextIndex = direction === 'up' ? index - 1 : index + 1
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const copy = [...items]
  const current = copy[index]
  copy[index] = copy[nextIndex]
  copy[nextIndex] = current

  return withNormalizedOrder(copy)
}

function AdminContactInfoPage() {
  const [formState, setFormState] = useState(initialState)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const payload = await getAdminContact()
        const data = payload?.data || payload

        if (!mounted) return

        setFormState({
          section_title: data?.section_title || initialState.section_title,
          section_subtitle:
            data?.section_subtitle || initialState.section_subtitle,
          emails: withNormalizedOrder(data?.emails || []),
          phones: withNormalizedOrder(data?.phones || []),
          address: {
            ...initialState.address,
            ...(data?.address || {}),
          },
          office_hours: {
            ...initialState.office_hours,
            ...(data?.office_hours || {}),
          },
        })
      } catch (error) {

        if (mounted) {
          setErrorMessage(error?.message || 'Unable to load contact information.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [])

  const emailPreview = useMemo(
    () => (formState.emails || []).filter((entry) => entry?.email),
    [formState.emails],
  )
  const phonePreview = useMemo(
    () => (formState.phones || []).filter((entry) => entry?.number),
    [formState.phones],
  )

  const setAddressField = (key, value) => {
    setFormState((current) => ({
      ...current,
      address: {
        ...current.address,
        [key]: value,
      },
    }))
  }

  const setOfficeHoursField = (key, value) => {
    setFormState((current) => ({
      ...current,
      office_hours: {
        ...current.office_hours,
        [key]: value,
      },
    }))
  }

  const setEmailField = (index, key, value) => {
    setFormState((current) => {
      const next = [...current.emails]
      next[index] = {
        ...next[index],
        [key]: value,
      }

      return {
        ...current,
        emails: withNormalizedOrder(next),
      }
    })
  }

  const setPhoneField = (index, key, value) => {
    setFormState((current) => {
      const next = [...current.phones]
      next[index] = {
        ...next[index],
        [key]: value,
      }

      return {
        ...current,
        phones: withNormalizedOrder(next),
      }
    })
  }

  const addEmail = () => {
    setFormState((current) => ({
      ...current,
      emails: withNormalizedOrder([
        ...current.emails,
        { email: '', label: '', display_order: current.emails.length + 1 },
      ]),
    }))
  }

  const removeEmail = (index) => {
    setFormState((current) => ({
      ...current,
      emails: withNormalizedOrder(
        current.emails.filter((_, itemIndex) => itemIndex !== index),
      ),
    }))
  }

  const moveEmail = (index, direction) => {
    setFormState((current) => ({
      ...current,
      emails: moveItem(current.emails, index, direction),
    }))
  }

  const addPhone = () => {
    setFormState((current) => ({
      ...current,
      phones: withNormalizedOrder([
        ...current.phones,
        {
          number: '',
          availability: '',
          display_order: current.phones.length + 1,
        },
      ]),
    }))
  }

  const removePhone = (index) => {
    setFormState((current) => ({
      ...current,
      phones: withNormalizedOrder(
        current.phones.filter((_, itemIndex) => itemIndex !== index),
      ),
    }))
  }

  const movePhone = (index, direction) => {
    setFormState((current) => ({
      ...current,
      phones: moveItem(current.phones, index, direction),
    }))
  }

  const handleSave = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      await updateAdminContact(formState)
      setSuccessMessage('Contact information saved successfully.')
    } catch (error) {

      setErrorMessage(error?.message || 'Unable to save contact information.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Contact Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the contact page details and preview how they appear.
          </p>
        </div>
        <Button type="button" loading={isSaving} onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading contact details...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Section Header</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Section Title</label>
                  <Input
                    value={formState.section_title}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        section_title: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Section Subtitle</label>
                  <Textarea
                    value={formState.section_subtitle}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        section_subtitle: event.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formState.emails.map((entry, index) => (
                  <div
                    key={`email-${index}`}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={entry.email || ''}
                        onChange={(event) =>
                          setEmailField(index, 'email', event.target.value)
                        }
                      />
                      <Input
                        placeholder="Label (e.g. Support)"
                        value={entry.label || ''}
                        onChange={(event) =>
                          setEmailField(index, 'label', event.target.value)
                        }
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveEmail(index, 'up')}
                        disabled={index === 0}
                      >
                        Move Up
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => moveEmail(index, 'down')}
                        disabled={index === formState.emails.length - 1}
                      >
                        Move Down
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeEmail(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addEmail}>
                  Add New Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phone Numbers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formState.phones.map((entry, index) => (
                  <div
                    key={`phone-${index}`}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Phone number"
                        value={entry.number || ''}
                        onChange={(event) =>
                          setPhoneField(index, 'number', event.target.value)
                        }
                      />
                      <Input
                        placeholder="Availability"
                        value={entry.availability || ''}
                        onChange={(event) =>
                          setPhoneField(index, 'availability', event.target.value)
                        }
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => movePhone(index, 'up')}
                        disabled={index === 0}
                      >
                        Move Up
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => movePhone(index, 'down')}
                        disabled={index === formState.phones.length - 1}
                      >
                        Move Down
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removePhone(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addPhone}>
                  Add New Phone
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Physical Address</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Street"
                  value={formState.address.street || ''}
                  onChange={(event) => setAddressField('street', event.target.value)}
                />
                <Input
                  placeholder="City"
                  value={formState.address.city || ''}
                  onChange={(event) => setAddressField('city', event.target.value)}
                />
                <Input
                  placeholder="State"
                  value={formState.address.state || ''}
                  onChange={(event) => setAddressField('state', event.target.value)}
                />
                <Input
                  placeholder="ZIP / Postal code"
                  value={formState.address.zip || ''}
                  onChange={(event) => setAddressField('zip', event.target.value)}
                />
                <Input
                  placeholder="Country"
                  value={formState.address.country || ''}
                  onChange={(event) => setAddressField('country', event.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Office Hours</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="Days"
                  value={formState.office_hours.days || ''}
                  onChange={(event) =>
                    setOfficeHoursField('days', event.target.value)
                  }
                />
                <Input
                  placeholder="Hours"
                  value={formState.office_hours.hours || ''}
                  onChange={(event) =>
                    setOfficeHoursField('hours', event.target.value)
                  }
                />
                <Select
                  value={formState.office_hours.timezone || ''}
                  onChange={(event) =>
                    setOfficeHoursField('timezone', event.target.value)
                  }
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </Select>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="text-lg font-semibold">{formState.section_title}</h3>
                  <p className="text-muted-foreground">{formState.section_subtitle}</p>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Emails</p>
                  {emailPreview.length === 0 ? (
                    <p className="text-muted-foreground">No email entries yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {emailPreview.map((entry, index) => (
                        <li key={`preview-email-${index}`}>
                          <span className="font-medium">{entry.label || 'General'}:</span>{' '}
                          {entry.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Phones</p>
                  {phonePreview.length === 0 ? (
                    <p className="text-muted-foreground">No phone entries yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {phonePreview.map((entry, index) => (
                        <li key={`preview-phone-${index}`}>
                          <span className="font-medium">{entry.number}</span>
                          {entry.availability ? ` (${entry.availability})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {[
                      formState.address.street,
                      formState.address.city,
                      formState.address.state,
                      formState.address.zip,
                      formState.address.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Address not provided.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-medium">Office Hours</p>
                  <p className="text-muted-foreground">
                    {formState.office_hours.days || '-'}
                  </p>
                  <p className="text-muted-foreground">
                    {formState.office_hours.hours || '-'}
                    {formState.office_hours.timezone
                      ? ` (${formState.office_hours.timezone})`
                      : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminContactInfoPage
