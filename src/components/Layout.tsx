import { memo, type ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  step: number
  onRestart: () => void
}

const progressWidths = [
  'w-0',
  'w-[16.6667%]',
  'w-[33.3333%]',
  'w-1/2',
  'w-[66.6667%]',
  'w-[83.3333%]',
  'w-full',
] as const

function LayoutComponent({ children, step, onRestart }: LayoutProps) {
  const progressWidth = progressWidths[Math.min(step, 6)] ?? 'w-full'
  const showRestart = step >= 1 && step <= 5
  const progressValue = Math.min(step, 6)

  return (
    <div className="cinematch-shell relative isolate min-h-screen overflow-hidden text-[color:var(--cm-text)]">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      >
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18" />
          </feComponentTransfer>
        </filter>
      </svg>

      <div aria-hidden="true" className="grain-overlay pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-[color:var(--cm-border)]">
        <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 px-6 py-7 sm:px-8">
          <div className="space-y-1">
            <p className="[font-family:var(--cm-font-mono)] text-[0.7rem] uppercase tracking-[0.5em] text-[color:var(--cm-gold)] sm:text-xs">
              CINEMATCH
            </p>
            <p className="[font-family:var(--cm-font-mono)] text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--cm-text-muted)] sm:text-[0.72rem]">
              Psychologically-grounded film recommendation
            </p>
          </div>

          {showRestart ? (
            <button
              className="cinematch-focus [font-family:var(--cm-font-mono)] rounded-sm border border-[color:var(--cm-border-strong)] px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--cm-text-muted)] transition hover:border-[color:var(--cm-gold)] hover:text-[color:var(--cm-text)]"
              onClick={onRestart}
              type="button"
            >
              Restart
            </button>
          ) : null}
        </div>

        <div
          aria-label="Questionnaire progress"
          aria-valuemax={6}
          aria-valuemin={0}
          aria-valuenow={progressValue}
          className="h-[2px] w-full bg-[color:var(--cm-progress-track)]"
          role="progressbar"
        >
          <div
            className={`${progressWidth} h-full bg-gradient-to-r from-[color:var(--cm-gold)] to-[color:var(--cm-copper)] transition-[width] duration-500 ease-out`}
          />
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-102px)] items-start">
        <div className="fade-step mx-auto w-full max-w-xl px-6 py-10 sm:px-8 sm:py-14">
          {children}
        </div>
      </main>
    </div>
  )
}

export const Layout = memo(LayoutComponent)

export default Layout
