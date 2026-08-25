import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, LocateFixed, X, TriangleAlert, Flame, CircleCheck } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

const PIN_POSITIONS = [
  { top: '28%', left: '42%' },
  { top: '46%', left: '26%' },
  { top: '62%', left: '58%' },
  { top: '20%', left: '68%' },
  { top: '72%', left: '34%' },
]

const ICONS = {
  Critical: TriangleAlert,
  Warning: Flame,
  Resolved: CircleCheck,
}

const ICON_TONE = {
  Critical: 'bg-crimson-500 text-white',
  Warning: 'bg-amber-500 text-ink-900',
  Resolved: 'bg-mint-500 text-ink-900',
}

export default function IncidentMap() {
  const { incidents } = useData()
  const [active, setActive] = useState(incidents[0]?.id || null)
  const [query, setQuery] = useState('')

  const pinned = incidents.slice(0, PIN_POSITIONS.length)
  const activeIncident = pinned.find((i) => i.id === active)

  return (
    <div className="animate-fadeUp">
      <div className="relative h-[70vh] min-h-[480px] overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-950">
        {/* Simulated map background */}
        <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 400 300">
          <rect width="400" height="300" fill="#070a13" />
          <path d="M0 60 H400 M0 140 H400 M0 220 H400" stroke="#1e2740" strokeWidth="1.5" />
          <path d="M70 0 V300 M180 0 V300 M290 0 V300" stroke="#1e2740" strokeWidth="1.5" />
          <path d="M0 30 Q200 120 400 40" stroke="#274067" strokeWidth="2.5" fill="none" />
          <path d="M0 250 Q220 160 400 260" stroke="#274067" strokeWidth="2.5" fill="none" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(240,38,79,0.08),transparent_55%)]" />

        {/* Search bar */}
        <div className="absolute left-3 right-3 top-3 sm:left-4 sm:right-auto sm:w-96">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/90 px-3 py-2.5 shadow-card backdrop-blur">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search locations or incidents…"
              className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
            <button className="rounded-lg p-1 text-slate-400 hover:text-white" aria-label="Filters">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Pins */}
        {pinned.map((incident, idx) => {
          const Icon = ICONS[incident.severity] || TriangleAlert
          const pos = PIN_POSITIONS[idx]
          return (
            <button
              key={incident.id}
              onClick={() => setActive(incident.id)}
              style={pos}
              className={`absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink-950 shadow-lg transition hover:scale-110 ${
                ICON_TONE[incident.severity] || ICON_TONE.Warning
              }`}
              aria-label={incident.title}
            >
              <Icon size={14} />
            </button>
          )
        })}

        {/* Popup */}
        {activeIncident && (
          <div className="absolute left-1/2 top-16 z-20 w-[calc(100vw-2.5rem)] max-w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-ink-900/95 p-4 shadow-card backdrop-blur sm:left-24 sm:w-72 sm:translate-x-0">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-sm font-semibold text-white">{activeIncident.title}</h3>
              <button onClick={() => setActive(null)} className="text-slate-500 hover:text-white" aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge border border-amber-500/30 bg-amber-500/15 text-amber-400">{activeIncident.status}</span>
              <span className="badge border border-white/10 bg-white/[0.05] text-slate-300">{activeIncident.category}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{activeIncident.location}</p>
            <Link to={`/app/reports/${activeIncident.id}`} className="btn-primary mt-3 w-full !py-2 text-xs">
              View Details
            </Link>
          </div>
        )}

        {/* Locate button */}
        <button
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-ink-800 text-slate-200 shadow-card transition hover:bg-ink-700"
          aria-label="Locate me"
        >
          <LocateFixed size={18} />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-600">
        Map view is a stylized representation for this demo build — connect a maps provider (e.g. Mapbox or Google Maps) for live tiles.
      </p>
    </div>
  )
}
