import express from 'express'
import cors from 'cors'
import { Low, JSONFile } from 'lowdb'
import path from 'path'

// 환경변수 사용
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL

const localhost5100s = /^http:\/\/localhost:51\d{2}$/
const corsOptions = {
  origin(origin, callback) {
    // 브라우저가 아닌(예: Postman) 요청엔 origin이 undefined일 수 있으니 허용
    if (!origin) return callback(null, true)

    if (localhost5100s.test(origin) || origin === FRONTEND_URL) {
      // localhost:5100–5199 대역이면 허용
      return callback(null, true)
    } else {
      return callback(
        new Error(`CORS 차단: 허용되지 않은 origin ${origin}`),
        false
      )
    }
  }
}

// Lowdb 세팅
const file = path.join(process.cwd(), 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)

async function initDb() {
  await db.read()
  db.data ||= { routes: [] }
  await db.write()
}

const app = express()

// CORS: 배포된 프론트 도메인만 허용
app.use(cors({
  origin: corsOptions,
}))
app.use(express.json())

// 관리용 CRUD 엔드포인트
app.get('/admin/routes', async (_req, res) => {
  await db.read()
  res.json(db.data.routes)
})

// 기존 app.post('/admin/routes', async (req, res) => { ... })
app.post('/admin/routes', async (req, res) => {
  // ① 최신 데이터 읽기
  await db.read()

  // ② 현재 있는 id 중 최대값을 찾아 +1 (없으면 1부터)
  const ids = db.data.routes.map(r => r.id)
  const newId = ids.length ? Math.max(...ids) + 1 : 1

  // ③ 정상적인 id와 함께 새 라우트 생성
  const { method, path, status, response, headers } = req.body

  const newRoute = { id: newId, method, path, status, response, headers }

  // ④ 메모리와 파일에 저장
  db.data.routes.push(newRoute)
  await db.write()

  // ⑤ 클라이언트에 생성된 객체 반환
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

app.all('*', async (req, res) => {
  if (req.path.startsWith('/admin')) return res.status(404).end()
    await db.read()
  
    const plain = req.path.startsWith('/') ? req.path.slice(1) : req.path
    const route = db.data.routes.find(r =>
      r.method === req.method &&
      (r.path === req.path || r.path === plain)
    )
    if (!route) return res.status(404).json({ error: 'Not found' })
  
    // 저장된 headers를 응답 헤더에 설정
    if (route.headers && typeof route.headers === 'object') {
      Object.entries(route.headers).forEach(([key, val]) => {
        res.setHeader(key, val)
      })
    }
  
    res.status(route.status).json(route.response)
})
// DB 초기화 후 서버 시작
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Mock API 서버 running on http://localhost:${PORT}`)
    console.log(`Allowed CORS origin: ${FRONTEND_URL}`)
  })
})
