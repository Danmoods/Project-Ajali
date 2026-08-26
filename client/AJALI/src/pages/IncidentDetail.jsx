import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Navigation, ImagePlus, Printer, ShieldAlert, Film } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Badge from '../components/ui/Badge.jsx'

const STATUS_OPTIONS = ['Pending Review', 'Under Review', 'Investigating', 'Resolved', 'Rejected']

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { incidents, updateIncident } = useData()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const incident = incidents.find((i) => i.id === id)
  const [status, setStatus] = useState(incident?.status || 'Pending Review')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  if (!incident) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <ShieldAlert size={32} className="text-slate-600" />
        <p className="font-semibold text-slate-200">Incident not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Go back
        </button>
      </div>
    )
  }

  const backTo = isAdmin ? '/admin/incidents' : '/app/reports'

  const handleUpdateStatus = () => {
    updateIncident(incident.id, { status })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
              <Meta label="Category" value={incident.category} />
              <Meta label="Reporter" value={`${incident.reporter} (${incident.reporterType || 'Citizen'})`} />
              <Meta label="Date / Time" value={`${incident.date} · ${incident.time}`} />
              <Meta
                label="Severity"
                value={<span className={incident.severity === 'Critical' ? 'text-crimson-400' : 'text-amber-400'}>{incident.severity}</span>}
              />
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">Evidence Gallery</h2>
              <span className="text-xs text-slate-500">
                {(incident.evidence?.length || 0) + (incident.hasVideo ? 1 : 0)} file(s) attached
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {(incident.evidence || []).map((src, idx) => (
                <div key={idx} className="h-28 w-28 overflow-hidden rounded-xl border border-white/10 sm:h-32 sm:w-32">
                  <img src={src} alt="Evidence" className="h-full w-full object-cover" />
                </div>
              ))}
              {incident.hasVideo && (
                <div className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-ink-900 text-slate-400 sm:h-32 sm:w-32">
                  <Film size={22} />
                  <span className="text-[11px]">Dashcam.mp4</span>
                </div>
              )}
              <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-slate-500 transition hover:border-amber-400/50 hover:text-amber-400 sm:h-32 sm:w-32">
                <ImagePlus size={20} />
                <span className="text-xs">Add Photo</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
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
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
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
            <p className="mt-3 text-sm text-slate-400">{incident.location}</p>
            {incident.lat && (
              <p className="mt-1 text-xs text-slate-600">
                Lat: {incident.lat}, Lng: {incident.lng}
              </p>
            )}
            {!isAdmin && (
              <button className="btn-secondary mt-4 w-full">
                <Navigation size={15} /> Get Directions
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
