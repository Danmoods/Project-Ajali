import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({username: '', email: '', password: '', confirm_password: '',})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.confirm_password
    ) {
      setError('Please fill in every field.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await register(form)
      navigate('/app')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-3 py-2.5 text-sm text-crimson-400">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <Field label="Username" icon={User} name="username" value={form.username} onChange={onChange} placeholder="Enter your username" />
        <Field label="Email" icon={Mail} name="email" type="email" value={form.email} onChange={onChange} placeholder="Enter your email" />
        <Field label="Password" icon={Lock} name="password" type="password" value={form.password} onChange={onChange} placeholder="Create a password" />
        <Field label="Confirm Password" icon={Lock} name="confirm_password" type="password" value={form.confirm_password} onChange={onChange} placeholder="Confirm your password" />

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          <UserPlus size={17} /> {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="pt-1 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-amber-400 hover:text-amber-300">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

function Field({ label, icon: Icon, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="relative block">
        <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input {...props} className="input-field pl-10" required />
      </span>
    </label>
  )
}
