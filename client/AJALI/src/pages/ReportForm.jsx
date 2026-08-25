import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Crosshair, Map, Camera, Video, Send, X } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

export default function ReportForm() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { addIncident } = useData()

  const category = state?.category || { label: 'Vehicle Accident', category: 'Vehicle Accident' }

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
  })
  const [photos, setPhotos] = useState([])
  const [videoName, setVideoName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
        }))
      },
      () => {
        setForm((f) => ({ ...f, lat: '34.0522', lng: '-118.2437' }))
      }
    )
  }

  const onPhotoUpload = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => setPhotos((prev) => [...prev, reader.result])
      reader.readAsDataURL(file)
    })
  }

  const onVideoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) setVideoName(file.name)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.address) return
    setSubmitting(true)
    setTimeout(() => {
      const record = addIncident({
        title: form.title,
        description: form.description,
        location: form.address,
        lat: form.lat,
        lng: form.lng,
        category: category.category || category.label,
        severity: 'Warning',
        reporter: 'You',
        reporterType: 'Citizen',
        evidence: photos,
        hasVideo: Boolean(videoName),
      })
      setSubmitting(false)
      setSubmitted(record.id)
    }, 700)
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center animate-fadeUp">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-mint-500/15 text-mint-400">
          <Send size={26} />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Report submitted</h1>
        <p className="mt-2 text-sm text-slate-400">
          Thanks for helping keep the community safe. Emergency responders and nearby users have been notified.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to={`/app/reports/${submitted}`} className="btn-primary">
            View report
          </Link>
          <Link to="/app" className="btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl animate-fadeUp pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/app/report"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-crimson-400 transition hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-bold text-crimson-400">Report Incident</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border-l-4 border-crimson-500 bg-ink-800/70 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Emergency Category</p>
            <p className="mt-1 flex items-center gap-2 font-display font-semibold text-crimson-400">
              <MapPin size={16} /> {category.category || category.label}
            </p>
          </div>
          <Link to="/app/report" className="text-sm font-semibold text-amber-400 hover:text-amber-300">
            Change
          </Link>
        </div>

        <section className="card p-6">
          <h2 className="mb-4 font-display font-semibold text-white">Incident Details</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Incident Title</span>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="e.g., Multi-car collision on I-95"
                className="input-field"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Incident Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Describe the situation clearly and concisely…"
                rows={4}
                className="input-field resize-none"
                required
              />
            </label>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-display font-semibold text-white">Location</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Street Address / Landmark</span>
              <span className="relative block">
                <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  placeholder="Enter location…"
                  className="input-field pl-10"
                  required
                />
              </span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Latitude</span>
                <input name="lat" value={form.lat} onChange={onChange} placeholder="34.0522" className="input-field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Longitude</span>
                <input name="lng" value={form.lng} onChange={onChange} placeholder="-118.2437" className="input-field" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={useCurrentLocation} className="btn-secondary">
                <Crosshair size={16} /> Use My Current Location
              </button>
              <button type="button" className="btn-secondary">
                <Map size={16} /> Select Location on Map
              </button>
            </div>

            {(form.lat || form.address) && (
              <div className="relative h-40 overflow-hidden rounded-xl border border-white/[0.06] bg-ink-900">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,38,79,0.25),transparent_60%)]" />
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                  <MapPin className="text-crimson-500 drop-shadow-glow" size={30} />
                  <span className="mt-1 text-xs text-slate-400">{form.address || 'Pinned location'}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-white">Add Evidence</h2>
            <span className="text-xs text-slate-500">Optional</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-ink-900/50 py-8 text-center transition hover:border-amber-400/50">
              <Camera size={22} className="text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Upload Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPhotoUpload} />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-ink-900/50 py-8 text-center transition hover:border-amber-400/50">
              <Video size={22} className="text-amber-400" />
              <span className="text-sm font-medium text-slate-300">{videoName || 'Upload Video'}</span>
              <input type="file" accept="video/*" className="hidden" onChange={onVideoUpload} />
            </label>
          </div>

          {photos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {photos.map((src, idx) => (
                <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/10">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-ink-900/95 px-4 py-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="mx-auto flex max-w-3xl gap-3">
            <Link to="/app" className="btn-secondary flex-1 sm:flex-none">
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 sm:flex-none">
              <Send size={16} /> {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
