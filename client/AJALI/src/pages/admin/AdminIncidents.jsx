import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Badge from '../../components/ui/Badge.jsx'
import { getAdminIncidents } from '../../api/adminApi.js'

function formatStatus(status) {
  if (!status) return 'Unknown'

  return status
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function AdminIncidents() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadIncidents() {
      try {
        setLoading(true)
        setError('')

        const data = await getAdminIncidents({
          page: 1,
          per_page: 100,
        })

        if (mounted) {
          setIncidents(data.items || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load incidents')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadIncidents()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="animate-fadeUp">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          All Incidents
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Loading incidents from the server...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fadeUp">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          All Incidents
        </h1>

        <div className="card mt-6 p-6">
          <p className="text-sm text-crimson-400">
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeUp">
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
        All Incidents
      </h1>

      <p className="mt-1 text-sm text-slate-400">
        Review, triage, and update the status of reported incidents.
      </p>

      <div className="mt-6 space-y-3">
        {incidents.map((incident) => (
          <Link
            key={incident.id}
            to={`/admin/incidents/${incident.id}`}
            className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-ink-800/70 p-4 transition hover:border-crimson-500/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-500">
                  #{incident.id}
                </span>

                <Badge tone="neutral">
                  {incident.incident_type || 'Unknown'}
                </Badge>
              </div>

              <p className="mt-1 font-semibold text-slate-100">
                {incident.title}
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={12} className="text-crimson-400" />

                {incident.latitude != null &&
                incident.longitude != null
                  ? `${Number(incident.latitude).toFixed(5)}, ${Number(
                      incident.longitude
                    ).toFixed(5)}`
                  : 'Location unavailable'}
              </p>
            </div>

            <Badge>
              {formatStatus(incident.status)}
            </Badge>
          </Link>
        ))}

        {incidents.length === 0 && (
          <div className="card p-8 text-center text-sm text-slate-500">
            No incidents have been reported yet.
          </div>
        )}
      </div>
    </div>
  )
}