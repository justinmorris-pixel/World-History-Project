import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getStudentSession } from '../lib/studentSession.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function VocabReview() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const [session] = useState(getStudentSession())
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)
  const [options, setOptions] = useState([])
  const [picked, setPicked] = useState(null) // { term_id, correct } | null
  const [resultModal, setResultModal] = useState(null) // { term, definition, example_sentence } | null

  useEffect(() => {
    if (!session) { navigate('/join'); return }
    loadState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, unitId])

  async function loadState() {
    setLoading(true)
    const { data, error } = await supabase.rpc('whp_vocab_unit_state', {
      p_student_id: session.student_id,
      p_unit_id: Number(unitId),
    })
    if (!error && data) {
      setTerms(data)
      const lessons = [...new Set(data.map((t) => t.lesson_number))].sort((a, b) => a - b)
      const activeLesson = lessons.find((l) =>
        data.some((t) => t.lesson_number === l && !t.mastered)
      )
      const pool = data.filter((t) => t.lesson_number === activeLesson && !t.mastered)
      const nextTarget = pool[Math.floor(Math.random() * pool.length)] || null
      setTarget(nextTarget)
      if (nextTarget) {
        const distractors = shuffle(data.filter((t) => t.term_id !== nextTarget.term_id)).slice(0, 3)
        setOptions(shuffle([nextTarget, ...distractors]))
      } else {
        setOptions([])
      }
    }
    setPicked(null)
    setLoading(false)
  }

  const lessons = useMemo(
    () => [...new Set(terms.map((t) => t.lesson_number))].sort((a, b) => a - b),
    [terms]
  )
  const activeLesson = useMemo(
    () => lessons.find((l) => terms.some((t) => t.lesson_number === l && !t.mastered)),
    [lessons, terms]
  )
  const allMastered = terms.length > 0 && activeLesson === undefined
  const masteredCount = terms.filter((t) => t.mastered).length

  async function handlePick(option) {
    if (picked || !target) return
    const correct = option.term_id === target.term_id
    setPicked({ term_id: option.term_id, correct })

    await supabase.rpc('whp_record_vocab_progress', {
      p_student_id: session.student_id,
      p_session_token: session.session_token,
      p_term_id: target.term_id,
      p_correct: correct,
    })

    if (correct) {
      setTimeout(() => {
        setResultModal({
          term: target.term,
          definition: target.definition,
          example_sentence: target.example_sentence,
        })
      }, 500)
    } else {
      setTimeout(() => setPicked(null), 700)
    }
  }

  async function handleContinue() {
    setResultModal(null)
    await loadState()
  }

  if (!session) return null
  if (loading) return <div className="min-h-screen flex items-center justify-center text-ink/60">Loading vocabulary...</div>

  return (
    <div className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/units" className="text-sm text-navy/60 hover:underline">&larr; All units</Link>
        <p className="text-sm text-ink/60">
          {masteredCount} / {terms.length} mastered
        </p>
      </div>

      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-6 border border-brass/20">
        <div
          className="h-full bg-forest transition-all"
          style={{ width: `${terms.length ? (masteredCount / terms.length) * 100 : 0}%` }}
        />
      </div>

      {allMastered ? (
        <div className="bg-white/70 border border-brass/30 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-2">📚</p>
          <h2 className="font-serif text-2xl font-bold mb-2">Vocabulary Mastered!</h2>
          <p className="text-ink/70">You've learned every term in this unit.</p>
        </div>
      ) : (
        <>
          <div className="bg-white/70 border border-brass/30 rounded-xl px-6 py-5 mb-5 text-center">
            <p className="text-xs uppercase tracking-wide text-brass font-semibold mb-2">Which word means...</p>
            <p className="font-serif text-xl font-bold text-ink leading-snug">{target?.definition}</p>
          </div>

          <div className="grid gap-3">
            {options.map((opt) => {
              let cls = 'bg-white/70 border-brass/30 hover:bg-brass/10'
              if (picked) {
                if (opt.term_id === target.term_id) cls = 'bg-forest/15 border-forest text-forest'
                else if (opt.term_id === picked.term_id) cls = 'bg-rust/15 border-rust text-rust'
                else cls = 'bg-white/40 border-brass/20 opacity-60'
              }
              return (
                <button
                  key={opt.term_id}
                  onClick={() => handlePick(opt)}
                  disabled={!!picked}
                  className={`text-left px-5 py-4 rounded-xl border font-semibold transition ${cls}`}
                >
                  {opt.term}
                </button>
              )
            })}
          </div>
        </>
      )}

      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6">
          <div className="w-full max-w-md bg-parchment border border-brass/40 rounded-2xl shadow-2xl p-8 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-xs uppercase tracking-wide text-brass font-semibold mb-1">Correct</p>
            <h3 className="font-serif text-2xl font-bold text-ink mb-3">{resultModal.term}</h3>
            <p className="text-ink/80 text-sm leading-relaxed mb-2">{resultModal.definition}</p>
            {resultModal.example_sentence && (
              <p className="text-ink/60 text-sm italic leading-relaxed mb-6">"{resultModal.example_sentence}"</p>
            )}
            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-lg bg-rust text-parchment font-semibold"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
