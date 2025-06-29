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
}).strict()

/**
 * Schema for different installation methods
 * Each method provides a different way to install and run the MCP server
 */
export const InstallationSchema = z.object({
  name: z.string().min(1).describe("Name of the installation method (e.g., 'Docker', 'NPX', 'Python')"),
  description: z.string().optional().describe("Brief description of this installation method"),
  config: z.string().min(1).refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "config must be a valid JSON string" }
  ),
  prerequisites: z.array(z.string()).optional().describe("List of system requirements"),
  parameters: z.array(ParameterSchema).optional().describe("Parameters for this installation method"),
  transports: z.array(z.enum(['stdio', 'sse', 'streamable-http'])).optional().describe("Supported transport methods for this installation"),
}).strict()

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

  // Installation options
  installations: z.array(InstallationSchema).min(1).describe("Available installation methods"),

  // Quality indicators
  featured: z.boolean().default(false).describe("Whether this server is featured/recommended"),
  verified: z.boolean().default(false).describe("Whether verified by official companies/maintainers"),
}).strict()
