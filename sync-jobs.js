// sync-jobs.js
// Pulls roles from Atlas Recruitment CRM and writes public/jobs.json
// Uses Node 18+ built-in fetch — no dependencies.
// ES module: package.json declares "type": "module".

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const API_KEY = process.env.ATLAS_API_KEY
const API_BASE = 'https://api.recruitwithatlas.com'

// Which Atlas states to pull from. Add or remove states here as needed.
const STATES = ['active', 'lead', 'pitch']

if (!API_KEY) {
  console.error('Missing ATLAS_API_KEY env var')
  process.exit(1)
}

async function fetchProjects(state) {
  const url = `${API_BASE}/api/v1/projects?state=${state}&per_page=100`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    console.error(`Atlas API error for state=${state}: ${res.status} ${res.statusText}`)
    return []
  }
  const data = await res.json()
  return data.data || []
}

// Pull a recruiter name out of whatever Atlas returns. Atlas's exact field name
// for the assigned recruiter isn't documented — try the likely candidates.
function extractRecruiter(job) {
  const candidates = [
    job.consultant,
    job.recruiter,
    job.owner,
    job.assignedTo,
    job.assigned_to,
    job.user,
  ].filter(Boolean)

  for (const c of candidates) {
    if (typeof c === 'string') return c
    if (typeof c === 'object') {
      return c.name || c.firstName || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || ''
    }
  }
  return ''
}

function transform(job) {
  return {
    id: job.id,
    title: job.jobRole || job.title || 'Role',
    company: 'Confidential Client',
    location: job.location || { name: 'Location TBD' },
    salary: job.salary || '',
    contractType: job.contractType || 'full_time',
    workMode: job.workMode || 'hybrid',
    seniority: job.seniority || '',
    function: job.func || job.function || '',
    recruiter: extractRecruiter(job),
    summary: job.jobDescription
      ? String(job.jobDescription).replace(/<[^>]+>/g, '').substring(0, 240).trim() + '…'
      : '',
    createdAt: job.createdAt || new Date().toISOString(),
    // Route applications through our own /apply/[id] page so we always email
    // james@ethiqrec.com (via /api/apply) regardless of how Atlas is set up
    // for this specific role.
    applyUrl: `/apply/${job.id}`,
  }
}

async function main() {
  console.log('Syncing jobs from Atlas…')
  console.log('States:', STATES.join(', '))

  const all = []
  for (const state of STATES) {
    const projects = await fetchProjects(state)
    console.log(`  ${state}: ${projects.length} jobs`)
    all.push(...projects)
  }

  // De-duplicate by id (in case a job appears in multiple states)
  const seen = new Set()
  const unique = all.filter((j) => {
    if (seen.has(j.id)) return false
    seen.add(j.id)
    return true
  })

  const transformed = unique.map(transform)

  const output = {
    jobs: transformed,
    lastUpdated: new Date().toISOString(),
    count: transformed.length,
  }

  const outPath = join(__dirname, 'public', 'jobs.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2))

  console.log(`✓ Wrote ${transformed.length} jobs to ${outPath}`)
  console.log('Recruiters found:', [...new Set(transformed.map((j) => j.recruiter).filter(Boolean))])
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
