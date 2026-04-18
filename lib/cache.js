// Cache layer — uses Vercel KV if available, falls back to in-memory Map
// Keyed by roleId:hash(jobDescription)

import { createHash } from 'crypto'

let kv = null

async function getKV() {
  if (kv) return kv
  // Skip KV entirely if env vars aren't configured
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  try {
    // Try to import @vercel/kv — only available when provisioned
    const mod = await import('@vercel/kv')
    kv = mod.kv || mod.default
    return kv
  } catch {
    return null
  }
}

// In-memory fallback
const memCache = new Map()

export function hashDescription(jd) {
  return createHash('sha256').update(jd || '').digest('hex').substring(0, 16)
}

export async function getCached(roleId, jdHash) {
  const key = `role:${roleId}:${jdHash}`
  const store = await getKV()
  if (store) {
    try {
      return await store.get(key)
    } catch {
      // KV not available, fall through
    }
  }
  return memCache.get(key) || null
}

export async function setCached(roleId, jdHash, value) {
  const key = `role:${roleId}:${jdHash}`
  const store = await getKV()
  if (store) {
    try {
      // Cache for 30 days
      await store.set(key, value, { ex: 60 * 60 * 24 * 30 })
      return
    } catch {
      // Fall through to mem
    }
  }
  memCache.set(key, value)
}

// Cache for the full roles list (short TTL)
const ROLES_KEY = 'roles:all'

export async function getCachedRoles() {
  const store = await getKV()
  if (store) {
    try {
      return await store.get(ROLES_KEY)
    } catch {}
  }
  return memCache.get(ROLES_KEY) || null
}

export async function setCachedRoles(roles) {
  const store = await getKV()
  if (store) {
    try {
      await store.set(ROLES_KEY, roles, { ex: 60 * 15 }) // 15 min
      return
    } catch {}
  }
  memCache.set(ROLES_KEY, roles)
}
