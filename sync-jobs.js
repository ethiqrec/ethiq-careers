import fs from 'fs';

const API_KEY = process.env.ATLAS_API_KEY;
const ATLAS_API_BASE = 'https://api.recruitwithatlas.com';
const ATLAS_PUBLIC_BASE = 'https://my.recruitwithatlas.com/public';
const OUTPUT_FILE = 'public/jobs.json';

if (!API_KEY) {
  console.error('ATLAS_API_KEY environment variable is not set.');
  process.exit(1);
}

console.log('Fetching jobs from Atlas...');

try {
  const response = await fetch(
    `${ATLAS_API_BASE}/api/v1/projects?state=active&per_page=100`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Atlas API returned HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const rawJobs = data.data || [];
  console.log(`Fetched ${rawJobs.length} jobs from Atlas`);

  // Transform to public-safe format (hide client names)
  const jobs = rawJobs.map(job => {
    // Build company metadata from industry and size (without naming the company)
    const industry = job.company?.industry || null;
    const companySize = job.company?.size || null;
    const companyMeta = [industry, companySize ? `${companySize} employees` : null]
      .filter(Boolean)
      .join(' \u00b7 ') || null;

    // Build location from city and country
    const city = job.location?.city || null;
    const country = job.location?.country || null;
    const locationStr = [city, country].filter(Boolean).join(', ') || null;

    // Strip HTML from job description
    const rawDesc = job.jobDescription || null;
    const description = rawDesc
      ? rawDesc.replace(/<[^>]*>/g, '').trim()
      : null;

    // Build salary string
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
