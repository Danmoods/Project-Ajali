	
import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { Menu, X, LayoutDashboard, ClipboardList, Map, LogOut } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/incidents', label: 'Incidents', icon: ClipboardList },
  { to: '/admin/map', label: 'Map', icon: Map },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-900/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/admin" className="font-display text-xl font-extrabold tracking-tight text-crimson-500">
              Ajali!
            </Link>
          </div>

      <nav className="hidden items-center gap-7 lg:flex">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 ${isActive ? 'nav-link nav-link-active' : 'nav-link'}`
            }
          >
            <item.icon size={15} /> {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="flex items-center gap-1.5 nav-link">
          <LogOut size={15} /> Logout
        </button>
      </nav>

      <Link to="/app/profile" aria-label="Profile">
        <Avatar name={user?.username || 'Ajali User'} size={38} />
      </Link>
    </div>

    {open && (
      <nav className="flex flex-col gap-1 border-t border-white/[0.06] bg-ink-850 px-4 py-3 lg:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive ? 'bg-crimson-500 text-white' : 'text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <item.icon size={16} /> {item.label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-crimson-400 hover:bg-white/5"
        >
          <LogOut size={16} /> Logout
        </button>
      </nav>
    )}
  </header>

  <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <Outlet />
  </main>
</div>
  )
}

