import { useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, TriangleAlert, Clock, MessagesSquare, Compass, User, LogOut,
  ShieldCheck, Pencil, Mail, Phone, Settings, Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/ui/Avatar.jsx'

const LINKS = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/report', label: 'Report Incident', icon: TriangleAlert },
  { to: '/app/reports', label: 'My Reports', icon: Clock },
  { to: '/app/community', label: 'Community', icon: MessagesSquare },
  { to: '/app/map', label: 'Incident Map', icon: Compass },
  { to: '/app/profile', label: 'Profile', icon: User },
]



export default function Profile() {
  const { user, updateProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const fileInputRef = useRef(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || 'Committed to community safety and rapid response tracking.',
  })

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Profile picture must be smaller than 5MB.')
      return
    }

    try {
      setUploadingPhoto(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'ajali_profile_upload')

      const uploadResponse = await fetch(
        'https://api.cloudinary.com/v1_1/askth98l/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload profile picture.')
      }

      const cloudinaryData = await uploadResponse.json()

      const updatedUser = await updateProfile({
        ...form,
        profile_photo: cloudinaryData.secure_url,
      })

      setForm((prev) => ({
        ...prev,
        username: updatedUser.username || prev.username,
        email: updatedUser.email || prev.email,
        phone: updatedUser.phone || prev.phone,
        bio: updatedUser.bio || prev.bio,
      }))
    } catch (err) {
      alert(err.message || 'Failed to update profile picture.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const onSave = () => {
    updateProfile(form)
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="grid animate-fadeUp grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden card h-fit flex-col p-5 lg:flex">
        <div className="mb-5 flex items-center gap-3 border-b border-white/[0.06] pb-5">
          <Avatar name={user?.username || 'Ajali User'} size={44} />
          <div>
            <p className="font-display text-sm font-bold text-crimson-400">{user?.username || 'Ajali! User'}</p>
            <p className="text-xs text-slate-500">Emergency Reporting</p>
            <p className="text-xs font-medium text-mint-400">Active</p>
          </div>
        </div>
        <nav className="space-y-1.5">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-amber-500 text-ink-900' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-crimson-400 transition hover:bg-crimson-500/10"
        >
          <LogOut size={17} /> Logout
        </button>
      </aside>

      <div>
        <h1 className="mb-5 font-display text-2xl font-bold text-white sm:text-3xl">Profile</h1>

        <section className="card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative w-fit">
              <Avatar
                name={user?.username || 'Alex Mercer'}
                size={90}
                src={user?.profile_photo}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-crimson-500 text-white shadow-glow transition hover:bg-crimson-400 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Change profile picture"
              >
                <Pencil size={13} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input-field max-w-xs"
                />
              ) : (
                <h2 className="font-display text-xl font-bold text-white">{user?.username || 'Alex Mercer'}</h2>
              )}
              <p className="mt-1 text-sm text-slate-500">Responder ID: {user?.responderId || '#00000-AJ'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="badge border border-mint-500/30 bg-mint-500/15 text-mint-400">
                  <ShieldCheck size={12} /> Verified
                </span>
                <span className="badge border border-white/10 bg-white/[0.05] text-slate-300">Joined {user?.joined || 2024}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-l-2 border-crimson-500/50 bg-white/[0.02] px-4 py-3">
            {editing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                className="input-field resize-none italic"
              />
            ) : (
              <p className="text-sm italic text-slate-400">“{user?.bio || form.bio}”</p>
            )}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-white">
              <Mail size={16} className="text-crimson-400" /> Contact Information
            </h3>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</span>
              {editing ? (
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="flex items-center gap-2 rounded-xl bg-ink-900/60 px-4 py-3 text-sm text-slate-300">
                  <Mail size={14} className="text-slate-500" /> {user?.email || 'you@example.com'}
                </p>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</span>
              {editing ? (
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="input-field"
                />
              ) : (
                <p className="flex items-center gap-2 rounded-xl bg-ink-900/60 px-4 py-3 text-sm text-slate-300">
                  <Phone size={14} className="text-slate-500" /> {user?.phone || 'Not set'}
                </p>
              )}
            </label>
          </section>

          <section className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-white">
              <Settings size={16} className="text-amber-400" /> Account Settings
            </h3>
            <div className="space-y-3">
              {editing ? (
                <button onClick={onSave} className="btn-secondary w-full !bg-mint-500/15 !text-mint-400">
                  <Check size={16} /> Save Changes
                </button>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary w-full">
                  <Pencil size={15} /> Edit Profile
                </button>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary w-full !border-crimson-500/30 !bg-crimson-500/10 !text-crimson-400 hover:!bg-crimson-500/20"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
