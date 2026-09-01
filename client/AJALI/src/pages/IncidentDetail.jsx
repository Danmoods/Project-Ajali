import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Navigation, ImagePlus, Printer, ShieldAlert, Film } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import { apiFetch } from '../lib/api.js'
import { getAdminIncident, updateAdminIncidentStatus } from '../api/adminApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import Badge from '../components/ui/Badge.jsx'

const STATUS_OPTIONS = [
  { value: 'under investigation', label: 'Under Investigation' },
  { value: 'verified', label: 'Verified' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const backTo = isAdmin ? '/admin/incidents' : '/app/reports'

  const [incident, setIncident] = useState(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const incidentCoordinates =
    incident &&
    Number.isFinite(Number(incident.latitude)) &&
    Number.isFinite(Number(incident.longitude))
      ? [Number(incident.latitude), Number(incident.longitude)]
      : null

  const directionsUrl =
    incidentCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${incidentCoordinates[0]},${incidentCoordinates[1]}`
      : null

  const handleGetDirections = () => {
    if (!directionsUrl) return
    window.open(directionsUrl, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    let mounted = true

    async function loadIncident() {
      try {
        setLoading(true)
        setError('')

        const data = isAdmin
          ? await getAdminIncident(id)
          : await apiFetch(`/incidents/${id}`)

        if (mounted) {
          const loadedIncident = data.incident || data
          setIncident(loadedIncident)
          setStatus(loadedIncident.status || '')
          setSaved(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load incident')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadIncident()

    return () => {
      mounted = false
    }
  }, [id, isAdmin])

  const handleUpdateStatus = async () => {
    if (!isAdmin) return

    try {
      setError('')
      setSaved(false)

      const data = await updateAdminIncidentStatus(id, status)
      const updatedIncident = data.incident || data

      setIncident((currentIncident) =>
        currentIncident
          ? { ...currentIncident, ...updatedIncident }
          : updatedIncident
      )
      setStatus(updatedIncident.status || status)
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Failed to update incident status')
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeUp">
        <p className="text-sm text-slate-400">
          Loading incident...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fadeUp">
        <div className="card p-6">
          <p className="text-sm text-crimson-400">
            {error}
          </p>

          <button
            onClick={() => navigate('/app/reports')}
            className="btn-secondary mt-4"
          >
            Back to My Reports
          </button>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="animate-fadeUp">
        <p className="text-sm text-slate-400">
          Incident not found.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fadeUp">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={backTo}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-crimson-400 transition hover:bg-white/5"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
              <ShieldAlert size={13} /> Incident #{incident.id}
            </p>
            <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{incident.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button className="btn-secondary !px-4 !py-2 text-xs">
              <Printer size={14} /> Export
            </button>
          )}
          <Badge>{incident.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card border-l-4 border-l-crimson-500 p-6">
            <h2 className="mb-3 flex items-center gap-2 font-display font-semibold text-white">
              Incident Details
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">{incident.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Meta
                label="Category"
                value={incident.incident_type || 'Not provided'}
              />

              <Meta
                label="Reporter"
                value={`${incident.reporter?.username || 'Unknown'} (${incident.reporter?.role || 'Citizen'})`}
              />

              <Meta
                label="Date / Time"
                value={
                  incident.created_at
                    ? new Date(incident.created_at).toLocaleString()
                    : 'Not provided'
                }
              />

              <Meta
                label="Severity"
                value={
                  <span className="text-amber-400">
                    Not provided
                  </span>
                }
              />
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">Evidence Gallery</h2>
              <span className="text-xs text-slate-500">
                {incident.media?.length || 0} file(s) attached
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {(incident.media || []).map((media) => (
                <div
                  key={media.id}
                  className="overflow-hidden rounded-xl border border-white/10"
                >
                  {media.media_type === 'video' ? (
                    <video
                      src={media.file_url}
                      controls
                      className="h-32 w-32 object-cover"
                    />
                  ) : (
                    <img
                      src={media.file_url}
                      alt="Incident evidence"
                      className="h-32 w-32 object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <section className="card border border-crimson-500/20 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-crimson-400">
                <ShieldAlert size={16} /> Status Management
              </h2>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Current Status</p>
              <Badge>{incident.status}</Badge>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Change Status</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setSaved(false)
                  }}
                  className="input-field"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add internal notes…"
                  className="input-field resize-none"
                />
              </label>

              <button onClick={handleUpdateStatus} className="btn-primary mt-4 w-full">
                {saved ? 'Status updated ✓' : 'Update Status'}
              </button>
            </section>
          )}

          <section className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-display font-semibold text-white">
              <MapPin size={16} className="text-crimson-400" /> Location
            </h2>

            {incidentCoordinates ? (
              <div className="h-40 overflow-hidden rounded-xl border border-white/[0.06] bg-ink-900">
                <MapContainer
                  center={incidentCoordinates}
                  zoom={14}
                  scrollWheelZoom={false}
                  dragging={false}
                  className="h-full w-full"
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <CircleMarker
                    center={incidentCoordinates}
                    radius={10}
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  />
                </MapContainer>
              </div>
            ) : (
              <div className="relative h-40 overflow-hidden rounded-xl border border-white/[0.06] bg-ink-900">
                <div
                  className={`absolute inset-0 ${
                    isAdmin
                      ? 'bg-[linear-gradient(135deg,rgba(240,38,79,0.25),rgba(34,181,115,0.2))]'
                      : 'bg-[radial-gradient(circle_at_50%_50%,rgba(240,38,79,0.25),transparent_60%)]'
                  }`}
                />
                <MapPin className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-crimson-400" size={28} />
              </div>
            )}

            <p className="mt-3 text-sm text-slate-400">
              {incident.location ||
                (incidentCoordinates
                  ? `${incidentCoordinates[0]}, ${incidentCoordinates[1]}`
                  : 'Location unavailable')}
            </p>

            {incidentCoordinates && (
              <p className="mt-1 text-xs text-slate-600">
                Lat: {incidentCoordinates[0]}, Lng: {incidentCoordinates[1]}
              </p>
            )}

            {!isAdmin && (
              <button
                type="button"
                onClick={handleGetDirections}
                disabled={!directionsUrl}
                className="btn-secondary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Navigation size={15} /> {directionsUrl ? 'Get Directions' : 'Directions unavailable'}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div className="rounded-lg bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  )
}
