import { memo } from 'react'

type AxisBarProps = {
  label: string
  value: number
  compact?: boolean
}

function AxisBarComponent({ label, value, compact = false }: AxisBarProps) {
  const width = `${Math.max(0, Math.min(1, value)) * 100}%`

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={[
            '[font-family:var(--cm-font-mono)] uppercase tracking-[0.16em] text-[color:var(--cm-text-muted)]',
            compact ? 'text-[0.62rem]' : 'text-[0.68rem]',
          ].join(' ')}
        >
          {label}
        </span>
        <span
          className={[
            '[font-family:var(--cm-font-mono)] text-[color:var(--cm-text-soft)]',
            compact ? 'text-[0.66rem]' : 'text-[0.72rem]',
          ].join(' ')}
        >
          {value.toFixed(2)}
        </span>
      </div>
      <div
        aria-hidden="true"
        className={[
          'overflow-hidden rounded-full bg-[rgba(232,224,212,0.08)]',
          compact ? 'h-1.5' : 'h-2',
        ].join(' ')}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[color:var(--cm-gold)] to-[color:var(--cm-copper)]"
          style={{ width }}
        />
      </div>
    </div>
  )
}

export const AxisBar = memo(AxisBarComponent)

export default AxisBar
