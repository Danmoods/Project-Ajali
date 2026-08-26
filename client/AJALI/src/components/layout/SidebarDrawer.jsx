import { NavLink } from 'react-router-dom';
import {
  Home,
  TriangleAlert,
  Clock,
  MessagesSquare,
  Compass,
  User,
  LogOut,
  X,
} from 'lucide-react';

import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/report', label: 'Report Incident', icon: TriangleAlert },
  { to: '/app/reports', label: 'My Reports', icon: Clock },
  { to: '/app/community', label: 'Community', icon: MessagesSquare },
  { to: '/app/map', label: 'Incident Map', icon: Compass },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export default function SidebarDrawer({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.06] bg-ink-850 p-5 transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user?.username || 'Ajali User'} size={44} />

            <div>
              <p className="font-display text-sm font-bold text-crimson-400">
                {user?.username || 'Ajali User'}
              </p>

              <p className="text-xs text-slate-500">
                Emergency Reporting
              </p>

              <p className="text-xs font-medium text-mint-400">
                Active
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-crimson-500 text-white shadow-glow'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-crimson-400 transition hover:bg-crimson-500/10"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>
    </>
  );
}