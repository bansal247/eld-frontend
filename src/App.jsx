import { Link, Route, Routes } from 'react-router-dom'
import PlanTripPage from './pages/PlanTripPage.jsx'
import TripResultPage from './pages/TripResultPage.jsx'

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<PlanTripPage />} />
          <Route path="/trips/:id" element={<TripResultPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-[color:var(--color-ink)] bg-[color:var(--color-card)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="inline-block w-7 h-7 bg-[color:var(--color-amber)] border-2 border-[color:var(--color-ink)] rotate-45 group-hover:rotate-[225deg] transition-transform duration-500" />
          <div className="leading-tight">
            <div className="font-display font-bold text-[15px] tracking-tight">
              ELD&nbsp;TRIP&nbsp;PLANNER
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              49 CFR Part 395 Compliant
            </div>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-muted)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          70hr / 8 day cycle
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-rule)] py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] flex flex-wrap gap-x-6 gap-y-1 justify-between">
        <span>Property carrier · single driver · interstate</span>
        <span>Demo build — assumes fresh shift on each plan</span>
      </div>
    </footer>
  )
}

function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-muted)]">
          Status 404
        </div>
        <h1 className="font-display text-3xl font-bold mt-2">Route not found</h1>
        <Link to="/" className="inline-block mt-6 font-mono text-sm underline underline-offset-4 decoration-[color:var(--color-amber)] decoration-2">
          Plan a new trip →
        </Link>
      </div>
    </div>
  )
}
