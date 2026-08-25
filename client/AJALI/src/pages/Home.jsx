import { Link } from 'react-router-dom'
import { Wifi, ClipboardList, Users, Map, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import Badge from '../components/ui/Badge.jsx'

export default function Home() {
  const { user } = useAuth()
  const { incidents } = useData()

  const myReportsCount = incidents.length

  return (
    <div className="space-y-8 animate-fadeUp">
      <div>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Welcome back, {user?.username?.split(' ')[0] || 'friend'}!
        </h1>
        <p className="mt-1 text-sm text-slate-400">Stay alert and help keep your community safe.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link
          to="/app/report"
          className="col-span-2 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-crimson-500 to-crimson-700 p-6 text-white shadow-glow transition hover:brightness-110 lg:col-span-1"
        >
          <Wifi size={26} />
          <span className="mt-6 font-display font-semibold">Report Incident</span>
        </Link>

        <Link to="/app/reports" className="card flex flex-col justify-between p-6 transition hover:border-crimson-500/30">
          <ClipboardList size={22} className="text-crimson-400" />
          <div className="mt-6">
            <p className="font-display text-2xl font-bold text-white">{myReportsCount}</p>
            <p className="text-xs text-slate-500">My Reports</p>
          </div>
        </Link>

        <Link to="/app/community" className="card flex flex-col justify-between p-6 transition hover:border-crimson-500/30">
          <Users size={22} className="text-amber-400" />
          <div className="mt-6">
            <p className="font-display font-semibold text-white">Alerts</p>
            <p className="text-xs text-slate-500">Community</p>
          </div>
        </Link>

        <Link to="/app/map" className="card relative flex flex-col justify-between overflow-hidden p-6 transition hover:border-crimson-500/30">
          <Map size={22} className="text-sky-400" />
          <div className="mt-6">
            <p className="font-display font-semibold text-white">Live Map</p>
            <p className="text-xs text-slate-500">View Map</p>
          </div>
        </Link>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Recent Incidents</h2>
          <Link to="/app/reports" className="flex items-center gap-1 text-sm font-semibold text-crimson-400 hover:text-crimson-300">
            View All <ArrowRight size={15} />
          </Link>
        </div>

        <div className="space-y-3">
          {incidents.slice(0, 4).map((incident) => (
            <div
              key={incident.id}
              className={`flex flex-col gap-3 rounded-xl border-l-4 bg-ink-800/70 p-4 sm:flex-row sm:items-center sm:justify-between ${
                incident.severity === 'Critical' ? 'border-crimson-500' : incident.severity === 'Resolved' ? 'border-mint-500' : 'border-amber-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-crimson-400">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{incident.category}</Badge>
                    <span className="text-xs text-slate-500">{incident.time}</span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-100">{incident.title}</p>
                  <p className="text-xs text-slate-500">{incident.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-12 sm:pl-0">
                <Badge>{incident.status}</Badge>
                <Link to={`/app/reports/${incident.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
