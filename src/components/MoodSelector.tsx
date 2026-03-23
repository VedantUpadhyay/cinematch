import { memo, useEffect, useRef, useState } from 'react'
import { COPING_OPTIONS, moods } from '../data/moods'
import type { CopingStyle } from '../types'

type MoodSelectorProps = {
  onMoodSelect: (moodKey: string, copingStyle: CopingStyle) => void
}

const moodToneClasses: Record<string, string> = {
  sad: 'hover:border-[#6B8DAE] hover:bg-[#6B8DAE22] data-[selected=true]:border-[#6B8DAE] data-[selected=true]:bg-[#6B8DAE22] data-[selected=true]:shadow-[0_0_24px_rgba(107,141,174,0.18)]',
  anxious:
    'hover:border-[#C4956A] hover:bg-[#C4956A22] data-[selected=true]:border-[#C4956A] data-[selected=true]:bg-[#C4956A22] data-[selected=true]:shadow-[0_0_24px_rgba(196,149,106,0.18)]',
  restless:
    'hover:border-[#D4654A] hover:bg-[#D4654A22] data-[selected=true]:border-[#D4654A] data-[selected=true]:bg-[#D4654A22] data-[selected=true]:shadow-[0_0_24px_rgba(212,101,74,0.18)]',
  reflective:
    'hover:border-[#8B7EC8] hover:bg-[#8B7EC822] data-[selected=true]:border-[#8B7EC8] data-[selected=true]:bg-[#8B7EC822] data-[selected=true]:shadow-[0_0_24px_rgba(139,126,200,0.2)]',
  joyful:
    'hover:border-[#D4A843] hover:bg-[#D4A84322] data-[selected=true]:border-[#D4A843] data-[selected=true]:bg-[#D4A84322] data-[selected=true]:shadow-[0_0_24px_rgba(212,168,67,0.2)]',
  numb: 'hover:border-[#7A8B8B] hover:bg-[#7A8B8B22] data-[selected=true]:border-[#7A8B8B] data-[selected=true]:bg-[#7A8B8B22] data-[selected=true]:shadow-[0_0_24px_rgba(122,139,139,0.18)]',
}

const copingToneClasses: Record<CopingStyle, string> = {
  'lean-in':
    'hover:border-[color:var(--cm-gold)] hover:bg-[rgba(212,168,67,0.12)] data-[selected=true]:border-[color:var(--cm-gold)] data-[selected=true]:bg-[rgba(212,168,67,0.12)] data-[selected=true]:shadow-[0_0_24px_rgba(212,168,67,0.16)]',
  'shift-away':
    'hover:border-[color:var(--cm-copper)] hover:bg-[rgba(196,149,106,0.12)] data-[selected=true]:border-[color:var(--cm-copper)] data-[selected=true]:bg-[rgba(196,149,106,0.12)] data-[selected=true]:shadow-[0_0_24px_rgba(196,149,106,0.16)]',
}

function MoodSelectorComponent({ onMoodSelect }: MoodSelectorProps) {
  const [selectedMoodKey, setSelectedMoodKey] = useState<string | null>(null)
  const [selectedCopingKey, setSelectedCopingKey] = useState<CopingStyle | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function handleMoodSelect(key: string) {
    if (isSubmitting) {
      return
    }

    setSelectedMoodKey(key)
    setSelectedCopingKey(null)
  }

  function handleCopingSelect(copingStyle: CopingStyle) {
    if (!selectedMoodKey || isSubmitting) {
      return
    }

    setSelectedCopingKey(copingStyle)
    setIsSubmitting(true)
    timeoutRef.current = window.setTimeout(() => {
      onMoodSelect(selectedMoodKey, copingStyle)
    }, 350)
  }

  return (
    <section className="space-y-6">
      <div className="rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <p className="[font-family:var(--cm-font-mono)] text-[0.74rem] uppercase tracking-[0.18em] text-[color:var(--cm-gold)]">
          Current State — Emotional Context
        </p>

        <h1 className="mt-4 text-[28px] leading-tight text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
          How are you feeling right now?
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--cm-text-soft)] [font-family:var(--cm-font-serif)]">
          This calibrates mood-regulation — some films match your state, others
          shift it.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          {moods.map((mood) => {
            const isSelected = selectedMoodKey === mood.key

            return (
              <button
                key={mood.key}
                className={`cinematch-focus flex min-h-[124px] flex-col items-start justify-between rounded-sm border border-[color:var(--cm-border)] bg-[rgba(18,16,14,0.86)] p-5 text-left transition duration-200 ${moodToneClasses[mood.key]} ${isSubmitting ? 'cursor-default' : 'cursor-pointer'}`}
                data-selected={isSelected}
                disabled={isSubmitting}
                onClick={() => handleMoodSelect(mood.key)}
                type="button"
              >
                <span className="text-3xl leading-none">{mood.emoji}</span>
                <span className="mt-5 text-base leading-6 text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
                  {mood.label}
                </span>
              </button>
            )
          })}
        </div>

        <div
          aria-hidden={selectedMoodKey === null}
          className={`mt-6 grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
            selectedMoodKey
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className={`min-h-0 overflow-hidden ${selectedMoodKey ? 'expand-fade-panel' : ''}`}>
            <section className="rounded-sm border border-[rgba(232,224,212,0.08)] bg-[rgba(255,255,255,0.02)] p-5 sm:p-6">
              <p className="[font-family:var(--cm-font-mono)] text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--cm-copper)]">
                Coping Style
              </p>
              <h2 className="mt-3 text-xl leading-tight text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)] sm:text-2xl">
                Do you want to lean into that feeling or shift away from it?
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {COPING_OPTIONS.map((option) => {
                  const isSelected = selectedCopingKey === option.key

                  return (
                    <button
                      key={option.key}
                      className={`cinematch-focus flex min-h-[150px] flex-col items-start rounded-sm border border-[color:var(--cm-border)] bg-[rgba(18,16,14,0.86)] p-4 text-left transition duration-200 sm:p-5 ${copingToneClasses[option.key]} ${selectedMoodKey && !isSubmitting ? 'cursor-pointer' : 'cursor-default'}`}
                      data-selected={isSelected}
                      disabled={!selectedMoodKey || isSubmitting}
                      onClick={() => handleCopingSelect(option.key)}
                      type="button"
                    >
                      <span className="text-3xl leading-none">{option.emoji}</span>
                      <span className="mt-5 text-sm leading-6 text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)] sm:text-base">
                        {option.label}
                      </span>
                      <span className="mt-3 text-xs leading-5 text-[color:var(--cm-text-muted)] [font-family:var(--cm-font-mono)] uppercase tracking-[0.08em] sm:text-[0.72rem]">
                        {option.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <aside className="rounded-sm border border-[rgba(139,126,200,0.2)] bg-[rgba(139,126,200,0.08)] p-5">
        <p className="[font-family:var(--cm-font-mono)] text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--cm-lavender)]">
          Research Citation
        </p>
        <p className="mt-3 text-sm leading-6 text-[rgba(232,224,212,0.72)] [font-family:var(--cm-font-serif)]">
          Mood Management Theory (Zillmann, 1988) — viewers select media to
          regulate emotional states. Some seek mood-congruent content
          (catharsis), others seek mood-incongruent content (escape). Your
          coping style determines which direction we steer.
        </p>
      </aside>
    </section>
  )
}

export const MoodSelector = memo(MoodSelectorComponent)

export default MoodSelector
