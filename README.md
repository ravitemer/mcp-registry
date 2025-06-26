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
- Transport capabilities are clearly specified for each server

### Directory Structure

```
mcp-registry/
├── servers/                     # Server definition files (YAML)
│   ├── filesystem.yaml
│   ├── github.yaml
│   └── ...
├── schemas/                     # Validation schemas
│   └── server-entry.js
├── scripts/                     # Build and validation tools
│   ├── build.js
│   ├── validate.js
│   └── utils.js
└── test/                        # Test suite
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

# Transport Capabilities
transports:                      # Supported transport methods
  - stdio
  - sse
  - streamable-http

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
  
# Parameters (used across all installation methods)
parameters:
  - name: Parameter Name         # Human-readable name
    key: PARAM                  # Variable key for ${PARAM}
    description: Parameter description
    placeholder: example-value   # Example value
    required: true              # Whether parameter is required

# Quality Indicators
featured: false                 # Featured/recommended server
verified: false                 # Verified by maintainers
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

- Parameters can be global (used across all installation methods) or method-specific
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


#### Example Server Definitions

##### Server with Multiple Installations

```yaml
id: filesystem
name: File System
description: Provides comprehensive filesystem operations
author: modelcontextprotocol
url: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
license: MIT
category: development
tags:
  - filesystem
  - file-management
transports:
  - stdio
installations:
  - name: NPX
    description: Run using NPX
    config: |
      {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "${ALLOWED_DIRECTORY}"]
      }
    prerequisites:
      - Node.js
  - name: Docker
    description: Run using Docker
    config: |
      {
        "command": "docker",
        "args": ["run", "-i", "--rm", "--mount", "type=bind,src=${ALLOWED_DIRECTORY},dst=/projects", "mcp/filesystem", "/projects"]
      }
    prerequisites:
      - Docker
parameters:
  - name: Allowed Directory
    key: ALLOWED_DIRECTORY
    description: The directory path that the filesystem server can access
    placeholder: /Users/username/Documents
featured: true
verified: true
```

##### Remote Server with Authentication

```yaml
id: remote_api_server
name: Remote API Server
description: Connects to a remote API service
author: API Company
url: https://api-company.com/mcp-server
category: api
tags:
  - api
  - remote
transports:
  - sse
  - streamable-http
installations:
  - name: Remote Connection
    description: Direct connection to hosted service
    config: |
      {
        "url": "https://api.service.com/mcp",
        "headers": {
          "Authorization": "Bearer ${API_TOKEN}"
        }
      }
parameters:
  - name: API Token
    key: API_TOKEN
    description: Your API authentication token
    placeholder: your_api_token_here
    required: true
featured: false
verified: true
```


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


## Best Practices

- **Clear Descriptions**: Write concise, informative descriptions under 200 characters
- **Comprehensive Tags**: Use relevant tags to make your server discoverable
- **Multiple Installation Methods**: Provide options for different environments when possible
- **Accurate Prerequisites**: List all system requirements clearly
- **Parameter Documentation**: Include helpful descriptions and example values
- **Testing**: Thoroughly test your server definition before submitting
- **Semantic Versioning**: Use semantic versioning if specifying a version
- **Quality URLs**: Ensure documentation and repository URLs are accurate

Ready to contribute? Start by forking the repository and adding your MCP server! 🚀
