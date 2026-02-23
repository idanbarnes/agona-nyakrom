import { Link } from 'react-router-dom'

const SECTION_CARDS = [
  {
    id: 'who-are-asafo-companies',
    title: 'Who Are Asafo Companies',
    subtitle: 'Introduction',
    description: 'Manage introductory content for Asafo Companies.',
  },
  {
    id: 'adontsen-asafo-company',
    title: 'Adontsen Asafo Company',
    subtitle: 'Asafo Company 1',
    description: 'Manage section content for Adontsen Asafo Company.',
  },
  {
    id: 'kyeremu-asafo',
    title: 'Kyeremu Asafo',
    subtitle: 'Asafo Company 2',
    description: 'Manage section content for Kyeremu Asafo.',
  },
]

export default function AdminAsafoCompaniesListPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Asafo Companies</h2>
        <p className="text-sm text-slate-600">
          Select a section card to edit the page content.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {SECTION_CARDS.map((card) => (
          <Link
            key={card.id}
            to={`/admin/asafo-companies/section/${card.id}`}
            className="asafo-card-link rounded-lg border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.subtitle}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
