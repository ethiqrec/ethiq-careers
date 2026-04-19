import { NextResponse } from 'next/server'
import { fetchActiveRoles, fetchRoleDetail } from '../../../lib/atlas.js'

export async function GET() {
  try {
    const roles = await fetchActiveRoles()
    // Get details for first 3 roles to see owner/members patterns
    const samples = await Promise.all(
      roles.slice(0, 3).map(async (r) => {
        const d = await fetchRoleDetail(r.id)
        return {
          id: d.id,
          title: d.jobRole,
          owner: d.owner,
          members: d.members,
          contractType: d.contractType,
          workMode: d.workMode,
          seniority: d.seniority,
          func: d.func,
          stages: d.stages?.map(s => ({ id: s.id, name: s.name })),
          customAttributes: d.customAttributes,
        }
      })
    )
    return NextResponse.json({ count: roles.length, samples })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
