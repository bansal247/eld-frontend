import axios from 'axios'

// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.js).
// In prod, set VITE_API_BASE_URL at build time.
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export async function geocode(query) {
  if (!query || query.length < 3) return []
  const { data } = await client.get('/api/geocode/', { params: { q: query } })
  return data
}

export async function planTrip(payload) {
  const { data } = await client.post('/api/trips/plan/', payload)
  return data
}

export async function getTrip(id) {
  const { data } = await client.get(`/api/trips/${id}/`)
  return data
}

export default client
