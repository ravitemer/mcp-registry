import { z } from 'zod';

/**
 * Schema for configuration parameters
 * These define the placeholders that can be used in installation configurations
 */
export const ParameterSchema = z.object({
  name: z.string().min(1).describe("Human-readable name for the parameter"),
  key: z.string().min(1).describe("The placeholder key used in configuration templates"),
  description: z.string().optional().describe("Detailed description of the parameter"),
  placeholder: z.string().optional().describe("Example value shown to the user"),
  required: z.boolean().default(true).describe("Whether this parameter is required"),
});

/**
 * Schema for different installation methods
 * Each method provides a different way to install and run the MCP server
 */
export const InstallationSchema = z.object({
  name: z.string().min(1).describe("Name of the installation method (e.g., 'Docker', 'NPX', 'Python')"),
  description: z.string().optional().describe("Brief description of this installation method"),
  config: z.string().min(1).describe("JSON string containing the mcp-hub server configuration"),
  prerequisites: z.array(z.string()).optional().describe("List of system requirements"),
  parameters: z.array(ParameterSchema).optional().describe("Method-specific parameters"),
});

/**
 * Main schema for MCP server registry entries
 */
export const ServerSchema = z.object({
  // Basic information
  id: z.string().min(1).describe("Unique identifier for the server (kebab-case)"),
  name: z.string().min(1).describe("Human-readable display name"),
  description: z.string().min(1).max(200).describe("Brief description (under 200 chars)"),

  // Author and source
  author: z.string().describe("Author or organization name"),
  url: z.string().url().describe("URL to the main documentation or repository"),
  license: z.string().optional().describe("Software license (e.g., 'MIT', 'Apache-2.0')"),

  // Classification
  category: z.string().describe("Primary category (e.g., 'productivity', 'development', 'data')"),
  tags: z.array(z.string()).describe("Searchable keywords and tags"),

  // Transport capabilities
  transports: z.array(z.enum(['stdio', 'sse', 'streamable-http'])).describe("Supported transport methods"),

  // Installation options
  installations: z.array(InstallationSchema).min(1).describe("Available installation methods"),

  // Common parameters used across all installation methods
  parameters: z.array(ParameterSchema).optional().describe("Global parameters for all methods"),

  // Quality indicators
  featured: z.boolean().default(false).describe("Whether this server is featured/recommended"),
  verified: z.boolean().default(false).describe("Whether verified by official companies/maintainers"),

  // Metadata
  version: z.string().optional().describe("Latest version number"),
});






