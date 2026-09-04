import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await login(form)
      const dest = session.role === 'admin' ? '/admin' : location.state?.from?.pathname || '/app'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to report and view incidents securely.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-3 py-2.5 text-sm text-crimson-400">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300">Email</span>
          <span className="relative block">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={onChange}
              placeholder="user@example.com"
              className="input-field pl-10"
            />
          </span>
        </label>

        <label className="block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <button type="button" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
              Forgot Password?
            </button>
          </div>
          <span className="relative block">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
              className="input-field pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          {loading ? 'Signing in…' : 'Login'} <ArrowRight size={17} />
        </button>

        <p className="pt-1 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-amber-400 hover:text-amber-300">
            Register
          </Link>
        </p>
        <p className="text-center text-xs text-slate-600">
          Demo admin access: admin@gmail.com, Password: admin123
        </p>
      </form>
    </AuthLayout>
  )
}
