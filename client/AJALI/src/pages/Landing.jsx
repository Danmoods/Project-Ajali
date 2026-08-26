import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, Eye, Zap, BellRing, ArrowRight, Menu, X } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import IncidentCard from '../components/ui/IncidentCard.jsx'
import CommunityPost from '../components/ui/CommunityPost.jsx'
import Avatar from '../components/ui/Avatar.jsx'

const STEPS = [
  {
    icon: Eye,
    title: 'See Something',
    body: 'Spot an accident, hazard, or heavy traffic on your route.',
  },
  {
    icon: Zap,
    title: 'Report Quickly',
    body: 'Use the app to instantly share the location and details.',
  },
  {
    icon: BellRing,
    title: 'Alert Others',
    body: 'Your report immediately warns nearby drivers and responders.',
  },
]

export default function Landing() {
  const { incidents, posts } = useData()
  const { user } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  const closeNav = () => setNavOpen(false)

  return (
    <div className="min-h-screen bg-ink-900 bg-grid-fade">
      <header className="relative border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="font-display text-2xl font-extrabold tracking-tight text-crimson-500">Ajali!</span>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#home" className="nav-link-active nav-link">Home</a>
            <Link to={user ? '/app/report' : '/login'} className="nav-link">Report</Link>
            <a href="#reports" className="nav-link">Reports</a>
            <a href="#community" className="nav-link">Community</a>
            <Link to={user ? '/app/map' : '/login'} className="nav-link">Map</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Toggle menu"
              aria-expanded={navOpen}
            >
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {user ? (
              <Link to="/app" aria-label="Dashboard" className="hidden md:block">
                <Avatar name={user.username} size={38} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-medium text-slate-300 hover:text-white sm:inline">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary !px-4 !py-2 text-xs">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>

        {navOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/[0.06] bg-ink-850 px-4 py-3 md:hidden">
            <a href="#home" onClick={closeNav} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5">
              Home
            </a>
            <Link to={user ? '/app/report' : '/login'} onClick={closeNav} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
              Report
            </Link>
            <a href="#reports" onClick={closeNav} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
              Reports
            </a>
            <a href="#community" onClick={closeNav} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
              Community
            </a>
            <Link to={user ? '/app/map' : '/login'} onClick={closeNav} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">
              Map
            </Link>
            {user && (
              <Link to="/app" onClick={closeNav} className="mt-1 flex items-center gap-2 rounded-lg border-t border-white/[0.06] px-3 pt-3 text-sm font-medium text-slate-300 hover:text-white">
                <Avatar name={user.username} size={22} /> Dashboard
              </Link>
            )}
          </nav>
        )}
      </header>

      <section id="home" className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
        <h1 className="animate-fadeUp font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          Chunga, <span className="text-crimson-500">Maisha Ni Yako</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
          Real-time incident reporting and community alerts for safer commutes. Stay informed,
          stay safe, and help others on the road.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={user ? '/app/report' : '/register'} className="btn-primary w-full sm:w-auto">
            <MapPin size={17} /> Report an Incident
          </Link>
          <Link to="#community" className="btn-secondary w-full sm:w-auto">
            <Users size={17} /> View Community
          </Link>
        </div>
      </section>

      <section id="reports" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">Recent Incidents</h2>
            <Link to={user ? '/app/reports' : '/login'} className="text-sm font-semibold text-amber-400 hover:text-amber-300">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {incidents.slice(0, 2).map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </div>

        <div id="community">
          <h2 className="mb-4 font-display text-xl font-bold text-white">Community</h2>
          <div className="space-y-3">
            {posts.slice(0, 2).map((post) => (
              <CommunityPost key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-ink-850/60">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white">How Ajali! Works</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, idx) => (
              <div key={title} className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-crimson-500/15 text-crimson-400">
                  <Icon size={26} />
                </div>
                <h3 className="font-display font-semibold text-white">
                  {idx + 1}. {title}
                </h3>
                <p className="mt-2 max-w-xs text-sm text-slate-400">{body}</p>
              </div>
            ))}
          </div>
          <Link to={user ? '/app/report' : '/register'} className="btn-primary mt-12 inline-flex">
            Report your first incident <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Ajali! Emergency Reporting Network. Built for safer roads.
      </footer>
    </div>
  )
}