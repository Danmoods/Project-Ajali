	
import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-900 px-4 py-12 bg-grid-fade">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-crimson-600 via-crimson-500 to-crimson-600" />
      <Link to="/" className="mb-2 font-display text-4xl font-extrabold tracking-tight text-crimson-500">
        Ajali!
      </Link>
      <p className="mb-8 text-sm font-medium tracking-wide text-slate-400">Emergency Reporting Network</p>

  <div className="w-full max-w-md animate-fadeUp card p-8">
    <h1 className="text-center font-display text-2xl font-bold text-crimson-400">{title}</h1>
    {subtitle && <p className="mt-1.5 text-center text-sm text-slate-400">{subtitle}</p>}
    <div className="mt-6">{children}</div>
  </div>
</div>
  )
}