import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPublicLeaders } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

function LeaderCard({ leader, compact = false }) {
  return (
    <article className={`rounded border p-3 space-y-2 ${compact ? 'text-sm' : ''}`}>
      {leader.photo ? (
        <img src={resolveAssetUrl(leader.photo)} alt={leader.name || leader.role_title || 'Leader'} className={`${compact ? 'h-28' : 'h-40'} w-full object-cover rounded`} />
      ) : null}
      <h3 className="font-semibold">{leader.name}</h3>
      <p>{leader.role_title}</p>
      {leader.short_bio_snippet ? <p className="text-muted-foreground">{leader.short_bio_snippet}</p> : null}
      <Link to={`/about/leadership-governance/${leader.slug || leader.id}`} className="text-sm underline">View Profile</Link>
    </article>
  )
}

export default function LeadershipGovernance() {
  const [data, setData] = useState({ traditional: [], community_admin: [] })

  useEffect(() => {
    getPublicLeaders()
      .then((res) => setData(res.data || res))
      .catch(() => {})
  }, [])

  return (
    <section className="container py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Leadership & Governance</h1>
      <section>
        <h2 className="text-xl font-semibold">Traditional Leadership</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {data.traditional.map((leader) => (
            <LeaderCard key={leader.id} leader={leader} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Community Administrative Leadership</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {data.community_admin.map((leader) => (
            <LeaderCard key={leader.id} leader={leader} compact />
          ))}
        </div>
      </section>
    </section>
  )
}
