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

  // For each project, fetch details and extract customAttributes
  const results = await Promise.all(
    projects.slice(0, 5).map(async (p) => {
      try {
        const res = await fetch(BASE + '/api/v1/projects/' + p.id, {
          headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }
        })
        const json = await res.json()
        const raw = json.data || json
        return {
          title: raw.jobRole,
          customAttributes: raw.customAttributes,
          contractType: raw.contractType
        }
      } catch (e) {
        return { title: p.jobRole, error: e.message }
      }
    })
  )

  return NextResponse.json(results)
}
