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

// Convert BlockNote JSON to HTML
function blocksToHtml(input) {
  if (!input) return ''
  if (typeof input === 'string') {
    if (input.startsWith('[') || input.startsWith('{')) {
      try {
        input = JSON.parse(input)
      } catch {
        return input // already HTML or plain text
      }
    } else {
      return input
    }
  }
  if (!Array.isArray(input)) return String(input)

  return input
    .map((block) => {
      const inlineHtml = (block.content || [])
        .map((c) => {
          if (typeof c === 'string') return esc(c)
          let t = esc(c.text || '')
          if (!t) return ''
          const styles = c.styles || {}
          if (styles.bold) t = `<strong>${t}</strong>`
          if (styles.italic) t = `<em>${t}</em>`
          if (styles.underline) t = `<u>${t}</u>`
          if (styles.strike) t = `<s>${t}</s>`
          if (styles.code) t = `<code>${t}</code>`
          if (c.type === 'link' && c.href) t = `<a href="${esc(c.href)}">${t}</a>`
          return t
        })
        .join('')

      const children = blocksToHtml(block.children || [])
      const inner = [inlineHtml, children].filter(Boolean).join('')

      switch (block.type) {
        case 'heading': {
          const lvl = Math.min(block.props?.level || 3, 4)
          return `<h${lvl}>${inner}</h${lvl}>`
        }
        case 'bulletListItem':
          return `<li>${inner}</li>`
        case 'numberedListItem':
          return `<li>${inner}</li>`
        case 'checkListItem':
          return `<li>${inner}</li>`
        default:
          return inner ? `<p>${inner}</p>` : ''
      }
    })
    .filter(Boolean)
    .join('\n')
}

// Wrap consecutive <li> elements in <ul>
function wrapLists(html) {
  return html
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Transform a raw Atlas project into our internal role shape
export function transformRole(raw) {
  const skills = (raw.skills || []).map((s) =>
    typeof s === 'string' ? s : s.name || s.label || ''
  )
  // Normalise skill casing (lowercase, dedupe)
  const normSkills = [...new Set(skills.map((s) => s.toLowerCase()))].filter(Boolean)

  const custom = raw.customAttributes || {}
  const stage = custom.stage || custom.fundingStage || deriveStagFromSize(raw.company?.size)

  const salary = raw.salary
  const currency = raw.salaryCurrency || (salary && typeof salary === 'string' && salary.match(/[£€$]/) ? salary.match(/[£€$]/)[0] : '')

  return {
    id: raw.id,
    title: raw.jobRole || raw.title || 'Untitled role',
    slug: slugify(raw.jobRole || raw.title || raw.id),
    jobDescription: wrapLists(blocksToHtml(raw.jobDescriptionFormatted || raw.jobDescription)) || '',
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
    stage,
    owner: {
      name: raw.owner?.name || raw.owner?.firstName || null,
      email: raw.owner?.email || process.env.OWNER_EMAIL_FALLBACK || 'james@ethiqrec.com',
    },
    applyUrl: raw.applyUrl || `https://my.recruitwithatlas.com/public/${raw.id}`,
  }
}

function deriveStagFromSize(size) {
  if (!size) return null
  const n = typeof size === 'number' ? size : parseInt(size, 10)
  if (isNaN(n)) return null
  if (n <= 10) return 'Pre-seed'
  if (n <= 30) return 'Seed'
  if (n <= 80) return 'Series A'
  if (n <= 200) return 'Series B'
  if (n <= 500) return 'Series C'
  return 'Series D+'
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}
