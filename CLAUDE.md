# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CrawlerView** is an AI crawler accessibility testing tool that validates how AI crawlers (GPTBot, ClaudeBot, Googlebot, BingBot) see websites. It provides both a CLI tool and web interface for SEO validation and AI accessibility testing.

**Type**: Pure Node.js tool (zero dependencies)
**Node Version**: >=14.0.0

## Available Interfaces

### 1. Command Line Interface (CLI)
Primary tool for testing websites from the terminal.

**File**: `cli.js`

```bash
# Test a URL
node cli.js https://example.com

# Get detailed explanations and fix recommendations
node cli.js --explain https://example.com

# Or use globally after npm link
npm link
crawlerview https://example.com
```

### 2. Web Server Interface
HTTP server with API endpoint and web UI.

**File**: `server.js`

```bash
# Start web server (default port 3000)
npm start
# or
npm run dev

# Use custom port
PORT=8080 npm start

# Access at http://localhost:3000
```

**API Endpoint**: `POST /api/test`
- Request body: `{ "url": "https://example.com" }`
- Returns full test results as JSON

### 3. Programmatic API
Node.js module for integration into other tools.

**File**: `index.js`

```javascript
const { testURL, testRobotsTxt, fetchURL, analyzeHTML } = require('./index.js');

// Test a URL programmatically
const results = await testURL('https://example.com');
```

## Key Commands

```bash
# Testing
npm test                    # Test with example.com

# Local Development
npm run local              # Create global symlink (npm link)
npm start                  # Start web server
npm run dev                # Start web server (alias)

# CLI Usage
node cli.js <url>          # Basic test
node cli.js --explain <url> # Detailed explanations
node cli.js --help         # Show help
```

## Architecture Overview

### Core Components

1. **HTTP Client Layer** (`index.js` & `cli.js`)
   - Custom HTTP/HTTPS client using Node.js built-in modules
   - Handles gzip, deflate, and brotli compression
   - Follows redirects (301, 302, 307, 308) up to 5 hops
   - 10-second timeout per request
   - Supports both HTTP and HTTPS protocols

2. **HTML Analysis Engine** (`index.js:analyzeHTML`)
   - Regex-based HTML parsing (no external dependencies)
   - Validates content length (minimum 200 chars)
   - Checks for noscript fallbacks
   - Detects structured data (JSON-LD schemas)
   - Validates meta tags (title, description)
   - Detects H1 headings
   - Identifies loading states (client-side rendering indicators)
   - Scoring algorithm: 100 points baseline, deductions for issues

3. **Crawler Simulation** (`AI_CRAWLERS` constant)
   Tests with 4 different user agents:
   - **GPTBot**: OpenAI/ChatGPT crawler
   - **ClaudeBot**: Anthropic/Claude crawler
   - **GoogleBot**: Google Search crawler
   - **BingBot**: Microsoft Bing crawler

4. **Scoring System**
   ```
   Base: 100 points
   - Missing content (< 200 chars): -30
   - No noscript: -10
   - No structured data: -15
   - Missing meta tags: -20
   - No H1: -10
   - Loading state detected: -15
   ```

   **Score Ranges**:
   - 80-100: Excellent (AI crawlers can fully understand)
   - 60-79: Good (minor improvements recommended)
   - 40-59: Fair (several issues need attention)
   - 0-39: Poor (major accessibility problems)

5. **Explanations System** (`explanations.js`)
   - Detailed issue explanations
   - Fix recommendations with code examples
   - Official documentation links
   - Common patterns for CSR, missing metadata, robots.txt blocking

### Data Flow

```
User Input (URL)
    ↓
testURL() in index.js
    ↓
├─→ testRobotsTxt() ──→ Fetch /robots.txt
│                       Check for bot blocks
│
├─→ For each AI crawler:
│   ├─→ fetchURL() ──→ HTTP/HTTPS request with crawler user agent
│   │                  Handle redirects & compression
│   │
│   └─→ analyzeHTML() ──→ Parse HTML with regex
│                         Calculate score
│                         Identify issues
│
└─→ Aggregate Results
    └─→ Return average score + per-crawler details
```

## Important Implementation Details

### Zero Dependencies Philosophy
- **No npm dependencies** - all functionality uses Node.js built-ins
- `https`, `http`, `zlib` for networking and compression
- Regex-based HTML parsing (no cheerio/jsdom)
- Pure JavaScript scoring and analysis

### Compression Handling
The tool handles 3 compression types:
- **gzip**: `zlib.createGunzip()`
- **deflate**: `zlib.createInflate()`
- **brotli**: `zlib.createBrotliDecompress()`

### Redirect Following
- Automatically follows 301, 302, 307, 308 redirects
- Maximum 5 redirects to prevent loops
- Tracks redirect chain for display
- Resolves relative redirect URLs to absolute

### HTML Analysis Patterns
Uses regex patterns to detect:
- `/<body[^>]*>([\s\S]*?)<\/body>/i` - Body content
- `/<script type="application\/ld\+json"[^>]*>/gi` - Structured data
- `/<title[^>]*>/` - Title tag
- `/<meta\s+name="description"/i` - Meta description
- `/<h1[^>]*>/` - H1 heading
- `/Loading\.\.\./i`, `/spinner/i`, `/aria-busy="true"/i` - Loading states

### Web Server Architecture
- Simple HTTP server using `http.createServer()`
- Serves static files from `public/` directory
- Single API endpoint: `POST /api/test`
- CORS enabled for all origins
- Directory traversal protection
- Graceful shutdown on SIGTERM/SIGINT

## Testing Strategy

When testing URLs, the tool:
1. First tests robots.txt accessibility
2. Then tests the URL with all 4 AI crawler user agents in sequence
3. Analyzes HTML from each crawler's perspective
4. Aggregates results and calculates average score
5. Provides recommendations based on detected issues

## Common Development Scenarios

### Adding a New Crawler
1. Add user agent string to `AI_CRAWLERS` in `index.js` and `cli.js`
2. No other changes needed - system automatically tests all crawlers

### Modifying Scoring Algorithm
Edit the scoring section in `index.js:analyzeHTML()`:
```javascript
let score = 100;
if (!results.hasContent) score -= 30;
// Add more deductions here
```

### Adding New HTML Checks
1. Add detection logic in `analyzeHTML()`
2. Add to issues array if detected
3. Adjust scoring as needed
4. Add explanation in `explanations.js` if using `--explain` flag

## File Locations

| File | Purpose |
|------|---------|
| `index.js` | Core API - testURL, analyzeHTML, fetchURL |
| `cli.js` | CLI interface with colored terminal output |
| `server.js` | HTTP server + API endpoint |
| `explanations.js` | Detailed issue explanations for --explain flag |
| `public/index.html` | Web UI frontend |
| `public/display-functions.js` | Client-side result rendering |
| `public/explanations-data.js` | Client-side explanations data |

## Related Projects

This is part of a larger ecosystem documented in parent CLAUDE.md. The tool is designed for:
- SEO validation
- AI crawler accessibility testing
- Pre-launch page validation
- Competitor analysis
- Agency audits

## Security Notes

- Server blocks directory traversal attacks
- URL validation before testing
- 10-second timeout prevents hanging requests
- No execution of fetched content
- CORS enabled for web interface
