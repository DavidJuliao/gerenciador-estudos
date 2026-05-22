import { useEffect, useMemo, useState } from 'react'
import { tempoEstudoApi, disciplinasApi } from '../api/api.js'

// ----- Helpers de data -----
const DIAS_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ISO local YYYY-MM-DD a partir de Date (evita problemas de timezone do toISOString).
const toIso = (d) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const fromIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Retorna a segunda-feira (00:00) da semana que contém `data`.
const segundaDaSemana = (data) => {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=dom, 1=seg, ...
  const diff = dow === 0 ? -6 : 1 - dow // dom volta 6 dias; demais voltam até segunda
  d.setDate(d.getDate() + diff)
  return d
}

const addDias = (data, n) => {
  const d = new Date(data)
  d.setDate(d.getDate() + n)
  return d
}

const formatarBR = (data) => {
  const dd = String(data.getDate()).padStart(2, '0')
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

const formatarHorasMin = (totalMin) => {
  if (!totalMin) return '0h'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

const formInicial = { data: toIso(new Date()), duracaoMinutos: '', disciplina: '' }

export default function TempoEstudo() {
  const [registros, setRegistros] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  // Semana atualmente sendo visualizada (representada pela segunda-feira).
  const [semanaInicio, setSemanaInicio] = useState(() => segundaDaSemana(new Date()))

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(formInicial)
  const [editandoId, setEditandoId] = useState(null)

  const semanaFim = useMemo(() => addDias(semanaInicio, 6), [semanaInicio])

  const carregarDisciplinas = async () => {
    try {
      const res = await disciplinasApi.listar()
      setDisciplinas(res.data || [])
    } catch (e) {
      // disciplinas é opcional; ignora falha silenciosamente
    }
  }

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await tempoEstudoApi.porIntervalo(toIso(semanaInicio), toIso(semanaFim))
      setRegistros(res.data || [])
    } catch (e) {
      setRegistros([])
      setMsg({ tipo: 'erro', texto: 'Erro ao carregar tempo de estudo' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregarDisciplinas() }, [])
  useEffect(() => { carregar() /* eslint-disable-next-line */ }, [semanaInicio])

  const nomesDisciplinas = useMemo(() => {
    const set = new Set()
    disciplinas.forEach((d) => { if (d?.nome) set.add(d.nome) })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [disciplinas])

  // Soma de minutos por dia da semana (índice 0 = segunda, 6 = domingo).
  const dadosPorDia = useMemo(() => {
    const arr = Array(7).fill(0)
    for (const r of registros) {
      if (!r?.data) continue
      const d = fromIso(r.data)
      const dow = d.getDay() // 0=dom .. 6=sab
      const idx = dow === 0 ? 6 : dow - 1
      arr[idx] += r.duracaoMinutos || 0
    }
    return arr.map((min, i) => ({
      label: DIAS_LABEL[i],
      data: addDias(semanaInicio, i),
      minutos: min
    }))
  }, [registros, semanaInicio])

  const totalSemana = useMemo(() => dadosPorDia.reduce((s, d) => s + d.minutos, 0), [dadosPorDia])

  // --- Navegação de semana ---
  const semanaAnterior = () => setSemanaInicio(addDias(semanaInicio, -7))
  const semanaProxima = () => setSemanaInicio(addDias(semanaInicio, 7))
  const semanaAtual = () => setSemanaInicio(segundaDaSemana(new Date()))

  const ehSemanaAtual = useMemo(() => {
    return toIso(semanaInicio) === toIso(segundaDaSemana(new Date()))
  }, [semanaInicio])

  // --- CRUD ---
  const abrirCadastro = () => {
    setForm({ ...formInicial, data: toIso(new Date()) })
    setEditandoId(null)
    setModalAberto(true)
  }

  const abrirEdicao = (r) => {
    setForm({
      data: r.data,
      duracaoMinutos: String(r.duracaoMinutos || ''),
      disciplina: r.disciplina || ''
    })
    setEditandoId(r.id)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setForm(formInicial)
    setEditandoId(null)
  }

  const submeter = async (e) => {
    e.preventDefault()
    const dur = parseInt(form.duracaoMinutos)
    if (!form.data || !dur || dur <= 0) {
      setMsg({ tipo: 'erro', texto: 'Preencha data e duração (minutos > 0)' })
      return
    }
    try {
      const payload = {
        data: form.data,
        duracaoMinutos: dur,
        disciplina: form.disciplina?.trim() || null
      }
      if (editandoId) {
        await tempoEstudoApi.atualizar(editandoId, payload)
        setMsg({ tipo: 'sucesso', texto: 'Registro atualizado' })
      } else {
        await tempoEstudoApi.criar(payload)
        setMsg({ tipo: 'sucesso', texto: 'Registro criado' })
      }
      fecharModal()
      // se o registro cair fora da semana visualizada, salta para a semana dele
      const novaSemana = segundaDaSemana(fromIso(payload.data))
      if (toIso(novaSemana) !== toIso(semanaInicio)) {
        setSemanaInicio(novaSemana)
      } else {
        await carregar()
      }
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar' })
    }
  }

  const excluir = async (id) => {
    if (!confirm('Excluir este registro?')) return
    try {
      await tempoEstudoApi.excluir(id)
      setMsg({ tipo: 'sucesso', texto: 'Registro excluído' })
      await carregar()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao excluir' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tempo de Estudo</h2>
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

      {/* Navegação de semana */}
      <div className="bg-white p-4 rounded shadow flex items-center justify-between gap-3">
        <button onClick={semanaAnterior} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">
          ← Anterior
        </button>
        <div className="text-center">
          <p className="font-semibold">
            Semana de {formatarBR(semanaInicio)} a {formatarBR(semanaFim)}
          </p>
          <p className="text-sm text-gray-500">
            Total: <strong>{formatarHorasMin(totalSemana)}</strong>
            {!ehSemanaAtual && (
              <button onClick={semanaAtual} className="ml-3 text-blue-600 hover:underline">
                ir para semana atual
              </button>
            )}
          </p>
        </div>
        <button onClick={semanaProxima} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">
          Próxima →
        </button>
      </div>

      {/* Gráfico de linha */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Evolução diária (em minutos)</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <GraficoLinha dados={dadosPorDia} />
        )}
      </div>

      {/* Lista cronológica */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Lançamentos da semana</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : registros.length === 0 ? (
          <p className="text-gray-500">Nenhum lançamento nesta semana.</p>
        ) : (
          <ul className="divide-y">
            {[...registros].sort((a, b) => (a.data || '').localeCompare(b.data || '')).map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{formatarHorasMin(r.duracaoMinutos)} <span className="text-gray-500 text-sm">· {r.data}</span></p>
                  <p className="text-sm text-gray-600">{r.disciplina || <span className="italic text-gray-400">sem disciplina</span>}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => abrirEdicao(r)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => excluir(r.id)} className="text-red-600 hover:underline">Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalAberto && (
        <Modal onClose={fecharModal} titulo={editandoId ? 'Editar registro' : 'Novo registro'}>
          <form onSubmit={submeter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Data</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Duração (minutos)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="60"
                  value={form.duracaoMinutos}
                  onChange={(e) => setForm({ ...form, duracaoMinutos: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Disciplina (opcional)</label>
                <select
                  value={form.disciplina}
                  onChange={(e) => setForm({ ...form, disciplina: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">— sem disciplina —</option>
                  {nomesDisciplinas.map((nome) => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </select>
              </div>
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

// ----- Gráfico de linha SVG -----
function GraficoLinha({ dados }) {
  const W = 640
  const H = 220
  const padL = 36, padR = 12, padT = 12, padB = 28
  const maxMin = Math.max(60, ...dados.map((d) => d.minutos)) // mínimo 60min na escala
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const x = (i) => padL + (i * innerW) / (dados.length - 1 || 1)
  const y = (min) => padT + innerH - (min / maxMin) * innerH

  const pontos = dados.map((d, i) => `${x(i)},${y(d.minutos)}`).join(' ')

  // Ticks do eixo Y: 0, meio e máximo
  const ticks = [0, Math.round(maxMin / 2), maxMin]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Eixo Y - grade */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL} y1={y(t)} x2={W - padR} y2={y(t)}
            stroke="#e5e7eb" strokeWidth="1"
          />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6b7280">
            {t}m
          </text>
        </g>
      ))}

      {/* Linha */}
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.5"
        points={pontos}
      />

      {/* Pontos com tooltip */}
      {dados.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.minutos)} r="4" fill="#2563eb" />
          {d.minutos > 0 && (
            <text x={x(i)} y={y(d.minutos) - 8} textAnchor="middle" fontSize="11" fill="#1f2937">
              {d.minutos}
            </text>
          )}
        </g>
      ))}

      {/* Eixo X - labels dos dias */}
      {dados.map((d, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - padB + 18}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
        >
          {d.label}
        </text>
      ))}
    </svg>
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
