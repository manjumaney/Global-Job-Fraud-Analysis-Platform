import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import SinglePredictionPage from './pages/SinglePredictionPage'
import CsvAnalysisPage from './pages/CsvAnalysisPage'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/single" element={<SinglePredictionPage />} />
          <Route path="/csv" element={<CsvAnalysisPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
