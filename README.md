# MCP Registry

> [!CAUTION]
⚠️ **Work in Progress**: This registry is currently in active development and testing phase. The API and data structure may change. Not recommended for production use yet.

**Live Registry**: https://ravitemer.github.io/mcp-registry/registry.json

A community-maintained registry of Model Context Protocol (MCP) servers with structured installation configurations for easy integration.

## Welcome

Welcome to the MCP Registry! 🚀

The Model Context Protocol (MCP) ecosystem is growing rapidly, but finding and configuring servers can be challenging. This registry solves that problem by providing a centralized, community-maintained collection of MCP servers with structured installation configurations.

**What makes this registry special?**

- 📦 **One-Click Installation**: Each server comes with ready-to-use configurations for popular tools (NPX, Docker, Python, etc.)
- 🔧 **Parameter System**: Smart placeholder system using `${VARIABLE}` syntax for easy customization
- 🚦 **Transport Information**: Clear indication of supported protocols (stdio, SSE, streamable-http)
- ✅ **Quality Assurance**: Comprehensive validation and testing ensure all definitions work correctly
- 🤝 **Community-Driven**: Easy contribution process via GitHub pull requests
- 🎯 **Integration-Ready**: Designed for seamless integration with MCP clients and hubs

Whether you're building an MCP client, managing a server hub, or just want to discover new servers, this registry provides the structured data you need!

## Registry Structure and Features

### Overview

- Every MCP server in the registry is defined in a single YAML file
- Each server can have multiple installation methods (NPX, Docker, Python, etc.)
- Installation configurations are ready-to-use JSON templates
- Parameters use `${VARIABLE}` syntax for easy replacement

### Directory Structure

```
mcp-registry/
├── servers/                     # Server definition files (YAML)
│   ├── filesystem.yaml
│   ├── github.yaml
│   └── ...
└── schemas/                     # Validation schemas
  └── server-entry.js
```

### Server Definition Format

Each server is defined in a YAML file in the `servers/` directory with the following structure:

```yaml
# Basic Information
id: server_name                    # Unique identifier (alphanumeric + underscore, min 3 chars)
name: Display Name                 # Human-readable name
description: Brief description under 200 characters
author: Author Name               # Author or organization
url: https://github.com/author/repo # Documentation or repository URL
license: MIT                      # Software license (optional)

# Classification
category: development             # Primary category
tags:                            # Searchable keywords
  - tag1
  - tag2

# Installation Methods
installations:
  - name: NPX                    # Installation method name
    description: Run using NPX   # Brief description
    config: |                    # JSON configuration template
      {
        "command": "npx",
        "args": ["-y", "package-name", "${PARAM}"]
      }
    prerequisites:               # System requirements
      - Node.js
    parameters:                  # Parameters for this installation
      - name: Parameter Name
        key: PARAM
        description: Parameter description
        placeholder: example-value
        required: true
    transports:                  # Supported transport methods for this installation
      - stdio
      - sse
      - streamable-http

# Quality Indicators
featured: false                 # Featured/recommended server
verified: false                 # Verified by maintainers
```

### Validation Schema (Zod)

```js
import { z } from 'zod';

export const ParameterSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(true),
}).strict();

export const InstallationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: z.string().min(1),
  prerequisites: z.array(z.string()).optional(),
  parameters: z.array(ParameterSchema).optional(),
  transports: z.array(z.enum(['stdio', 'sse', 'streamable-http'])).optional(),
}).strict();

export const ServerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).max(200),
  author: z.string(),
  url: z.string().url(),
  license: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()),
  installations: z.array(InstallationSchema).min(1),
  featured: z.boolean().default(false),
  verified: z.boolean().default(false),
}).strict();
```

### Installation Methods

Each server can provide multiple installation methods to accommodate different environments:

- **NPX**: Node.js package execution
- **Docker**: Container-based execution  
- **Python/UVX**: Python-based servers
- **Remote**: Direct HTTP connections
- **Custom**: Any other installation method

### Parameter System

The registry uses a `${VARIABLE}` placeholder system for configuration templates:

- Parameters should be declared for each installation method if present
- Each parameter includes name, description, placeholder, and required flag
- Consumers replace placeholders with actual values during installation

## Contributing Process

Contributing a new MCP server is easy! Follow these steps:

### 1. Fork the Repository

1. Visit the MCP Registry repository: [https://github.com/ravitemer/mcp-registry](https://github.com/ravitemer/mcp-registry)
2. Click the "Fork" button in the top-right corner
3. This creates your own copy where you can make changes

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/mcp-registry.git
cd mcp-registry
npm install
```

### 3. Create Your Server Definition

1. Create a new YAML file in the `servers/` directory
2. Use a descriptive filename (e.g., `my-awesome-server.yaml`)
3. Follow the server definition format described above
4. Include all required fields and at least one installation method

### 4. Test Your Server

Before submitting, validate your server definition:

```bash
# Validate your server definition
npm run validate

# Run all tests
npm test
```

Fix any validation errors before proceeding.

### 5. Commit and Push Your Changes

```bash
git add servers/my-server.yaml
git commit -m "Add My Awesome Server to registry"
git push origin main
```

### 6. Create a Pull Request

1. Go to the original repository: [https://github.com/ravitemer/mcp-registry](https://github.com/ravitemer/mcp-registry)
2. Click "Pull Requests" then "New Pull Request"
3. Click "Compare across forks"
4. Select your fork as the head repository
5. Provide a clear title and description
6. Submit the pull request

### 7. Review Process

After submitting:

1. Automated tests will run to validate your server definition
2. Maintainers will review your submission
3. They may request changes or improvements
4. Once approved, your server will be merged and automatically deployed
5. Your server will be available at: `https://ravitemer.github.io/mcp-registry/registry.json`

#### Automated Validation on Pull Requests

Every pull request to this repository triggers a comprehensive validation workflow.  
**Your submission will only be accepted if it passes all of the following checks:**

- **Schema Validation:**  
  Every server YAML file must match the [strict Zod schema](#validation-schema-zod).  
  - No extra fields are allowed.
  - All required fields must be present.

- **Unique IDs and Names:**  
  All servers must have a unique `id` and `name`.  
  Duplicate IDs or names across files will cause validation to fail.

- **Valid JSON in Config:**  
  Each installation’s `config` field must be a valid JSON string.

- **Parameter Placeholder Consistency:**  
  Every `${VARIABLE}` placeholder in an installation’s `config` must have a corresponding parameter declared in that installation’s `parameters` array.

If any of these checks fail, your PR will be marked as failing and you will see detailed error messages in the PR logs.


## Best Practices

- **Clear Descriptions**: Write concise, informative descriptions under 200 characters
- **Comprehensive Tags**: Use relevant tags to make your server discoverable
- **Multiple Installation Methods**: Provide options for different environments when possible
- **Accurate Prerequisites**: List all system requirements clearly
- **Parameter Documentation**: Include helpful descriptions and example values
- **Testing**: Thoroughly test your server definition before submitting
- **Quality URLs**: Ensure repository URLs are accurate

Ready to contribute? Start by forking the repository and adding your MCP server! 🚀
