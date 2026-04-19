import { NextResponse } from 'next/server'
import { fetchRoleDetail } from '../../../lib/atlas.js'

const ROLE_ID = '664f54c4-2efb-4817-b578-ca549215adf2'

export async function GET() {
  try {
    const raw = await fetchRoleDetail(ROLE_ID)
    
    // Show all top-level keys and their types
    const keys = Object.keys(raw).map(k => {
      const v = raw[k]
      const t = Array.isArray(v) ? 'array' : typeof v
      let sample = ''
      if (typeof v === 'string') sample = v.substring(0, 60)
      else if (Array.isArray(v)) sample = v.length + ' items'
      else if (v && typeof v === 'object') sample = Object.keys(v).join(',')
      return { key: k, type: t, sample }
    })

    // Check for any field containing BlockNote-like data
    const jsonFields = Object.keys(raw).filter(k => {
      const v = raw[k]
      return typeof v === 'string' && (v.startsWith('[{') || v.startsWith('{'))
    })

    return NextResponse.json({
      allKeys: keys,
      jsonStringFields: jsonFields,
      jobDescriptionRaw: raw.jobDescriptionRaw ? (typeof raw.jobDescriptionRaw + ': ' + String(raw.jobDescriptionRaw).substring(0, 200)) : 'NOT PRESENT',
      description: raw.description ? (typeof raw.description + ': ' + String(raw.description).substring(0, 200)) : 'NOT PRESENT',
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
