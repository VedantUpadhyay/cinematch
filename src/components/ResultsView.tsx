import { memo, useEffect, useRef, useState } from 'react'
import { useFeedback } from '../hooks/useFeedback'
import type { FeedbackRating, Recommendation, UserProfile } from '../types'
import AxisBar from './AxisBar'
import ProfileSummary from './ProfileSummary'

type ResultsViewProps = {
  onReset: () => void
  profile: UserProfile
  recommendations: Recommendation[]
}

const axisLabels = [
  ['hedonic', 'Hedonic'],
  ['arousal', 'Arousal'],
  ['moralFlex', 'Moral Ambiguity Tolerance'],
  ['literacy', 'Complexity Tolerance'],
  ['social', 'Social'],
] as const

function ResultsViewComponent({
  onReset,
  profile,
  recommendations,
}: ResultsViewProps) {
  const { getRating, hasRated, submitFeedback } = useFeedback()
  const [thanksIds, setThanksIds] = useState<Set<number>>(() => new Set())
  const [expandedTopIds, setExpandedTopIds] = useState<Set<number>>(() => new Set())
  const [expandedDiscoveryId, setExpandedDiscoveryId] = useState<number | null>(
    null,
  )
  const [activeDiscoveryIndex, setActiveDiscoveryIndex] = useState(0)
  const [hasDiscoveryOverflow, setHasDiscoveryOverflow] = useState(false)
  const [showDiscoveryFade, setShowDiscoveryFade] = useState(false)
  const timeoutHandles = useRef<Map<number, number>>(new Map())
  const discoveryRowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      timeoutHandles.current.forEach((handle) => {
        window.clearTimeout(handle)
      })
      timeoutHandles.current.clear()
    }
  }, [])

  const copingDescription =
    profile.copingStyle === 'lean-in'
      ? 'mood-congruent catharsis'
      : profile.copingStyle === 'shift-away'
        ? 'gentle mood redirection'
        : 'balanced mood regulation'

  const tieredRecommendations = recommendations.map((recommendation, index) => ({
    ...recommendation,
    tier:
      recommendation.tier === 1 || recommendation.tier === 2
        ? recommendation.tier
        : index < 3
          ? 1
          : 2,
  }))
  const topMatches = tieredRecommendations.filter(
    (recommendation) => recommendation.tier === 1,
  )
  const discoveryPicks = tieredRecommendations.filter(
    (recommendation) => recommendation.tier === 2,
  )

  useEffect(() => {
    const syncDiscoveryState = () => {
      const row = discoveryRowRef.current

      if (!row || discoveryPicks.length === 0) {
        setActiveDiscoveryIndex(0)
        setHasDiscoveryOverflow(false)
        setShowDiscoveryFade(false)
        return
      }

      const overflow = row.scrollWidth - row.clientWidth > 8
      setHasDiscoveryOverflow(overflow)
      setShowDiscoveryFade(
        overflow && row.scrollLeft + row.clientWidth < row.scrollWidth - 4,
      )

      const cards = Array.from(row.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement,
      )

      if (cards.length === 0) {
        setActiveDiscoveryIndex(0)
        return
      }

      const viewportCenter = row.scrollLeft + row.clientWidth / 2
      let nearestIndex = 0
      let nearestDistance = Number.POSITIVE_INFINITY

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(cardCenter - viewportCenter)

        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = index
        }
      })

      setActiveDiscoveryIndex(nearestIndex)
    }

    syncDiscoveryState()
    window.addEventListener('resize', syncDiscoveryState)

    return () => {
      window.removeEventListener('resize', syncDiscoveryState)
    }
  }, [discoveryPicks.length, expandedDiscoveryId])

  const handleRate = (recommendation: Recommendation, rating: FeedbackRating) => {
    if (hasRated(recommendation.tmdbId)) {
      return
    }

    void submitFeedback(recommendation, rating, profile)

    setThanksIds((current) => {
      const next = new Set(current)
      next.add(recommendation.tmdbId)
      return next
    })

    const existingHandle = timeoutHandles.current.get(recommendation.tmdbId)

    if (existingHandle) {
      window.clearTimeout(existingHandle)
    }

    const nextHandle = window.setTimeout(() => {
      setThanksIds((current) => {
        const next = new Set(current)
        next.delete(recommendation.tmdbId)
        return next
      })
      timeoutHandles.current.delete(recommendation.tmdbId)
    }, 1500)

    timeoutHandles.current.set(recommendation.tmdbId, nextHandle)
  }

  const toggleTopMatch = (tmdbId: number) => {
    setExpandedTopIds((current) => {
      const next = new Set(current)

      if (next.has(tmdbId)) {
        next.delete(tmdbId)
      } else {
        next.add(tmdbId)
      }

      return next
    })
  }

  const toggleDiscoveryPick = (tmdbId: number) => {
    setExpandedDiscoveryId((current) => (current === tmdbId ? null : tmdbId))
  }

  const scrollToDiscoveryCard = (index: number) => {
    const row = discoveryRowRef.current
    const card = row?.children[index]

    if (!(card instanceof HTMLElement)) {
      return
    }

    card.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }

  const renderFeedbackControls = (
    recommendation: Recommendation,
    options?: {
      compact?: boolean
      stopPropagation?: boolean
    },
  ) => {
    const currentRating = getRating(recommendation.tmdbId)
    const compact = options?.compact ?? false
    const stopPropagation = options?.stopPropagation ?? false

    return (
      <div className="mt-5 flex items-center justify-end gap-2">
        {(['up', 'down'] as const).map((rating) => {
          const isSelected = currentRating === rating
          const isLocked = currentRating !== null
          const label = rating === 'up' ? 'Thumbs up' : 'Thumbs down'

          return (
            <button
              key={rating}
              aria-label={`${label} for ${recommendation.title}`}
              className={[
                'cinematch-focus inline-flex items-center justify-center rounded-full border transition',
                compact ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-base',
                isSelected
                  ? 'border-[color:var(--cm-gold)] bg-[rgba(212,168,67,0.16)] text-[color:var(--cm-gold)]'
                  : isLocked
                    ? 'cursor-not-allowed border-[rgba(232,224,212,0.08)] bg-transparent text-[color:var(--cm-text-muted)] opacity-45'
                    : 'border-[rgba(232,224,212,0.12)] bg-transparent text-[color:var(--cm-text-muted)] hover:border-[color:var(--cm-gold)] hover:bg-[rgba(212,168,67,0.08)] hover:text-[color:var(--cm-text)]',
              ].join(' ')}
              disabled={isLocked}
              onClick={(event) => {
                if (stopPropagation) {
                  event.stopPropagation()
                }

                handleRate(recommendation, rating)
              }}
              type="button"
            >
              <span aria-hidden="true">{rating === 'up' ? '👍' : '👎'}</span>
            </button>
          )
        })}

        <span
          aria-live="polite"
          className={[
            '[font-family:var(--cm-font-mono)] uppercase tracking-[0.14em] text-[color:var(--cm-copper)] transition duration-300',
            compact ? 'text-[0.64rem]' : 'text-[0.7rem]',
            thanksIds.has(recommendation.tmdbId)
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-1 opacity-0',
          ].join(' ')}
        >
          Thanks
        </span>
      </div>
    )
  }

  const renderTopMatchCard = (recommendation: Recommendation, index: number) => {
    const isExpanded = expandedTopIds.has(recommendation.tmdbId)
    const explanationId = `top-match-why-${recommendation.tmdbId}`

    return (
      <article
        key={recommendation.tmdbId}
        className="results-card-entrance rounded-sm border border-[color:var(--cm-border)] border-l-2 border-l-[color:var(--cm-gold)] bg-[color:var(--cm-panel)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-7"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <header className="flex flex-col gap-3 border-b border-[rgba(232,224,212,0.08)] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl leading-tight text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
              {recommendation.title}
            </h2>
          </div>
          <div className="flex flex-col gap-1 text-left sm:items-end sm:text-right">
            <p className="[font-family:var(--cm-font-mono)] text-[0.76rem] uppercase tracking-[0.14em] text-[color:var(--cm-text-muted)]">
              {recommendation.year}
            </p>
            <p className="[font-family:var(--cm-font-mono)] text-[0.76rem] uppercase tracking-[0.14em] text-[color:var(--cm-text-muted)]">
              {recommendation.genre}
            </p>
          </div>
        </header>

        <p className="mt-5 text-lg italic leading-7 text-[color:var(--cm-copper)] [font-family:var(--cm-font-serif)]">
          {recommendation.tagline}
        </p>

        <section className="mt-6 rounded-sm border border-[rgba(232,224,212,0.08)] bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
          <h3 className="[font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--cm-lavender)]">
            Axis Match
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {axisLabels.map(([key, label]) => (
              <AxisBar
                key={key}
                label={label}
                value={recommendation.axisScores[key]}
              />
            ))}
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            aria-controls={explanationId}
            aria-expanded={isExpanded}
            className="cinematch-focus [font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--cm-gold)] transition hover:text-[color:var(--cm-text)]"
            onClick={() => toggleTopMatch(recommendation.tmdbId)}
            type="button"
          >
            {isExpanded ? 'Hide why' : 'Why this film?'}
          </button>
        </div>

        <div
          aria-hidden={!isExpanded}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-200 ease-out ${
            isExpanded ? 'mt-4 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
          }`}
          id={explanationId}
        >
          <div className="min-h-0 overflow-hidden">
            <p className="rounded-sm border border-[rgba(232,224,212,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-base leading-7 text-[color:var(--cm-text)]">
              {recommendation.why}
            </p>
          </div>
        </div>

        {renderFeedbackControls(recommendation)}
      </article>
    )
  }

  const renderDiscoveryCard = (recommendation: Recommendation) => {
    const isExpanded = expandedDiscoveryId === recommendation.tmdbId
    const explanationId = `discovery-why-${recommendation.tmdbId}`

    return (
      <article
        key={recommendation.tmdbId}
        className="w-[240px] shrink-0 snap-start rounded-sm border border-[color:var(--cm-border)] border-l-2 border-l-[color:var(--cm-copper)] bg-[color:var(--cm-panel)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.32)] md:w-[248px]"
      >
        <div
          aria-controls={explanationId}
          aria-expanded={isExpanded}
          className="cursor-pointer"
          onClick={() => toggleDiscoveryPick(recommendation.tmdbId)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleDiscoveryPick(recommendation.tmdbId)
            }
          }}
          role="button"
          tabIndex={0}
        >
          <header className="space-y-2 border-b border-[rgba(232,224,212,0.08)] pb-4">
            <h2 className="text-base leading-snug text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)] md:text-[1.05rem]">
              {recommendation.title}
            </h2>
            <p className="[font-family:var(--cm-font-mono)] text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--cm-text-muted)]">
              {recommendation.year} • {recommendation.genre}
            </p>
          </header>

          <p className="mt-4 line-clamp-2 text-[13px] italic leading-6 text-[color:var(--cm-copper)] [font-family:var(--cm-font-serif)]">
            {recommendation.tagline}
          </p>

          <section className="mt-4 rounded-sm border border-[rgba(232,224,212,0.08)] bg-[rgba(255,255,255,0.02)] p-3.5">
            <h3 className="[font-family:var(--cm-font-mono)] text-[0.64rem] uppercase tracking-[0.16em] text-[color:var(--cm-lavender)]">
              Axis Match
            </h3>
            <div className="mt-3 space-y-3">
              {axisLabels.map(([key, label]) => (
                <AxisBar
                  compact
                  key={key}
                  label={label}
                  value={recommendation.axisScores[key]}
                />
              ))}
            </div>
          </section>

          <div
            aria-hidden={!isExpanded}
            className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-200 ease-out ${
              isExpanded ? 'mt-4 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
            }`}
            id={explanationId}
          >
            <div className="min-h-0 overflow-hidden">
              <p className="rounded-sm border border-[rgba(232,224,212,0.08)] bg-[rgba(255,255,255,0.02)] px-3.5 py-3.5 text-sm leading-6 text-[color:var(--cm-text)]">
                {recommendation.why}
              </p>
            </div>
          </div>
        </div>

        {renderFeedbackControls(recommendation, {
          compact: true,
          stopPropagation: true,
        })}
      </article>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="[font-family:var(--cm-font-mono)] text-[0.74rem] uppercase tracking-[0.18em] text-[color:var(--cm-gold)]">
              Results
            </p>
            <h1 className="mt-4 text-[28px] leading-tight text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
              Films matched to your psychological profile
            </h1>
            <p className="mt-4 text-base leading-7 text-[color:var(--cm-text-soft)]">
              Each recommendation explains how the film fits your current balance of
              mood, stimulation, moral complexity, and viewing context.
            </p>
          </div>

          <button
            className="cinematch-focus [font-family:var(--cm-font-mono)] self-start rounded-sm border border-[color:var(--cm-border-strong)] px-4 py-3 text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--cm-text-muted)] transition hover:border-[color:var(--cm-gold)] hover:bg-[rgba(212,168,67,0.08)] hover:text-[color:var(--cm-text)]"
            onClick={onReset}
            type="button"
          >
            Retake Profile
          </button>
        </div>

        <footer className="mt-6 border-t border-[rgba(232,224,212,0.08)] pt-4">
          <p className="[font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--cm-text-muted)]">
            Model Steering: Five-axis profile, mood state, and coping style
            ({copingDescription})
          </p>
        </footer>
      </section>

      <ProfileSummary profile={profile} />

      <p className="rounded-sm border border-[rgba(232,224,212,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm leading-6 text-[color:var(--cm-text-soft)]">
        Your top matches are films closest to your psychological profile.
        Discovery picks score slightly lower on axis alignment but introduce
        variety you might not expect.
      </p>

      <div aria-label="Film recommendations" className="space-y-8">
        <section className="space-y-5">
          <header className="space-y-2">
            <p className="[font-family:var(--cm-font-mono)] text-[0.74rem] uppercase tracking-[0.18em] text-[color:var(--cm-gold)]">
              TOP MATCHES — Strongest profile alignment
            </p>
          </header>

          <div className="space-y-5">
            {topMatches.map((recommendation, index) =>
              renderTopMatchCard(recommendation, index),
            )}
          </div>
        </section>

        <section className="space-y-5">
          <header className="space-y-2">
            <p className="[font-family:var(--cm-font-mono)] text-[0.74rem] uppercase tracking-[0.18em] text-[color:var(--cm-copper)]">
              DISCOVERY PICKS — Outside your comfort zone
            </p>
          </header>

          <div className="discovery-row-entrance space-y-4">
            <div className="relative -mx-6 px-6 sm:-mx-8 sm:px-8">
              <div
                aria-label="Discovery picks"
                className="discovery-scroll flex gap-4 overflow-x-auto overscroll-x-contain pb-1 pr-6 snap-x snap-mandatory md:pr-0"
                onScroll={() => {
                  const row = discoveryRowRef.current

                  if (!row) {
                    return
                  }

                  const overflow = row.scrollWidth - row.clientWidth > 8
                  setHasDiscoveryOverflow(overflow)
                  setShowDiscoveryFade(
                    overflow &&
                      row.scrollLeft + row.clientWidth < row.scrollWidth - 4,
                  )

                  const cards = Array.from(row.children).filter(
                    (child): child is HTMLElement => child instanceof HTMLElement,
                  )

                  if (cards.length === 0) {
                    setActiveDiscoveryIndex(0)
                    return
                  }

                  const viewportCenter = row.scrollLeft + row.clientWidth / 2
                  let nearestIndex = 0
                  let nearestDistance = Number.POSITIVE_INFINITY

                  cards.forEach((card, cardIndex) => {
                    const cardCenter = card.offsetLeft + card.offsetWidth / 2
                    const distance = Math.abs(cardCenter - viewportCenter)

                    if (distance < nearestDistance) {
                      nearestDistance = distance
                      nearestIndex = cardIndex
                    }
                  })

                  setActiveDiscoveryIndex(nearestIndex)
                }}
                ref={discoveryRowRef}
              >
                {discoveryPicks.map((recommendation) => renderDiscoveryCard(recommendation))}
              </div>

              {hasDiscoveryOverflow && showDiscoveryFade ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-[rgba(13,13,13,0.96)] via-[rgba(13,13,13,0.72)] to-transparent md:block"
                />
              ) : null}
            </div>

            {discoveryPicks.length > 1 ? (
              <div className="flex items-center justify-center gap-2">
                {discoveryPicks.map((recommendation, index) => (
                  <button
                    key={recommendation.tmdbId}
                    aria-label={`Jump to discovery pick ${index + 1}`}
                    className={[
                      'cinematch-focus h-2.5 rounded-full transition',
                      activeDiscoveryIndex === index
                        ? 'w-5 bg-[color:var(--cm-copper)]'
                        : 'w-2.5 bg-[rgba(196,149,106,0.24)] hover:bg-[rgba(196,149,106,0.44)]',
                    ].join(' ')}
                    onClick={() => scrollToDiscoveryCard(index)}
                    type="button"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

export const ResultsView = memo(ResultsViewComponent)

export default ResultsView
