import { describe, it, expect } from 'vitest';
import { ParameterSchema, InstallationSchema, ServerSchema } from '../schemas/server-entry.js';

describe('Schemas', () => {
  describe('ParameterSchema', () => {
    it('should validate a valid parameter', () => {
      const validParameter = {
        name: 'API Key',
        key: 'API_KEY',
        description: 'Your API key',
        placeholder: 'sk-1234567890',
        required: true
      };

      expect(() => ParameterSchema.parse(validParameter)).not.toThrow();
    });

    it('should set default for required field', () => {
      const parameter = {
        name: 'API Key',
        key: 'API_KEY'
      };

      const result = ParameterSchema.parse(parameter);
      expect(result.required).toBe(true);
    });

    it('should reject invalid parameters', () => {
      expect(() => ParameterSchema.parse({})).toThrow();
      expect(() => ParameterSchema.parse({ name: '' })).toThrow();
      expect(() => ParameterSchema.parse({ name: 'Test' })).toThrow(); // missing key
    });
  });

  describe('InstallationSchema', () => {
    it('should validate a valid installation', () => {
      const validInstallation = {
        name: 'NPX',
        description: 'Run using NPX',
        config: '{"command": "npx", "args": ["test"]}',
        prerequisites: ['Node.js']
      };

      expect(() => InstallationSchema.parse(validInstallation)).not.toThrow();
    });

    it('should validate minimal installation', () => {
      const installation = {
        name: 'Docker',
        config: '{"command": "docker"}'
      };

      expect(() => InstallationSchema.parse(installation)).not.toThrow();
    });
  });

  describe('ServerSchema', () => {
    it('should validate a complete server entry', () => {
      const validServer = {
        id: 'test_server',
        name: 'Test Server',
        description: 'A test server',
        author: 'Test Author',
        url: 'https://github.com/test/server',
        license: 'MIT',
        category: 'development',
        tags: ['test', 'example'],
        transports: ['stdio'],
        installations: [{
          name: 'NPX',
          config: '{"command": "npx"}'
        }],
        parameters: [{
          name: 'Test Param',
          key: 'TEST_PARAM'
        }],
        featured: false,
        verified: true,
        version: '1.0.0'
      };

      expect(() => ServerSchema.parse(validServer)).not.toThrow();
    });

    it('should set default values', () => {
      const minimalServer = {
        id: 'minimal',
        name: 'Minimal Server',
        description: 'A minimal server',
        author: 'Test',
        url: 'https://example.com',
        category: 'test',
        tags: ['test'],
        transports: ['stdio'],
        installations: [{
          name: 'Test',
          config: '{}'
        }]
      };

      const result = ServerSchema.parse(minimalServer);
      expect(result.featured).toBe(false);
      expect(result.verified).toBe(false);
    });

    it('should enforce description length limit', () => {
      const longDescription = 'a'.repeat(201);
      const server = {
        id: 'test',
        name: 'Test',
        description: longDescription,
        author: 'Test',
        url: 'https://example.com',
        category: 'test',
        tags: ['test'],
        transports: ['stdio'],
        installations: [{
          name: 'Test',
          config: '{}'
        }]
      };

      expect(() => ServerSchema.parse(server)).toThrow();
    });

    it('should require at least one installation', () => {
      const server = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        author: 'Test',
        url: 'https://example.com',
        category: 'test',
        tags: ['test'],
        transports: ['stdio'],
        installations: []
      };

      expect(() => ServerSchema.parse(server)).toThrow();
    });

    it('should reject invalid transports', () => {
      const server = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        author: 'Test',
        url: 'https://example.com',
        category: 'test',
        tags: ['test'],
        transports: ['invalid-transport'],
        installations: [{
          name: 'Test',
          config: '{}'
        }]
      };

      expect(() => ServerSchema.parse(server)).toThrow();
    });

    it('should accept valid transports', () => {
      const server = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        author: 'Test',
        url: 'https://example.com',
        category: 'test',
        tags: ['test'],
        transports: ['stdio', 'sse', 'streamable-http'],
        installations: [{
          name: 'Test',
          config: '{}'
        }]
      };

      expect(() => ServerSchema.parse(server)).not.toThrow();
    });
  });
});




