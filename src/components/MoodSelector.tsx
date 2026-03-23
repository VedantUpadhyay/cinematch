import { memo, useEffect, useRef, useState } from 'react'
import moods from '../data/moods'

type MoodSelectorProps = {
  onMoodSelect: (key: string) => void
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

function MoodSelectorComponent({ onMoodSelect }: MoodSelectorProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function handleSelect(key: string) {
    if (selectedKey !== null) {
      return
    }

    setSelectedKey(key)
    timeoutRef.current = window.setTimeout(() => {
      onMoodSelect(key)
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
            const isSelected = selectedKey === mood.key

            return (
              <button
                key={mood.key}
                className={`cinematch-focus flex min-h-[124px] flex-col items-start justify-between rounded-sm border border-[color:var(--cm-border)] bg-[rgba(18,16,14,0.86)] p-5 text-left transition duration-200 ${moodToneClasses[mood.key]} ${selectedKey !== null ? 'cursor-default' : 'cursor-pointer'}`}
                data-selected={isSelected}
                disabled={selectedKey !== null}
                onClick={() => handleSelect(mood.key)}
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
      </div>

      <aside className="rounded-sm border border-[rgba(139,126,200,0.2)] bg-[rgba(139,126,200,0.08)] p-5">
        <p className="[font-family:var(--cm-font-mono)] text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--cm-lavender)]">
          Research Citation
        </p>
        <p className="mt-3 text-sm leading-6 text-[rgba(232,224,212,0.72)] [font-family:var(--cm-font-serif)]">
          Mood Management Theory (Zillmann, 1988) — viewers use media
          selection to regulate affect, either sustaining a desired state or
          shifting away from an unwanted one.
        </p>
      </aside>
    </section>
  )
}

export const MoodSelector = memo(MoodSelectorComponent)

export default MoodSelector
