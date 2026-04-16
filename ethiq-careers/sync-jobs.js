// Simple Atlas API sync without external dependencies
const ATLAS_API_BASE = 'https://api.recruitwithatlas.com';
const API_KEY = process.env.ATLAS_API_KEY;

async function syncJobs() {
  console.log('🔄 Starting job sync...');
  
  if (!API_KEY) {
    throw new Error('ATLAS_API_KEY environment variable not set');
  }

  try {
    // Use built-in fetch (available in Node 18+)
    const response = await fetch(`${ATLAS_API_BASE}/api/v1/projects?state=active&per_page=50`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Atlas API error: ${response.status}`);
    }

    const data = await response.json();
    const projects = data.data || [];
    
    console.log(`Found ${projects.length} active projects`);

    // Transform jobs and hide client names
    const jobs = projects
      .filter(job => job.public !== false) // Only public jobs
      .map(job => ({
        id: job.id,
        title: job.jobRole,
        company: 'Confidential Client', // Always hide client name
        location: job.location || { name: 'Location TBD' },
        state: job.state,
        createdAt: job.createdAt || new Date().toISOString(),
        applyUrl: `${ATLAS_API_BASE}/jobs/${job.id}` // Atlas public job URL
      }));

    // Write to jobs.json
    const outputData = {
      jobs: jobs,
      lastUpdated: new Date().toISOString(),
      count: jobs.length
    };

    // Use Node.js built-in fs
    const fs = await import('fs/promises');
    await fs.writeFile('./public/jobs.json', JSON.stringify(outputData, null, 2));
    
    console.log(`✅ Successfully synced ${jobs.length} jobs`);
    return jobs.length;
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

syncJobs()
  .then(count => {
    console.log(`🎉 Sync completed: ${count} jobs published`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Sync failed:', error.message);
    process.exit(1);
  });
