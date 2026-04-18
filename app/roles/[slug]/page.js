import { getRoles, getRoleBySlug } from '../../../lib/roles.js'
import MobileDetail from './mobile-detail.js'
import { notFound } from 'next/navigation'

export const revalidate = 900

// Generate static params for all roles
export async function generateStaticParams() {
  try {
    const roles = await getRoles()
    return roles.map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const role = await getRoleBySlug(slug)
  if (!role) return { title: 'Role not found — Ethiq' }
  return {
    title: `${role.title} — Ethiq`,
    description: role.descriptor || 'Engineering role via Ethiq',
  }
}

export default async function RolePage({ params }) {
  const { slug } = await params
  const role = await getRoleBySlug(slug)
  if (!role) notFound()

  return <MobileDetail role={role} />
}
