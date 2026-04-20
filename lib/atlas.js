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

// ── BlockNote JSON parser ──
// Atlas stores job descriptions as BlockNote rich-text JSON.
// This extracts readable plain text from that structure.

function parseBlockNote(input) {
  if (!input) return ''
  if (typeof input !== 'string') return String(input)
  var trimmed = input.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      var parsed = JSON.parse(trimmed)
      var blocks = Array.isArray(parsed) ? parsed : [parsed]
      return extractBlocks(blocks)
    } catch (e) {
      // Not valid JSON — fall through to return raw
    }
  }
  return input
}

function extractBlocks(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map(function (block) {
      var text = ''
      // Extract inline content
      if (block.content && Array.isArray(block.content)) {
        text = block.content
          .map(function (inline) {
            if (inline.type === 'text') return inline.text || ''
            if (inline.type === 'link') {
              var linkText = (inline.content || [])
                .map(function (c) { return c.text || '' })
                .join('')
              return linkText || inline.href || ''
            }
            return inline.text || ''
          })
          .join('')
      }
      // Handle table rows
      if (block.type === 'table' && block.content && block.content.rows) {
        text = block.content.rows
          .map(function (row) {
            return (row.cells || [])
              .map(function (cell) {
                return (cell || [])
                  .map(function (inline) { return inline.text || '' })
                  .join('')
              })
              .join(' | ')
          })
          .join('\n')
      }
      // Prefix for headings
      if (block.type === 'heading' && text) {
        text = text + ':'
      }
      // Prefix for list items
      if (block.type === 'bulletListItem' && text) {
        text = '\u2022 ' + text
      }
      if (block.type === 'numberedListItem' && text) {
        text = '\u2022 ' + text
      }
      // Recurse into children
      if (block.children && block.children.length > 0) {
        var childText = extractBlocks(block.children)
        if (childText) text = text ? text + '\n' + childText : childText
      }
      return text
    })
    .filter(function (t) { return t.length > 0 })
    .join('\n')
}

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
    jobDescription: parseBlockNote(raw.jobDescription || ''),
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
