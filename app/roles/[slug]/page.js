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

// Build Google Jobs JSON-LD structured data
function buildJobPostingLD(role) {
  // Strip HTML tags from description for clean plain text
  const plainDesc = (role.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.title,
    description: plainDesc || role.descriptor || role.title,
    datePosted: role.createdAt
      ? new Date(role.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Ethiq',
      sameAs: 'https://ethiq-careers.vercel.app',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: role.locationDisplay || role.location || 'United Kingdom',
      },
    },
  }

  // Employment type
  if (role.contractType) {
    const typeMap = {
      permanent: 'FULL_TIME',
      contract: 'CONTRACTOR',
      'full-time': 'FULL_TIME',
      'part-time': 'PART_TIME',
    }
    const mapped = typeMap[(role.contractType || '').toLowerCase()]
    if (mapped) ld.employmentType = mapped
  }

  // Salary - parse display string like "\u00a380-\u00a3120k base"
  if (role.salaryDisplay || role.salary) {
    const salaryStr = String(role.salaryDisplay || role.salary)
    // Match numbers, accounting for k/K suffix
    const matches = salaryStr.match(/([£$\d,.]+[kK]?)/g)
    if (matches && matches.length >= 1) {
      const parseVal = (s) => {
        const cleaned = s.replace(/[\u00a3$,]/g, '')
        const num = parseFloat(cleaned)
        if (cleaned.toLowerCase().endsWith('k')) {
          return parseFloat(cleaned.slice(0, -1)) * 1000
        }
        // If number is small (< 1000), likely in thousands
        return num < 1000 ? num * 1000 : num
      }
      ld.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: 'GBP',
        value: {
          '@type': 'QuantitativeValue',
          unitText: 'YEAR',
        },
      }
      if (matches.length >= 2) {
        ld.baseSalary.value.minValue = parseVal(matches[0])
        ld.baseSalary.value.maxValue = parseVal(matches[1])
      } else {
        ld.baseSalary.value.value = parseVal(matches[0])
      }
    }
  }

  // Remote work
  if (role.workMode) {
    const wm = (role.workMode || '').toLowerCase()
    if (wm.includes('remote')) {
      ld.jobLocationType = 'TELECOMMUTE'
    }
  }

  return ld
}

export default async function RolePage({ params }) {
  const { slug } = await params
  const role = await getRoleBySlug(slug)
  if (!role) notFound()

  const jobPostingLD = buildJobPostingLD(role)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLD) }}
      />
      <MobileDetail role={role} />
    </>
  )
}
