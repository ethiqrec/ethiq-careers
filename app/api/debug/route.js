import { NextResponse } from 'next/server'
import { fetchRoleDetail, transformRole } from '../../../lib/atlas.js'

// Product Engineer role ID
const ROLE_ID = '664f54c4-2efb-4817-b578-ca549215adf2'

export async function GET() {
  try {
    const raw = await fetchRoleDetail(ROLE_ID)
    const jd = raw.jobDescription
    const jdType = Array.isArray(jd) ? 'array' : typeof jd
    
    // Check if it's a string containing JSON
    let parsed = null
    let parseError = null
    if (typeof jd === 'string' && (jd.startsWith('[') || jd.startsWith('{'))) {
      try { parsed = JSON.parse(jd) } catch (e) { parseError = e.message }
    }

    // Transform through our pipeline
    const transformed = transformRole(raw)

    return NextResponse.json({
      rawJdType: jdType,
      rawJdStartsWith: typeof jd === 'string' ? jd.substring(0, 80) : null,
      rawJdLength: typeof jd === 'string' ? jd.length : null,
      parsedBlockCount: parsed ? (Array.isArray(parsed) ? parsed.length : 'not array') : null,
      parsedFirstBlocks: parsed && Array.isArray(parsed) ? parsed.slice(0, 3).map(b => ({ type: b.type, contentLen: (b.content || []).length, firstContent: (b.content || [])[0]?.text?.substring(0, 50) })) : null,
      parseError,
      transformedJdHasHtml: /<[a-z]/.test(transformed.jobDescription || ''),
      transformedJdSample: (transformed.jobDescription || '').substring(0, 500),
    })
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}
