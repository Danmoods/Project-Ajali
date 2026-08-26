import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Siren, Flame, ShieldAlert, Waves, Asterisk, ArrowLeft } from 'lucide-react'

const CATEGORIES = [
  { id: 'ambulance', label: 'Ambulance', icon: Siren, category: 'Medical Emergency' },
  { id: 'fire', label: 'Fire', icon: Flame, category: 'Fire Emergency' },
  { id: 'police', label: 'Police', icon: ShieldAlert, category: 'Security Incident' },
  { id: 'lifeguard', label: 'Lifeguard', icon: Waves, category: 'Water Rescue' },
  { id: 'all', label: 'All-in-One', icon: Asterisk, category: 'Vehicle Accident' },
]

export default function ReportCategory() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  const handleContinue = () => {
    if (!selected) return
    navigate('/app/report/new', { state: { category: selected } })
  }

  return (
    <div className="mx-auto max-w-3xl animate-fadeUp">
      <div className="mb-8 flex items-center gap-3">
        <Link
          to="/app"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-crimson-400 transition hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Report an Emergency</h1>
          <p className="text-sm text-slate-400">What kind of emergency are you reporting?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CATEGORIES.map(({ id, label, icon: Icon, category }) => {
          const active = selected?.id === id
          return (
            <button
              key={id}
              onClick={() => setSelected({ id, label, category })}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition ${
                active
                  ? 'border-crimson-500 bg-crimson-500/10 shadow-glow'
                  : 'border-white/[0.06] bg-ink-800/70 hover:border-white/20'
              }`}
            >
              <Icon size={26} className={active ? 'text-crimson-400' : 'text-slate-300'} />
              <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-200'}`}>{label}</span>
            </button>
          )
        })}
      </div>

      <button onClick={handleContinue} disabled={!selected} className="btn-primary mt-8 w-full">
        Continue
      </button>
    </div>
  )
}
