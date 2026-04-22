import { NextResponse } from 'next/server'

const BASE = process.env.ATLAS_BASE_URL || 'https://api.recruitwithatlas.com'
const KEY = process.env.ATLAS_API_KEY

export async function GET() {
  try {
    // Fetch active projects list
    const listRes = await fetch(`${BASE}/api/v1/projects?state=active&per_page=5`, {
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    })
    const listData = await listRes.json()
    const projects = listData.data || []

    // Fetch full detail for first 3 projects and return ALL fields
    const details = await Promise.all(
      projects.slice(0, 3).map(async (p) => {
        const res = await fetch(`${BASE}/api/v1/projects/${p.id}`, {
          headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        })
        const raw = await res.json()
        // Return the full raw response plus extracted keys
        return {
          id: p.id,
          title: raw.jobRole || raw.title,
          allTopLevelKeys: Object.keys(raw),
          customAttributes: raw.customAttributes,
          custom: raw.custom,
          customFields: raw.customFields,
          discipline: raw.discipline,
          tags: raw.tags,
          labels: raw.labels,
          metadata: raw.metadata,
          rawSnippet: JSON.stringify(raw).substring(0, 2000),
        }
      })
    )

    return NextResponse.json(details, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
