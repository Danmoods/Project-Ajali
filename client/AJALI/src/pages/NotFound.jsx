import { Link } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-900 px-4 text-center">
      <TriangleAlert size={36} className="text-crimson-500" />
      <h1 className="font-display text-2xl font-bold text-white">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-400">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  )
}
