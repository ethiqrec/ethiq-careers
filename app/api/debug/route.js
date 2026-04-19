import { NextResponse } from 'next/server'
import { fetchActiveRoles, fetchRoleDetail } from '../../../lib/atlas.js'

export async function GET() {
  try {
    const roles = await fetchActiveRoles()
    const details = await Promise.all(
      roles.map(async (r) => {
        const d = await fetchRoleDetail(r.id)
        return {
          id: d.id,
          title: d.jobRole,
          ownerName: d.owner?.name,
          ownerEmail: d.owner?.email,
          members: (d.members || []).map(m => ({ name: m.name, email: m.email, type: m.memberType })),
          contractType: d.contractType,
          workMode: d.workMode,
        }
      })
    )

    // Unique owners
    const owners = {}
    details.forEach(d => {
      if (d.ownerEmail) {
        if (!owners[d.ownerEmail]) owners[d.ownerEmail] = { name: d.ownerName, email: d.ownerEmail, roleCount: 0, roles: [] }
        owners[d.ownerEmail].roleCount++
        owners[d.ownerEmail].roles.push(d.title)
      }
    })

    // Unique members (across all roles)
    const allMembers = {}
    details.forEach(d => {
      d.members.forEach(m => {
        if (!allMembers[m.email]) allMembers[m.email] = { name: m.name, email: m.email, types: new Set(), roleCount: 0 }
        allMembers[m.email].types.add(m.type)
        allMembers[m.email].roleCount++
      })
    })
    // Convert sets to arrays for JSON
    Object.values(allMembers).forEach(m => { m.types = [...m.types] })

    // Contract types and work modes
    const contractTypes = [...new Set(details.map(d => d.contractType).filter(Boolean))]
    const workModes = [...new Set(details.map(d => JSON.stringify(d.workMode)).filter(v => v !== 'null'))]

    return NextResponse.json({
      totalRoles: details.length,
      uniqueOwners: Object.values(owners),
      uniqueMembers: Object.values(allMembers),
      contractTypes,
      workModes,
      sampleRoles: details.slice(0, 5),
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
