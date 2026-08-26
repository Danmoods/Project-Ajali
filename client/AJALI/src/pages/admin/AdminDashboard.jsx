import { Link } from 'react-router-dom'
import { TrendingUp, ClipboardList, ShieldCheck, CheckCheck, XCircle, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { adminStats, adminIncidentRows } from '../../data/seed.js'

const STATS = [
  { key: 'total', label: 'Total Reports', icon: TrendingUp, value: adminStats.total.toLocaleString(), note: '+12% from last week', tone: 'text-white' },
  { key: 'pending', label: 'Pending', icon: ClipboardList, value: adminStats.pending, note: 'Requires triage', tone: 'text-amber-400' },
  { key: 'investigating', label: 'Investigating', icon: ShieldCheck, value: adminStats.investigating, note: 'Active field teams', tone: 'text-mint-400' },
  { key: 'resolved', label: 'Resolved', icon: CheckCheck, value: adminStats.resolved.toLocaleString(), note: 'Archived reports', tone: 'text-white' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, value: adminStats.rejected, note: 'Invalid or spam', tone: 'text-crimson-400' },
]

export default function AdminDashboard() {
  const { incidents } = useData()

  return (
    <div className="animate-fadeUp">
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">System Overview</h1>
      <p className="mt-1 text-sm text-slate-400">Real-time emergency reporting metrics and incident management.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {STATS.map(({ key, label, icon: Icon, value, note, tone }) => (
          <div key={key} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <Icon size={16} className="text-slate-500" />
            </div>
            <p className={`mt-3 font-display text-2xl font-bold ${tone}`}>{value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{note}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5">
          <h2 className="font-display font-semibold text-white">Recent Incidents</h2>
          <div className="flex gap-2">
            <button className="btn-secondary !px-3 !py-2 text-xs">
              <Filter size={14} /> Filter
            </button>
            <button className="btn-secondary !px-3 !py-2 text-xs">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminIncidentRows.map((row) => {
                const linked = incidents.find((i) => i.title === row.title)
                const Row = (
                  <tr className="border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{row.id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-100">{row.title}</td>
                    <td className="px-5 py-4">
                      <Badge tone="neutral">{row.category}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{row.location}</td>
                    <td className="px-5 py-4 text-slate-500">{row.date}</td>
                    <td className="px-5 py-4">
                      <Badge>{row.status}</Badge>
                    </td>
                  </tr>
                )
                return linked ? (
                  <Link key={row.id} to={`/admin/incidents/${linked.id}`} className="contents">
                    {Row}
                  </Link>
                ) : (
                  <tr key={row.id} className="contents">
                    {Row}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 text-xs text-slate-500">
          <span>Showing 1 to {adminIncidentRows.length} of {adminStats.total.toLocaleString()} entries</span>
          <div className="flex gap-1">
            <button className="rounded-lg p-1.5 hover:bg-white/5" aria-label="Previous page">
              <ChevronLeft size={15} />
            </button>
            <button className="rounded-lg p-1.5 hover:bg-white/5" aria-label="Next page">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
