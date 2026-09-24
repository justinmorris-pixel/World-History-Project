import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getStudentSession } from '../lib/studentSession.js'
import WorldMap from '../components/WorldMap.jsx'

export default function MapGame() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const [session] = useState(getStudentSession())
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)
  const [flash, setFlash] = useState(null) // { location_id, kind: 'correct' | 'wrong' }
  const [lastFact, setLastFact] = useState(null)

  useEffect(() => {
    if (!session) { navigate('/join'); return }
    loadState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, unitId])

  async function loadState() {
    setLoading(true)
    const { data, error } = await supabase.rpc('whp_unit_state', {
      p_student_id: session.student_id,
      p_unit_id: Number(unitId),
    })
    if (!error && data) {
      setLocations(data)
      const groups = [...new Set(data.map((l) => l.group_number))].sort((a, b) => a - b)
      const activeGroup = groups.find((g) =>
        data.some((l) => l.group_number === g && !l.mastered)
      )
      const pool = data.filter((l) => l.group_number === activeGroup && !l.mastered)
      setTarget(pool[Math.floor(Math.random() * pool.length)] || null)
    }
    setLoading(false)
  }

  const groups = useMemo(
    () => [...new Set(locations.map((l) => l.group_number))].sort((a, b) => a - b),
    [locations]
  )
  const activeGroup = useMemo(
    () => groups.find((g) => locations.some((l) => l.group_number === g && !l.mastered)),
    [groups, locations]
  )
  const allMastered = locations.length > 0 && activeGroup === undefined
  const masteredCount = locations.filter((l) => l.mastered).length

  const pins = useMemo(() => {
    return locations
      .filter((l) => l.group_number <= (activeGroup ?? Infinity))
      .map((l) => {
        let status = 'dim'
        if (l.mastered) status = 'mastered'
        else if (l.group_number === activeGroup) status = 'active'
        if (flash && flash.location_id === l.location_id) status = flash.kind === 'correct' ? 'mastered' : 'wrong'
        return { ...l, status }
      })
  }, [locations, activeGroup, flash])

  async function handlePinClick(pin) {
    if (!target || pin.mastered) return
    const correct = pin.location_id === target.location_id
    setFlash({ location_id: pin.location_id, kind: correct ? 'correct' : 'wrong' })

    await supabase.rpc('whp_record_progress', {
      p_student_id: session.student_id,
      p_session_token: session.session_token,
      p_location_id: pin.location_id,
      p_correct: correct,
    })

    if (correct) {
      setLastFact(pin.fun_fact)
      setTimeout(async () => {
        setFlash(null)
        await loadState()
      }, 700)
    } else {
      setTimeout(() => setFlash(null), 500)
    }
  }

  if (!session) return null
  if (loading) return <div className="min-h-screen flex items-center justify-center text-ink/60">Loading map...</div>

  return (
    <div className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/units" className="text-sm text-navy/60 hover:underline">&larr; All units</Link>
        <p className="text-sm text-ink/60">
          {masteredCount} / {locations.length} mastered
        </p>
      </div>

      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-6 border border-brass/20">
        <div
          className="h-full bg-forest transition-all"
          style={{ width: `${locations.length ? (masteredCount / locations.length) * 100 : 0}%` }}
        />
      </div>

      {allMastered ? (
        <div className="bg-white/70 border border-brass/30 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <h2 className="font-serif text-2xl font-bold mb-2">Unit Mastered!</h2>
          <p className="text-ink/70">You've placed every location in this unit. Nice work.</p>
        </div>
      ) : (
        <>
          <div className="bg-white/70 border border-brass/30 rounded-xl px-5 py-4 mb-4 text-center">
            <p className="text-xs uppercase tracking-wide text-brass font-semibold mb-1">Find on the map</p>
            <p className="font-serif text-2xl font-bold">{target?.name}</p>
            {target?.region && <p className="text-sm text-ink/60">{target.region}</p>}
          </div>

          <WorldMap pins={pins} onPinClick={handlePinClick} />

          {lastFact && (
            <div className="mt-4 bg-forest/10 border border-forest/30 rounded-lg px-4 py-3 text-sm text-forest">
              {lastFact}
            </div>
          )}
        </>
      )}
    </div>
  )
}
