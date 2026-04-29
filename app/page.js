import { Suspense } from 'react'
import { getRoles } from '../lib/roles.js'
import CareersClient from './careers-client.js'

export const revalidate = 900 // ISR: revalidate every 15 min

export default async function Page() {
  let roles = []
  try {
    roles = await getRoles()
  } catch (err) {
    console.error('Failed to load roles:', err.message)
  }

  // Route applications through our own /apply/[id] page so submissions
  // always email james@ethiqrec.com via /api/apply, regardless of how
  // (or whether) the role is wired up in Atlas.
  roles = roles.map((r) => ({ ...r, applyUrl: `/apply/${r.id}` }))

  return (
    <Suspense>
      <CareersClient roles={roles} />
    </Suspense>
  )
}
