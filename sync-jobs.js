import fs from 'fs';

const API_KEY = process.env.ATLAS_API_KEY;
const ATLAS_API_BASE = 'https://api.recruitwithatlas.com';
const ATLAS_PUBLIC_BASE = 'https://my.recruitwithatlas.com/public';
const OUTPUT_FILE = 'public/jobs.json';

if (!API_KEY) {
  console.error('ATLAS_API_KEY environment variable is not set.');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function fetchJobDetails(id) {
  const res = await fetch(`${ATLAS_API_BASE}/api/v1/projects/${id}`, { headers });
  if (!res.ok) {
    console.warn(`Warning: could not fetch details for ${id} (HTTP ${res.status})`);
    return null;
  }
  const json = await res.json();
  return json.data || null;
}

console.log('Fetching jobs from Atlas...');

try {
  // Step 1: Get list of active projects (summary only)
  const listRes = await fetch(
    `${ATLAS_API_BASE}/api/v1/projects?state=active&per_page=100`,
    { headers }
  );

  if (!listRes.ok) {
    throw new Error(`Atlas API returned HTTP ${listRes.status}: ${await listRes.text()}`);
  }

  const listData = await listRes.json();
  const summaries = listData.data || [];
  console.log(`Fetched ${summaries.length} active projects from Atlas`);

  // Step 2: Fetch full details for each project
  console.log('Fetching full details for each project...');
  const detailedJobs = await Promise.all(
    summaries.map(s => fetchJobDetails(s.id))
  );

  // Transform to public-safe format (hide client names)
  const jobs = detailedJobs
    .filter(job => job !== null)
    .map(job => {
      // Company metadata from industry and size (without naming the company)
      const industry = job.company?.industry || null;
      const companySize = job.company?.size || null;
      const companyMeta = [industry, companySize ? `${companySize} employees` : null]
        .filter(Boolean)
        .join(' \u00b7 ') || null;

      // Location - use formattedAddress or build from parts
      const locationStr = job.location?.formattedAddress
        || [job.location?.city, job.location?.country].filter(Boolean).join(', ')
        || null;

      // Strip HTML from job description
      const rawDesc = job.jobDescription || null;
      const description = rawDesc
        ? rawDesc.replace(/<[^>]*>/g, '').trim()
        : null;

      // Salary string
      const salary = job.salary || null;
      const salaryCurrency = job.salaryCurrency || null;
      const salaryStr = salary
        ? (salaryCurrency ? `${salaryCurrency} ${salary}` : String(salary))
        : null;

      return {
        id: job.id,
        title: job.jobRole || 'Open Role',
        companyMeta,
        description,
        contractType: job.contractType || null,
        workMode: job.workMode || null,
        location: locationStr,
        salary: salaryStr,
        visaSupport: job.visaSupport === true ? true : (job.visaSupport === false ? false : null),
        createdAt: job.createdAt || new Date().toISOString(),
        applyUrl: `${ATLAS_PUBLIC_BASE}/${job.id}`
      };
    });

  const output = {
    jobs,
    lastUpdated: new Date().toISOString(),
    count: jobs.length
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Wrote ${jobs.length} jobs to ${OUTPUT_FILE}`);
} catch (error) {
  console.error('Sync failed:', error.message);
  process.exit(1);
}
