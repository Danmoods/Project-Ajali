import { Link } from 'react-router-dom'
import { MapPin, Pencil, Trash2, TriangleAlert, ArrowRight, FilePlus2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import Badge from '../components/ui/Badge.jsx'

export default function Reports() {
  const { incidents, removeIncident } = useData()

  return (
    <div className="animate-fadeUp">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">My Reports</h1>
          <p className="mt-1 text-sm text-slate-400">Manage and track the incidents you have reported.</p>
        </div>
        <Link to="/app/report" className="btn-primary">
          <FilePlus2 size={16} /> New Report
        </Link>
      </div>

      {incidents.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <TriangleAlert className="text-slate-600" size={32} />
          <p className="font-semibold text-slate-200">No reports yet</p>
          <p className="max-w-xs text-sm text-slate-500">Reports you submit will show up here so you can track their status.</p>
          <Link to="/app/report" className="btn-primary mt-2">
            Report an incident
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {incidents.map((incident) => (
            <div key={incident.id} className="card flex flex-col gap-4 border-l-4 border-l-crimson-500/60 p-5">
              <div className="flex items-center justify-between">
                <Badge>{incident.status}</Badge>
                <span className="text-xs text-slate-500">{incident.date}</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-white">{incident.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin size={13} className="text-crimson-400" /> {incident.location}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-400">
                <TriangleAlert size={12} /> {incident.category}
              </span>

              <div className="mt-1 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <Link
                  to={`/app/reports/${incident.id}`}
                  className="flex items-center gap-1 text-sm font-semibold text-crimson-400 hover:text-crimson-300"
                >
                  View Details <ArrowRight size={14} />
                </Link>
                <div className="flex items-center gap-1">
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Edit report">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => removeIncident(incident.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-crimson-500/10 hover:text-crimson-400"
                    aria-label="Delete report"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
