import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  ClipboardList,
  ShieldCheck,
  CheckCheck,
  XCircle,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Badge from '../../components/ui/Badge.jsx'
import { getAdminDashboard } from '../../api/adminApi.js'

function formatStatus(status) {
  if (!status) return 'Unknown'

  return status
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString()
}

function getCategory(incident) {
  return incident.incident_type || 'Unknown'
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const data = await getAdminDashboard()

        if (mounted) {
          setDashboard(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load admin dashboard')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  const summary = dashboard?.summary || {}
  const counts = summary.status_counts || {}
  const incidents = dashboard?.recent_incidents || []

  const total = summary.total_reports || 0
  const investigating = counts['under investigation'] || 0
  const verified = counts.verified || 0
  const resolved = counts.resolved || 0
  const rejected = counts.rejected || 0

  const STATS = [
    {
      key: 'total',
      label: 'Total Reports',
      icon: TrendingUp,
      value: total.toLocaleString(),
      note: 'All reports',
      tone: 'text-white',
    },
    {
      key: 'investigating',
      label: 'Investigating',
      icon: ShieldCheck,
      value: investigating.toLocaleString(),
      note: 'Active investigations',
      tone: 'text-mint-400',
    },
    {
      key: 'verified',
      label: 'Verified',
      icon: ClipboardList,
      value: verified.toLocaleString(),
      note: 'Verified reports',
      tone: 'text-amber-400',
    },
    {
      key: 'resolved',
      label: 'Resolved',
      icon: CheckCheck,
      value: resolved.toLocaleString(),
      note: 'Resolved reports',
      tone: 'text-white',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      icon: XCircle,
      value: rejected.toLocaleString(),
      note: 'Invalid or rejected',
      tone: 'text-crimson-400',
    },
  ]

  if (loading) {
    return (
      <div className="animate-fadeUp">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          System Overview
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Loading real-time emergency reporting metrics...
        </p>

        <div className="mt-8 text-sm text-slate-500">
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fadeUp">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          System Overview
        </h1>

        <div className="card mt-6 p-6">
          <p className="text-sm text-crimson-400">
            {error}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Check that you are logged in as an administrator and that the
            Render API URL is correct.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeUp">
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
        System Overview
      </h1>

      <p className="mt-1 text-sm text-slate-400">
        Real-time emergency reporting metrics and incident management.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {STATS.map(({ key, label, icon: Icon, value, note, tone }) => (
          <div key={key} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {label}
              </span>

              <Icon size={16} className="text-slate-500" />
            </div>

            <p
              className={`mt-3 font-display text-2xl font-bold ${tone}`}
            >
              {value}
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              {note}
            </p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5">
          <h2 className="font-display font-semibold text-white">
            Recent Incidents
          </h2>

          <div className="flex gap-2">
            <button className="btn-secondary !px-3 !py-2 text-xs">
              <Filter size={14} />
              Filter
            </button>

            <button className="btn-secondary !px-3 !py-2 text-xs">
              <Download size={14} />
              Export
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
              {incidents.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4 font-mono text-xs text-slate-400">
                    #{incident.id}
                  </td>

                  <td className="px-5 py-4 font-semibold text-slate-100">
                    <Link
                      to={`/admin/incidents/${incident.id}`}
                      className="hover:text-crimson-400"
                    >
                      {incident.title}
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    <Badge tone="neutral">
                      {getCategory(incident)}
                    </Badge>
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {incident.latitude != null &&
                    incident.longitude != null
                      ? `${Number(incident.latitude).toFixed(4)}, ${Number(
                          incident.longitude
                        ).toFixed(4)}`
                      : 'Location unavailable'}
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {formatDate(incident.created_at)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge>
                      {formatStatus(incident.status)}
                    </Badge>
                  </td>
                </tr>
              ))}

              {incidents.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 text-xs text-slate-500">
          <span>
            Showing {incidents.length} of {total.toLocaleString()} entries
          </span>

          <div className="flex gap-1">
            <button
              className="rounded-lg p-1.5 hover:bg-white/5"
              aria-label="Previous page"
              disabled
            >
              <ChevronLeft size={15} />
            </button>

            <button
              className="rounded-lg p-1.5 hover:bg-white/5"
              aria-label="Next page"
              disabled
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}