import { NextResponse } from 'next/server'

const BASE = process.env.ATLAS_BASE_URL || 'https://api.recruitwithatlas.com'
const KEY = process.env.ATLAS_API_KEY

export async function GET() {
  if (!KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 })
  
  const listRes = await fetch(BASE + '/api/v1/projects?state=active&per_page=100', {
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }
  })
  const listData = await listRes.json()
  const projects = listData.data || []
  
  // Find Senior Product Engineer
  const spe = projects.find(p => (p.jobRole || '').includes('Senior Product Engineer'))
  if (!spe) return NextResponse.json({ error: 'SPE not found', titles: projects.map(p => p.jobRole) })
  
  const res = await fetch(BASE + '/api/v1/projects/' + spe.id, {
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }
  })
  const json = await res.json()
  const raw = json.data || json
  
  // Return everything except jobDescription/jobDescriptionFormatted (too long)
  const clean = {}
  for (const [k, v] of Object.entries(raw)) {
    if (k === 'jobDescription' || k === 'jobDescriptionFormatted') {
      clean[k] = typeof v === 'string' ? v.substring(0, 50) + '...' : v
    } else {
      clean[k] = v
    }
  }
  
  return NextResponse.json(clean)
}
