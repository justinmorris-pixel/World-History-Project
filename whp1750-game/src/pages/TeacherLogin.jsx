import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function TeacherLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | signup
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email, password, options: { data: { name } },
      })
      if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

      if (data.user) {
        const { error: insertErr } = await supabase
          .from('whp_teachers')
          .insert({ id: data.user.id, name, email })
        if (insertErr) { setError(insertErr.message); setLoading(false); return }
      }

      if (!data.session) {
        setError('Check your email to confirm your account, then log in.')
        setLoading(false)
        return
      }
    } else {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) { setError(signInErr.message); setLoading(false); return }
    }

    setLoading(false)
    navigate('/teacher/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/70 border border-brass/30 rounded-2xl shadow p-8">
        <Link to="/" className="text-sm text-navy/60 hover:underline">&larr; Back</Link>
        <h1 className="font-serif text-2xl font-bold mt-2 mb-6">
          Teacher {mode === 'login' ? 'Log In' : 'Sign Up'}
        </h1>

        {error && (
          <div className="mb-4 text-sm text-rust bg-rust/10 border border-rust/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-brass/40 px-4 py-3"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-brass/40 px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-brass/40 px-4 py-3"
            />
          </div>
          <button
            disabled={loading}
            className="w-full py-3 rounded-lg bg-navy text-parchment font-semibold disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-sm text-navy/60 hover:underline mt-4"
        >
          {mode === 'login' ? "Need an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
