import { useEffect, useMemo, useState } from 'react'
import { disciplinasApi } from '../api/api.js'

const formInicial = { nome: '', grupo: '' }

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [filtroGrupo, setFiltroGrupo] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(formInicial)
  const [editandoId, setEditandoId] = useState(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const res = filtroGrupo
        ? await disciplinasApi.porGrupo(filtroGrupo)
        : await disciplinasApi.listar()
      setDisciplinas(res.data || [])
    } catch (e) {
      setDisciplinas([])
      setMsg({ tipo: 'erro', texto: 'Erro ao carregar disciplinas' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirCadastro = () => {
    setForm(formInicial)
    setEditandoId(null)
    setModalAberto(true)
  }

  const abrirEdicao = (d) => {
    setForm({ nome: d.nome || '', grupo: d.grupo ?? '' })
    setEditandoId(d.id)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setForm(formInicial)
    setEditandoId(null)
  }

  const submeter = async (e) => {
    e.preventDefault()
    if (!form.nome || form.grupo === '') {
      setMsg({ tipo: 'erro', texto: 'Preencha todos os campos' })
      return
    }
    try {
      const payload = { nome: form.nome.trim(), grupo: parseInt(form.grupo) }
      if (editandoId) {
        await disciplinasApi.atualizar(editandoId, payload)
        setMsg({ tipo: 'sucesso', texto: 'Disciplina atualizada' })
      } else {
        await disciplinasApi.criar(payload)
        setMsg({ tipo: 'sucesso', texto: 'Disciplina criada' })
      }
      fecharModal()
      carregar()
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar' })
    }
  }

  const excluir = async (id) => {
    if (!confirm('Excluir esta disciplina?')) return
    try {
      await disciplinasApi.excluir(id)
      setMsg({ tipo: 'sucesso', texto: 'Disciplina excluída' })
      carregar()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao excluir' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Disciplinas</h2>
        <button
          onClick={abrirCadastro}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Cadastrar
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded ${msg.tipo === 'erro' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {msg.texto}
        </div>
      )}

      <div className="bg-white p-4 rounded shadow">
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            placeholder="Filtrar por grupo"
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <button onClick={carregar} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
            Filtrar
          </button>
          <button
            onClick={() => { setFiltroGrupo(''); setTimeout(carregar, 0) }}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Limpar
          </button>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : disciplinas.length === 0 ? (
          <p className="text-gray-500">Nenhuma disciplina cadastrada. Use o botão "+ Cadastrar" para começar.</p>
        ) : (
          <DisciplinasTabela
            disciplinas={disciplinas}
            onEditar={abrirEdicao}
            onExcluir={excluir}
          />
        )}
      </div>

      {modalAberto && (
        <Modal onClose={fecharModal} titulo={editandoId ? 'Editar disciplina' : 'Nova disciplina'}>
          <form onSubmit={submeter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="border rounded px-3 py-2"
                autoFocus
              />
              <input
                type="number"
                placeholder="Grupo"
                value={form.grupo}
                onChange={(e) => setForm({ ...form, grupo: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={fecharModal} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                Cancelar
              </button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {editandoId ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function DisciplinasTabela({ disciplinas, onEditar, onExcluir }) {
  // Ordena por grupo (asc) e depois por nome. Disciplinas do mesmo grupo
  // ficam visualmente "juntas" com a mesma cor de fundo, alternando entre
  // grupos. A troca de grupo recebe uma divisória mais marcada.
  const ordenadas = useMemo(() => {
    return [...disciplinas].sort((a, b) => {
      if (a.grupo !== b.grupo) return (a.grupo ?? 0) - (b.grupo ?? 0)
      return (a.nome || '').localeCompare(b.nome || '')
    })
  }, [disciplinas])

  const corDoGrupo = useMemo(() => {
    const map = new Map()
    let idx = 0
    for (const d of ordenadas) {
      if (!map.has(d.grupo)) {
        map.set(d.grupo, idx++)
      }
    }
    return (grupo) => (map.get(grupo) % 2 === 0 ? 'bg-white' : 'bg-gray-100')
  }, [ordenadas])

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Nome</th>
          <th className="text-left p-2">Grupo</th>
          <th className="text-right p-2">Ações</th>
        </tr>
      </thead>
      <tbody>
        {ordenadas.map((d, i) => {
          const anterior = ordenadas[i - 1]
          const trocouGrupo = anterior && anterior.grupo !== d.grupo
          return (
            <tr
              key={d.id}
              className={`hover:bg-blue-50 ${corDoGrupo(d.grupo)} ${trocouGrupo ? 'border-t-4 border-t-gray-300' : 'border-t'}`}
            >
              <td className="p-2">{d.nome}</td>
              <td className="p-2">{d.grupo}</td>
              <td className="p-2 text-right space-x-2">
                <button onClick={() => onEditar(d)} className="text-blue-600 hover:underline">Editar</button>
                <button onClick={() => onExcluir(d.id)} className="text-red-600 hover:underline">Excluir</button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Modal({ titulo, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{titulo}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
