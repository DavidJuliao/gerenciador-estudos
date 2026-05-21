# Gerenciador de Estudos

Projeto composto por duas aplicações containerizadas:

- **Backend** — Spring Boot 3 + MongoDB (Java 17)
- **Frontend** — React 18 + Vite + Tailwind, servido via Nginx

## Estrutura

```
projeto-estudos/
├── docker-compose.yml      Orquestra Mongo + Backend + Frontend
├── backend/                API REST Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/...
└── frontend/               SPA React
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/...
```

## Como rodar

Pré-requisito: **Docker Desktop** rodando.

Na raiz do projeto:

```bash
docker-compose up --build
```

Acesse:

- Frontend: http://localhost:3000
- Backend (API): http://localhost:8080
- MongoDB: localhost:27017 (usuário `admin`, senha `admin`)

Para parar:

```bash
docker-compose down
```

Para limpar tudo (incluindo os dados do Mongo):

```bash
docker-compose down -v
```

## Endpoints da API

### Disciplinas
- `GET    /disciplinas`              — lista todas
- `GET    /disciplinas/{id}`         — busca por id
- `GET    /disciplinas/grupo/{n}`    — lista disciplinas de um grupo
- `POST   /disciplinas`              — cria
- `PUT    /disciplinas/{id}`         — atualiza
- `DELETE /disciplinas/{id}`         — exclui

### Conteúdos
- `GET    /conteudos`                — lista todos
- `GET    /conteudos/{id}`           — busca por id
- `GET    /conteudos/disciplina/{id}`— lista por disciplina
- `POST   /conteudos`                — cria
- `PUT    /conteudos/{id}`           — atualiza
- `DELETE /conteudos/{id}`           — exclui

## Exemplos de payload

### Disciplina
```json
{
  "nome": "Direito Constitucional",
  "grupo": 1
}
```

### Conteúdo
```json
{
  "disciplinaId": "65f...abc",
  "descricao": "Princípios fundamentais",
  "prioridade": "ALTA",
  "dataEstudada": "2026-05-17",
  "subConteudos": [
    { "descricao": "Soberania" },
    { "descricao": "Cidadania" }
  ],
  "questoes": [
    {
      "banca": "CESPE",
      "link": "https://exemplo.com/q1",
      "ultimaQuestaoEstudada": "42"
    }
  ]
}
```

Prioridades válidas: `BAIXA`, `MEDIA`, `ALTA`.

## Desenvolvimento local (fora do Docker)

### Backend
```bash
cd backend
./mvnw spring-boot:run   # ou: mvn spring-boot:run
```
Requer Mongo rodando em `localhost:27017` com usuário admin/admin.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Aplicação disponível em http://localhost:3000.

## Credenciais padrão

| Recurso  | Usuário | Senha |
|----------|---------|-------|
| MongoDB  | admin   | admin |

> ⚠️ Use somente em desenvolvimento. Para produção, substitua as credenciais por variáveis de ambiente seguras.
