import { getRoles } from '../lib/roles.js'

const BASE_URL = 'https://ethiq-careers.vercel.app'

export default async function sitemap() {
  const roles = await getRoles()

  const roleEntries = roles.map((role) => ({
    url: `${BASE_URL}/roles/${role.slug}`,
    lastModified: role.createdAt ? new Date(role.createdAt) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    ...roleEntries,
  ]
}
