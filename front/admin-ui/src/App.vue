<template>
  <div class="min-h-screen bg-base-200">
    <!-- Header -->
    <header class="bg-base-300 p-4">
      <h1 class="text-2xl font-bold">API Manager</h1>
    </header>

    <main class="p-6">
      <button class="btn btn-primary mb-4" @click="showModal = true">
        New API
      </button>

       <!-- 수동 로드 버튼 -->
       <button class="btn btn-outline" @click="loadRoutes">
        새로고침
      </button>

      <!-- API 목록 테이블 -->
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in routes" :key="r.id">
              <td><span class="badge badge-outline">{{ r.method }}</span></td>
              <td><code>{{ r.path }}</code></td>
              <td>{{ r.status }}</td>
              <td>
                <button class="btn btn-sm btn-error" @click="deleteRoute(r.id)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="modal modal-open">
        <div class="modal-box relative">
          <h3 class="text-lg font-bold">New API</h3>
          <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="showModal = false">✕</button>

          <div class="form-control space-y-4 mt-4">
            <select v-model="form.method" class="select select-bordered w-full">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input v-model="form.path" type="text" placeholder="/your-path" class="input input-bordered w-full" />
            <input v-model.number="form.status" type="number" placeholder="200" class="input input-bordered w-full" />
            <textarea v-model="form.response" placeholder="{ }" class="textarea textarea-bordered w-full" rows="4"></textarea>
          </div>

          <div class="modal-action">
            <button class="btn" @click="showModal = false">Cancel</button>
            <button class="btn btn-primary" @click="addRoute">Save</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Rail­way에 배포된 백엔드 URL을 환경변수에서 읽어옵니다.
const API_BASE = import.meta.env.VITE_API_BASE_URL

interface Route {
  id: number
  method: string
  path: string
  status: number
  response: any
}

const routes = ref<Route[]>([])
const showModal = ref(false)
const form = ref({ method: 'GET', path: '', status: 200, response: '{}' })

async function loadRoutes() {
  try {
    const res = await fetch(`${API_BASE}/admin/routes`)
    if (!res.ok) throw new Error('라우트 로드 실패')
    routes.value = await res.json()
  } catch (e) {
    console.error(e)
    alert('라우트를 불러오는 중 에러가 발생했습니다.')
  }
}

async function addRoute() {
  await fetch(`${API_BASE}/admin/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: form.value.method,
      path: form.value.path,
      status: form.value.status,
      response: JSON.parse(form.value.response),
    }),
  })
  showModal.value = false
  await loadRoutes()
}

async function deleteRoute(id: number) {
  await fetch(`${API_BASE}/admin/routes/${id}`, { method: 'DELETE' })
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
