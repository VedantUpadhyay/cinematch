import { memo } from 'react'

type AxisBarProps = {
  label: string
  value: number
}

function AxisBarComponent({ label, value }: AxisBarProps) {
  const width = `${Math.max(0, Math.min(1, value)) * 100}%`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="[font-family:var(--cm-font-mono)] text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--cm-text-muted)]">
          {label}
        </span>
        <span className="[font-family:var(--cm-font-mono)] text-[0.72rem] text-[color:var(--cm-text-soft)]">
          {value.toFixed(2)}
        </span>
      </div>
      <div
        aria-hidden="true"
        className="h-2 overflow-hidden rounded-full bg-[rgba(232,224,212,0.08)]"
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
