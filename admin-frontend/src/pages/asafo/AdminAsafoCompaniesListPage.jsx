import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import { deleteAsafoCompany, getAllAsafoCompanies, updateAsafoCompany } from '../../services/api/adminAsafoApi.js'

export default function AdminAsafoCompaniesListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await getAllAsafoCompanies()
      setItems(res?.data || [])
    } catch (err) {
      if (err.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!getAuthToken()) return navigate('/login', { replace: true })
    load()
  }, [navigate])

  const updateField = async (id, patch) => {
    const formData = new FormData()
    Object.entries(patch).forEach(([k, v]) => formData.append(k, String(v)))
    await updateAsafoCompany(id, formData)
    load()
  }

  const intro = items.find((item) => item.entry_type === 'introduction')

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Asafo Entries</h2>
        <div className="space-x-2">
          {!intro ? <Link className="rounded border px-3 py-2" to="/admin/asafo-companies/create?type=introduction">Create Introduction</Link> : null}
          <Link className="rounded bg-black px-3 py-2 text-white" to="/admin/asafo-companies/create">Create Company</Link>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Type</th>
            <th>Title</th>
            <th>Company Key</th>
            <th>Published</th>
            <th>Order</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2"><span className="rounded border px-2 py-1 text-xs">{item.entry_type}</span></td>
              <td>{item.title || item.name}</td>
              <td>{item.company_key || '-'}</td>
              <td>
                <input
                  type="checkbox"
                  checked={Boolean(item.published)}
                  onChange={(e) => updateField(item.id, { published: e.target.checked })}
                />
              </td>
              <td>
                <input
                  className="w-16 rounded border px-2 py-1"
                  type="number"
                  value={item.display_order ?? 0}
                  onChange={(e) => updateField(item.id, { display_order: Number(e.target.value || 0) })}
                />
              </td>
              <td className="space-x-2">
                <Link to={`/admin/asafo-companies/edit/${item.id}`} className="underline">Edit</Link>
                {item.entry_type !== 'introduction' ? (
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={async () => {
                      await deleteAsafoCompany(item.id)
                      load()
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
