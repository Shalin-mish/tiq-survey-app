import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import DataPage from './pages/DataPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/data" element={<DataPage />} />
      </Routes>
    </BrowserRouter>
  )
}
