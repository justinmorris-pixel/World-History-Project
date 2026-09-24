import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { saveStudentSession } from '../lib/studentSession.js'

export default function StudentJoin() {
  const navigate = useNavigate()
  const [step, setStep] = useState('code') // code -> name -> pin
  const [classCode, setClassCode] = useState('')
  const [classInfo, setClassInfo] = useState(null)
  const [roster, setRoster] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFindClass(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const code = classCode.trim().toUpperCase()

    const { data: classRows, error: classErr } = await supabase
      .rpc('whp_find_class', { p_class_code: code })
    if (classErr || !classRows || classRows.length === 0) {
      setError("We couldn't find a class with that code. Double check with your teacher.")
      setLoading(false)
      return
    }

    const { data: rosterRows, error: rosterErr } = await supabase
      .rpc('whp_get_roster', { p_class_code: code })
    if (rosterErr) {
      setError('Something went wrong loading the class roster.')
      setLoading(false)
      return
    }

    setClassInfo({ class_id: classRows[0].class_id, class_name: classRows[0].class_name, code })
    setRoster(rosterRows || [])
    setStep('name')
    setLoading(false)
  }

  async function handlePinSubmit(e) {
    e.preventDefault()
    setError('')
    if (pin.length < 4) {
      setError('Your PIN should be at least 4 digits.')
      return
    }
    setLoading(true)
    const { data, error: authErr } = await supabase
      .rpc('whp_student_auth', { p_student_id: selectedStudent.student_id, p_pin: pin })
      .single()

    if (authErr || !data || !data.success) {
      setError(data?.error || 'Something went wrong. Try again.')
      setLoading(false)
      return
    }

    saveStudentSession({
      student_id: selectedStudent.student_id,
      student_name: selectedStudent.name,
      class_id: classInfo.class_id,
      class_name: classInfo.class_name,
      session_token: data.session_token,
    })
    setLoading(false)
    navigate('/units')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/70 border border-brass/30 rounded-2xl shadow p-8">
        <Link to="/" className="text-sm text-navy/60 hover:underline">&larr; Back</Link>
        <h1 className="font-serif text-2xl font-bold mt-2 mb-6">Join Your Class</h1>

        {error && (
          <div className="mb-4 text-sm text-rust bg-rust/10 border border-rust/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {step === 'code' && (
          <form onSubmit={handleFindClass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class Code</label>
              <input
                autoFocus
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="e.g. WH7X2A"
                maxLength={8}
                className="w-full rounded-lg border border-brass/40 px-4 py-3 tracking-widest uppercase font-semibold text-center"
              />
            </div>
            <button
              disabled={loading || !classCode}
              className="w-full py-3 rounded-lg bg-rust text-parchment font-semibold disabled:opacity-50"
            >
              {loading ? 'Looking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'name' && (
          <div className="space-y-4">
            <p className="text-sm text-ink/70">{classInfo.class_name}</p>
            <label className="block text-sm font-medium mb-1">Find your name</label>
            <div className="max-h-64 overflow-y-auto space-y-1 border border-brass/30 rounded-lg p-2">
              {roster.length === 0 && (
                <p className="text-sm text-ink/60 px-2 py-3">
                  No students yet — ask your teacher to add the roster.
                </p>
              )}
              {roster.map((s) => (
                <button
                  key={s.student_id}
                  onClick={() => { setSelectedStudent(s); setStep('pin') }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-brass/10"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-sm text-ink/70">
              Hi <span className="font-semibold">{selectedStudent.name}</span> —{' '}
              {selectedStudent.has_pin ? 'enter your PIN' : 'set a PIN to lock your account'}
            </p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4+ digit PIN"
              className="w-full rounded-lg border border-brass/40 px-4 py-3 tracking-widest text-center"
            />
            <button
              disabled={loading}
              className="w-full py-3 rounded-lg bg-rust text-parchment font-semibold disabled:opacity-50"
            >
              {loading ? 'Checking...' : selectedStudent.has_pin ? 'Log In' : 'Set PIN & Continue'}
            </button>
            <button
              type="button"
              onClick={() => setStep('name')}
              className="w-full text-sm text-navy/60 hover:underline"
            >
              Not you? Pick a different name
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
