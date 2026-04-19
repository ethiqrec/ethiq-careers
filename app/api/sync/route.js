// /api/sync — refresh roles from Atlas
// Triggers Vercel rebuild to pick up fresh KV data
// Wired to Vercel cron (every 15 min)

import { NextResponse } from 'next/server'
import { fetchActiveRoles, fetchRoleDetail, transformRole } from '../../../lib/atlas.js'
import { setCachedRoles } from '../../../lib/cache.js'

export const maxDuration = 60

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

    // 1. Fetch active roles from Atlas (list endpoint — minimal data)
    const raw = await fetchActiveRoles()
    console.log(`Sync: fetched ${raw.length} active projects from Atlas`)

    // 2. Fetch full details for each role
    const roles = await Promise.all(
      raw.map(async (summary) => {
        try {
          const detail = await fetchRoleDetail(summary.id)
          return transformRole(detail)
        } catch (err) {
          console.warn(`Sync: failed to fetch detail for ${summary.id}:`, err.message)
          return transformRole(summary)
        }
      })
    )
    console.log(`Sync: fetched details for ${roles.length} roles`)

    // 3. Enrich and cache
    const enriched = roles.map((role) => ({
      ...role,
      rewrite: null,
      locationDisplay: formatLocation(role.location, role.workMode),
      workModeLabel: formatWorkMode(role.workMode),
      contractTypeLabel: formatContractType(role.contractType),
      seniorityLabel: formatSeniority(role.seniority),
      salaryDisplay: role.salary || null,
      ownerFirstName: (role.owner?.name || '').split(' ')[0] || null,
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
  const formatted = location?.formattedAddress || ''
  if (workMode === 'remote') return country ? `Remote · ${country}` : 'Remote'
  if (workMode === 'hybrid') return city ? `Hybrid · ${city}` : 'Hybrid'
  if (workMode === 'office') return city ? `On-site · ${city}` : 'On-site'
  return formatted || city || country || null
}

function formatWorkMode(mode) {
  if (!mode) return null
  return { remote: 'Remote', hybrid: 'Hybrid', office: 'On-site' }[mode] || mode
}

function formatContractType(type) {
  if (!type) return null
  return { full_time: 'Full-time', contract: 'Contract', part_time: 'Part-time' }[type] || type
}

function formatSeniority(seniority) {
  if (!seniority) return null
  const map = {
    partner: 'Partner', board: 'Board', founder: 'Founder', cxo: 'C-Suite',
    vp: 'VP', director: 'Director', manager: 'Manager', senior: 'Senior',
    middle: 'Mid-level', junior: 'Junior',
  }
  return map[seniority] || seniority
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
