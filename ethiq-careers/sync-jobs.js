import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const ATLAS_API_BASE = 'https://api.recruitwithatlas.com';
const API_KEY = process.env.ATLAS_API_KEY;
const OUTPUT_FILE = './public/jobs.json';

// Atlas API client
class AtlasClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = ATLAS_API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Atlas API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getActiveJobs() {
    // Fetch active and public jobs only
    const params = new URLSearchParams({
      state: 'active',
      per_page: '100' // Adjust as needed
    });

    const response = await this.request(`/api/v1/projects?${params}`);
    return response.data;
  }

  async getJobDetails(jobId) {
    const response = await this.request(`/api/v1/projects/${jobId}`);
    return response.data;
  }
}

// Transform Atlas job data for frontend consumption
function transformJob(job, details = null) {
  // Base data from list endpoint
  const transformed = {
    id: job.id,
    title: job.jobRole,
    state: job.state,
    // NEVER include client name - always hide
    company: 'Confidential Client',
    createdAt: job.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Enhanced data from details endpoint if available
  if (details) {
    transformed.contractType = details.contractType;
    transformed.workMode = details.workMode;
    transformed.seniority = details.seniority;
    transformed.function = details.func;
    transformed.salary = details.salary;
    transformed.location = details.location;
    transformed.summary = extractSummary(details.jobDescription);
    transformed.skills = details.skills || [];
    transformed.visaSupport = details.visaSupport;
    
    // Generate Atlas public job URL - UPDATE THIS PATTERN
    transformed.applyUrl = `${ATLAS_API_BASE}/jobs/${job.id}`;
  }

  return transformed;
}

// Extract a clean summary from job description
function extractSummary(description) {
  if (!description) return '';
  
  // Take first 200 characters and end at sentence boundary
  const truncated = description.substring(0, 200);
  const lastSentence = truncated.lastIndexOf('.');
  
  return lastSentence > 50 ? truncated.substring(0, lastSentence + 1) : truncated + '...';
}

// Filter jobs that should be public
function shouldPublishJob(job, details) {
  // Only publish if explicitly marked as public in Atlas
  if (details && details.public === false) {
    return false;
  }
  
  // Must be active
  if (job.state !== 'active') {
    return false;
  }
  
  // Must have basic required fields
  if (!job.jobRole || job.jobRole.trim() === '') {
    return false;
  }
  
  return true;
}

// Main sync function
async function syncJobs() {
  console.log('🔄 Starting job sync...');
  
  if (!API_KEY) {
    throw new Error('ATLAS_API_KEY environment variable not set');
  }

  const client = new AtlasClient(API_KEY);
  
  try {
    // Get list of active jobs
    console.log('📥 Fetching active jobs from Atlas...');
    const jobs = await client.getActiveJobs();
    console.log(`Found ${jobs.length} active jobs`);

    // Transform and filter jobs
    const transformedJobs = [];
    
    for (const job of jobs) {
      try {
        // Get detailed info for each job
        const details = await client.getJobDetails(job.id);
        
        // Check if this job should be published
        if (shouldPublishJob(job, details)) {
          const transformed = transformJob(job, details);
          transformedJobs.push(transformed);
          console.log(`✅ Processed: ${transformed.title}`);
        } else {
          console.log(`⏭️  Skipped: ${job.jobRole} (not marked public)`);
        }
        
        // Rate limiting - be nice to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing job ${job.id}: ${error.message}`);
        // Continue with other jobs
      }
    }

    // Write to output file
    const outputData = {
      jobs: transformedJobs,
      lastUpdated: new Date().toISOString(),
      count: transformedJobs.length
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log(`📝 Wrote ${transformedJobs.length} jobs to ${OUTPUT_FILE}`);
    
    // Write summary for debugging
    const summary = {
      totalFetched: jobs.length,
      published: transformedJobs.length,
      lastUpdated: new Date().toISOString(),
      jobs: transformedJobs.map(job => ({
        id: job.id,
        title: job.title,
        location: job.location?.name,
        workMode: job.workMode
      }))
    };
    
    await fs.writeFile('./sync-log.json', JSON.stringify(summary, null, 2));
    console.log('✅ Sync completed successfully');
    
    return transformedJobs.length;
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncJobs()
    .then(count => {
      console.log(`🎉 Sync completed: ${count} jobs published`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Sync failed:', error);
      process.exit(1);
    });
}

export { syncJobs };
