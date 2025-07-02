import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ServerSchema } from '../schemas/server-entry.js';

const SERVERS_DIR = 'servers';

async function validate() {
  console.log('🔍 Validating MCP Registry servers...');

  try {
    const serverFiles = await fs.readdir(SERVERS_DIR);
    let validCount = 0;
    let errorCount = 0;
    const ids = {};
    const names = {};
    let duplicateFound = false;

    for (const file of serverFiles) {
      if (!file.endsWith('.yaml') && !file.endsWith('.yml')) {
        continue;
      }

      // console.log(`📝 Validating ${file}...`);
      const filePath = path.join(SERVERS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');

      try {
        const data = yaml.load(content);

        // Validate against schema
        const validatedServer = ServerSchema.parse(data);

        // Duplicate id check
        if (ids[validatedServer.id]) {
          console.error(`❌ Duplicate server id '${validatedServer.id}' found in: ${file} and ${ids[validatedServer.id]}`);
          duplicateFound = true;
        } else {
          ids[validatedServer.id] = file;
        }
        // Duplicate name check
        if (names[validatedServer.name]) {
          console.error(`❌ Duplicate server name '${validatedServer.name}' found in: ${file} and ${names[validatedServer.name]}`);
          duplicateFound = true;
        } else {
          names[validatedServer.name] = file;
        }



        validCount++;
        // console.log(`✅ ${validatedServer.name} is valid`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Validation failed for ${file}:`);
        if (error.errors) {
          error.errors.forEach(err => {
            console.error(`   - ${err.path.join('.')}: ${err.message}`);
          });
        } else {
          console.error(`   - ${error.message}`);
        }
      }
    }

    if (duplicateFound) {
      console.error('💥 Duplicate server ids or names found. Please fix before proceeding.');
      process.exit(1);
    }

    if (errorCount > 0) {
      console.log(`❌ Invalid servers: ${errorCount}`);
      console.log('\n💡 Please fix the validation errors before building the registry.');
      process.exit(1);
    } else {
      console.log('\n🎉 All servers are valid!');
    }
  } catch (error) {
    console.error('💥 Validation failed:', error.message);
    process.exit(1);
  }
}

validate();

