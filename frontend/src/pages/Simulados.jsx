import { useEffect, useMemo, useState } from 'react'
import { simuladosApi, simuladoHistoricosApi, conteudosApi, disciplinasApi } from '../api/api.js'

const ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E']

const ordenarQuestoes = (obj) =>
  Object.keys(obj || {}).sort((a, b) => Number(a) - Number(b))

export default function Simulados() {
  // view: 'lista' | 'historicos'
  const [view, setView] = useState('lista')
  const [simulado, setSimulado] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3500)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        {view === 'historicos' ? (
          <>
            <button onClick={() => setView('lista')} className="text-blue-600 hover:underline">Simulados</button>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-800">Simulado #{simulado?.numero}</span>
          </>
        ) : (
          <span className="font-semibold text-gray-800">Simulados</span>
        )}
      </div>

      {msg && (
        <div className={`p-3 rounded ${msg.tipo === 'erro' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {msg.texto}
        </div>
      )}

      {view === 'lista' ? (
        <ListaSimulados onSelecionar={(s) => { setSimulado(s); setView('historicos') }} onMsg={setMsg} />
      ) : (
        <ListaHistoricos simulado={simulado} onMsg={setMsg} />
      )}
    </div>
  )
}

/* --------------------------------------------------------- 1) Lista de simulados */

const simuladoFormInicial = { numero: '', questoesJson: '', disciplinas: {}, conteudos: {} }

function ListaSimulados({ onSelecionar, onMsg }) {
  const [simulados, setSimulados] = useState([])
  const [disciplinasNomes, setDisciplinasNomes] = useState([])
  const [conteudosTodos, setConteudosTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(simuladoFormInicial)
  const [editandoId, setEditandoId] = useState(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await simuladosApi.listar()
      setSimulados(res.data || [])
    } catch {
      setSimulados([])
      onMsg({ tipo: 'erro', texto: 'Erro ao carregar simulados' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // Carrega disciplinas e conteúdos cadastrados para sugerir no formulário.
  useEffect(() => {
    disciplinasApi.listar()
      .then((res) => {
        const nomes = [...new Set((res.data || []).map((d) => (d.nome || '').trim()).filter(Boolean))]
        setDisciplinasNomes(nomes.sort((a, b) => a.localeCompare(b)))
      })
      .catch(() => setDisciplinasNomes([]))
    conteudosApi.listar()
      .then((res) => setConteudosTodos(res.data || []))
      .catch(() => setConteudosTodos([]))
  }, [])

  const abrirCadastro = () => {
    setForm(simuladoFormInicial)
    setEditandoId(null)
    setModalAberto(true)
  }

  const abrirEdicao = (s, e) => {
    e.stopPropagation()
    const questoesOrdenadas = {}
    ordenarQuestoes(s.questoes).forEach((q) => { questoesOrdenadas[q] = s.questoes[q] })
    setForm({
      numero: s.numero ?? '',
      questoesJson: JSON.stringify(questoesOrdenadas, null, 2),
      disciplinas: { ...(s.disciplinas || {}) },
      conteudos: { ...(s.conteudos || {}) }
    })
    setEditandoId(s.id)
    setModalAberto(true)
  }

  const excluir = async (s, e) => {
    e.stopPropagation()
    if (!confirm(`Excluir o simulado #${s.numero}? Os históricos vinculados também serão removidos.`)) return
    try {
      await simuladosApi.excluir(s.id)
      onMsg({ tipo: 'sucesso', texto: 'Simulado excluído' })
      carregar()
    } catch {
      onMsg({ tipo: 'erro', texto: 'Erro ao excluir simulado' })
    }
  }

  const submeter = async (payload) => {
    try {
      if (editandoId) {
        await simuladosApi.atualizar(editandoId, payload)
        onMsg({ tipo: 'sucesso', texto: 'Simulado atualizado' })
      } else {
        await simuladosApi.criar(payload)
        onMsg({ tipo: 'sucesso', texto: 'Simulado cadastrado' })
      }
      setModalAberto(false)
      carregar()
    } catch {
      onMsg({ tipo: 'erro', texto: 'Erro ao salvar simulado' })
    }
  }

  const ordenados = useMemo(
    () => [...simulados].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0)),
    [simulados]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Simulados</h2>
        <button onClick={abrirCadastro} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Cadastrar simulado
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? (
          <p>Carregando...</p>
        ) : ordenados.length === 0 ? (
          <p className="text-gray-500">Nenhum simulado cadastrado.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Simulado</th>
                <th className="p-2">Questões</th>
                <th className="p-2">Disciplinas</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((s) => {
                const qtd = ordenarQuestoes(s.questoes).length
                const disciplinas = [...new Set(Object.values(s.disciplinas || {}).map((d) => (d || '').trim()).filter(Boolean))]
                return (
                  <tr key={s.id} onClick={() => onSelecionar(s)} className="border-t hover:bg-blue-50 cursor-pointer">
                    <td className="p-2 font-semibold">#{s.numero}</td>
                    <td className="p-2">{qtd}</td>
                    <td className="p-2 text-gray-600 text-sm">{disciplinas.length ? disciplinas.join(', ') : '—'}</td>
                    <td className="p-2 text-right space-x-2 whitespace-nowrap">
                      <button onClick={(e) => abrirEdicao(s, e)} className="text-blue-600 hover:underline">Editar</button>
                      <button onClick={(e) => excluir(s, e)} className="text-red-600 hover:underline">Excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <Modal titulo={editandoId ? 'Editar simulado' : 'Novo simulado'} onClose={() => setModalAberto(false)}>
          <SimuladoForm
            form={form}
            setForm={setForm}
            disciplinasNomes={disciplinasNomes}
            conteudosTodos={conteudosTodos}
            editando={!!editandoId}
            onCancelar={() => setModalAberto(false)}
            onSubmeter={submeter}
            onMsg={onMsg}
          />
        </Modal>
      )}
    </div>
  )
}

function SimuladoForm({ form, setForm, disciplinasNomes = [], conteudosTodos = [], editando, onCancelar, onSubmeter, onMsg }) {
  // Sugestões de conteúdo filtradas pela disciplina informada na própria questão.
  const conteudosDaDisciplina = (disc) => {
    const d = (disc || '').trim().toLowerCase()
    const filtrados = conteudosTodos.filter((c) => !d || (c.disciplina || '').trim().toLowerCase() === d)
    return [...new Set(filtrados.map((c) => c.descricao).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  }
  const exemplo = `{
  "1": "B",
  "2": "A",
  "3": "C"
}`

  // Lê o JSON do gabarito em tempo real para gerar a lista por questão.
  const { mapa, numeros, jsonOk } = useMemo(() => {
    if (!form.questoesJson.trim()) return { mapa: {}, numeros: [], jsonOk: null }
    try {
      const parsed = JSON.parse(form.questoesJson)
      const m = parsed && parsed.questoes && typeof parsed.questoes === 'object' ? parsed.questoes : parsed
      if (!m || typeof m !== 'object' || Array.isArray(m)) return { mapa: {}, numeros: [], jsonOk: false }
      return { mapa: m, numeros: ordenarQuestoes(m), jsonOk: true }
    } catch {
      return { mapa: {}, numeros: [], jsonOk: false }
    }
  }, [form.questoesJson])

  const setDisc = (q, v) => setForm((f) => ({ ...f, disciplinas: { ...f.disciplinas, [q]: v } }))
  const setCont = (q, v) => setForm((f) => ({ ...f, conteudos: { ...f.conteudos, [q]: v } }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.numero === '' || form.numero === null) {
      onMsg({ tipo: 'erro', texto: 'Informe o número do simulado.' })
      return
    }
    if (jsonOk !== true || numeros.length === 0) {
      onMsg({ tipo: 'erro', texto: 'Cole o gabarito no formato {"1":"A","2":"B"}.' })
      return
    }
    // Mantém apenas disciplina/conteúdo preenchidos e dentro das questões existentes.
    const disciplinas = {}
    const conteudos = {}
    numeros.forEach((q) => {
      const d = (form.disciplinas[q] || '').trim()
      const c = (form.conteudos[q] || '').trim()
      if (d) disciplinas[q] = d
      if (c) conteudos[q] = c
    })
    onSubmeter({
      numero: parseInt(form.numero),
      questoes: normalizarQuestoes(mapa),
      disciplinas,
      conteudos
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="text-sm block max-w-xs">
        Número do simulado
        <input
          type="number"
          value={form.numero}
          onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
          className="border rounded px-3 py-2 w-full mt-1"
          autoFocus
        />
      </label>

      <div>
        <label className="text-sm font-medium">Gabarito do simulado (JSON)</label>
        <textarea
          value={form.questoesJson}
          onChange={(e) => setForm((f) => ({ ...f, questoesJson: e.target.value }))}
          rows={8}
          spellCheck={false}
          className="w-full border rounded px-3 py-2 font-mono text-sm mt-1"
          placeholder={exemplo}
        />
        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, questoesJson: exemplo }))}
            className="text-blue-600 text-sm hover:underline"
          >
            Inserir exemplo
          </button>
          {jsonOk === false && <span className="text-sm text-red-600">JSON inválido.</span>}
        </div>
      </div>

      {jsonOk === true && numeros.length > 0 && (
        <div>
          <datalist id="lista-disciplinas-simulado">
            {disciplinasNomes.map((nome) => (
              <option key={nome} value={nome} />
            ))}
          </datalist>
          <div className="text-sm font-medium mb-1">Disciplina e conteúdo por questão (opcional)</div>
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
              <span className="w-10">Questão</span>
              <span className="w-8 text-center">Resp.</span>
              <span className="flex-1">Disciplina</span>
              <span className="flex-1">Conteúdo</span>
            </div>
            {numeros.map((q) => (
              <div key={q} className="flex items-center gap-2">
                <span className="w-10 text-sm text-gray-600">#{q}</span>
                <span className="w-8 text-center text-sm font-medium text-gray-700">{mapa[q]}</span>
                <input
                  type="text"
                  list="lista-disciplinas-simulado"
                  placeholder="disciplina"
                  value={form.disciplinas[q] || ''}
                  onChange={(e) => setDisc(q, e.target.value)}
                  className="border rounded px-2 py-1 text-sm flex-1 min-w-0"
                />
                <input
                  type="text"
                  list={`lista-conteudos-${q}`}
                  placeholder="conteúdo"
                  value={form.conteudos[q] || ''}
                  onChange={(e) => setCont(q, e.target.value)}
                  className="border rounded px-2 py-1 text-sm flex-1 min-w-0"
                />
                <datalist id={`lista-conteudos-${q}`}>
                  {conteudosDaDisciplina(form.disciplinas[q]).map((desc) => (
                    <option key={desc} value={desc} />
                  ))}
                </datalist>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t">
        <button type="button" onClick={onCancelar} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
          Cancelar
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editando ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------- 2) Históricos */

function ListaHistoricos({ simulado, onMsg }) {
  const [historicos, setHistoricos] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [detalhe, setDetalhe] = useState(null)

  const numeros = useMemo(() => ordenarQuestoes(simulado.questoes), [simulado])

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await simuladoHistoricosApi.porSimulado(simulado.id)
      setHistoricos(res.data || [])
    } catch {
      setHistoricos([])
      onMsg({ tipo: 'erro', texto: 'Erro ao carregar históricos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [simulado])

  const abrirCadastro = () => { setEditando(null); setModalAberto(true) }
  const abrirEdicao = (h) => { setEditando(h); setModalAberto(true) }

  const excluir = async (h) => {
    if (!confirm('Excluir este histórico?')) return
    try {
      await simuladoHistoricosApi.excluir(h.id)
      onMsg({ tipo: 'sucesso', texto: 'Histórico excluído' })
      if (detalhe?.id === h.id) setDetalhe(null)
      carregar()
    } catch {
      onMsg({ tipo: 'erro', texto: 'Erro ao excluir histórico' })
    }
  }

  const submeter = async (payload) => {
    try {
      if (editando) {
        await simuladoHistoricosApi.atualizar(editando.id, payload)
        onMsg({ tipo: 'sucesso', texto: 'Histórico atualizado' })
      } else {
        await simuladoHistoricosApi.criar(simulado.id, payload)
        onMsg({ tipo: 'sucesso', texto: 'Histórico cadastrado' })
      }
      setModalAberto(false)
      carregar()
    } catch {
      onMsg({ tipo: 'erro', texto: 'Erro ao salvar histórico' })
    }
  }

  const ordenados = useMemo(
    () => [...historicos].sort((a, b) => (b.dataResolucao || '').localeCompare(a.dataResolucao || '')),
    [historicos]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Simulado #{simulado.numero}</h2>
          <p className="text-sm text-gray-500">{numeros.length} questões</p>
        </div>
        <button onClick={abrirCadastro} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Cadastrar histórico
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? (
          <p>Carregando...</p>
        ) : ordenados.length === 0 ? (
          <p className="text-gray-500">Nenhuma resolução registrada ainda.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Data</th>
                <th className="p-2">Resultado</th>
                <th className="p-2">Aproveitamento</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((h) => {
                const pct = h.totalQuestoes ? Math.round((h.acertos / h.totalQuestoes) * 100) : 0
                return (
                  <tr key={h.id} className="border-t hover:bg-blue-50">
                    <td className="p-2">{formatarData(h.dataResolucao)}</td>
                    <td className="p-2 font-semibold">{h.acertos}/{h.totalQuestoes}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-sm ${pct >= 70 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="p-2 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => setDetalhe(h)} className="text-gray-700 hover:underline">Ver</button>
                      <button onClick={() => abrirEdicao(h)} className="text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => excluir(h)} className="text-red-600 hover:underline">Excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {detalhe && (
        <Modal titulo={`Resolução de ${formatarData(detalhe.dataResolucao)}`} onClose={() => setDetalhe(null)}>
          <DetalheHistorico simulado={simulado} historico={detalhe} numeros={numeros} onMsg={onMsg} />
        </Modal>
      )}

      {modalAberto && (
        <Modal titulo={editando ? 'Editar histórico' : 'Nova resolução'} onClose={() => setModalAberto(false)}>
          <HistoricoForm
            numeros={numeros}
            inicial={editando}
            onCancelar={() => setModalAberto(false)}
            onSubmeter={submeter}
          />
        </Modal>
      )}
    </div>
  )
}

function HistoricoForm({ numeros, inicial, onCancelar, onSubmeter }) {
  const [data, setData] = useState(inicial?.dataResolucao || hoje())
  const [respostas, setRespostas] = useState({ ...(inicial?.respostas || {}) })
  const [atencao, setAtencao] = useState({ ...(inicial?.atencao || {}) })
  const [observacoes, setObservacoes] = useState({ ...(inicial?.observacoes || {}) })
  const [idx, setIdx] = useState(0)

  const total = numeros.length
  const q = numeros[idx]
  const respondidas = numeros.filter((n) => respostas[n]).length

  const irPara = (i) => setIdx(Math.max(0, Math.min(total - 1, i)))

  const escolher = (alt) => {
    setRespostas((r) => ({ ...r, [q]: alt }))
    if (idx < total - 1) setTimeout(() => setIdx((i) => Math.min(total - 1, i + 1)), 120)
  }
  const limparResposta = () => setRespostas((r) => { const c = { ...r }; delete c[q]; return c })
  const toggleAtencao = () => setAtencao((a) => ({ ...a, [q]: !a[q] }))
  const setObs = (v) => setObservacoes((o) => ({ ...o, [q]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const obsLimpa = {}
    Object.entries(observacoes).forEach(([k, v]) => { if (v && v.trim()) obsLimpa[k] = v.trim() })
    const atencaoLimpa = {}
    Object.entries(atencao).forEach(([k, v]) => { if (v) atencaoLimpa[k] = true })
    onSubmeter({
      dataResolucao: data || null,
      respostas,
      observacoes: obsLimpa,
      atencao: atencaoLimpa
    })
  }

  if (total === 0) {
    return <p className="text-gray-500">Este simulado não possui questões cadastradas.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="text-sm">
          Data da resolução
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="border rounded px-3 py-2 mt-1 block"
          />
        </label>
        <div className="text-sm text-gray-600">{respondidas}/{total} respondidas</div>
      </div>

      <div className="flex flex-wrap gap-1">
        {numeros.map((n, i) => {
          const atual = i === idx
          const feita = !!respostas[n]
          return (
            <button
              type="button"
              key={n}
              onClick={() => irPara(i)}
              className={`w-8 h-8 rounded text-xs font-medium border ${atual ? 'ring-2 ring-blue-500 ' : ''}${
                feita ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-white text-gray-500 border-gray-300'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>

      <div className="border rounded p-4 space-y-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Questão {idx + 1} de {total}</div>
          <div className="text-3xl font-bold">{q}</div>
        </div>

        <div className="flex justify-center gap-2">
          {ALTERNATIVAS.map((alt) => (
            <button
              type="button"
              key={alt}
              onClick={() => escolher(alt)}
              className={`w-12 h-12 rounded-lg text-lg font-semibold border transition ${
                respostas[q] === alt
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
              }`}
            >
              {alt}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <label className="flex items-center gap-1 text-sm text-gray-600">
            <input type="checkbox" checked={!!atencao[q]} onChange={toggleAtencao} />
            marcar atenção
          </label>
          {respostas[q] && (
            <button type="button" onClick={limparResposta} className="text-sm text-gray-500 hover:underline">
              limpar resposta
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="observação (opcional)"
          value={observacoes[q] || ''}
          onChange={(e) => setObs(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => irPara(idx - 1)}
          disabled={idx === 0}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={() => irPara(idx + 1)}
          disabled={idx === total - 1}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
        >
          Avançar →
        </button>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t">
        <button type="button" onClick={onCancelar} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
          Cancelar
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Salvar e corrigir
        </button>
      </div>
    </form>
  )
}

function DetalheHistorico({ simulado, historico, numeros, onMsg }) {
  const pct = historico.totalQuestoes ? Math.round((historico.acertos / historico.totalQuestoes) * 100) : 0

  // Busca o conteúdo cadastrado (disciplina + descrição) e marca para revisar.
  const revisar = async (disciplina, conteudo) => {
    if (!disciplina || !conteudo) {
      onMsg({ tipo: 'erro', texto: 'Esta questão não tem disciplina/conteúdo informados.' })
      return
    }
    try {
      const res = await conteudosApi.porDisciplina(disciplina)
      const alvo = (res.data || []).find(
        (c) => (c.descricao || '').trim().toLowerCase() === conteudo.trim().toLowerCase()
      )
      if (!alvo) {
        onMsg({ tipo: 'erro', texto: `Conteúdo "${conteudo}" não está cadastrado em ${disciplina}.` })
        return
      }
      await conteudosApi.atualizar(alvo.id, { ...alvo, marcado: true })
      onMsg({ tipo: 'sucesso', texto: `"${conteudo}" marcado para revisar.` })
    } catch {
      onMsg({ tipo: 'erro', texto: 'Erro ao marcar para revisar.' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold">{historico.acertos}/{historico.totalQuestoes}</div>
        <span className={`px-2 py-1 rounded ${pct >= 70 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
          {pct}% de acerto
        </span>
      </div>

      <p className="text-xs text-gray-400">
        Passe o mouse sobre as questões erradas ou marcadas (⚠️) para ver a disciplina/conteúdo e revisar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {numeros.map((q) => {
          const acertou = historico.resultadoPorQuestao?.[q]
          const marcada = historico.respostas?.[q] || '—'
          const correta = simulado.questoes?.[q] || '—'
          const temAtencao = historico.atencao?.[q]
          const disciplina = simulado.disciplinas?.[q]
          const conteudo = simulado.conteudos?.[q]
          const destacar = !acertou || temAtencao
          return (
            <div
              key={q}
              className={`group relative rounded p-2 text-sm border ${acertou ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Questão {q}</span>
                <span className="flex items-center gap-2">
                  {temAtencao && <span title="Atenção">⚠️</span>}
                  <span className={acertou ? 'text-green-700' : 'text-red-700'}>
                    {marcada} {acertou ? '✓' : `✗ (${correta})`}
                  </span>
                </span>
              </div>

              {/* Questões corretas: disciplina/conteúdo inline */}
              {!destacar && (disciplina || conteudo) && (
                <div className="text-xs text-gray-500 mt-1">{[disciplina, conteudo].filter(Boolean).join(' · ')}</div>
              )}

              {/* Questões erradas ou marcadas: painel de revisão no hover */}
              {destacar && (
                <div className="hidden group-hover:block mt-2 border-t pt-2 space-y-1">
                  {disciplina && (
                    <div className="text-xs text-gray-600"><span className="font-medium">Disciplina:</span> {disciplina}</div>
                  )}
                  {conteudo && (
                    <div className="text-xs text-gray-600"><span className="font-medium">Conteúdo:</span> {conteudo}</div>
                  )}
                  {!disciplina && !conteudo && (
                    <div className="text-xs text-gray-400">Sem disciplina/conteúdo informados.</div>
                  )}
                  {conteudo && (
                    <button
                      type="button"
                      onClick={() => revisar(disciplina, conteudo)}
                      className="mt-1 text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600"
                    >
                      Revisar
                    </button>
                  )}
                </div>
              )}

              {historico.observacoes?.[q] && (
                <div className="text-xs text-gray-500 mt-1 italic">{historico.observacoes[q]}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- Reusáveis */

// Normaliza as respostas: descarta vazios e deixa as alternativas em maiúsculo.
function normalizarQuestoes(obj) {
  const out = {}
  Object.entries(obj).forEach(([k, v]) => {
    if (typeof v === 'string' && v.trim()) out[k] = v.trim().toUpperCase()
  })
  return out
}

function Modal({ titulo, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded shadow-lg w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{titulo}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none" aria-label="Fechar">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- Utils */

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function formatarData(iso) {
  if (!iso) return '—'
  const [a, m, d] = String(iso).slice(0, 10).split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}
