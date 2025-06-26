import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ServerSchema } from '../schemas/server-entry.js';
import { getCurrentTimestamp } from './utils.js';

const SERVERS_DIR = 'servers';
const ENRICHMENT_FILE = 'public/enrichment.json';

// Configuration for GitHub API
const GITHUB_API_CONFIG = {
  BATCH_SIZE: 50,           // Process 50 servers per batch
  BATCH_DELAY: 2000,        // 2 seconds between batches
  REQUEST_DELAY: 100,       // 100ms between individual requests in batch
  MAX_RETRIES: 3,           // Retry failed requests up to 3 times
  RATE_LIMIT_BUFFER: 100    // Keep 100 requests as buffer
};

async function getGitHubToken() {
  // Try to get token from environment or GitHub Actions
  return process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || null;
}

async function checkRateLimit(token) {
  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: token ? {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'mcp-registry-enricher'
      } : {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'mcp-registry-enricher'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const remaining = data.rate.remaining;
      const limit = data.rate.limit;
      const resetTime = new Date(data.rate.reset * 1000);

      console.log(`📊 GitHub API Rate Limit: ${remaining}/${limit} remaining (resets at ${resetTime.toLocaleTimeString()})`);
      return { remaining, limit, resetTime };
    }
  } catch (error) {
    console.warn('⚠️  Could not check rate limit:', error.message);
  }

  // Default fallback for unauthenticated requests
  return { remaining: 60, limit: 60, resetTime: new Date() };
}

async function fetchGitHubData(url, token, retryCount = 0) {
  try {
    // Extract GitHub repo from URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return { success: false, data: {} };

    const [, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'mcp-registry-enricher'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, { headers });

    if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
      const resetTime = new Date(parseInt(response.headers.get('x-ratelimit-reset')) * 1000);
      throw new Error(`Rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`);
    }

    if (response.status === 404) {
      return { success: false, data: {}, reason: 'Repository not found or private' };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        stars: data.stargazers_count,
        lastCommit: Math.floor(new Date(data.pushed_at).getTime() / 1000)
      }
    };
  } catch (error) {
    if (retryCount < GITHUB_API_CONFIG.MAX_RETRIES) {
      console.warn(`⚠️  Retrying ${owner}/${repo} (attempt ${retryCount + 1}/${GITHUB_API_CONFIG.MAX_RETRIES}): ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
      return fetchGitHubData(url, token, retryCount + 1);
    }

    return { success: false, data: {}, reason: error.message };
  }
}

async function processBatch(servers, token, batchIndex) {
  console.log(`🔄 Processing batch ${batchIndex + 1} (${servers.length} servers)...`);

  const promises = servers.map(async ({ data }, index) => {
    // Stagger requests within the batch
    await new Promise(resolve => setTimeout(resolve, index * GITHUB_API_CONFIG.REQUEST_DELAY));

    const result = await fetchGitHubData(data.url, token);
    return { data, result };
  });

  const results = await Promise.allSettled(promises);

  let successCount = 0;
  let failureCount = 0;
  const enrichmentUpdates = {};

  for (const promiseResult of results) {
    if (promiseResult.status === 'fulfilled') {
      const { data, result } = promiseResult.value;

      if (result.success) {
        enrichmentUpdates[data.id] = {
          ...result.data,
          updatedAt: getCurrentTimestamp()
        };
        successCount++;
        console.log(`  ✅ ${data.name} (${result.data.stars || 0} stars)`);
      } else {
        failureCount++;
        console.log(`  ⏭️  ${data.name}: ${result.reason || 'No GitHub data'}`);
      }
    } else {
      failureCount++;
      console.log(`  ❌ Failed: ${promiseResult.reason.message}`);
    }
  }

  console.log(`  📊 Batch ${batchIndex + 1} complete: ${successCount} success, ${failureCount} failed/skipped`);
  return enrichmentUpdates;
}

async function loadEnrichmentData() {
  try {
    const content = await fs.readFile(ENRICHMENT_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('Creating new enrichment data file...');
    return {
      version: '1.0.0',
      lastUpdated: getCurrentTimestamp(),
      servers: {}
    };
  }
}

async function saveEnrichmentData(data) {
  await fs.mkdir(path.dirname(ENRICHMENT_FILE), { recursive: true });
  await fs.writeFile(ENRICHMENT_FILE, JSON.stringify(data, null, 2));
}

async function enrichServers() {
  console.log('🔍 Starting server enrichment...');

  // Get GitHub token for authenticated requests
  const token = await getGitHubToken();
  if (token) {
    console.log('🔑 Using authenticated GitHub API requests');
  } else {
    console.log('⚠️  No GitHub token found, using unauthenticated requests (limited to 60/hour)');
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(token);

  // Load existing enrichment data
  const enrichmentData = await loadEnrichmentData();

  const serverFiles = await fs.readdir(SERVERS_DIR);
  const validServers = [];

  // Validate all server files
  for (const file of serverFiles) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;

    const filePath = path.join(SERVERS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content);

    try {
      ServerSchema.parse(data);
      validServers.push({ file, data });
    } catch (error) {
      console.error(`❌ Invalid server definition in ${file}:`, error.message);
    }
  }

  console.log(`📝 Found ${validServers.length} valid servers to process`);

  // Check if we have enough rate limit
  const requiredRequests = validServers.length;
  const bufferNeeded = Math.min(GITHUB_API_CONFIG.RATE_LIMIT_BUFFER, requiredRequests);

  if (rateLimit.remaining < requiredRequests + bufferNeeded) {
    console.warn(`⚠️  Insufficient rate limit: need ${requiredRequests} (+${bufferNeeded} buffer), have ${rateLimit.remaining}`);
    console.warn(`⏰ Rate limit resets at ${rateLimit.resetTime.toLocaleTimeString()}`);

    if (!token) {
      console.error('💡 Consider setting GITHUB_TOKEN environment variable for higher rate limits');
    }
  } else {
    console.log(`✅ Rate limit sufficient: need ${requiredRequests}, have ${rateLimit.remaining}`);
  }// Split servers into batches
  const batches = [];
  for (let i = 0; i < validServers.length; i += GITHUB_API_CONFIG.BATCH_SIZE) {
    batches.push(validServers.slice(i, i + GITHUB_API_CONFIG.BATCH_SIZE));
  }

  console.log(`🔄 Processing ${batches.length} batches of up to ${GITHUB_API_CONFIG.BATCH_SIZE} servers each`);

  let totalSuccess = 0;
  let totalFailed = 0;

  // Process batches sequentially with delays
  for (let i = 0; i < batches.length; i++) {
    const batchUpdates = await processBatch(batches[i], token, i);

    // Merge batch updates into main enrichment data
    Object.assign(enrichmentData.servers, batchUpdates);

    totalSuccess += Object.keys(batchUpdates).length;
    totalFailed += batches[i].length - Object.keys(batchUpdates).length;

    // Wait between batches (except for the last one)
    if (i < batches.length - 1) {
      console.log(`⏳ Waiting ${GITHUB_API_CONFIG.BATCH_DELAY}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, GITHUB_API_CONFIG.BATCH_DELAY));
    }
  }

  // Update metadata
  enrichmentData.lastUpdated = getCurrentTimestamp();

  // Save enrichment data
  await saveEnrichmentData(enrichmentData);

  console.log(`🎉 Enrichment complete!`);
  console.log(`✅ Successfully enriched: ${totalSuccess} servers`);
  console.log(`⏭️  Failed/Skipped: ${totalFailed} servers`);
  console.log(`📊 Total processed: ${validServers.length} servers in ${batches.length} batches`);
  console.log(`📁 Enrichment data saved to ${ENRICHMENT_FILE}`);
}

enrichServers().catch(error => {
  console.error('💥 Enrichment failed:', error);
  process.exit(1);
});

