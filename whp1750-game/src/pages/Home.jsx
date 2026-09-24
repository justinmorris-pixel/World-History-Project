import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="uppercase tracking-[0.3em] text-xs text-brass font-semibold mb-3">
        Duncan High School · World History
      </p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-2">
        World History 1750
      </h1>
      <h2 className="font-serif text-2xl text-navy/80 mb-10">Map Quest</h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/join"
          className="px-8 py-4 rounded-lg bg-rust text-parchment font-semibold shadow hover:brightness-110 transition"
        >
          I'm a Student
        </Link>
        <Link
          to="/teacher/login"
          className="px-8 py-4 rounded-lg bg-navy text-parchment font-semibold shadow hover:brightness-110 transition"
        >
          I'm a Teacher
        </Link>
      </div>
    </div>
  )
}
