import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded transition ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-200'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">📚 Gerenciador de Estudos</h1>
          <nav className="flex gap-2">
            <NavLink to="/disciplinas" className={linkClass}>Disciplinas</NavLink>
            <NavLink to="/conteudos" className={linkClass}>Conteúdos</NavLink>
            <NavLink to="/revisoes" className={linkClass}>Revisões</NavLink>
            <NavLink to="/gabaritos" className={linkClass}>Gabaritos</NavLink>
            <NavLink to="/tempo-estudo" className={linkClass}>Tempo de Estudo</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
