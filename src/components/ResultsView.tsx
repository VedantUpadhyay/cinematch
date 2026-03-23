import { memo, useEffect, useRef, useState } from 'react'
import { useFeedback } from '../hooks/useFeedback'
import type { FeedbackRating, Recommendation, UserProfile } from '../types'
import AxisBar from './AxisBar'
import ProfileSummary from './ProfileSummary'

type ResultsViewProps = {
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
  profile,
  recommendations,
}: ResultsViewProps) {
  const { getRating, hasRated, submitFeedback } = useFeedback()
  const [thanksIds, setThanksIds] = useState<Set<number>>(() => new Set())
  const timeoutHandles = useRef<Map<number, number>>(new Map())

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

  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel)] p-6 sm:p-8">
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
        <footer className="mt-6 border-t border-[rgba(232,224,212,0.08)] pt-4">
          <p className="[font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--cm-text-muted)]">
            Model Steering: Five-axis profile, mood state, and coping style
            ({copingDescription})
          </p>
        </footer>
      </section>

      <ProfileSummary profile={profile} />

      <section aria-label="Film recommendations" className="space-y-5">
        {recommendations.map((recommendation, index) => (
          <article
            key={recommendation.tmdbId}
            className="rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-7"
          >
            <header className="flex flex-col gap-3 border-b border-[rgba(232,224,212,0.08)] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="[font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--cm-copper)]">
                  Recommendation {index + 1}
                </p>
                <h2 className="mt-2 text-2xl leading-tight text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
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

            <p className="mt-5 text-lg italic leading-7 text-[color:var(--cm-text-soft)] [font-family:var(--cm-font-serif)]">
              {recommendation.tagline}
            </p>

            <p className="mt-5 text-base leading-7 text-[color:var(--cm-text)]">
              {recommendation.why}
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

            <div className="mt-5 flex items-center justify-end gap-2">
              {(['up', 'down'] as const).map((rating) => {
                const currentRating = getRating(recommendation.tmdbId)
                const isSelected = currentRating === rating
                const isLocked = currentRating !== null
                const label = rating === 'up' ? 'Thumbs up' : 'Thumbs down'

                return (
                  <button
                    key={rating}
                    aria-label={`${label} for ${recommendation.title}`}
                    className={[
                      'cinematch-focus inline-flex h-9 w-9 items-center justify-center rounded-full border text-base transition',
                      isSelected
                        ? 'border-[color:var(--cm-gold)] bg-[rgba(212,168,67,0.16)] text-[color:var(--cm-gold)]'
                        : isLocked
                          ? 'cursor-not-allowed border-[rgba(232,224,212,0.08)] bg-transparent text-[color:var(--cm-text-muted)] opacity-45'
                          : 'border-[rgba(232,224,212,0.12)] bg-transparent text-[color:var(--cm-text-muted)] hover:border-[color:var(--cm-gold)] hover:bg-[rgba(212,168,67,0.08)] hover:text-[color:var(--cm-text)]',
                    ].join(' ')}
                    disabled={isLocked}
                    onClick={() => handleRate(recommendation, rating)}
                    type="button"
                  >
                    <span aria-hidden="true">{rating === 'up' ? '👍' : '👎'}</span>
                  </button>
                )
              })}

              <span
                aria-live="polite"
                className={[
                  '[font-family:var(--cm-font-mono)] text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--cm-copper)] transition duration-300',
                  thanksIds.has(recommendation.tmdbId)
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-1 opacity-0',
                ].join(' ')}
              >
                Thanks
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export const ResultsView = memo(ResultsViewComponent)

export default ResultsView
