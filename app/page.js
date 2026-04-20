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

  return (
    <Suspense>
      <CareersClient roles={roles} />
    </Suspense>
  )
}
