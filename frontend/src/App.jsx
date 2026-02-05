import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DAppPage from './pages/DAppPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dapp" element={<DAppPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
