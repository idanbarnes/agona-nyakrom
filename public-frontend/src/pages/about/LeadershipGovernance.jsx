import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPublicLeaders } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

export default function LeadershipGovernance() {
  const [data, setData] = useState({ traditional: [], community_admin: [] })
  useEffect(() => { getPublicLeaders().then((res) => setData(res.data || res)).catch(() => {}) }, [])

  const LeaderCard = ({ leader }) => <article className="rounded border p-3 space-y-2">{leader.photo ? <img src={resolveAssetUrl(leader.photo)} className="h-40 w-full object-cover rounded" /> : null}<h3 className="font-semibold">{leader.name}</h3><p>{leader.role_title}</p><p className="text-sm text-muted-foreground">{leader.short_bio_snippet}</p><Link to={`/about-nyakrom/leadership-governance/${leader.slug}`} className="text-sm underline">View Profile</Link></article>

  return <section className="container py-10 space-y-6"><h1 className="text-3xl font-semibold">Leadership & Governance</h1>
    <section><h2 className="text-xl font-semibold">Traditional Leadership</h2><div className="mt-3 grid gap-4 md:grid-cols-3">{data.traditional.map((leader)=><LeaderCard key={leader.id} leader={leader} />)}</div></section>
    <section><h2 className="text-xl font-semibold">Community Administrative Leadership</h2><div className="mt-3 grid gap-4 md:grid-cols-4">{data.community_admin.map((leader)=><LeaderCard key={leader.id} leader={leader} />)}</div></section>
  </section>
}
