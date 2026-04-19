import { NextResponse } from 'next/server'
import { fetchActiveRoles, fetchRoleDetail } from '../../../lib/atlas.js'
import { getCachedRoles } from '../../../lib/cache.js'

export async function GET() {
  try {
    const cached = await getCachedRoles()
    const firstCached = cached?.[0]

    const roles = await fetchActiveRoles()
    const firstId = roles[0]?.id
    let rawJdType = null
    let rawJdSample = null

    if (firstId) {
      const rawDetail = await fetchRoleDetail(firstId)
      const jd = rawDetail.jobDescription
      rawJdType = Array.isArray(jd) ? 'array' : typeof jd
      if (typeof jd === 'string') {
        rawJdSample = jd.substring(0, 300)
      } else if (Array.isArray(jd)) {
        rawJdSample = JSON.stringify(jd.slice(0, 2), null, 2)
      } else {
        rawJdSample = JSON.stringify(jd)?.substring(0, 300)
      }
    }

    return NextResponse.json({
      kvCacheExists: !!cached,
      kvCacheCount: cached?.length || 0,
      kvFirstRole: firstCached ? {
        title: firstCached.title,
        jdHasHtmlTags: /<[a-z]/.test(firstCached.jobDescription || ''),
        jdSample: (firstCached.jobDescription || '').substring(0, 300),
      } : null,
      atlasRaw: {
        roleId: firstId,
        jdType: rawJdType,
        jdSample: rawJdSample,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
