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

// A term is done being asked once it's been answered correctly, or after
// two attempts either way — so nothing can get stuck in an endless retry.
function isResolved(t) {
  return t.mastered || t.attempts >= 2
}

export default function VocabReview() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const [session] = useState(getStudentSession())
  const [allTerms, setAllTerms] = useState([])
  const [loading, setLoading] = useState(true)

  // quiz: { lessonNumber, round, queue: [term,...], index, missed: [term,...] } | null
  const [quiz, setQuiz] = useState(null)
  const [feedback, setFeedback] = useState(null) // { chosenId, correct } | null
  const [transition, setTransition] = useState(null) // { lessonNumber, missedTerms } | null
  const [unitComplete, setUnitComplete] = useState(null) // { scorePct } | null

  useEffect(() => {
    if (!session) { navigate('/join'); return }
    loadState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, unitId])

  async function loadState() {
    setLoading(true)
    setTransition(null)
    const { data, error } = await supabase.rpc('whp_vocab_unit_state', {
      p_student_id: session.student_id,
      p_unit_id: Number(unitId),
    })
    if (!error && data) {
      setAllTerms(data)
      const lessons = [...new Set(data.map((t) => t.lesson_number))].sort((a, b) => a - b)
      const activeLesson = lessons.find((l) =>
        data.some((t) => t.lesson_number === l && !isResolved(t))
      )
      if (activeLesson === undefined) {
        const totalCredit = data.reduce((sum, t) => sum + Number(t.credit), 0)
        setUnitComplete({ scorePct: data.length ? Math.round((totalCredit / data.length) * 100) : 0 })
        setQuiz(null)
      } else {
        setUnitComplete(null)
        const unresolved = data.filter((t) => t.lesson_number === activeLesson && !isResolved(t))
        setQuiz({ lessonNumber: activeLesson, round: 1, queue: shuffle(unresolved), index: 0, missed: [] })
      }
    }
    setFeedback(null)
    setLoading(false)
  }

  const currentQuestion = quiz ? quiz.queue[quiz.index] : null

  const options = useMemo(() => {
    if (!currentQuestion) return []
    const distractors = shuffle(allTerms.filter((t) => t.term_id !== currentQuestion.term_id)).slice(0, 3)
    return shuffle([currentQuestion, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.term_id])

  const resolvedCount = allTerms.filter(isResolved).length

  function handlePick(option) {
    if (feedback || !quiz || !currentQuestion) return
    const correct = option.term_id === currentQuestion.term_id
    setFeedback({ chosenId: option.term_id, correct })

    supabase.rpc('whp_record_vocab_progress', {
      p_student_id: session.student_id,
      p_session_token: session.session_token,
      p_term_id: currentQuestion.term_id,
      p_correct: correct,
    })

    setTimeout(() => {
      const newMissed = correct ? quiz.missed : [...quiz.missed, currentQuestion]
      const nextIndex = quiz.index + 1
      if (nextIndex < quiz.queue.length) {
        setFeedback(null)
        setQuiz({ ...quiz, index: nextIndex, missed: newMissed })
      } else if (quiz.round === 1 && newMissed.length > 0) {
        setFeedback(null)
        setTransition({ lessonNumber: quiz.lessonNumber, missedTerms: newMissed })
        setQuiz(null)
      } else {
        loadState()
      }
    }, 900)
  }

  function startRound2() {
    setQuiz({
      lessonNumber: transition.lessonNumber,
      round: 2,
      queue: shuffle(transition.missedTerms),
      index: 0,
      missed: [],
    })
    setTransition(null)
  }

  if (!session) return null
  if (loading) return <div className="min-h-screen flex items-center justify-center text-ink/60">Loading vocabulary...</div>

  return (
    <div className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/units" className="text-sm text-navy/60 hover:underline">&larr; All units</Link>
        <p className="text-sm text-ink/60">
          {resolvedCount} / {allTerms.length} reviewed
        </p>
      </div>

      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-6 border border-brass/20">
        <div
          className="h-full bg-forest transition-all"
          style={{ width: `${allTerms.length ? (resolvedCount / allTerms.length) * 100 : 0}%` }}
        />
      </div>

      {unitComplete ? (
        <div className="bg-white/70 border border-brass/30 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-2">📚</p>
          <h2 className="font-serif text-2xl font-bold mb-2">Vocabulary Quiz Complete!</h2>
          <p className="text-ink/70 mb-4">You've been through every term in this unit.</p>
          <p className="font-serif text-4xl font-bold text-forest">{unitComplete.scorePct}%</p>
          <p className="text-xs uppercase tracking-wide text-ink/50 mt-1">Final Score</p>
        </div>
      ) : transition ? (
        <div className="bg-white/70 border border-brass/30 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-2">🔁</p>
          <h2 className="font-serif text-2xl font-bold mb-2">Second Chances</h2>
          <p className="text-ink/70 mb-6">
            You missed {transition.missedTerms.length} term{transition.missedTerms.length === 1 ? '' : 's'}.
            Get them right this time for half credit.
          </p>
          <button
            onClick={startRound2}
            className="px-8 py-3 rounded-lg bg-rust text-parchment font-semibold"
          >
            Start Round 2
          </button>
        </div>
      ) : quiz && currentQuestion ? (
        <>
          <p className="text-center text-xs uppercase tracking-wide text-brass font-semibold mb-3">
            Lesson {quiz.lessonNumber} · Round {quiz.round}{quiz.round === 2 ? ' — Second Chances' : ''}
          </p>

          <div className="bg-white/70 border border-brass/30 rounded-xl px-6 py-5 mb-5 text-center">
            <p className="text-xs uppercase tracking-wide text-brass font-semibold mb-2">Which word means...</p>
            <p className="font-serif text-xl font-bold text-ink leading-snug">{currentQuestion.definition}</p>
          </div>

          <div className="grid gap-3">
            {options.map((opt) => {
              let cls = 'bg-white/70 border-brass/30 hover:bg-brass/10'
              if (feedback) {
                if (opt.term_id === currentQuestion.term_id) cls = 'bg-forest/15 border-forest text-forest'
                else if (opt.term_id === feedback.chosenId) cls = 'bg-rust/15 border-rust text-rust'
                else cls = 'bg-white/40 border-brass/20 opacity-60'
              }
              return (
                <button
                  key={opt.term_id}
                  onClick={() => handlePick(opt)}
                  disabled={!!feedback}
                  className={`text-left px-5 py-4 rounded-xl border font-semibold transition ${cls}`}
                >
                  {opt.term}
                </button>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
