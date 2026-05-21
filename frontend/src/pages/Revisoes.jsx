import { useEffect, useMemo, useState } from 'react'
import { conteudosApi } from '../api/api.js'

export default function Revisoes() {
  const [disciplinas, setDisciplinas] = useState([])
  const [conteudos, setConteudos] = useState([])
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null)
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false)
  const [loadingConteudos, setLoadingConteudos] = useState(false)
  const [msg, setMsg] = useState(null)

  const carregarDisciplinas = async () => {
    setLoadingDisciplinas(true)
    try {
      const res = await conteudosApi.disciplinasDistinct()
      setDisciplinas(res.data)
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao carregar disciplinas' })
    } finally {
      setLoadingDisciplinas(false)
    }
  }

  useEffect(() => { carregarDisciplinas() }, [])

  const selecionarDisciplina = async (nome) => {
    setDisciplinaSelecionada(nome)
    setConteudos([])
    setLoadingConteudos(true)
    try {
      const res = await conteudosApi.porDisciplina(nome)
      const ordenados = [...res.data].sort((a, b) => {
        // 1) Marcados (precisa revisar) sempre vêm antes dos não marcados.
        const am = a.marcado ? 1 : 0
        const bm = b.marcado ? 1 : 0
        if (am !== bm) return bm - am
        // 2) Depois ordena por dataEstudada decrescente; nunca estudados ao final.
        if (!a.dataEstudada && !b.dataEstudada) return 0
        if (!a.dataEstudada) return 1
        if (!b.dataEstudada) return -1
        return b.dataEstudada.localeCompare(a.dataEstudada)
      })
      setConteudos(ordenados)
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao carregar conteúdos da disciplina' })
    } finally {
      setLoadingConteudos(false)
    }
  }

  const voltar = () => {
    setDisciplinaSelecionada(null)
    setConteudos([])
  }

  const diasDesde = (dataIso) => {
    if (!dataIso) return null
    const hoje = new Date()
    const data = new Date(dataIso + 'T00:00:00')
    const diff = Math.floor((hoje - data) / (1000 * 60 * 60 * 24))
    return diff
  }

  const corPrioridade = (prioridade) => {
    switch (prioridade) {
      case 'ALTA': return 'bg-red-100 text-red-800'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800'
      case 'BAIXA': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const idParaConteudo = useMemo(() => {
    const map = new Map()
    conteudos.forEach((c) => map.set(c.id, c))
    return map
  }, [conteudos])

  // Cada CONTEUDO (e seus SUBCONTEUDOs filhos) compartilham a mesma cor de
  // fundo, alternando entre branco e cinza claro. O "tronco" de um item
  // é o id do CONTEUDO pai (ou o próprio id se for CONTEUDO).
  const corPorTronco = useMemo(() => {
    const ordemTroncos = []
    const set = new Set()
    for (const c of conteudos) {
      const tronco = c.tipo === 'SUBCONTEUDO' ? (c.conteudoPaiId || `orfao-${c.id}`) : c.id
      if (!set.has(tronco)) {
        set.add(tronco)
        ordemTroncos.push(tronco)
      }
    }
    const indice = new Map(ordemTroncos.map((id, i) => [id, i]))
    return (c) => {
      const tronco = c.tipo === 'SUBCONTEUDO' ? (c.conteudoPaiId || `orfao-${c.id}`) : c.id
      const i = indice.get(tronco) ?? 0
      return i % 2 === 0 ? 'bg-white' : 'bg-gray-100'
    }
  }, [conteudos])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Revisões</h2>

      {msg && (
        <div className={`p-3 rounded ${msg.tipo === 'erro' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {msg.texto}
        </div>
      )}

      {!disciplinaSelecionada ? (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Selecione uma disciplina para revisar</h3>
          {loadingDisciplinas ? (
            <p>Carregando...</p>
          ) : disciplinas.length === 0 ? (
            <p className="text-gray-500">Nenhuma disciplina com conteúdo cadastrado ainda.</p>
          ) : (
            <ul className="divide-y">
              {disciplinas.map((nome) => (
                <li key={nome}>
                  <button
                    onClick={() => selecionarDisciplina(nome)}
                    className="w-full text-left py-3 px-2 hover:bg-blue-50 rounded transition flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-800">{nome}</span>
                    <span className="text-sm text-gray-500">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={voltar}
                className="text-blue-600 hover:underline text-sm mb-1"
              >
                ← Voltar para disciplinas
              </button>
              <h3 className="text-xl font-semibold">{disciplinaSelecionada}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-3">
              Conteúdos: marcados primeiro, depois ordenados por última data de estudo (mais recentes primeiro)
            </h4>
            {loadingConteudos ? (
              <p>Carregando conteúdos...</p>
            ) : conteudos.length === 0 ? (
              <p className="text-gray-500">Nenhum conteúdo cadastrado para esta disciplina.</p>
            ) : (
              <div className="space-y-3">
                {conteudos.map((c) => {
                  const dias = diasDesde(c.dataEstudada)
                  const pai = c.tipo === 'SUBCONTEUDO' ? idParaConteudo.get(c.conteudoPaiId) : null
                  const bg = corPorTronco(c)
                  return (
                    <div
                      key={c.id}
                      className={`border rounded p-3 hover:bg-blue-50 transition ${bg} ${c.tipo === 'SUBCONTEUDO' ? 'ml-6 border-l-4 border-l-blue-200' : ''} ${c.marcado ? 'border-orange-400' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {c.marcado && <span title="Marcado para revisar">🔖</span>}
                            {c.tipo === 'SUBCONTEUDO' && <span className="text-xs text-blue-600">↳</span>}
                            <p className="font-semibold">{c.descricao}</p>
                            <span className={`text-xs px-2 py-0.5 rounded ${corPrioridade(c.prioridade)}`}>
                              {c.prioridade}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {c.tipo === 'SUBCONTEUDO' ? 'sub' : 'conteúdo'}
                            </span>
                            {c.marcado && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                                Marcado para revisar
                              </span>
                            )}
                          </div>
                          {pai && (
                            <p className="text-xs text-gray-500 mt-1">
                              Subconteúdo de: <strong>{pai.descricao}</strong>
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {c.dataEstudada
                              ? <>Última data de estudo: <strong>{c.dataEstudada}</strong>{dias !== null && ` (há ${dias} ${dias === 1 ? 'dia' : 'dias'})`}</>
                              : <span className="italic">Nunca estudado</span>}
                          </p>
                          {c.questoes?.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Questões cadastradas: {c.questoes.length}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
