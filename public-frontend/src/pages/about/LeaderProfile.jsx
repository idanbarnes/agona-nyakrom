import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPublicLeaderBySlug } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

export default function LeaderProfile() {
  const { slug } = useParams()
  const [leader, setLeader] = useState(null)
  useEffect(() => { getPublicLeaderBySlug(slug).then((res) => setLeader(res.data || res)).catch(() => setLeader(null)) }, [slug])

  if (!leader) return <section className="container py-10">Profile not available.</section>

  return <section className="container py-10 space-y-3"><Link to="/about-nyakrom/leadership-governance" className="underline">Back to Leadership & Governance</Link>{leader.photo ? <img src={resolveAssetUrl(leader.photo)} className="max-h-96 rounded" /> : null}<h1 className="text-3xl font-semibold">{leader.name}</h1><p>{leader.role_title}</p><p style={{ whiteSpace: 'pre-line' }}>{leader.full_bio}</p></section>
}
