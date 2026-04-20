// Atlas CRM API client
// Fetches active roles and individual role details

const BASE = process.env.ATLAS_BASE_URL || 'https://api.recruitwithatlas.com'
const KEY = process.env.ATLAS_API_KEY

function headers() {
  if (!KEY) throw new Error('ATLAS_API_KEY not set')
  return {
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }
}

// Fetch all active projects from Atlas
export async function fetchActiveRoles() {
  const res = await fetch(`${BASE}/api/v1/projects?state=active&per_page=100`, {
    headers: headers(),
    next: { revalidate: 0 }, // always fresh when called
  })
  if (!res.ok) {
    throw new Error(`Atlas projects endpoint returned ${res.status}: ${await res.text()}`)
  }
  const data = await res.json()
  return (data.data || []).filter((r) => r.public !== false)
}

// Fetch full details for a single project
export async function fetchRoleDetail(id) {
  const res = await fetch(`${BASE}/api/v1/projects/${id}`, {
    headers: headers(),
  })
  if (!res.ok) {
    throw new Error(`Atlas project ${id} returned ${res.status}`)
  }
  const json = await res.json()
  // Unwrap { data: {...} } envelope if present
  return json.data || json
}

// Create a person in Atlas (for apply / refer flows)
export async function createPerson({ name, email, linkedinUrl, addedByEmail }) {
  const [firstName, ...rest] = (name || '').split(' ')
  const res = await fetch(`${BASE}/api/v1/people`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      firstName: firstName || 'Unknown',
      lastName: rest.join(' ') || '',
      email,
      linkedinUrl: linkedinUrl || undefined,
      added_by_email: addedByEmail,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Atlas create person failed ${res.status}: ${text}`)
  }
  return res.json()
}

// Add a person as a candidate to a project
export async function addCandidate(projectId, personId) {
  const res = await fetch(`${BASE}/api/v1/projects/${projectId}/candidates`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ personId }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Atlas add candidate failed ${res.status}: ${text}`)
  }
  return res.json()
}

// Lookup people by email or LinkedIn
export async function lookupPeople(identifiers) {
  const res = await fetch(`${BASE}/api/v1/people/lookup-batch`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ identifiers }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.data || data || []
}

// Currency symbol regex (using Unicode escapes to avoid encoding issues)
const CURRENCY_RE = /[\u00A3\u20AC$]/

// Transform a raw Atlas project into our internal role shape
export function transformRole(raw) {
  const skills = (raw.skills || []).map((s) =>
    typeof s === 'string' ? s : s.name || s.label || ''
  )
  // Normalise skill casing (lowercase, dedupe)
  const normSkills = [...new Set(skills.map((s) => s.toLowerCase()))].filter(Boolean)

  const salary = raw.salary
  const currency = raw.salaryCurrency || (salary && typeof salary === 'string' && salary.match(CURRENCY_RE) ? salary.match(CURRENCY_RE)[0] : '')

  return {
    id: raw.id,
    title: raw.jobRole || raw.title || raw.name || 'Untitled role',
    slug: slugify(raw.jobRole || raw.title || raw.name || raw.id) + '-' + String(raw.id || '').substring(0, 8),
    jobDescription: raw.jobDescription || '',
    location: raw.location || {},
    workMode: raw.workMode || null,
    seniority: raw.seniority || null,
    salary: salary || null,
    salaryCurrency: currency || null,
    visaSupport: raw.visaSupport ?? null,
    skills: normSkills,
    contractType: raw.contractType || 'full_time',
    createdAt: raw.createdAt || new Date().toISOString(),
    company: {
      industry: raw.company?.industry || null,
      size: raw.company?.size || null,
    },
    stage: null,
    owner: {
      name: raw.owner?.name || raw.owner?.firstName || null,
      email: raw.owner?.email || process.env.OWNER_EMAIL_FALLBACK || '',
    },
    applyUrl: raw.applyUrl || null,
  }
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}
