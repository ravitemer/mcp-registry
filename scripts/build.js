import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ServerSchema } from '../schemas/server-entry.js';
import { getCurrentTimestamp } from './utils.js';

const REGISTRY_VERSION = '1.0.0';
const SERVERS_DIR = 'servers';
const ENRICHMENT_FILE = 'public/enrichment.json';
const DIST_DIR = 'dist';
const OUTPUT_FILE = path.join(DIST_DIR, 'registry.json');

async function loadEnrichmentData() {
  try {
    const content = await fs.readFile(ENRICHMENT_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('⚠️  No enrichment data found, using defaults');
    return { servers: {} };
  }
}

async function build() {
  console.log('🚀 Starting MCP Registry build...');

  try {
    // Ensure dist directory exists
    await fs.mkdir(DIST_DIR, { recursive: true });

    // Load enrichment data
    const enrichmentData = await loadEnrichmentData();

    // Read all server files
    const serverFiles = await fs.readdir(SERVERS_DIR);
    const servers = [];

    for (const file of serverFiles) {
      if (!file.endsWith('.yaml') && !file.endsWith('.yml')) {
        console.log(`⏭️  Skipping non-YAML file: ${file}`);
        continue;
      }

      console.log(`📝 Processing ${file}...`);
      const filePath = path.join(SERVERS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');

      try {
        const data = yaml.load(content);

        // Validate the data against our schema
        const validatedServer = ServerSchema.parse(data);

        // Merge with enrichment data
        const enrichedServer = {
          ...validatedServer,
          ...(enrichmentData.servers[validatedServer.id] || {})
        };

        servers.push(enrichedServer);
        console.log(`✅ Successfully processed ${validatedServer.name}`);

      } catch (error) {
        console.error(`❌ Validation failed for ${file}:`);
        if (error.errors) {
          error.errors.forEach(err => {
            console.error(`   - ${err.path.join('.')}: ${err.message}`);
          });
        } else {
          console.error(`   - ${error.message}`);
        }
        throw new Error(`Invalid data in ${file}`);
      }
    }

    // Create the registry catalog
    const registry = {
      version: REGISTRY_VERSION,
      generatedAt: getCurrentTimestamp(),
      totalServers: servers.length,
      servers: servers.sort((a, b) => a.name.localeCompare(b.name))
    };

    // Write the output file
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(registry, null, 2));

    console.log(`🎉 Build successful!`);
    console.log(`📊 Registry written to ${OUTPUT_FILE}`);
    console.log(`📈 Total servers: ${servers.length}`);
    console.log(`🏷️  Categories: ${[...new Set(servers.map(s => s.category))].join(', ')}`);

  } catch (error) {
    console.error('💥 Build failed:', error.message);
    process.exit(1);
  }
}

build();

