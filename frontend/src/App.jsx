import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Disciplinas from './pages/Disciplinas.jsx'
import Conteudos from './pages/Conteudos.jsx'
import Revisoes from './pages/Revisoes.jsx'
import TempoEstudo from './pages/TempoEstudo.jsx'
import Gabaritos from './pages/Gabaritos.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/disciplinas" />} />
        <Route path="disciplinas" element={<Disciplinas />} />
        <Route path="conteudos" element={<Conteudos />} />
        <Route path="revisoes" element={<Revisoes />} />
        <Route path="tempo-estudo" element={<TempoEstudo />} />
        <Route path="gabaritos" element={<Gabaritos />} />
      </Route>
    </Routes>
  )
}
