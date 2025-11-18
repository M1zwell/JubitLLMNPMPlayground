# Claude Code MCP Server Configuration

This document contains all MCP (Model Context Protocol) server configurations for easy re-setup.

## Current MCP Servers

| Server | Status | Description |
|--------|--------|-------------|
| filesystem | ✓ Connected | Local filesystem access |
| github | ✓ Connected | GitHub API integration |
| puppeteer | ✓ Connected | Browser automation |
| postgres | ✗ Failed | PostgreSQL database access |
| docker | ✗ Failed | Docker container management |
| chrome | ✓ Connected | Chrome DevTools integration |
| firecrawl | ✓ Connected | Web scraping and crawling |

## Setup Commands

### 1. Filesystem Server
**Purpose**: Access and manipulate local files

```bash
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem C:\Users\user\JubitLLMNPMPlayground
```

### 2. GitHub Server
**Purpose**: GitHub API operations (repos, issues, PRs, etc.)

```bash
claude mcp add github npx -y @modelcontextprotocol/server-github
```

**Environment Variables Required**:
- `GITHUB_PERSONAL_ACCESS_TOKEN`: Your GitHub PAT with appropriate scopes

### 3. Puppeteer Server
**Purpose**: Browser automation and web scraping

```bash
claude mcp add puppeteer npx -y @modelcontextprotocol/server-puppeteer
```

### 4. PostgreSQL Server
**Purpose**: PostgreSQL database operations
**Status**: ⚠️ Currently failing to connect - check DATABASE_URL

```bash
claude mcp add postgres npx -y @modelcontextprotocol/server-postgres
```

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://postgres:password@localhost:5432/mydatabase`

**Troubleshooting**:
- Ensure PostgreSQL is running
- Verify connection string is correct
- Check firewall/network access
- For Supabase: Use the connection pooler URL with `?pgbouncer=true`

### 5. Docker Server
**Purpose**: Docker container and image management
**Status**: ⚠️ Currently failing to connect - check Docker installation

```bash
claude mcp add docker npx -y @modelcontextprotocol/server-docker
```

**Troubleshooting**:
- Ensure Docker Desktop is running
- Verify Docker daemon is accessible
- Check Docker socket permissions
- On Windows: Ensure WSL2 backend is configured if using WSL

### 6. Chrome DevTools Server
**Purpose**: Chrome browser control and debugging

```bash
claude mcp add chrome npx -y chrome-devtools-mcp
```

### 7. Firecrawl Server
**Purpose**: Advanced web scraping, crawling, and content extraction

```bash
claude mcp add firecrawl npx -y firecrawl-mcp
```

**Environment Variables Required**:
- `FIRECRAWL_API_KEY`: Your Firecrawl API key (get from https://firecrawl.dev)

## Quick Re-setup

To re-add all working servers at once:

```bash
# Working servers
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem C:\Users\user\JubitLLMNPMPlayground
claude mcp add github npx -y @modelcontextprotocol/server-github
claude mcp add puppeteer npx -y @modelcontextprotocol/server-puppeteer
claude mcp add chrome npx -y chrome-devtools-mcp
claude mcp add firecrawl npx -y firecrawl-mcp

# Optional: Add when issues are resolved
# claude mcp add postgres npx -y @modelcontextprotocol/server-postgres
# claude mcp add docker npx -y @modelcontextprotocol/server-docker
```

## Environment Variables Setup

Create or update your `.env` file with required API keys:

```bash
# GitHub Integration
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here

# Firecrawl Integration
FIRECRAWL_API_KEY=fc-your_api_key_here

# PostgreSQL (if using)
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase (if connecting via postgres MCP)
# Use connection pooler for better performance
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
```

## Management Commands

```bash
# List all MCP servers
claude mcp list

# Remove a server
claude mcp remove <server-name>

# Example: Remove postgres
claude mcp remove postgres
```

## Notes

### Working Servers (5/7)
- **filesystem**: Fully functional, scoped to project directory
- **github**: Fully functional with API token
- **puppeteer**: Fully functional for browser automation
- **chrome**: Fully functional for DevTools integration
- **firecrawl**: Fully functional for web scraping

### Failed Servers (2/7)
- **postgres**: Connection failed - likely missing or incorrect DATABASE_URL
- **docker**: Connection failed - Docker daemon may not be running or accessible

### Recommended Actions

1. **For Postgres**:
   - If using Supabase, add DATABASE_URL to environment variables
   - Use connection string from Supabase project settings > Database > Connection string
   - Consider using connection pooler URL for better performance

2. **For Docker**:
   - Start Docker Desktop if installed
   - If not needed, consider removing with: `claude mcp remove docker`
   - On WSL: Ensure Docker Desktop WSL2 integration is enabled

### Security Notes

- Never commit `.env` files containing API keys
- Use environment-specific `.env.local` files for local development
- Rotate API tokens regularly
- Limit GitHub PAT scopes to minimum required permissions

## Additional MCP Servers (Optional)

Consider adding these servers for enhanced functionality:

```bash
# Brave Search
claude mcp add brave-search npx -y @modelcontextprotocol/server-brave-search

# Memory (persistent memory across sessions)
claude mcp add memory npx -y @modelcontextprotocol/server-memory

# Slack integration
claude mcp add slack npx -y @modelcontextprotocol/server-slack

# Google Drive
claude mcp add gdrive npx -y @modelcontextprotocol/server-gdrive

# AWS
claude mcp add aws npx -y @modelcontextprotocol/server-aws
```

## Last Updated
Generated: 2025-11-13

---

**Repository**: JubitLLMNPMPlayground
**Working Directory**: C:\Users\user\JubitLLMNPMPlayground
**Platform**: Windows (win32)
