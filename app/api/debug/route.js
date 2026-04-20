import { NextResponse } from 'next/server'
import { fetchActiveRoles, fetchRoleDetail } from '../../../../lib/atlas.js'

export async function GET() {
    try {
          const list = await fetchActiveRoles()
          const first = list[0]
          if (!first) return NextResponse.json({ error: 'No roles' })
          const detail = await fetchRoleDetail(first.id)
          return NextResponse.json({
                  listKeys: Object.keys(first),
                  detailKeys: Object.keys(detail),
                  detailSample: {
                            id: detail.id,
                            title: detail.title || detail.jobRole,
                            hasJobDescription: !!detail.jobDescription,
                            jobDescType: typeof detail.jobDescription,
                            jobDescLen: String(detail.jobDescription || '').length,
                            jobDescPreview: String(detail.jobDescription || '').substring(0, 200),
                            hasDescription: !!detail.description,
                            descPreview: String(detail.description || '').substring(0, 200),
                            hasSummary: !!detail.summary,
                            summaryPreview: String(detail.summary || '').substring(0, 200),
                  }
          })
    } catch (err) {
          return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
