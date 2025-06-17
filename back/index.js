// --------------------------------------------------
import express from 'express'
import cors from 'cors'
import { Low, JSONFile } from 'lowdb'

// Lowdb 설정 (db.json 파일 사용)
const adapter = new JSONFile('db.json')
const db = new Low(adapter)
await db.read()
// data가 undefined면 기본 구조 설정
db.data ||= { routes: [] }

const app = express()
app.use(cors())
app.use(express.json())

// CRUD 엔드포인트
// 전체 목록 조회
app.get('/admin/routes', async (req, res) => {
  await db.read()
  res.json(db.data.routes)
})

// 단일 항목 조회
app.get('/admin/routes/:id', async (req, res) => {
  await db.read()
  const id = Number(req.params.id)
  const route = db.data.routes.find(r => r.id === id)
  if (!route) return res.status(404).json({ error: 'Not found' })
  res.json(route)
})

// 생성
app.post('/admin/routes', async (req, res) => {
  const { method, path, status, response } = req.body
  const newRoute = { id: Date.now(), method, path, status, response }
  db.data.routes.push(newRoute)
  await db.write()
  res.status(201).json(newRoute)
})

// 수정
app.put('/admin/routes/:id', async (req, res) => {
  await db.read()
  const id = Number(req.params.id)
  const idx = db.data.routes.findIndex(r => r.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const updated = { ...db.data.routes[idx], ...req.body }
  db.data.routes[idx] = updated
  await db.write()
  res.json(updated)
})

// 삭제
app.delete('/admin/routes/:id', async (req, res) => {
  await db.read()
  const id = Number(req.params.id)
  db.data.routes = db.data.routes.filter(r => r.id !== id)
  await db.write()
  res.status(204).end()
})

// Mock API 처리 (catch-all)
app.all('*', async (req, res) => {
  await db.read()
  const route = db.data.routes.find(r => r.method === req.method && r.path === req.path)
  if (!route) return res.status(404).json({ error: 'Not found' })
  res.status(route.status).json(route.response)
})

// 서버 시작
const PORT = 3000
app.listen(PORT, () => console.log(`Mock API 서버 실행 중: http://localhost:${PORT}`))
