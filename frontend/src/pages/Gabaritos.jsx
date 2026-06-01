import { useEffect, useMemo, useState } from 'react'
import { disciplinasApi, conteudosApi, gabaritosApi, historicosApi } from '../api/api.js'

const ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E']

// Ordena as chaves de questão ("1", "2", ... "10") numericamente.
const ordenarQuestoes = (obj) =>
  Object.keys(obj || {}).sort((a, b) => Number(a) - Number(b))

export default function Gabaritos() {
  // view: 'disciplinas' | 'gabaritos' | 'historicos'
  const [view, setView] = useState('disciplinas')
  const [disciplina, setDisciplina] = useState(null) // nome da disciplina selecionada
  const [gabarito, setGabarito] = useState(null)      // gabarito selecionado
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3500)
    return () => clearTimeout(t)
  }, [msg])

  const irParaGabaritos = (nomeDisciplina) => {
    setDisciplina(nomeDisciplina)
    setView('gabaritos')
  }

  const irParaHistoricos = (g) => {
    setGabarito(g)
    setView('historicos')
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        view={view}
        disciplina={disciplina}
        gabarito={gabarito}
        onDisciplinas={() => setView('disciplinas')}
        onGabaritos={() => setView('gabaritos')}
      />

      {msg && (
        <div className={`p-3 rounded ${msg.tipo === 'erro' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {msg.texto}
        </div>
      )}

      {view === 'disciplinas' && (
        <ListaDisciplinas onSelecionar={irParaGabaritos} onMsg={setMsg} />
      )}

      {view === 'gabaritos' && (
        <ListaGabaritos disciplina={disciplina} onSelecionar={irParaHistoricos} onMsg={setMsg} />
      )}

      {view === 'historicos' && (
        <ListaHistoricos gabarito={gabarito} onMsg={setMsg} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Breadcrumb */

function Breadcrumb({ view, disciplina, gabarito, onDisciplinas, onGabaritos }) {
  const Item = ({ children, onClick, ativo }) =>
    ativo ? (
      <span className="font-semibold text-gray-800">{children}</span>
    ) : (
      <button onClick={onClick} className="text-blue-600 hover:underline">{children}</button>
    )

  return (
    <div className="flex items-center gap-2 text-sm">
      <Item onClick={onDisciplinas} ativo={view === 'disciplinas'}>Disciplinas</Item>
      {(view === 'gabaritos' || view === 'historicos') && (
        <>
          <span className="text-gray-400">/</span>
          <Item onClick={onGabaritos} ativo={view === 'gabaritos'}>{disciplina}</Item>
        </>
      )}
      {view === 'historicos' && (
        <>
          <span className="text-gray-400">/</span>
          <Item ativo>Gabarito #{gabarito?.numero}</Item>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ 1) Disciplinas */

function ListaDisciplinas({ onSelecionar, onMsg }) {
  const [disciplinas, setDisciplinas] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ativo = true
    setLoading(true)
    disciplinasApi.listar()
      .then((res) => { if (ativo) setDisciplinas(res.data || []) })
      .catch(() => { if (ativo) { setDisciplinas([]); onMsg({ tipo: 'erro', texto: 'Erro ao carregar disciplinas' }) } })
      .finally(() => { if (ativo) setLoading(false) })
    return () => { ativo = false }
  }, [])

  // Nomes de disciplina únicos (a mesma disciplina pode existir em vários
  // grupos; no fluxo de gabaritos o vínculo é só pelo nome).
  const nomesUnicos = useMemo(() => {
    const nomes = [...new Set(disciplinas.map((d) => (d.nome || '').trim()).filter(Boolean))]
    return nomes.sort((a, b) => a.localeCompare(b))
  }, [disciplinas])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gabaritos por disciplina</h2>
      <p className="text-gray-500">Selecione uma disciplina para ver e cadastrar os gabaritos.</p>

      {loading ? (
        <p>Carregando...</p>
      ) : nomesUnicos.length === 0 ? (
        <p className="text-gray-500">Nenhuma disciplina cadastrada.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nomesUnicos.map((nome) => (
            <button
              key={nome}
              onClick={() => onSelecionar(nome)}
              className="text-left bg-white p-4 rounded shadow hover:shadow-md hover:bg-blue-50 transition border border-transparent hover:border-blue-200"
            >
              <div className="font-semibold text-gray-800">{nome}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- 2) Gabaritos */

const gabaritoFormInicial = { numero: '', conteudoId: '', questoesJson: '' }

function ListaGabaritos({ disciplina, onSelecionar, onMsg }) {
  const [gabaritos, setGabaritos] = useState([])
  const [conteudos, setConteudos] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(gabaritoFormInicial)
  const [editandoId, setEditandoId] = useState(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await gabaritosApi.porDisciplina(disciplina)
      setGabaritos(res.data || [])
    } catch {
      setGabaritos([])
      onMsg({ tipo: 'erro', texto: 'Erro ao carregar gabaritos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    conteudosApi.porDisciplina(disciplina)
      .then((res) => setConteudos(res.data || []))
      .catch(() => setConteudos([]))
  }, [disciplina])

  const nomeConteudo = (id) => conteudos.find((c) => c.id === id)?.descricao

  const abrirCadastro = () => {
    setForm(gabaritoFormInicial)
    setEditandoId(null)
    setModalAberto(true)
  }

  const abrirEdicao = (g, e) => {
    e.stopPropagation()
    const questoesOrdenadas = {}
    ordenarQuestoes(g.questoes).forEach((q) => { questoesOrdenadas[q] = g.questoes[q] })
    setForm({
      numero: g.numero ?? '',
      conteudoId: g.conteudoId || '',
      questoesJson: JSON.stringify(questoesOrdenadas, null, 2)
    })
    setEditandoId(g.id)
    setModalAberto(true)
  }

  const excluir = async (g, e) => {
    e.stopPropagation()
    if (!confirm(`Excluir o gabarito #${g.numero}? Os históricos vinculados também serão removidos.`)) return
    try {
      await gabaritosApi.excluir(g.id)
      onMsg({ tipo: 'sucesso', texto: 'Gabarito excluído' })
      carregar()
    } catch {
      onMsg({ tipo: 'erro', texto: 'Erro ao excluir gabarito' })
    }
  }

  const submeter = async (payload) => {
    try {
      if (editandoId) {
        await gabaritosApi.atualizar(editandoId, payload)
        onMsg({ tipo: 'sucesso', texto: 'Gabarito atualizado' })
      } else {
        await gabaritosApi.criar(payload)
        onMsg({ tipo: 'sucesso', texto: 'Gabarito cadastrado' })
      }
      setModalAberto(false)
      carregar()
    } catch {
      onMsg({ tipo: 'erro', texto: 'Erro ao salvar gabarito' })
    }
  }

  const ordenados = useMemo(
    () => [...gabaritos].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0)),
    [gabaritos]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{disciplina}</h2>
        <button onClick={abrirCadastro} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Cadastrar gabarito
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? (
          <p>Carregando...</p>
        ) : ordenados.length === 0 ? (
          <p className="text-gray-500">Nenhum gabarito cadastrado para esta disciplina.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Gabarito</th>
                <th className="p-2">Questões</th>
                <th className="p-2">Conteúdo</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => onSelecionar(g)}
                  className="border-t hover:bg-blue-50 cursor-pointer"
                >
                  <td className="p-2 font-semibold">#{g.numero}</td>
                  <td className="p-2">{ordenarQuestoes(g.questoes).length}</td>
                  <td className="p-2 text-gray-600">{nomeConteudo(g.conteudoId) || '—'}</td>
                  <td className="p-2 text-right space-x-2 whitespace-nowrap">
                    <button onClick={(e) => abrirEdicao(g, e)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={(e) => excluir(g, e)} className="text-red-600 hover:underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <Modal titulo={editandoId ? 'Editar gabarito' : 'Novo gabarito'} onClose={() => setModalAberto(false)}>
          <GabaritoForm
            disciplina={disciplina}
            conteudos={conteudos}
            form={form}
            setForm={setForm}
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

function GabaritoForm({ disciplina, conteudos, form, setForm, editando, onCancelar, onSubmeter, onMsg }) {
  const exemplo = `{
  "1": "B",
  "2": "A",
  "3": "C"
}`

  const handleSubmit = (e) => {
    e.preventDefault()

    if (form.numero === '' || form.numero === null) {
      onMsg({ tipo: 'erro', texto: 'Informe o número do gabarito.' })
      return
    }

    let parsed
    try {
      parsed = JSON.parse(form.questoesJson)
    } catch {
      onMsg({ tipo: 'erro', texto: 'JSON das questões inválido. Verifique a formatação.' })
      return
    }

    // Aceita o mapa direto ({"1":"A",...}) ou um objeto com a chave "questoes".
    const mapa = parsed && parsed.questoes && typeof parsed.questoes === 'object' ? parsed.questoes : parsed
    if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa) || Object.keys(mapa).length === 0) {
      onMsg({ tipo: 'erro', texto: 'Cole as questões no formato {"1":"A","2":"B"}.' })
      return
    }

    onSubmeter({
      numero: parseInt(form.numero),
      disciplina,
      conteudoId: form.conteudoId || null,
      questoes: normalizarQuestoes(mapa)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-sm">
          Número do gabarito
          <input
            type="number"
            value={form.numero}
            onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
            className="border rounded px-3 py-2 w-full mt-1"
            autoFocus
          />
        </label>
        <label className="text-sm">
          Disciplina
          <input
            type="text"
            value={disciplina}
            disabled
            className="border rounded px-3 py-2 w-full mt-1 bg-gray-100 text-gray-600"
          />
        </label>
        <label className="text-sm">
          Conteúdo (opcional)
          <select
            value={form.conteudoId}
            onChange={(e) => setForm((f) => ({ ...f, conteudoId: e.target.value }))}
            className="border rounded px-3 py-2 w-full mt-1"
          >
            <option value="">—</option>
            {conteudos.map((c) => (
              <option key={c.id} value={c.id}>{c.descricao}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label className="text-sm font-medium">Questões e respostas (JSON)</label>
        <textarea
          value={form.questoesJson}
          onChange={(e) => setForm((f) => ({ ...f, questoesJson: e.target.value }))}
          rows={12}
          spellCheck={false}
          className="w-full border rounded px-3 py-2 font-mono text-sm mt-1"
          placeholder={exemplo}
        />
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, questoesJson: exemplo }))}
          className="text-blue-600 text-sm hover:underline mt-1"
        >
          Inserir exemplo
        </button>
      </div>

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

/* ------------------------------------------------------------- 3) Históricos */

function ListaHistoricos({ gabarito, onMsg }) {
  const [historicos, setHistoricos] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [detalhe, setDetalhe] = useState(null)

  const numeros = useMemo(() => ordenarQuestoes(gabarito.questoes), [gabarito])

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await historicosApi.porGabarito(gabarito.id)
      setHistoricos(res.data || [])
    } catch {
      setHistoricos([])
      onMsg({ tipo: 'erro', texto: 'Erro ao carregar históricos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [gabarito])

  const abrirCadastro = () => { setEditando(null); setModalAberto(true) }
  const abrirEdicao = (h) => { setEditando(h); setModalAberto(true) }

  const excluir = async (h) => {
    if (!confirm('Excluir este histórico?')) return
    try {
      await historicosApi.excluir(h.id)
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
        await historicosApi.atualizar(editando.id, payload)
        onMsg({ tipo: 'sucesso', texto: 'Histórico atualizado' })
      } else {
        await historicosApi.criar(gabarito.id, payload)
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
          <h2 className="text-2xl font-bold">Gabarito #{gabarito.numero}</h2>
          <p className="text-sm text-gray-500">{gabarito.disciplina} · {numeros.length} questões</p>
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
          <DetalheHistorico gabarito={gabarito} historico={detalhe} numeros={numeros} />
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
    // Avança automaticamente ao selecionar a resposta (exceto na última questão).
    if (idx < total - 1) setTimeout(() => setIdx((i) => Math.min(total - 1, i + 1)), 120)
  }
  const limparResposta = () => setRespostas((r) => { const c = { ...r }; delete c[q]; return c })
  const toggleAtencao = () => setAtencao((a) => ({ ...a, [q]: !a[q] }))
  const setObs = (v) => setObservacoes((o) => ({ ...o, [q]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // Remove observações/atenção vazias para não poluir o documento.
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
    return <p className="text-gray-500">Este gabarito não possui questões cadastradas.</p>
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

      {/* Navegador: clique em qualquer número para voltar/avançar a uma questão. */}
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

      {/* Questão atual */}
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

      {/* Navegação anterior / próxima */}
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

function DetalheHistorico({ gabarito, historico, numeros }) {
  const pct = historico.totalQuestoes ? Math.round((historico.acertos / historico.totalQuestoes) * 100) : 0
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold">{historico.acertos}/{historico.totalQuestoes}</div>
        <span className={`px-2 py-1 rounded ${pct >= 70 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
          {pct}% de acerto
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {numeros.map((q) => {
          const acertou = historico.resultadoPorQuestao?.[q]
          const marcada = historico.respostas?.[q] || '—'
          const correta = gabarito.questoes?.[q] || '—'
          const temAtencao = historico.atencao?.[q]
          return (
            <div
              key={q}
              className={`rounded p-2 text-sm border ${acertou ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">{q}</span>
                {temAtencao && <span title="Atenção">⚠️</span>}
              </div>
              <div className={acertou ? 'text-green-700' : 'text-red-700'}>
                {marcada} {acertou ? '✓' : `✗ (${correta})`}
              </div>
              {historico.observacoes?.[q] && (
                <div className="text-xs text-gray-500 mt-1">{historico.observacoes[q]}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- Reusáveis */

// Verifica se um objeto parece um mapa de respostas: {"1":"A","2":"B",...}
function pareceMapaRespostas(obj) {
  const entries = Object.entries(obj || {})
  if (entries.length === 0) return false
  return entries.every(([k, v]) => /^\d+$/.test(k) && typeof v === 'string' && /^[A-Ea-e]$/.test(v.trim()))
}

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
  // iso pode vir como "2026-05-26" (LocalDate). Evita problema de fuso.
  const [a, m, d] = String(iso).slice(0, 10).split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}
