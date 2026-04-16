// Updated Atlas API sync - pulls from multiple states
const API_KEY = 'YOUR_ACTUAL_API_KEY_HERE'; // Replace with your real key
const ATLAS_API_BASE = 'https://api.recruitwithatlas.com';

console.log('🔄 Fetching jobs from Atlas...');

// Pull jobs from active, lead, and pitch states (common for public display)
fetch(`${ATLAS_API_BASE}/api/v1/projects?state=active,lead,pitch&per_page=50`, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Response status:', response.status);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
})
.then(data => {
  console.log('✅ Jobs found:', data.data?.length || 0);
  
  // Show what states we got
  const states = {};
  data.data?.forEach(job => {
    states[job.state] = (states[job.state] || 0) + 1;
    console.log(`- ${job.jobRole} (${job.state})`);
  });
  console.log('Job states found:', states);
  
  // Transform to your format
  const jobs = (data.data || []).map(job => ({
    id: job.id,
    title: job.jobRole,
    company: 'Confidential Client', 
    location: job.location || { name: 'Location TBD' },
    salary: job.salary || null,
    contractType: job.contractType || 'full_time',
    workMode: job.workMode || 'hybrid', 
    seniority: job.seniority || 'senior',
    function: job.func || 'Various',
    summary: job.jobDescription ? job.jobDescription.substring(0, 200) + '...' : 'Exciting opportunity to join our client.',
    createdAt: job.createdAt || new Date().toISOString(),
    applyUrl: `${ATLAS_API_BASE}/jobs/${job.id}`
  }));
  
  console.log('✅ Transformed jobs ready for display:', jobs.length);
  console.log('Sample job:', jobs[0]);
  
  // This would update jobs.json in a real sync
  const output = {
    jobs: jobs,
    lastUpdated: new Date().toISOString(),
    count: jobs.length
  };
  
  console.log('📄 Final JSON:', JSON.stringify(output, null, 2));
})
.catch(error => {
  console.error('❌ Error:', error.message);
});
