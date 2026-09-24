import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import StudentJoin from './pages/StudentJoin.jsx'
import StudentUnits from './pages/StudentUnits.jsx'
import MapGame from './pages/MapGame.jsx'
import TeacherLogin from './pages/TeacherLogin.jsx'
import TeacherDashboard from './pages/TeacherDashboard.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<StudentJoin />} />
      <Route path="/units" element={<StudentUnits />} />
      <Route path="/play/:unitId" element={<MapGame />} />
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
    </Routes>
  )
}
