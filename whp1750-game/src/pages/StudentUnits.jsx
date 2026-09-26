import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getStudentSession, clearStudentSession } from '../lib/studentSession.js'

export default function StudentUnits() {
  const navigate = useNavigate()
  const [session] = useState(getStudentSession())
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      navigate('/join')
      return
    }
    supabase
      .rpc('whp_open_units', { p_class_id: session.class_id })
      .then(({ data, error }) => {
        if (!error) setUnits(data || [])
        setLoading(false)
      })
  }, [session, navigate])

  if (!session) return null

  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-ink/60">{session.class_name}</p>
          <h1 className="font-serif text-3xl font-bold">Hi, {session.student_name}!</h1>
        </div>
        <button
          onClick={() => { clearStudentSession(); navigate('/') }}
          className="text-sm text-navy/60 hover:underline"
        >
          Switch student
        </button>
      </div>

      {loading && <p className="text-ink/60">Loading your units...</p>}

      {!loading && units.length === 0 && (
        <div className="bg-white/70 border border-brass/30 rounded-xl p-6 text-center text-ink/70">
          Your teacher hasn't opened any units yet. Check back once your class reaches
          a new unit in World History 1750.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {units.map((u) => (
          <div
            key={u.unit_id}
            className="bg-white/70 border border-brass/30 rounded-xl p-5 shadow"
          >
            <p className="text-xs uppercase tracking-wide text-brass font-semibold">
              Unit {u.unit_number}
            </p>
            <p className="font-serif text-xl font-bold text-ink mt-1">{u.title}</p>
            <p className="text-sm text-ink/60 mt-1 mb-4">{u.years}</p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/play/${u.unit_id}`)}
                className="flex-1 py-2 rounded-lg bg-rust text-parchment text-sm font-semibold"
              >
                🗺️ Map Quest
              </button>
              <button
                onClick={() => navigate(`/vocab/${u.unit_id}`)}
                className="flex-1 py-2 rounded-lg bg-navy text-parchment text-sm font-semibold"
              >
                📚 Vocabulary
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
