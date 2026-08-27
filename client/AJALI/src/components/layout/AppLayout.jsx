
import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import SidebarDrawer from './SidebarDrawer.jsx'
import Avatar from '../ui/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/report', label: 'Report Incident' },
  { to: '/app/reports', label: 'My Reports' },
  { to: '/app/community', label: 'Community' },
  { to: '/app/map', label: 'Incident Map' },
]

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-ink-900">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-900/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <Link to="/app" className="font-display text-xl font-extrabold tracking-tight text-crimson-500">
              Ajali!
            </Link>
          </div>

      <nav className="hidden items-center gap-7 lg:flex">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Link to="/app/profile" aria-label="Profile">
        <Avatar name={user?.username || 'Ajali User'} size={38} />
      </Link>
    </div>
  </header>

  <SidebarDrawer open={open} onClose={() => setOpen(false)} />

  <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <Outlet />
  </main>
</div>
  )
}

