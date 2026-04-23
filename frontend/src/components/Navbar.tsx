import { Link, NavLink } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="section-shell flex h-16 items-center justify-between">
        <Link to="/" className="text-sm font-semibold tracking-tight text-slate-900">
          Global Job Fraud Analysis Platform
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={navClass}>Home</NavLink>
          <NavLink to="/single" className={navClass}>Single Prediction</NavLink>
          <NavLink to="/csv" className={navClass}>CSV Analysis</NavLink>
        </nav>
      </div>
    </header>
  )
}
