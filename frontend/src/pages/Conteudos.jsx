import { useEffect, useState, useMemo } from 'react'
import { conteudosApi, disciplinasApi } from '../api/api.js'

const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA']
const TIPOS = ['CONTEUDO', 'SUBCONTEUDO']

const formInicial = {
  disciplina: '',
  descricao: '',
  prioridade: 'MEDIA',
  tipo: 'CONTEUDO',
  conteudoPaiId: '',
  dataEstudada: '',
  dataEstudadaAnterior: '',
  marcado: false,
  questoes: []
}

export default function Conteudos() {
  const [conteudos, setConteudos] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  // null = listando disciplinas; string = nome da disciplina selecionada.
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null)

  const [modalCadastroAberto, setModalCadastroAberto] = useState(false)
  const [conteudoDetalhe, setConteudoDetalhe] = useState(null)

  const [form, setForm] = useState(formInicial)
  const [editandoId, setEditandoId] = useState(null)

  const carregarDisciplinas = async () => {
    try {
      const res = await disciplinasApi.listar()
      setDisciplinas(res.data || [])
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao carregar disciplinas' })
    }
  }

  const carregarConteudos = async () => {
    setLoading(true)
    try {
      const res = await conteudosApi.listar()
      setConteudos(res.data || [])
    } catch (e) {
      setConteudos([])
      setMsg({ tipo: 'erro', texto: 'Erro ao carregar conteúdos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDisciplinas()
    carregarConteudos()
  }, [])

  // Nomes distintos da tabela Disciplinas (única fonte para o select e para
  // a tela inicial — inclui disciplinas mesmo sem conteúdo).
  const nomesDisciplinasDistinct = useMemo(() => {
    const set = new Set()
    disciplinas.forEach((d) => { if (d?.nome) set.add(d.nome) })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [disciplinas])

  // Contagem de conteúdos por nome de disciplina (mostrada na lista de
  // disciplinas para o usuário ter contexto).
  const contagemPorDisciplina = useMemo(() => {
    const map = new Map()
    conteudos.forEach((c) => {
      const nome = c.disciplina || '—'
      map.set(nome, (map.get(nome) || 0) + 1)
    })
    return map
  }, [conteudos])

  // Grupo de cada disciplina (para colorir a lista de disciplinas igual à
  // tela de Disciplinas: mesmo grupo = mesma cor).
  const grupoPorDisciplina = useMemo(() => {
    const map = new Map()
    disciplinas.forEach((d) => { if (d?.nome) map.set(d.nome, d.grupo) })
    return map
  }, [disciplinas])

  // Conteúdos filtrados pela disciplina selecionada.
  const conteudosDaDisciplina = useMemo(() => {
    if (!disciplinaSelecionada) return []
    return conteudos.filter((c) => c.disciplina === disciplinaSelecionada)
  }, [conteudos, disciplinaSelecionada])

  // Pais disponíveis para vincular um novo SUBCONTEUDO (mesma disciplina).
  const conteudosPaiDisponiveis = useMemo(() => {
    return conteudos
      .filter((c) => c.tipo !== 'SUBCONTEUDO' && (!form.disciplina || c.disciplina === form.disciplina))
      .filter((c) => c.id !== editandoId)
      .sort((a, b) => (a.descricao || '').localeCompare(b.descricao || ''))
  }, [conteudos, form.disciplina, editandoId])

  const idParaConteudo = useMemo(() => {
    const map = new Map()
    conteudos.forEach((c) => map.set(c.id, c))
    return map
  }, [conteudos])

  // Listagem agrupada (CONTEUDO seguido de seus SUBCONTEUDOs) dentro da
  // disciplina selecionada. Conteúdos sem `tipo` são tratados como pais.
  const gruposListagem = useMemo(() => {
    const lista = conteudosDaDisciplina
    const ehSub = (c) => c.tipo === 'SUBCONTEUDO'
    const pais = lista.filter((c) => !ehSub(c))
    const filhos = lista.filter(ehSub)

    pais.sort((a, b) => (a.descricao || '').localeCompare(b.descricao || ''))

    const grupos = pais.map((p) => ({
      pai: p,
      filhos: filhos
        .filter((f) => f.conteudoPaiId === p.id)
        .sort((a, b) => (a.descricao || '').localeCompare(b.descricao || ''))
    }))

    const orfaos = filhos.filter((f) => !f.conteudoPaiId || !idParaConteudo.has(f.conteudoPaiId))
    if (orfaos.length > 0) {
      grupos.push({ pai: null, filhos: orfaos })
    }
    return grupos
  }, [conteudosDaDisciplina, idParaConteudo])

  const abrirCadastro = () => {
    // Pré-preenche a disciplina se já estamos dentro de uma.
    setForm({ ...formInicial, disciplina: disciplinaSelecionada || '' })
    setEditandoId(null)
    setModalCadastroAberto(true)
  }

  const abrirEdicao = (c) => {
    setForm({
      disciplina: c.disciplina || '',
      descricao: c.descricao || '',
      prioridade: c.prioridade || 'MEDIA',
      tipo: c.tipo || 'CONTEUDO',
      conteudoPaiId: c.conteudoPaiId || '',
      dataEstudada: c.dataEstudada || '',
      dataEstudadaAnterior: c.dataEstudadaAnterior || '',
      marcado: !!c.marcado,
      questoes: c.questoes || []
    })
    setEditandoId(c.id)
    setConteudoDetalhe(null)
    setModalCadastroAberto(true)
  }

  const fecharCadastro = () => {
    setModalCadastroAberto(false)
    setForm(formInicial)
    setEditandoId(null)
  }

  const submeter = async (e) => {
    e.preventDefault()
    if (!form.disciplina || !form.descricao) {
      setMsg({ tipo: 'erro', texto: 'Preencha disciplina e descrição' })
      return
    }
    if (form.tipo === 'SUBCONTEUDO' && !form.conteudoPaiId) {
      setMsg({ tipo: 'erro', texto: 'Selecione o conteúdo pai do subconteúdo' })
      return
    }
    try {
      const payload = {
        ...form,
        disciplina: form.disciplina.trim(),
        dataEstudada: form.dataEstudada || null,
        dataEstudadaAnterior: form.dataEstudadaAnterior || null,
        marcado: !!form.marcado,
        conteudoPaiId: form.tipo === 'SUBCONTEUDO' ? form.conteudoPaiId : null
      }
      if (editandoId) {
        await conteudosApi.atualizar(editandoId, payload)
        setMsg({ tipo: 'sucesso', texto: 'Conteúdo atualizado' })
      } else {
        await conteudosApi.criar(payload)
        setMsg({ tipo: 'sucesso', texto: 'Conteúdo criado' })
      }
      fecharCadastro()
      await carregarConteudos()
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar' })
    }
  }

  const excluir = async (id) => {
    if (!confirm('Excluir este conteúdo? Subconteúdos vinculados também serão removidos.')) return
    try {
      await conteudosApi.excluir(id)
      setMsg({ tipo: 'sucesso', texto: 'Conteúdo excluído' })
      setConteudoDetalhe(null)
      await carregarConteudos()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao excluir' })
    }
  }

  const payloadBase = (c) => ({
    disciplina: c.disciplina,
    descricao: c.descricao,
    prioridade: c.prioridade,
    tipo: c.tipo || 'CONTEUDO',
    conteudoPaiId: c.conteudoPaiId || null,
    dataEstudada: c.dataEstudada || null,
    dataEstudadaAnterior: c.dataEstudadaAnterior || null,
    marcado: !!c.marcado,
    questoes: c.questoes || []
  })

  const marcarComoEstudado = async (c) => {
    try {
      const hoje = new Date().toISOString().slice(0, 10)
      const payload = {
        ...payloadBase(c),
        dataEstudada: hoje,
        dataEstudadaAnterior: c.dataEstudada || null,
        marcado: false
      }
      await conteudosApi.atualizar(c.id, payload)
      setMsg({ tipo: 'sucesso', texto: `"${c.descricao}" marcado como estudado em ${hoje}` })
      await carregarConteudos()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao atualizar data de estudo' })
    }
  }

  const desfazerEstudei = async (c) => {
    if (!c.dataEstudadaAnterior) return
    try {
      const payload = {
        ...payloadBase(c),
        dataEstudada: c.dataEstudadaAnterior,
        dataEstudadaAnterior: null
      }
      await conteudosApi.atualizar(c.id, payload)
      setMsg({ tipo: 'sucesso', texto: `Restaurada data anterior: ${c.dataEstudadaAnterior}` })
      await carregarConteudos()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao desfazer' })
    }
  }

  const toggleMarcado = async (c) => {
    try {
      const novoMarcado = !c.marcado
      const payload = { ...payloadBase(c), marcado: novoMarcado }
      await conteudosApi.atualizar(c.id, payload)
      setMsg({
        tipo: 'sucesso',
        texto: novoMarcado ? `"${c.descricao}" marcado para revisar` : `"${c.descricao}" desmarcado`
      })
      await carregarConteudos()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao marcar' })
    }
  }

  const addQ = () => setForm({
    ...form,
    questoes: [...form.questoes, { banca: '', link: '', ultimaQuestaoEstudada: '' }]
  })
  const updQ = (i, campo, v) => {
    const arr = [...form.questoes]
    arr[i] = { ...arr[i], [campo]: v }
    setForm({ ...form, questoes: arr })
  }
  const delQ = (i) => setForm({ ...form, questoes: form.questoes.filter((_, idx) => idx !== i) })

  const corPrioridade = (p) => {
    switch (p) {
      case 'ALTA': return 'bg-red-100 text-red-800'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800'
      case 'BAIXA': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const corGrupo = (idx) => (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')

  const renderItem = (c, indent = false, grupoBg = '') => (
    <div
      key={c.id}
      onClick={() => setConteudoDetalhe(c)}
      className={`border rounded p-3 hover:bg-blue-50 transition cursor-pointer ${grupoBg} ${indent ? 'ml-6 border-l-4 border-l-blue-200' : ''} ${c.marcado ? 'border-orange-400' : ''}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {c.marcado && <span title="Marcado para revisar">🔖</span>}
        {c.tipo === 'SUBCONTEUDO' && <span className="text-xs text-blue-600">↳</span>}
        <span className="text-gray-700 font-medium">{c.descricao}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${corPrioridade(c.prioridade)}`}>
          {c.prioridade}
        </span>
        {c.tipo === 'SUBCONTEUDO' && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">sub</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleMarcado(c) }}
            className={`px-3 py-1 rounded text-sm ${c.marcado
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-white text-orange-600 border border-orange-400 hover:bg-orange-50'}`}
            title={c.marcado ? 'Desmarcar' : 'Marcar para revisar'}
          >
            {c.marcado ? 'Desmarcar' : 'Marcar'}
          </button>
          {c.dataEstudadaAnterior && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); desfazerEstudei(c) }}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              title={`Restaurar data anterior (${c.dataEstudadaAnterior})`}
            >
              Desfazer
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); marcarComoEstudado(c) }}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            title="Atualizar última data de estudo para hoje"
          >
            Estudei
          </button>
        </div>
      </div>
      {c.dataEstudada && (
        <p className="text-xs text-gray-500 mt-1">
          Estudado em {c.dataEstudada}
          {c.dataEstudadaAnterior && (
            <span className="ml-2 text-gray-400">(anterior: {c.dataEstudadaAnterior})</span>
          )}
        </p>
      )}
    </div>
  )

  // Lista ordenada de disciplinas para a tela inicial: por grupo + nome.
  const disciplinasOrdenadas = useMemo(() => {
    return [...nomesDisciplinasDistinct].sort((a, b) => {
      const ga = grupoPorDisciplina.get(a)
      const gb = grupoPorDisciplina.get(b)
      if (ga !== gb) return (ga ?? 0) - (gb ?? 0)
      return a.localeCompare(b)
    })
  }, [nomesDisciplinasDistinct, grupoPorDisciplina])

  // Cor por grupo na tela de disciplinas (mesmo grupo = mesma cor).
  const corDoGrupoDisciplina = useMemo(() => {
    const map = new Map()
    let idx = 0
    for (const nome of disciplinasOrdenadas) {
      const g = grupoPorDisciplina.get(nome)
      if (!map.has(g)) map.set(g, idx++)
    }
    return (nome) => {
      const g = grupoPorDisciplina.get(nome)
      return (map.get(g) % 2 === 0 ? 'bg-white' : 'bg-gray-100')
    }
  }, [disciplinasOrdenadas, grupoPorDisciplina])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {disciplinaSelecionada && (
            <button
              onClick={() => setDisciplinaSelecionada(null)}
              className="text-blue-600 hover:underline text-sm mb-1"
            >
              ← Voltar para disciplinas
            </button>
          )}
          <h2 className="text-2xl font-bold">
            {disciplinaSelecionada ? `Conteúdos · ${disciplinaSelecionada}` : 'Conteúdos'}
          </h2>
        </div>
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
        {loading ? (
          <p>Carregando...</p>
        ) : !disciplinaSelecionada ? (
          // ---- TELA 1: lista de disciplinas ----
          disciplinasOrdenadas.length === 0 ? (
            <p className="text-gray-500">Nenhuma disciplina cadastrada ainda.</p>
          ) : (
            <ul className="divide-y">
              {disciplinasOrdenadas.map((nome, i) => {
                const total = contagemPorDisciplina.get(nome) || 0
                const anterior = disciplinasOrdenadas[i - 1]
                const trocouGrupo = anterior && grupoPorDisciplina.get(anterior) !== grupoPorDisciplina.get(nome)
                return (
                  <li
                    key={nome}
                    className={`${corDoGrupoDisciplina(nome)} ${trocouGrupo ? 'border-t-4 border-t-gray-300' : ''}`}
                  >
                    <button
                      onClick={() => setDisciplinaSelecionada(nome)}
                      className="w-full text-left py-3 px-2 hover:bg-blue-50 rounded transition flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-800">
                        {nome}
                        <span className="ml-2 text-xs text-gray-500">grupo {grupoPorDisciplina.get(nome) ?? '?'}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {total} {total === 1 ? 'conteúdo' : 'conteúdos'} →
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )
        ) : (
          // ---- TELA 2: conteúdos da disciplina selecionada ----
          gruposListagem.length === 0 ? (
            <p className="text-gray-500">Nenhum conteúdo cadastrado para esta disciplina. Use o botão "+ Cadastrar" para começar.</p>
          ) : (
            <div className="space-y-4">
              {gruposListagem.map((g, idx) => {
                const bg = corGrupo(idx)
                if (!g.pai) {
                  return (
                    <div key={`orfaos-${idx}`} className="space-y-2">
                      <p className="text-xs text-gray-500 italic">Subconteúdos sem conteúdo pai:</p>
                      {g.filhos.map((f) => renderItem(f, true, bg))}
                    </div>
                  )
                }
                return (
                  <div key={g.pai.id} className="space-y-2">
                    {renderItem(g.pai, false, bg)}
                    {g.filhos.map((f) => renderItem(f, true, bg))}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {conteudoDetalhe && (
        <Modal onClose={() => setConteudoDetalhe(null)} titulo="Detalhes">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {conteudoDetalhe.marcado && <span title="Marcado para revisar">🔖</span>}
              <h3 className="text-lg font-semibold">{conteudoDetalhe.descricao}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${corPrioridade(conteudoDetalhe.prioridade)}`}>
                {conteudoDetalhe.prioridade}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {conteudoDetalhe.tipo === 'SUBCONTEUDO' ? 'Subconteúdo' : 'Conteúdo'}
              </span>
              {conteudoDetalhe.marcado && (
                <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                  Marcado para revisar
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Disciplina: <strong>{conteudoDetalhe.disciplina || '—'}</strong>
            </p>
            {conteudoDetalhe.tipo === 'SUBCONTEUDO' && (
              <p className="text-sm text-gray-600">
                Conteúdo pai: <strong>{idParaConteudo.get(conteudoDetalhe.conteudoPaiId)?.descricao || '(não encontrado)'}</strong>
              </p>
            )}
            <p className="text-sm text-gray-600">
              {conteudoDetalhe.dataEstudada
                ? <>Última data de estudo: <strong>{conteudoDetalhe.dataEstudada}</strong></>
                : <span className="italic">Nunca estudado</span>}
            </p>
            {conteudoDetalhe.dataEstudadaAnterior && (
              <p className="text-xs text-gray-500">
                Data anterior (1 nível de histórico): <strong>{conteudoDetalhe.dataEstudadaAnterior}</strong>
              </p>
            )}

            <div>
              <h4 className="font-medium mt-2">Questões</h4>
              {conteudoDetalhe.questoes?.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {conteudoDetalhe.questoes.map((q, i) => (
                    <li key={i} className="border rounded p-2 bg-gray-50">
                      <p><strong>Banca:</strong> {q.banca || '—'}</p>
                      <p>
                        <strong>Link:</strong>{' '}
                        {q.link
                          ? <a href={q.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{q.link}</a>
                          : '—'}
                      </p>
                      <p><strong>Última questão estudada:</strong> {q.ultimaQuestaoEstudada || '—'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">Nenhuma questão.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => excluir(conteudoDetalhe.id)}
                className="text-red-600 hover:underline px-3 py-2"
              >
                Excluir
              </button>
              <button
                onClick={() => abrirEdicao(conteudoDetalhe)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Editar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modalCadastroAberto && (
        <Modal onClose={fecharCadastro} titulo={editandoId ? 'Editar' : 'Novo cadastro'}>
          <form onSubmit={submeter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value, conteudoPaiId: e.target.value === 'CONTEUDO' ? '' : form.conteudoPaiId })}
                className="border rounded px-3 py-2"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t === 'CONTEUDO' ? 'Conteúdo' : 'Subconteúdo'}</option>
                ))}
              </select>

              <select
                value={form.disciplina}
                onChange={(e) => setForm({ ...form, disciplina: e.target.value, conteudoPaiId: '' })}
                className="border rounded px-3 py-2"
              >
                <option value="">Selecione a disciplina</option>
                {nomesDisciplinasDistinct.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>

              {form.tipo === 'SUBCONTEUDO' && (
                <select
                  value={form.conteudoPaiId}
                  onChange={(e) => setForm({ ...form, conteudoPaiId: e.target.value })}
                  className="border rounded px-3 py-2 md:col-span-2"
                >
                  <option value="">Selecione o conteúdo pai</option>
                  {conteudosPaiDisponiveis.map((c) => (
                    <option key={c.id} value={c.id}>{c.descricao} ({c.disciplina})</option>
                  ))}
                </select>
              )}

              <select
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                className="border rounded px-3 py-2"
              >
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              <input
                type="text"
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="border rounded px-3 py-2 md:col-span-2"
              />

              <input
                type="date"
                value={form.dataEstudada}
                onChange={(e) => setForm({ ...form, dataEstudada: e.target.value })}
                className="border rounded px-3 py-2"
              />

              <label className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={!!form.marcado}
                  onChange={(e) => setForm({ ...form, marcado: e.target.checked })}
                />
                <span className="text-sm">Marcado para revisar</span>
              </label>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Questões</h4>
                <button type="button" onClick={addQ} className="text-blue-600 hover:underline text-sm">+ Adicionar</button>
              </div>
              {form.questoes.map((q, i) => (
                <div key={i} className="border rounded p-3 mb-2 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Banca"
                      value={q.banca}
                      onChange={(e) => updQ(i, 'banca', e.target.value)}
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Link"
                      value={q.link}
                      onChange={(e) => updQ(i, 'link', e.target.value)}
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Última questão estudada"
                      value={q.ultimaQuestaoEstudada}
                      onChange={(e) => updQ(i, 'ultimaQuestaoEstudada', e.target.value)}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                  <button type="button" onClick={() => delQ(i)} className="mt-2 text-red-600 hover:underline text-sm">Remover questão</button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={fecharCadastro} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
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

function Modal({ titulo, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-full max-w-3xl my-8"
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
