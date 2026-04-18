// Roles data layer — fetches from Atlas or falls back to local jobs.json
// This is the main entry point for getting role data

import { fetchActiveRoles, transformRole } from './atlas.js'
import { getCachedRoles, setCachedRoles } from './cache.js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Format salary for display: "£85-110k", "€50-70k"
function formatSalary(salary, currency) {
  if (!salary) return null
  // If salary is already formatted as a string, return it
  if (typeof salary === 'string' && salary.match(/[£€$]/)) return salary
  return salary
}

// Format location for display
function formatLocation(location, workMode) {
  const city = location?.city || location?.name || ''
  const country = location?.countryCode || location?.country || ''
  if (workMode === 'remote') return country ? `remote ${country}` : 'remote'
  if (workMode === 'hybrid') return city ? `hybrid ${city}` : 'hybrid'
  if (workMode === 'office') return city ? `office ${city}` : 'on-site'
  return city || country || null
}

// Format work mode label
function formatWorkMode(mode) {
  if (!mode) return null
  const map = { remote: 'Remote', hybrid: 'Hybrid', office: 'On-site' }
  return map[mode] || mode
}

// Build the descriptor line: "Series A fintech · 40 people · remote-first EU · visa supported"
function buildDescriptor(role) {
  const parts = []
  if (role.stage) parts.push(role.stage)
  if (role.company?.industry) parts.push(role.company.industry.toLowerCase())
  if (role.company?.size) parts.push(`${role.company.size} people`)
  const loc = formatLocation(role.location, role.workMode)
  if (loc) parts.push(loc)
  if (role.visaSupport === true || role.visaSupport === 'yes') parts.push('visa supported')
  return parts.join(' \u00b7 ') || null
}

// Get all roles with enriched data
export async function getRoles() {
  // Try cache first
  const cached = await getCachedRoles()
  if (cached) return cached

  let rawRoles = []

  // Try Atlas API
  if (process.env.ATLAS_API_KEY) {
    try {
      const atlasRoles = await fetchActiveRoles()
      rawRoles = atlasRoles.map(transformRole)
    } catch (err) {
      console.error('Atlas fetch failed, falling back to jobs.json:', err.message)
    }
  }

  // Fallback to local jobs.json
  if (rawRoles.length === 0) {
    try {
      const filePath = join(process.cwd(), 'public', 'jobs.json')
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      rawRoles = (data.jobs || []).map((j) => ({
        id: j.id,
        title: j.title,
        slug: (j.title || j.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        jobDescription: j.summary || '',
        location: j.location || {},
        workMode: j.workMode || null,
        seniority: j.seniority || null,
        salary: j.salary || null,
        salaryCurrency: null,
        visaSupport: null,
        skills: [],
        contractType: j.contractType || 'full_time',
        createdAt: j.createdAt || new Date().toISOString(),
        company: { industry: null, size: null },
        stage: null,
        owner: { name: 'James', email: 'james@ethiqrec.com' },
        applyUrl: j.applyUrl || null,
      }))
    } catch (err) {
      console.error('Failed to read jobs.json:', err.message)
      rawRoles = []
    }
  }

  // Enrich with display fields (no LLM rewrites)
  const enriched = rawRoles.map((role) => ({
    ...role,
    locationDisplay: formatLocation(role.location, role.workMode),
    workModeLabel: formatWorkMode(role.workMode),
    salaryDisplay: formatSalary(role.salary, role.salaryCurrency),
    descriptor: buildDescriptor(role),
    rewrite: null,
  }))

  // Sort by newest first
  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Cache the result
  await setCachedRoles(enriched)
  return enriched
}

// Get a single role by slug
export async function getRoleBySlug(slug) {
  const roles = await getRoles()
  return roles.find((r) => r.slug === slug) || null
}
