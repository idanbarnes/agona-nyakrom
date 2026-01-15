import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClanDetail } from '../../api/endpoints.js'
import {
  Button,
  Card,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'

const EMPTY_LEADERS = { current: [], past: [] }

function ClanDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadClan = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing clan slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getClanDetail(slug)
      const payload = response?.data || response?.item || response
      setItem(payload || null)
    } catch (err) {
      if (err?.status === 404) {
        setItem(null)
        setError(null)
      } else {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadClan()
  }, [loadClan])

  // Prefer medium image, then fall back to any available image field.
  const imagePath =
    item?.images?.medium || item?.images?.large || item?.image || item?.photo
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  const currentLeaders = useMemo(
    () => item?.leaders?.current || EMPTY_LEADERS.current,
    [item?.leaders?.current],
  )
  const pastLeaders = useMemo(
    () => item?.leaders?.past || EMPTY_LEADERS.past,
    [item?.leaders?.past],
  )

  const metaItems = [item?.origin, item?.region, item?.founded].filter(Boolean)

  return (
    <section className="container py-6 md:py-10">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <ErrorState
            message={error?.message || 'Unable to load this clan.'}
            onRetry={loadClan}
          />
        }
        empty={
          <EmptyState
            title="Not found"
            description="This item may have been removed."
            action={
              <Button as={Link} to="/clans" variant="ghost">
                Back to clans
              </Button>
            }
          />
        }
      >
        <div className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-4xl">
              {item?.name || 'Clan'}
            </h1>
            {metaItems.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {metaItems.map((meta) => (
                  <span key={meta}>{meta}</span>
                ))}
              </div>
            ) : null}
          </header>

          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt={item?.name || 'Clan'}
              className="h-56 w-full rounded-xl border border-border object-cover md:h-80"
            />
          ) : null}

          <div className="max-w-3xl space-y-4 leading-7 text-foreground">
            {item?.history ? (
              <p>{item.history}</p>
            ) : (
              <p className="text-muted-foreground">No history available.</p>
            )}
            {item?.key_contributions ? (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Key Contributions</h2>
                <p>{item.key_contributions}</p>
              </div>
            ) : null}
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Current Leaders
            </h2>
            {currentLeaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No current leaders listed.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {currentLeaders.map((leader) => {
                  const leaderImage =
                    leader?.images?.medium ||
                    leader?.images?.large ||
                    leader?.images?.thumbnail ||
                    leader?.images?.original ||
                    ''
                  const leaderImageUrl = leaderImage
                    ? resolveAssetUrl(leaderImage)
                    : null

                  return (
                    <Card
                      key={leader.id || leader.name || leader.position}
                      className="flex flex-col gap-3 p-4 sm:flex-row"
                    >
                      <ImageWithFallback
                        src={leaderImageUrl}
                        alt={leader.name || leader.position || 'Leader'}
                        className="h-20 w-20 rounded-md object-cover"
                        fallbackText="No image"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {leader.position || 'Leader'}
                        </p>
                        {leader.title && (
                          <p className="text-sm text-muted-foreground">
                            {leader.title}
                          </p>
                        )}
                        {leader.name && (
                          <p className="text-sm text-foreground">
                            {leader.name}
                          </p>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Past Leaders
            </h2>
            {pastLeaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No past leaders listed.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pastLeaders.map((leader) => {
                  const leaderImage =
                    leader?.images?.medium ||
                    leader?.images?.large ||
                    leader?.images?.thumbnail ||
                    leader?.images?.original ||
                    ''
                  const leaderImageUrl = leaderImage
                    ? resolveAssetUrl(leaderImage)
                    : null

                  return (
                    <Card
                      key={leader.id || leader.name || leader.position}
                      className="flex flex-col gap-3 p-4 sm:flex-row"
                    >
                      <ImageWithFallback
                        src={leaderImageUrl}
                        alt={leader.name || leader.position || 'Leader'}
                        className="h-20 w-20 rounded-md object-cover"
                        fallbackText="No image"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {leader.position || 'Leader'}
                        </p>
                        {leader.title && (
                          <p className="text-sm text-muted-foreground">
                            {leader.title}
                          </p>
                        )}
                        {leader.name && (
                          <p className="text-sm text-foreground">
                            {leader.name}
                          </p>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </StateGate>
    </section>
  )
}

export default ClanDetail
