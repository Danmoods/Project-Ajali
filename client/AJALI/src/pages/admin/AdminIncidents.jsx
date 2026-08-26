import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function AdminIncidents() {
  const { incidents } = useData()

  return (
    <div className="animate-fadeUp">
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">All Incidents</h1>
      <p className="mt-1 text-sm text-slate-400">Review, triage, and update the status of reported incidents.</p>

      <div className="mt-6 space-y-3">
        {incidents.map((incident) => (
          <Link
            key={incident.id}
            to={`/admin/incidents/${incident.id}`}
            className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-ink-800/70 p-4 transition hover:border-crimson-500/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-500">#{incident.id}</span>
                <Badge tone="neutral">{incident.category}</Badge>
              </div>
              <p className="mt-1 font-semibold text-slate-100">{incident.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={12} className="text-crimson-400" /> {incident.location}
              </p>
            </div>
            <Badge>{incident.status}</Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
