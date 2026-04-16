// Test Atlas API connection
const API_KEY = 'hEVpFYwRHUKIymDhRyedzB'; // Replace this with your real key
const ATLAS_API_BASE = 'https://api.recruitwithatlas.com';

console.log('🔄 Testing Atlas API connection...');

fetch(`${ATLAS_API_BASE}/api/v1/projects?state=active&per_page=5`, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Response status:', response.status);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
})
.then(data => {
  console.log('✅ API Success!');
  console.log('Projects found:', data.data?.length || 0);
  
  // Transform to our format
  const jobs = (data.data || []).map(job => ({
    id: job.id,
    title: job.jobRole,
    company: 'Confidential Client',
    location: job.location || { name: 'Location TBD' },
    salary: job.salary || null,
    summary: job.jobDescription ? job.jobDescription.substring(0, 200) + '...' : 'Exciting opportunity to join our client.',
    createdAt: job.createdAt || new Date().toISOString(),
    applyUrl: `${ATLAS_API_BASE}/jobs/${job.id}`
  }));
  
  console.log('Transformed jobs:', JSON.stringify(jobs, null, 2));
})
.catch(error => {
  console.error('❌ API Error:', error.message);
});
