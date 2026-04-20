// Roles data layer — fetches from Atlas or falls back to local jobs.json
// This is the main entry point for getting role data

import { fetchActiveRoles, fetchRoleDetail, transformRole } from './atlas.js'
import { getCachedRoles, setCachedRoles } from './cache.js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load manual location overrides (Atlas API does not expose Place of Work)
let locationOverrides = {}
try {
  const locPath = join(process.cwd(), 'public', 'locations.json')
  locationOverrides = JSON.parse(readFileSync(locPath, 'utf8'))
} catch (e) {
  // No overrides file or invalid JSON
}

// Currency symbol regex (Unicode escapes to avoid encoding issues)
const CURRENCY_RE = /[\u00A3\u20AC$]/

// Format salary for display: "£85-110k", "€50-70k"
function formatSalary(salary, currency) {
  if (!salary) return null

  // If salary is already formatted as a string with currency symbol, clean it up
  if (typeof salary === 'string' && salary.match(CURRENCY_RE)) {
    // Check if the numeric value is suspiciously low (under 1000 = probably in thousands)
    const num = parseFloat(salary.replace(/[^0-9.]/g, ''))
    if (num > 0 && num < 1000) {
      const sym = salary.match(CURRENCY_RE)?.[0] || '\u00A3'
      return `${sym}${Math.round(num)}k`
    }
    return salary
  }

  // Handle numeric salary
  if (typeof salary === 'number') {
    const sym = currency || '\u00A3'
    if (salary < 1000) {
      return `${sym}${Math.round(salary)}k`
    }
    return `${sym}${Math.round(salary / 1000)}k`
  }

  // Handle salary object with min/max
  if (typeof salary === 'object' && salary !== null) {
    const sym = currency || '\u00A3'
    const min = salary.min || salary.salary_min
    const max = salary.max || salary.salary_max
    if (min && max) {
      const minK = min < 1000 ? min : Math.round(min / 1000)
      const maxK = max < 1000 ? max : Math.round(max / 1000)
      return `${sym}${minK}-${maxK}k`
    }
    if (min) {
      const minK = min < 1000 ? min : Math.round(min / 1000)
      return `${sym}${minK}k+`
    }
    return null
  }

  // String without currency - try to parse
  const num = parseFloat(String(salary).replace(/[^0-9.]/g, ''))
  if (isNaN(num) || num === 0) return null
  const sym = currency || '\u00A3'
  if (num < 1000) return `${sym}${Math.round(num)}k`
  return `${sym}${Math.round(num / 1000)}k`
}

// Format location for display
function formatLocation(location, workMode) {
  const city = location?.city || location?.name || ''
  const country = location?.countryCode || location?.country || ''
  const formatted = location?.formattedAddress || ''

  if (workMode === 'remote') return country ? `Remote \u00B7 ${country}` : 'Remote'
  if (workMode === 'hybrid') return city ? `Hybrid \u00B7 ${city}` : 'Hybrid'
  if (workMode === 'office') return city ? `On-site \u00B7 ${city}` : 'On-site'
  return formatted || city || country || null
}

// Format work mode label
function formatWorkMode(mode) {
  if (!mode) return null
  const map = { remote: 'Remote', hybrid: 'Hybrid', office: 'On-site' }
  return map[mode] || mode
}

// Format contract type label
function formatContractType(type) {
  if (!type) return null
  const map = { full_time: 'Full-time', contract: 'Contract', part_time: 'Part-time' }
  return map[type] || type
}

// Format seniority label
function formatSeniority(seniority) {
  if (!seniority) return null
  const map = {
    partner: 'Partner',
    board: 'Board',
    founder: 'Founder',
    cxo: 'C-Suite',
    vp: 'VP',
    director: 'Director',
    manager: 'Manager',
    senior: 'Senior',
    middle: 'Mid-level',
    junior: 'Junior',
  }
  return map[seniority] || seniority
}

// Build the descriptor line
function buildDescriptor(role) {
  const parts = []
  if (role.company?.industry) parts.push(role.company.industry.toLowerCase())
  if (role.company?.size) parts.push(`${role.company.size} people`)
  const loc = formatLocation(role.location, role.workMode)
  if (loc) parts.push(loc)
  if (role.visaSupport === true || role.visaSupport === 'yes') parts.push('visa supported')
  return parts.join(' \u00B7 ') || null
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
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

      // Fetch full details for each role (list endpoint only returns id/jobRole/state/company)
      const detailed = await Promise.all(
        atlasRoles.map(async (summary) => {
          try {
            const detail = await fetchRoleDetail(summary.id)
            return transformRole(detail)
          } catch (err) {
            console.warn(`Failed to fetch detail for project ${summary.id}:`, err.message)
            // Fall back to summary data
            return transformRole(summary)
          }
        })
      )
      rawRoles = detailed
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
        slug: slugify(j.title || j.id) + '-' + String(j.id || '').substring(0, 8),
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
        owner: { name: null, email: process.env.OWNER_EMAIL_FALLBACK || null },
        applyUrl: j.applyUrl || null,
      }))
    } catch (err) {
      console.error('Failed to read jobs.json:', err.message)
      rawRoles = []
    }
  }

  // Enrich with display fields
  const enriched = rawRoles.map((role) => ({
    ...role,
    locationDisplay: locationOverrides[role.title] || role.placeOfWork || formatLocation(role.location, role.workMode),
    workModeLabel: formatWorkMode(role.workMode),
    contractTypeLabel: formatContractType(role.contractType),
    seniorityLabel: formatSeniority(role.seniority),
    salaryDisplay: formatSalary(role.salary, role.salaryCurrency),
    liveRolesDisplay: role.numberOfPositions ? String(role.numberOfPositions) : null,
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
