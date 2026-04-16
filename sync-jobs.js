import fs from 'fs';

const API_KEY = process.env.ATLAS_API_KEY;
const ATLAS_API_BASE = 'https://api.recruitwithatlas.com';
const OUTPUT_FILE = 'public/jobs.json';

if (!API_KEY) {
  console.error('❌ ATLAS_API_KEY environment variable is not set.');
  process.exit(1);
}

console.log('🔄 Fetching jobs from Atlas...');

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

  console.log(`✅ Fetched ${rawJobs.length} jobs from Atlas`);

  // Transform to public-safe format (hide client names)
  const jobs = rawJobs.map(job => ({
    id: job.id,
    title: job.jobRole,
    company: 'Confidential Client',
    location: job.location || { name: 'Location TBD' },
    salary: job.salary || null,
    contractType: job.contractType || 'full_time',
    workMode: job.workMode || 'hybrid',
    seniority: job.seniority || 'senior',
    function: job.func || 'Various',
    summary: job.jobDescription
      ? job.jobDescription.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
      : 'Exciting opportunity to join our client.',
    createdAt: job.createdAt || new Date().toISOString(),
    applyUrl: `${ATLAS_API_BASE}/jobs/${job.id}`
  }));

  const output = {
    jobs,
    lastUpdated: new Date().toISOString(),
    count: jobs.length
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`📄 Wrote ${jobs.length} jobs to ${OUTPUT_FILE}`);

} catch (error) {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
}
