import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' }
})

export const disciplinasApi = {
  listar: () => api.get('/disciplinas'),
  buscar: (id) => api.get(`/disciplinas/${id}`),
  porGrupo: (grupo) => api.get(`/disciplinas/grupo/${grupo}`),
  criar: (data) => api.post('/disciplinas', data),
  atualizar: (id, data) => api.put(`/disciplinas/${id}`, data),
  excluir: (id) => api.delete(`/disciplinas/${id}`)
}

export const tempoEstudoApi = {
  listar: () => api.get('/tempo-estudo'),
  porIntervalo: (inicio, fim) => api.get('/tempo-estudo', { params: { inicio, fim } }),
  criar: (data) => api.post('/tempo-estudo', data),
  atualizar: (id, data) => api.put(`/tempo-estudo/${id}`, data),
  excluir: (id) => api.delete(`/tempo-estudo/${id}`)
}

export const conteudosApi = {
  listar: () => api.get('/conteudos'),
  buscar: (id) => api.get(`/conteudos/${id}`),
  porDisciplina: (nome) => api.get('/conteudos/disciplina', { params: { nome } }),
  disciplinasDistinct: () => api.get('/conteudos/disciplinas-distinct'),
  criar: (data) => api.post('/conteudos', data),
  atualizar: (id, data) => api.put(`/conteudos/${id}`, data),
  excluir: (id) => api.delete(`/conteudos/${id}`)
}

export const gabaritosApi = {
  listar: () => api.get('/gabaritos'),
  porDisciplina: (disciplina) => api.get('/gabaritos', { params: { disciplina } }),
  buscar: (id) => api.get(`/gabaritos/${id}`),
  criar: (data) => api.post('/gabaritos', data),
  atualizar: (id, data) => api.put(`/gabaritos/${id}`, data),
  excluir: (id) => api.delete(`/gabaritos/${id}`)
}

export const historicosApi = {
  porGabarito: (gabaritoId) => api.get(`/gabaritos/${gabaritoId}/historicos`),
  buscar: (id) => api.get(`/historicos/${id}`),
  criar: (gabaritoId, data) => api.post(`/gabaritos/${gabaritoId}/historicos`, data),
  atualizar: (id, data) => api.put(`/historicos/${id}`, data),
  excluir: (id) => api.delete(`/historicos/${id}`)
}

export default api
