import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function randomClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('classes') // classes | content

  const [classes, setClasses] = useState([])
  const [activeClass, setActiveClass] = useState(null)
  const [newClassName, setNewClassName] = useState('')

  const [roster, setRoster] = useState([])
  const [newStudentName, setNewStudentName] = useState('')

  const [units, setUnits] = useState([])
  const [classUnits, setClassUnits] = useState({}) // unit_id -> is_open

  const [progress, setProgress] = useState([])

  const [contentUnit, setContentUnit] = useState(null)
  const [locations, setLocations] = useState([])
  const [locDraft, setLocDraft] = useState(null) // location being added/edited

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/teacher/login'); return }
    setUser(authUser)
    const { data: unitRows } = await supabase.from('whp_units').select('*').order('unit_number')
    setUnits(unitRows || [])
    if (unitRows?.length) setContentUnit(unitRows[0])
    await loadClasses()
  }

  async function loadClasses() {
    const { data } = await supabase.from('whp_classes').select('*').order('created_at')
    setClasses(data || [])
    if (data?.length && !activeClass) selectClass(data[0])
  }

  async function selectClass(cls) {
    setActiveClass(cls)
    const [{ data: studentRows }, { data: cuRows }, { data: progressRows }] = await Promise.all([
      supabase.from('whp_students').select('*').eq('class_id', cls.id).order('name'),
      supabase.from('whp_class_units').select('*').eq('class_id', cls.id),
      supabase.rpc('whp_teacher_progress', { p_class_id: cls.id }),
    ])
    setRoster(studentRows || [])
    const map = {}
    ;(cuRows || []).forEach((r) => { map[r.unit_id] = r.is_open })
    setClassUnits(map)
    setProgress(progressRows || [])
  }

  async function handleCreateClass(e) {
    e.preventDefault()
    if (!newClassName.trim()) return
    const code = randomClassCode()
    const { data, error } = await supabase
      .from('whp_classes')
      .insert({ teacher_id: user.id, name: newClassName.trim(), class_code: code })
      .select()
      .single()
    if (!error) {
      setNewClassName('')
      await loadClasses()
      selectClass(data)
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault()
    if (!newStudentName.trim() || !activeClass) return
    await supabase.from('whp_students').insert({ class_id: activeClass.id, name: newStudentName.trim() })
    setNewStudentName('')
    selectClass(activeClass)
  }

  async function handleRemoveStudent(id) {
    await supabase.from('whp_students').delete().eq('id', id)
    selectClass(activeClass)
  }

  async function toggleUnit(unitId) {
    const isOpen = !classUnits[unitId]
    await supabase
      .from('whp_class_units')
      .upsert({ class_id: activeClass.id, unit_id: unitId, is_open: isOpen }, { onConflict: 'class_id,unit_id' })
    setClassUnits({ ...classUnits, [unitId]: isOpen })
  }

  async function loadLocations(unit) {
    setContentUnit(unit)
    const { data } = await supabase
      .from('whp_unit_locations')
      .select('*')
      .eq('unit_id', unit.id)
      .order('group_number')
      .order('name')
    setLocations(data || [])
  }

  useEffect(() => {
    if (contentUnit && tab === 'content') loadLocations(contentUnit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function startNewLocation() {
    setLocDraft({ unit_id: contentUnit.id, name: '', region: '', lat: '', lng: '', group_number: 1, fun_fact: '' })
  }

  async function saveLocation(e) {
    e.preventDefault()
    const payload = {
      ...locDraft,
      lat: parseFloat(locDraft.lat),
      lng: parseFloat(locDraft.lng),
      group_number: parseInt(locDraft.group_number, 10),
    }
    if (locDraft.id) {
      await supabase.from('whp_unit_locations').update(payload).eq('id', locDraft.id)
    } else {
      delete payload.id
      await supabase.from('whp_unit_locations').insert(payload)
    }
    setLocDraft(null)
    loadLocations(contentUnit)
  }

  async function deleteLocation(id) {
    await supabase.from('whp_unit_locations').delete().eq('id', id)
    loadLocations(contentUnit)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-sm text-navy/60 hover:underline">&larr; Home</Link>
          <h1 className="font-serif text-3xl font-bold mt-1">Teacher Dashboard</h1>
        </div>
        <button onClick={handleSignOut} className="text-sm text-navy/60 hover:underline">Sign out</button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('classes')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'classes' ? 'bg-navy text-parchment' : 'bg-white/60 text-ink/70'}`}
        >
          My Classes
        </button>
        <button
          onClick={() => setTab('content')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'content' ? 'bg-navy text-parchment' : 'bg-white/60 text-ink/70'}`}
        >
          Unit Content
        </button>
      </div>

      {tab === 'classes' && (
        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <div className="space-y-3">
            <form onSubmit={handleCreateClass} className="flex gap-2">
              <input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="New class name"
                className="flex-1 rounded-lg border border-brass/40 px-3 py-2 text-sm"
              />
              <button className="px-3 py-2 rounded-lg bg-forest text-parchment text-sm font-semibold">+</button>
            </form>
            <div className="space-y-1">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectClass(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeClass?.id === c.id ? 'bg-brass/20 font-semibold' : 'hover:bg-white/50'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {activeClass && (
            <div className="space-y-8">
              <div className="bg-white/70 border border-brass/30 rounded-xl p-5">
                <p className="text-sm text-ink/60">Class code students use to join</p>
                <p className="font-serif text-2xl font-bold tracking-widest">{activeClass.class_code}</p>
              </div>

              <div className="bg-white/70 border border-brass/30 rounded-xl p-5">
                <h3 className="font-serif text-lg font-bold mb-3">Open Units</h3>
                <div className="space-y-2">
                  {units.map((u) => (
                    <label key={u.id} className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={!!classUnits[u.id]}
                        onChange={() => toggleUnit(u.id)}
                      />
                      <span>Unit {u.unit_number}: {u.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white/70 border border-brass/30 rounded-xl p-5">
                <h3 className="font-serif text-lg font-bold mb-3">Roster</h3>
                <form onSubmit={handleAddStudent} className="flex gap-2 mb-3">
                  <input
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Student name"
                    className="flex-1 rounded-lg border border-brass/40 px-3 py-2 text-sm"
                  />
                  <button className="px-3 py-2 rounded-lg bg-forest text-parchment text-sm font-semibold">Add</button>
                </form>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {roster.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-white/50">
                      <span>{s.name} {s.pin ? '' : <span className="text-brass">(no PIN yet)</span>}</span>
                      <button onClick={() => handleRemoveStudent(s.id)} className="text-rust text-xs hover:underline">remove</button>
                    </div>
                  ))}
                  {roster.length === 0 && <p className="text-sm text-ink/50">No students yet.</p>}
                </div>
              </div>

              <div className="bg-white/70 border border-brass/30 rounded-xl p-5 overflow-x-auto">
                <h3 className="font-serif text-lg font-bold mb-3">Progress</h3>
                {progress.length === 0 ? (
                  <p className="text-sm text-ink/50">No progress yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ink/50">
                        <th className="pb-2 pr-4">Student</th>
                        <th className="pb-2 pr-4">Unit</th>
                        <th className="pb-2">Mastered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.filter((p) => p.total_count > 0 && classUnits[p.unit_id]).map((p, i) => (
                        <tr key={i} className="border-t border-brass/10">
                          <td className="py-1 pr-4">{p.student_name}</td>
                          <td className="py-1 pr-4">Unit {p.unit_number}</td>
                          <td className="py-1">{p.mastered_count} / {p.total_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'content' && (
        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <div className="space-y-1">
            {units.map((u) => (
              <button
                key={u.id}
                onClick={() => loadLocations(u)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${contentUnit?.id === u.id ? 'bg-brass/20 font-semibold' : 'hover:bg-white/50'}`}
              >
                Unit {u.unit_number}: {u.title}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                {contentUnit ? `Unit ${contentUnit.unit_number}: ${contentUnit.title}` : ''}
              </h3>
              <button
                onClick={startNewLocation}
                className="px-3 py-2 rounded-lg bg-forest text-parchment text-sm font-semibold"
              >
                + Add Location
              </button>
            </div>

            {locDraft && (
              <form onSubmit={saveLocation} className="bg-white/70 border border-brass/30 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Name" value={locDraft.name}
                    onChange={(e) => setLocDraft({ ...locDraft, name: e.target.value })}
                    className="rounded-lg border border-brass/40 px-3 py-2 text-sm" />
                  <input placeholder="Region" value={locDraft.region}
                    onChange={(e) => setLocDraft({ ...locDraft, region: e.target.value })}
                    className="rounded-lg border border-brass/40 px-3 py-2 text-sm" />
                  <input required type="number" step="any" placeholder="Latitude" value={locDraft.lat}
                    onChange={(e) => setLocDraft({ ...locDraft, lat: e.target.value })}
                    className="rounded-lg border border-brass/40 px-3 py-2 text-sm" />
                  <input required type="number" step="any" placeholder="Longitude" value={locDraft.lng}
                    onChange={(e) => setLocDraft({ ...locDraft, lng: e.target.value })}
                    className="rounded-lg border border-brass/40 px-3 py-2 text-sm" />
                  <input required type="number" min="1" placeholder="Group #" value={locDraft.group_number}
                    onChange={(e) => setLocDraft({ ...locDraft, group_number: e.target.value })}
                    className="rounded-lg border border-brass/40 px-3 py-2 text-sm" />
                </div>
                <textarea placeholder="Fun fact shown after mastering" value={locDraft.fun_fact}
                  onChange={(e) => setLocDraft({ ...locDraft, fun_fact: e.target.value })}
                  className="w-full rounded-lg border border-brass/40 px-3 py-2 text-sm" rows={2} />
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-lg bg-rust text-parchment text-sm font-semibold">Save</button>
                  <button type="button" onClick={() => setLocDraft(null)} className="px-4 py-2 rounded-lg bg-white text-ink text-sm border border-brass/30">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {locations.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-ink/50"> — group {l.group_number}{l.region ? ` · ${l.region}` : ''}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setLocDraft(l)} className="text-navy text-xs hover:underline">edit</button>
                    <button onClick={() => deleteLocation(l.id)} className="text-rust text-xs hover:underline">delete</button>
                  </div>
                </div>
              ))}
              {locations.length === 0 && <p className="text-sm text-ink/50">No locations yet for this unit.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
