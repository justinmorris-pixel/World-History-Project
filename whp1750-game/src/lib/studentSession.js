const KEY = 'whp1750_student_session'

export function saveStudentSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function getStudentSession() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearStudentSession() {
  localStorage.removeItem(KEY)
}
