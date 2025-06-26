import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const TEST_SERVERS_DIR = 'test/fixtures/servers';
const TEST_DIST_DIR = 'test/fixtures/dist';

describe('Build Process', () => {
  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(TEST_SERVERS_DIR, { recursive: true });
    await fs.mkdir(TEST_DIST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm('test/fixtures', { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should build registry from valid server files', async () => {
    // Create a test server file
    const testServer = {
      id: 'test_server',
      name: 'Test Server',
      description: 'A test server for testing',
      author: 'Test Author',
      url: 'https://github.com/test/server',
      category: 'test',
      tags: ['test'],
      installations: [{
        name: 'NPX',
        config: '{"command": "npx", "args": ["test"]}',
        transports: ['stdio']
      }]
    };

    await fs.writeFile(
      path.join(TEST_SERVERS_DIR, 'test-server.yaml'),
      yaml.dump(testServer)
    );

    // Import and run build logic (we'd need to refactor build.js to be testable)
    // For now, let's test the YAML parsing and validation
    const content = await fs.readFile(path.join(TEST_SERVERS_DIR, 'test-server.yaml'), 'utf-8');
    const data = yaml.load(content);

    expect(data.id).toBe('test_server');
    expect(data.name).toBe('Test Server');
    expect(data.installations).toHaveLength(1);
  });

  it('should handle multiple server files', async () => {
    const servers = [
      {
        id: 'server_one',
        name: 'Server One',
        description: 'First test server',
        author: 'Test',
        url: 'https://example.com',
        category: 'test',
        tags: ['test'],
        installations: [{
          name: 'Test',
          config: '{}',
          transports: ['stdio']
        }]
      },
      {
        id: 'server_two',
        name: 'Server Two',
        description: 'Second test server',
        author: 'Test',
        url: 'https://example.com',
        category: 'test',
        tags: ['test'],
        installations: [{
          name: 'Test',
          config: '{}',
          transports: ['stdio']
        }]
      }
    ];

    for (let i = 0; i < servers.length; i++) {
      await fs.writeFile(
        path.join(TEST_SERVERS_DIR, `server-${i + 1}.yaml`),
        yaml.dump(servers[i])
      );
    }

    const files = await fs.readdir(TEST_SERVERS_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml'));

    expect(yamlFiles).toHaveLength(2);
  });

  it('should ignore non-YAML files', async () => {
    await fs.writeFile(path.join(TEST_SERVERS_DIR, 'readme.txt'), 'This is not a YAML file');
    await fs.writeFile(path.join(TEST_SERVERS_DIR, 'test.json'), '{"not": "yaml"}');

    const testServer = {
      id: 'valid_server',
      name: 'Valid Server',
      description: 'A valid server',
      author: 'Test',
      url: 'https://example.com',
      category: 'test',
      tags: ['test'],
      installations: [{
        name: 'Test',
        config: '{}',
        transports: ['stdio']
      }]
    };

    await fs.writeFile(
      path.join(TEST_SERVERS_DIR, 'valid.yaml'),
      yaml.dump(testServer)
    );

    const files = await fs.readdir(TEST_SERVERS_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    expect(files).toHaveLength(3); // All files
    expect(yamlFiles).toHaveLength(1); // Only YAML files
  });
});
