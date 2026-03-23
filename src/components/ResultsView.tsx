import { memo } from 'react'
import type { Recommendation, UserProfile } from '../types'
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
  const copingDescription =
    profile.copingStyle === 'lean-in'
      ? 'mood-congruent catharsis'
      : profile.copingStyle === 'shift-away'
        ? 'gentle mood redirection'
        : 'balanced mood regulation'

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
            key={`${recommendation.title}-${recommendation.year}`}
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
          </article>
        ))}
      </section>
    </div>
  )
}

export const ResultsView = memo(ResultsViewComponent)

export default ResultsView
