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
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.title,
    description: role.description || role.descriptor || '',
    datePosted: role.createdAt ? new Date(role.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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

  // Salary
  if (role.salary) {
    const salaryStr = String(role.salary)
    const nums = salaryStr.match(/[\d,]+/g)
    if (nums && nums.length >= 1) {
      const clean = (s) => parseInt(s.replace(/,/g, ''), 10)
      ld.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: role.salaryCurrency || 'GBP',
        value: {
          '@type': 'QuantitativeValue',
          unitText: 'YEAR',
        },
      }
      if (nums.length >= 2) {
        ld.baseSalary.value.minValue = clean(nums[0])
        ld.baseSalary.value.maxValue = clean(nums[1])
      } else {
        ld.baseSalary.value.value = clean(nums[0])
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
