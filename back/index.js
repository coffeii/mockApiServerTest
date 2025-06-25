// back/index.js
import express from 'express'
import cors from 'cors'
import { Low, JSONFile } from 'lowdb'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

// 0. DEBUG: 현재 작업 디렉터리 확인
console.log('📂 Working directory:', process.cwd())

// 1. 포트 설정 (Railway가 할당하는 PORT 환경변수 사용)
const PORT = process.env.PORT || 3000

// 2. CORS 허용 도메인
//    - 로컬 개발 시 http://localhost:5173 허용
//    - 프로덕션 시 FRONTEND_URL 로 변경 (Railway Variables에서 설정)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
console.log(`🌐 CORS origin set to: ${FRONTEND_URL}`)

// 3. Lowdb 파일 경로
//    Railway의 Root Directory를 'back'으로 설정했다면,
//    process.cwd()가 '/app/back'이 되고, 그 안에 db.json이 있어야 합니다.
const dbFile = path.join(process.cwd(), 'db.json')
console.log('🗄️  DB file path:', dbFile)

const adapter = new JSONFile(dbFile)
const db = new Low(adapter)

// 4. DB 초기화
async function initDb() {
  try {
    await db.read()
    db.data ||= { routes: [] }
    await db.write()
    console.log('✅ Lowdb initialized, routes count =', db.data.routes.length)
  } catch (err) {
    console.error('❌ initDb failed:', err)
    // 만약 여기서 에러가 나면 컨테이너가 기동했어도 바로 죽을 수 있으니
    // 예외를 swallow하고 빈 배열로라도 시작하도록 합니다.
    db.data = { routes: [] }
    await db.write().catch(() => {})
  }
}

const app = express()

// 5. CORS & JSON body parsing
// 1) 로그로 실제 Origin 확인해 보기
app.use((req, _res, next) => {
  console.log('➜ Incoming Origin:', req.headers.origin)
  next()
})
// 2) 개발 모드면 CORS 모두 열어주기
if (process.env.NODE_ENV !== 'production') {
  app.use(cors())
  console.log('⚙️  CORS: development mode, allowing all origins')
} else {
  // production 모드일 때만 whitelist 기반으로 설정
  const PROD = process.env.FRONTEND_URL  // e.g. https://your-site.netlify.app
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origin === PROD) return callback(null, true)
      callback(new Error(`CORS block for ${origin}`))
    }
  }))
  console.log(`⚙️  CORS: production mode, allowing only ${PROD}`)
}
app.use(express.json())

// 6. 헬스체크 엔드포인트 (Railway 기본 헬스체크: GET "/")
app.get('/', (_req, res) => {
  res.status(200).send('OK')
})

// 7. 관리용 CRUD 엔드포인트
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

// 8. Mock API 동적 처리 (catch-all)
//    관리용 엔드포인트 외의 모든 요청을 여기서 처리
app.all('*', async (req, res) => {
  // 이미 "/" 와 "/admin" 경로를 처리했으므로, 그 외만
  await db.read()
  // "/123" vs "123" 매칭
  const plain = req.path.startsWith('/') ? req.path.slice(1) : req.path
  const route = db.data.routes.find(r =>
    r.method === req.method &&
    (r.path === req.path || r.path === plain)
  )
  if (!route) return res.status(404).json({ error: 'Not found' })

  // 저장된 headers를 실제 응답 헤더로 설정
  if (route.headers && typeof route.headers === 'object') {
    Object.entries(route.headers).forEach(([k, v]) => {
      res.setHeader(k, v)
    })
  }
  res.status(route.status).json(route.response)
})

// 9. DB 초기화 후 서버 시작
initDb().then(() => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server listening on 0.0.0.0:${PORT}`)
      console.log(`🔖 CORS origin: ${FRONTEND_URL}`)
    })
  } catch (err) {
    console.error('❌ app.listen error:', err)
  }
})
