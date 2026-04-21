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

// Fetch location data from Atlas Public Jobs GraphQL API
// This endpoint doesn't need an API key — it uses the agency alias
const PUBLIC_GQL = 'https://api.recruitwithatlas.com/public-graphql'
const AGENCY_ALIAS = process.env.ATLAS_AGENCY_ALIAS || 'ethiqreccom'

export async function fetchPublicLocations() {
  try {
    const res = await fetch(PUBLIC_GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        operationName: 'GetPublicJobOpenings',
        variables: { page: 1, limit: 100, input: { agencyAlias: AGENCY_ALIAS } },
        query: `query GetPublicJobOpenings($input: PublicJobOpeningInput!, $limit: Int, $page: Int) {
          publicJobOpenings(input: $input, limit: $limit, page: $page) {
            items {
              id
              jobRole
              location {
                name
                country
                locality
                region
                street_address
                postal_code
              }
            }
          }
        }`
      })
    })
    if (!res.ok) return {}
    const json = await res.json()
    const items = json.data?.publicJobOpenings?.items || []
    // Build a map of project ID -> location string
    const locationMap = {}
    for (const item of items) {
      const loc = item.location
      if (!loc) continue
      const display = loc.locality || loc.name || loc.country || loc.region || null
      if (display) locationMap[item.id] = display
    }
    return locationMap
  } catch (err) {
    console.warn('fetchPublicLocations failed:', err.message)
    return {}
  }
}

// Currency symbol regex (using Unicode escapes to avoid encoding issues)
const CURRENCY_RE = /[\u00A3\u20AC$]/

// ── BlockNote JSON parser ──
// Atlas stores job descriptions as BlockNote rich-text JSON.
// This converts them to HTML for rich rendering.

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;')
}

function parseBlockNote(input) {
  if (!input) return ''
  if (typeof input !== 'string') return esc(String(input))
  var trimmed = input.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      var parsed = JSON.parse(trimmed)
      var blocks = Array.isArray(parsed) ? parsed : [parsed]
      return blocksToHtml(blocks)
    } catch (e) {
      // Not valid JSON - fall through to return escaped raw
    }
  }
  // Plain text: wrap lines in paragraphs
  return input.split(/\n+/).filter(Boolean).map(function (l) { return '<p>' + esc(l) + '</p>' }).join('')
}

function inlineToHtml(inlines) {
  if (!Array.isArray(inlines)) return ''
  return inlines.map(function (inline) {
    if (inline.type === 'link') {
      var linkText = (inline.content || []).map(function (c) { return esc(c.text || '') }).join('')
      var href = esc(inline.href || '')
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + (linkText || href) + '</a>'
    }
    var t = esc(inline.text || '')
    if (inline.styles) {
      if (inline.styles.bold) t = '<strong>' + t + '</strong>'
      if (inline.styles.italic) t = '<em>' + t + '</em>'
      if (inline.styles.underline) t = '<u>' + t + '</u>'
      if (inline.styles.code) t = '<code>' + t + '</code>'
    }
    return t
  }).join('')
}

function blocksToHtml(blocks) {
  if (!Array.isArray(blocks)) return ''
  var html = ''
  var listOpen = null // 'ul' or 'ol'
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i]
    var isBullet = block.type === 'bulletListItem'
    var isNumbered = block.type === 'numberedListItem'
    var isList = isBullet || isNumbered
    var listTag = isBullet ? 'ul' : isNumbered ? 'ol' : null

    // Close list if switching type or leaving list
    if (listOpen && (!isList || listTag !== listOpen)) {
      html += '</' + listOpen + '>'
      listOpen = null
    }

    if (isList) {
      if (!listOpen) {
        listOpen = listTag
        html += '<' + listTag + '>'
      }
      var liContent = inlineToHtml(block.content)
      if (block.children && block.children.length > 0) {
        liContent += blocksToHtml(block.children)
      }
      html += '<li>' + liContent + '</li>'
    } else if (block.type === 'heading') {
      var level = block.props && block.props.level ? block.props.level : 3
      if (level < 1 || level > 6) level = 3
      html += '<h' + level + '>' + inlineToHtml(block.content) + '</h' + level + '>'
    } else if (block.type === 'table' && block.content && (block.content.rows || Array.isArray(block.content))) {
      var rows = block.content.rows || block.content
      html += '<table>'
      for (var r = 0; r < rows.length; r++) {
        html += '<tr>'
        var cells = rows[r].cells || []
        var tag = r === 0 ? 'th' : 'td'
        for (var c = 0; c < cells.length; c++) {
          var cellContent = Array.isArray(cells[c]) ? cells[c].map(function (ci) { return esc(ci.text || '') }).join('') : esc(String(cells[c]))
          html += '<' + tag + '>' + cellContent + '</' + tag + '>'
        }
        html += '</tr>'
      }
      html += '</table>'
    } else {
      // paragraph or unknown block type
      var content = inlineToHtml(block.content)
      if (content) html += '<p>' + content + '</p>'
      if (block.children && block.children.length > 0) {
        html += blocksToHtml(block.children)
      }
    }
  }
  // Close any trailing open list
  if (listOpen) html += '</' + listOpen + '>'
  return html
}

// Extract a value from Atlas customAttributes array by attribute name
function getCustomAttr(customAttributes, name) {
  if (!Array.isArray(customAttributes)) return null
  const attr = customAttributes.find(
    (a) => a.attributeName && a.attributeName.toLowerCase() === name.toLowerCase()
  )
  return attr ? attr.value || null : null
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
    title: toTitleCase(raw.jobRole || raw.title || raw.name) || 'Untitled role',
    slug: slugify(raw.jobRole || raw.title || raw.name || raw.id) + '-' + String(raw.id || '').substring(0, 8),
    jobDescription: parseBlockNote(raw.jobDescriptionFormatted || raw.jobDescription || ''),
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
    applyUrl: raw.applyUrl || `https://my.recruitwithatlas.com/public/${raw.id}`,
    numberOfPositions: raw.hireTarget || raw.numberOfPositions || null,
    placeOfWork: getCustomAttr(raw.customAttributes, 'Place of work')
      || raw.location?.country || raw.location?.formattedAddress || null,
    discipline: getCustomAttr(raw.customAttributes, 'discipline') || null,
  }
}

function toTitleCase(str) {
  if (!str) return str
  const small = new Set(['of', 'and', 'for', 'at', 'the', 'in', 'on', 'to', 'a', 'an', 'by', 'or', 'is'])
  const upper = new Set(['ai', 'uk', 'us', 'eu', 'sap', 'api', 'cto', 'ceo', 'cfo', 'coo', 'vp', 'hr', 'qa', 'ui', 'ux', 'ml', 'be', 'fe', 'devops', 'saas', 'ios', 'sql', 'aws', 'gcp', 'erp', 'crm', 'ftc', 'abap', 'emea'])
  return str.replace(/\S+/g, (word, i) => {
    const lower = word.toLowerCase()
    // Strip trailing punctuation for matching, re-attach after
    const core = lower.replace(/[^a-z]/g, '')
    if (upper.has(core)) return word.toUpperCase()
    if (i > 0 && small.has(lower)) return lower
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
}
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}
