import { getRoles } from '../lib/roles.js'
import CareersClient from './careers-client.js'

export const revalidate = 900 // ISR: revalidate every 15 min

export default async function Page() {
  let roles = []
  const syncedAt = new Date().toISOString()
  try {
    roles = await getRoles()
  } catch (err) {
    console.error('Failed to load roles:', err.message)
  }

  return <CareersClient roles={roles} syncedAt={syncedAt} />
}
