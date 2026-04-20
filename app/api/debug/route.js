import { NextResponse } from 'next/server'

const BASE = process.env.ATLAS_BASE_URL || 'https://api.recruitwithatlas.com'
const KEY = process.env.ATLAS_API_KEY

export async function GET() {
  if (!KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 })
  
  const listRes = await fetch(BASE + '/api/v1/projects?state=active&per_page=5', {
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }
  })
  const listData = await listRes.json()
  const projects = listData.data || []
  
  const details = []
  for (const p of projects.slice(0, 5)) {
    const res = await fetch(BASE + '/api/v1/projects/' + p.id, {
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }
    })
    const json = await res.json()
    const raw = json.data || json
    details.push({
      id: raw.id,
      title: raw.jobRole || raw.title,
      location: raw.location,
      hireTarget: raw.hireTarget,
      customAttributes: raw.customAttributes,
      workMode: raw.workMode,
      seniority: raw.seniority,
    })
  }
  
  return NextResponse.json({ projects: details })
}
