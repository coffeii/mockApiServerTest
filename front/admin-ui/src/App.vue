<template>
  <div class="p-8 space-y-8">
    <!-- 1. API 등록 섹션 -->
    <section class="bg-base-200 p-6 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-6">API 등록</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Method -->
        <div class="form-control">
          <label class="label"><span class="label-text">Method</span></label>
          <select v-model="form.method" class="select select-bordered w-full">
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
        </div>
        <!-- Path -->
        <div class="form-control">
          <label class="label"><span class="label-text">Path</span></label>
          <input
            v-model="form.path"
            placeholder="/your-path"
            class="input input-bordered w-full"
          />
        </div>
        <!-- Status -->
        <div class="form-control">
          <label class="label"><span class="label-text">Status</span></label>
          <input
            v-model.number="form.status"
            type="number"
            class="input input-bordered w-full"
          />
        </div>
        <!-- Response -->
        <div class="form-control md:col-span-3">
          <label class="label"><span class="label-text">Response (JSON)</span></label>
          <textarea
            v-model="form.response"
            class="textarea textarea-bordered w-full"
            rows="3"
            placeholder='예: {"msg":"Hello"}'
          ></textarea>
        </div>
        <!-- Headers -->
        <div class="form-control md:col-span-3">
          <label class="label"><span class="label-text">Headers (JSON)</span></label>
          <textarea
            v-model="form.headers"
            class="textarea textarea-bordered w-full"
            rows="2"
            placeholder='예: {"X-Test-Header":"Value"}'
          ></textarea>
        </div>
      </div>
      <button
        class="btn btn-primary mt-6"
        @click="addRoute"
      >
        등록하기
      </button>
    </section>

    <!-- 2. API 리스트 섹션 -->
    <section>
      <h2 class="text-2xl font-bold mb-4">Registered APIs</h2>
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Response</th>
              <th>Headers</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in routes" :key="r.id">
              <td>{{ r.method }}</td>
              <td>{{ r.path }}</td>
              <td>{{ r.status }}</td>
              <td>
                <pre class="whitespace-pre-wrap">{{ JSON.stringify(r.response) }}</pre>
              </td>
              <td>
                <pre class="whitespace-pre-wrap">{{ JSON.stringify(r.headers || {}) }}</pre>
              </td>
              <td>
                <button
                  class="btn btn-sm btn-error"
                  @click="deleteRoute(r.id)"
                >
                  삭제
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Rail­way에 배포된 백엔드 URL을 환경변수에서 읽어옵니다.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface Route {
  id: number
  method: string
  path: string
  status: number
  response: any
  headers?: Record<string, string>
}

const routes = ref<Route[]>([])
const form = ref({
  method: 'GET',
  path: '',
  status: 200,
  response: '{}',
  headers: '{}',
})

async function loadRoutes() {
  try {
    const res = await fetch(`${API_BASE}/admin/routes`, { mode: 'cors' })
    if (!res.ok) throw new Error(res.statusText)
    routes.value = await res.json()
  } catch (e:any) {
    alert('라우트 로드 오류: ' + e.message)
  }
}

async function addRoute() {
  // path 노멀라이즈
  let p = form.value.path.trim()
  if (!p.startsWith('/')) p = '/' + p

  // JSON 파싱
  let resp: any, hdr: Record<string,string>
  try { resp = JSON.parse(form.value.response) } catch { return alert('Response JSON 형식 오류') }
  try { hdr  = JSON.parse(form.value.headers) }   catch { return alert('Headers JSON 형식 오류') }

  // POST (mode: 'cors' 명시)
  try {
    const res = await fetch(`${API_BASE}/admin/routes`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: form.value.method, path:p, status:form.value.status, response:resp, headers:hdr })
    })
    if (!res.ok) throw new Error(res.statusText)
    form.value = { method:'GET', path:'', status:200, response:'{}', headers:'{}' }
    await loadRoutes()
  } catch (e:any) {
    alert('등록 오류: ' + e.message)
  }
}

async function deleteRoute(id: number) {
  await fetch(`${API_BASE}/admin/routes/${id}`, { method: 'DELETE', mode:'cors' })
  await loadRoutes()
}

onMounted(loadRoutes)
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
