import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Low, JSONFile } from 'lowdb'
import path from 'path'

dotenv.config()

// 1) 포트 & CORS Origin
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

console.log('▶️ Starting server:')
console.log('   • NODE_ENV      =', process.env.NODE_ENV)
console.log('   • PORT          =', PORT)
console.log('   • FRONTEND_URL  =', FRONTEND_URL)

// 2) Lowdb 설정
const dbFile = path.join(process.cwd(), 'db.json')
console.log('   • DB file path  =', dbFile)
const adapter = new JSONFile(dbFile)
const db = new Low(adapter)

// 3) DB 초기화
async function initDb() {
  await db.read().catch(console.error)
  db.data ||= { routes: [] }
  await db.write().catch(console.error)
  console.log(`✅ Lowdb initialized: ${db.data.routes.length} routes`)
}

const app = express()

// 4) CORS/Preflight: 맨 위에서 모든 요청 허용 (개발 모드)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ 
    origin: FRONTEND_URL,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['*'],
    optionsSuccessStatus: 200
   }))
  app.options('*', cors())
  console.log('⚙️ Dev CORS: allowing all origins')
} else {
  // 프로덕션 모드: whitelist 기반 (필요 시 활성화)
  app.use(cors({
    origin(origin, cb) {
      if (!origin || origin === FRONTEND_URL) return cb(null, true)
      return cb(new Error(`CORS blocked: ${origin}`))
    },
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['*'],
    optionsSuccessStatus: 200
  }))
  app.options('*', cors())
  console.log('⚙️ Prod CORS: only allowing', FRONTEND_URL)
}

// 5) JSON Body 파싱
app.use(express.json())

// 6) 헬스체크 (Railway 기본 "/")
app.get('/', (_req, res) => res.status(200).send('OK'))

// 7) Request 로그 (디버깅용)
app.use((req, _res, next) => {
  console.log(`➜ ${req.method} ${req.originalUrl}`)
  next()
})

// 8) CRUD 엔드포인트 (/admin/routes)
app.get('/admin/routes', async (_req, res) => {
  await db.read()
  res.json(db.data.routes)
})

app.post('/admin/routes', async (req, res) => {
  await db.read()
  const ids = db.data.routes.map(r => r.id)
  const newId = ids.length ? Math.max(...ids) + 1 : 1
  const { method, path: p, status, response, headers } = req.body
  const newRoute = { id: newId, method, path: p, status, response, headers }
  db.data.routes.push(newRoute)
  await db.write()
  res.status(201).json(newRoute)
})

app.get('/admin/routes/:id', async (req, res) => {
  await db.read()
  const route = db.data.routes.find(r => r.id === +req.params.id)
  if (!route) return res.status(404).json({ error: 'Not found' })
  res.json(route)
})

app.put('/admin/routes/:id', async (req, res) => {
  await db.read()
  const idx = db.data.routes.findIndex(r => r.id === +req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.data.routes[idx] = { id: +req.params.id, ...req.body }
  await db.write()
  res.json(db.data.routes[idx])
})

app.delete('/admin/routes/:id', async (req, res) => {
  await db.read()
  db.data.routes = db.data.routes.filter(r => r.id !== +req.params.id)
  await db.write()
  res.status(204).end()
})

// 9) catch-all Mock API 처리
app.all('*', async (req, res) => {
  await db.read()
  const plain = req.path.startsWith('/') ? req.path.slice(1) : req.path
  const route = db.data.routes.find(r =>
    r.method === req.method &&
    (r.path === req.path || r.path === plain)
  )
  if (!route) return res.status(404).json({ error: 'Not found' })
  // 헤더 적용
  if (route.headers) {
    Object.entries(route.headers).forEach(([k, v]) => res.setHeader(k, v))
  }
  res.status(route.status).json(route.response)
})

// 10) 서버 시작
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on 0.0.0.0:${PORT}`)
  })
})
