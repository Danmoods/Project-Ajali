const TONES = {
  critical: 'bg-crimson-500/15 text-crimson-400 border border-crimson-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  success: 'bg-mint-500/15 text-mint-400 border border-mint-500/30',
  info: 'bg-sky-400/15 text-sky-400 border border-sky-400/30',
  neutral: 'bg-white/[0.06] text-slate-300 border border-white/10',
}

const STATUS_TONE = {
  critical: 'critical',
  pending: 'warning',
  'pending review': 'warning',
  'under review': 'warning',
  investigating: 'info',
  resolved: 'success',
  rejected: 'critical',
  warning: 'warning',
}

export default function Badge({ children, tone, dot = false }) {
  const key =
    tone || STATUS_TONE[String(children).toLowerCase()] || 'neutral'

  const classes = TONES[key] || TONES.neutral

  return (
    <span className={`badge ${classes}`}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulseDot" />
      )}
      {children}
    </span>
  )
}
