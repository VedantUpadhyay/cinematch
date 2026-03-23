import { memo } from 'react'
import moods from '../data/moods'
import type { UserProfile } from '../types'
import AxisBar from './AxisBar'

type ProfileSummaryProps = {
  profile: UserProfile
}

const axisLabels = [
  ['hedonic', 'Hedonic'],
  ['arousal', 'Arousal'],
  ['moralFlex', 'Moral Flex'],
  ['literacy', 'Literacy'],
  ['social', 'Social'],
] as const

function ProfileSummaryComponent({ profile }: ProfileSummaryProps) {
  const mood = moods.find((item) => item.key === profile.mood)

  return (
    <section className="rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel-muted)] p-5 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="[font-family:var(--cm-font-mono)] text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--cm-copper)]">
            Profile Summary
          </p>
          <h2 className="mt-2 text-xl text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
            Who you are right now
          </h2>
        </div>

        {mood ? (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[color:var(--cm-border-strong)] px-3 py-2">
            <span aria-hidden="true" className="text-lg">
              {mood.emoji}
            </span>
            <span className="[font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--cm-text-soft)]">
              {mood.label}
            </span>
          </div>
        ) : null}
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {axisLabels.map(([key, label]) => (
          <AxisBar key={key} label={label} value={profile[key]} />
        ))}
      </div>
    </section>
  )
}

export const ProfileSummary = memo(ProfileSummaryComponent)

export default ProfileSummary
