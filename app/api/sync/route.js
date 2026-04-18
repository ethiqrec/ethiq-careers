// /api/sync — refresh roles from Atlas + regenerate LLM content
// Wired to Vercel cron (every 15 min)

import { NextResponse } from 'next/server'
import { fetchActiveRoles, transformRole } from '../../../lib/atlas.js'
import { rewriteAllRoles } from '../../../lib/llm.js'
import { setCachedRoles } from '../../../lib/cache.js'

export const maxDuration = 60 // allow up to 60s for LLM calls

export async function GET(request) {
  // Optional: verify cron secret
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!process.env.ATLAS_API_KEY) {
      return NextResponse.json({ error: 'ATLAS_API_KEY not configured' }, { status: 500 })
    }

    // 1. Fetch active roles from Atlas
    const raw = await fetchActiveRoles()
    const roles = raw.map(transformRole)
    console.log(`Sync: fetched ${roles.length} roles from Atlas`)

    // 2. Run LLM rewrites (only for roles with changed JDs — cache handles dedup)
    const rewrites = await rewriteAllRoles(roles)
    console.log(`Sync: processed ${rewrites.size} LLM rewrites`)

    // 3. Enrich and cache
    const enriched = roles.map((role) => ({
      ...role,
      rewrite: rewrites.get(role.id) || null,
      locationDisplay: formatLocation(role.location, role.workMode),
      workModeLabel: formatWorkMode(role.workMode),
      salaryDisplay: role.salary || null,
      descriptor: buildDescriptor(role),
    }))

    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    await setCachedRoles(enriched)
    console.log(`Sync: cached ${enriched.length} enriched roles`)

    return NextResponse.json({
      ok: true,
      count: enriched.length,
      synced_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Sync failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Helper functions (duplicated from roles.js to keep the route self-contained)
function formatLocation(location, workMode) {
  const city = location?.city || location?.name || ''
  const country = location?.countryCode || location?.country || ''
  if (workMode === 'remote') return country ? `remote ${country}` : 'remote'
  if (workMode === 'hybrid') return city ? `hybrid ${city}` : 'hybrid'
  if (workMode === 'office') return city ? `office ${city}` : 'on-site'
  return city || country || null
}

function formatWorkMode(mode) {
  if (!mode) return null
  return { remote: 'Remote', hybrid: 'Hybrid', office: 'On-site' }[mode] || mode
}

function buildDescriptor(role) {
  const parts = []
  if (role.stage) parts.push(role.stage)
  if (role.company?.industry) parts.push(role.company.industry.toLowerCase())
  if (role.company?.size) parts.push(`${role.company.size} people`)
  const loc = formatLocation(role.location, role.workMode)
  if (loc) parts.push(loc)
  if (role.visaSupport === true || role.visaSupport === 'yes') parts.push('visa supported')
  return parts.join(' · ') || null
}
