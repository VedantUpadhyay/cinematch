import { memo, useEffect, useRef, useState } from 'react'
import type { Question } from '../types'

type QuestionCardProps = {
  question: Question
  onAnswer: (axis: Question['axis'], value: number) => void
  currentStep: number
}

function QuestionCardComponent({
  question,
  onAnswer,
  currentStep,
}: QuestionCardProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function handleSelect(value: number) {
    if (selectedValue !== null) {
      return
    }

    setSelectedValue(value)
    timeoutRef.current = window.setTimeout(() => {
      onAnswer(question.axis, value)
    }, 350)
  }

  return (
    <section className="space-y-6">
      <div className="rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <p className="[font-family:var(--cm-font-mono)] text-[0.74rem] uppercase tracking-[0.18em] text-[color:var(--cm-gold)]">
          {`Axis ${currentStep + 1} of 5 — ${question.description}`}
        </p>

        <h1 className="mt-4 text-[28px] leading-tight text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
          {question.label}
        </h1>

        <div className="mt-8 space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedValue === option.value

            return (
              <button
                key={`${question.axis}-${option.value}`}
                className={`cinematch-focus group flex w-full items-center gap-4 rounded-sm border px-4 py-4 text-left transition duration-200 sm:px-5 ${
                  isSelected
                    ? 'border-[color:var(--cm-gold)] bg-[rgba(212,168,67,0.14)] shadow-[0_0_28px_rgba(212,168,67,0.14)]'
                    : 'border-[color:var(--cm-border)] bg-[rgba(18,16,14,0.86)] hover:border-[color:var(--cm-border-strong)] hover:bg-[rgba(24,21,18,0.96)] hover:shadow-[0_0_24px_rgba(212,168,67,0.08)]'
                } ${selectedValue !== null ? 'cursor-default' : 'cursor-pointer'}`}
                disabled={selectedValue !== null}
                onClick={() => handleSelect(option.value)}
                type="button"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[color:var(--cm-border)] bg-[rgba(255,255,255,0.03)] text-2xl">
                  {option.emoji}
                </span>
                <span className="text-base leading-7 text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)]">
                  {option.label}
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
          {question.research}
        </p>
      </aside>
    </section>
  )
}

export const QuestionCard = memo(QuestionCardComponent)

export default QuestionCard
