import { Link } from 'react-router-dom'
import { MapPin, ChevronRight } from 'lucide-react'
import Badge from './Badge.jsx'

const SEVERITY_BAR = {
  Critical: 'bg-crimson-500',
  Warning: 'bg-amber-500',
  Resolved: 'bg-mint-500',
}

export default function IncidentCard({ incident, to, timeAgo }) {
  const bar = SEVERITY_BAR[incident.severity] || 'bg-sky-400'

  const content = (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-ink-800/70 p-4 pl-5 transition hover:border-crimson-500/30 hover:bg-ink-800">
      <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} />

      <div className="flex items-start justify-between gap-3">
        <Badge
          tone={
            incident.severity === 'Critical'
              ? 'critical'
              : incident.severity === 'Resolved'
                ? 'success'
                : 'warning'
          }
        >
          {incident.severity}
        </Badge>

        <span className="text-xs text-slate-500">
          {timeAgo || incident.time}
        </span>
      </div>

      <h4 className="mt-2 font-semibold text-slate-100 group-hover:text-white">
        {incident.title}
      </h4>

      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
        <MapPin size={13} className="text-crimson-400" />
        {incident.location}
      </p>

      {to && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-crimson-400 opacity-0 transition group-hover:opacity-100">
          View details <ChevronRight size={14} />
        </span>
      )}
    </div>
  )

  if (!to) return content

  return <Link to={to}>{content}</Link>
}
