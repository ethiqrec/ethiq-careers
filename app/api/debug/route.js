import { NextResponse } from 'next/server'

const BASE = process.env.ATLAS_BASE_URL || 'https://api.recruitwithatlas.com'
const KEY = process.env.ATLAS_API_KEY

export async function GET() {
  try {
    const listRes = await fetch(`${BASE}/api/v1/projects?state=active&per_page=100`, {
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    })
    const listData = await listRes.json()
    const projects = (listData.data || [])

    // Fetch full detail for ALL projects and check customAttributes
    const details = await Promise.all(
      projects.map(async (p) => {
        const res = await fetch(`${BASE}/api/v1/projects/${p.id}`, {
          headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        })
        const json = await res.json()
        const raw = json.data || json

        // Look for discipline in various places
        const customAttrs = raw.customAttributes || []
        const customFields = raw.customFields
        const custom = raw.custom
        const discipline = raw.discipline
        const tags = raw.tags
        const labels = raw.labels

        // Search the entire raw JSON for "discipline" or "Discipline"
        const rawStr = JSON.stringify(raw)
        const hasDiscipline = rawStr.toLowerCase().includes('discipline')
        const disciplineContext = hasDiscipline
          ? rawStr.slice(Math.max(0, rawStr.toLowerCase().indexOf('discipline') - 30), rawStr.toLowerCase().indexOf('discipline') + 80)
          : null

        return {
          id: p.id,
          title: raw.jobRole || raw.title,
          jobNumber: raw.jobNumber,
          customAttributes: customAttrs,
          customFields: customFields || null,
          custom: custom || null,
          discipline: discipline || null,
          tags: tags || null,
          labels: labels || null,
          hasDisciplineInRaw: hasDiscipline,
          disciplineContext: disciplineContext,
          allKeys: Object.keys(raw).sort(),
        }
      })
    )

    return NextResponse.json(details, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
