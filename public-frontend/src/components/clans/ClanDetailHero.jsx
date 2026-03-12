import { Link } from 'react-router-dom'
import AnimatedHeroIntro from '../motion/AnimatedHeroIntro.jsx'
import { Button } from '../ui/index.jsx'

function stripHtml(html) {
  if (!html) {
    return ''
  }

  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildSummary(caption, body) {
  const trimmedCaption = caption?.trim()

  if (trimmedCaption) {
    return trimmedCaption
  }

  const plainText = stripHtml(body)
  if (!plainText) {
    return 'Explore the heritage, symbols, and leadership lineage of this clan.'
  }

  if (plainText.length <= 180) {
    return plainText
  }

  return `${plainText.slice(0, 177).trimEnd()}...`
}

export default function ClanDetailHero({
  name,
  caption,
  body,
  imageUrl,
  currentLeaderCount = 0,
  pastLeaderCount = 0,
  backTo = '/clans',
  historyAnchorId = 'clan-history',
  leadersAnchorId = 'clan-leadership',
}) {
  const clanName = name?.trim() || 'Clan'
  const summary = buildSummary(caption, body)
  const totalLeaders = currentLeaderCount + pastLeaderCount

  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_32%),linear-gradient(135deg,_#fffaf2_0%,_#ffffff_45%,_#f7f2e8_100%)] shadow-[0_24px_60px_rgba(28,25,23,0.08)]">
      <div className="px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <AnimatedHeroIntro
          className="space-y-6"
          entry="left"
          visualEntry="up"
          headline={
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-[#F3D3A2] bg-white/80 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#B45309] shadow-sm backdrop-blur">
                Clan Heritage
              </span>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-tight text-stone-950 sm:text-5xl lg:text-[3.7rem]">
                  {clanName}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                  {summary}
                </p>
              </div>
            </div>
          }
          subtext={
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-stone-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Current Leaders
                </p>
                <p className="mt-1 text-base font-semibold text-stone-900">
                  {currentLeaderCount}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Past Leaders
                </p>
                <p className="mt-1 text-base font-semibold text-stone-900">
                  {pastLeaderCount}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 shadow-sm">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Leadership Archive
                </p>
                <p className="mt-1 text-base font-semibold text-stone-900">
                  {totalLeaders} profile{totalLeaders === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                as={Link}
                to={backTo}
                variant="secondary"
                className="rounded-full border-stone-200 bg-white px-5 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              >
                Back to Clans
              </Button>
              <Button
                as="a"
                href={`#${historyAnchorId}`}
                className="rounded-full border-transparent bg-[#D97706] px-5 text-sm font-semibold text-white hover:bg-[#B45309]"
              >
                Read Clan History
              </Button>
              <Button
                as="a"
                href={`#${leadersAnchorId}`}
                variant="ghost"
                className="rounded-full border-stone-200 bg-white/75 px-5 text-sm font-semibold text-stone-700 hover:bg-white"
              >
                View Leadership
              </Button>
            </div>
          }
          visual={
            <div className="relative pt-2">
              <div className="pointer-events-none absolute left-6 top-14 h-28 w-28 rounded-full bg-amber-200/40 blur-3xl" />
              <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full bg-stone-300/30 blur-2xl" />

              <div className="relative mx-auto overflow-hidden rounded-[1.9rem] border border-white/75 bg-[linear-gradient(180deg,_#fbf7ef_0%,_#efe2cc_100%)] shadow-[0_22px_46px_rgba(28,25,23,0.16)]">
                <div className="aspect-[16/10] sm:aspect-[16/9] lg:aspect-[12/5]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${clanName} emblem`}
                      className="h-full w-full object-contain object-center p-4 sm:p-6 lg:p-8"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,_#f5ede1_0%,_#ead9bd_100%)] p-6">
                      <p className="max-w-[20rem] text-center text-2xl font-semibold leading-tight text-stone-900">
                        {clanName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  )
}
