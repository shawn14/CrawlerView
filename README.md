# CrawlerView

**See your website through the eyes of AI crawlers**

Test how ChatGPT, Claude, Google, and Bing see your website. Validate SEO, structured data, and AI accessibility in seconds.

## Features

- ✅ **Web Interface**: Beautiful visual dashboard with instant results
- ✅ Tests 4 major AI crawlers (GPTBot, Claude-Web, Googlebot, BingBot)
- ✅ Detailed explanations based on official OpenAI, Anthropic, Google & Bing documentation
- ✅ Actionable fix recommendations with code examples
- ✅ Automatically follows redirects (301, 302, 307, 308) like real crawlers
- ✅ Shows redirect chains and final destination URLs
- ✅ Validates meta tags, structured data, and accessibility
- ✅ Scores pages 0-100 based on SEO best practices
- ✅ Detects common issues that block AI understanding
- ✅ Works with any URL - no installation required
- ✅ Zero dependencies - pure Node.js

## Quick Start

### Web Interface (Easiest)

```bash
# Start the web server (default port 3000, or set PORT env variable)
npm start

# Open browser to http://localhost:3000
# If port 3000 is in use, specify a different port:
PORT=8080 npm start

# Enter any URL and get instant results with visual scoring
```

### Command Line

```bash
# Test any URL
node cli.js https://example.com

# Or install globally
npm link
crawlerview https://example.com

# Get detailed explanations and fix recommendations
crawlerview --explain https://example.com
```

## What It Tests

### 1. robots.txt Configuration
- Checks if AI crawlers are allowed or blocked
- Validates GPTBot, Claude-Web, and general crawler access

### 2. Content Accessibility
- Text content availability (minimum 200 chars)
- Noscript fallback content
- H1 heading presence
- Loading state detection

### 3. Meta Tags
- Title tag (critical for AI understanding)
- Meta description
- Open Graph tags
- Twitter Cards

### 4. Structured Data
- JSON-LD schemas
- Schema.org types
- Rich snippet opportunities

### 5. Per-Crawler Testing
Tests each AI crawler separately to identify crawler-specific issues:
- **GPTBot** (ChatGPT)
- **Claude-Web** (Claude)
- **Googlebot** (Google Search)
- **BingBot** (Bing Search)

## Understanding the Score

- **80-100**: Excellent - AI crawlers can fully understand your content
- **60-79**: Good - Minor improvements recommended
- **40-59**: Fair - Several issues need attention
- **0-39**: Poor - Major accessibility problems

## Detailed Explanations Mode

Use the `--explain` flag to get comprehensive fix recommendations:

```bash
crawlerview --explain https://yoursite.com
```

This mode provides:
- **Crawler Information**: Details about each AI crawler (GPTBot, ClaudeBot, Googlebot, BingBot)
- **Issue Explanations**: Why each issue matters for AI understanding
- **Fix Recommendations**: Step-by-step solutions with code examples
- **Common Patterns**: Solutions for client-side rendering, missing metadata, and more
- **Official Documentation**: Links to OpenAI, Anthropic, Google, and Bing resources

All explanations are based on official documentation from:
- OpenAI (GPTBot)
- Anthropic (ClaudeBot)
- Google (Googlebot)
- Microsoft Bing (BingBot)

## Common Issues & Fixes

### Issue: Redirects detected
**Info**: Tool automatically follows up to 5 redirects
**Display**: Shows redirect chain (e.g., `308: https://example.com → https://www.example.com/`)
**Best Practice**: Use permanent redirects (301, 308) for SEO canonicalization

### Issue: Low content length
**Problem**: Page has less than 200 characters of text
**Fix**: Add more descriptive content or use server-side rendering

### Issue: No structured data
**Problem**: Missing JSON-LD schemas
**Fix**: Add appropriate Schema.org markup for your content type

### Issue: Missing meta tags
**Problem**: No title or description tags
**Fix**: Add proper meta tags in your HTML head

### Issue: Loading state detected
**Problem**: Page shows loading spinners in initial HTML
**Fix**: Use server-side rendering or static generation

### Issue: No noscript fallback
**Problem**: Content only available with JavaScript
**Fix**: Add noscript tags with key content

## Use Cases

1. **SEO Validation**: Ensure your pages are optimized for AI search
2. **Troubleshooting**: Find out why ChatGPT can&apos;t access your site
3. **Pre-Launch Testing**: Validate new pages before going live
4. **Competitor Analysis**: See how competitors structure their content
5. **Agency Audits**: Professional SEO audits for clients

## Technical Details

- Uses Node.js built-in modules (https, http, zlib)
- Handles gzip, deflate, and brotli compression
- Automatically follows redirects (301, 302, 307, 308) up to 5 hops
- Simulates real AI crawler user agents
- Validates HTML structure with regex parsing
- 10-second timeout per request
- Detects redirect loops and excessive redirects

## Requirements

- Node.js 14.0.0 or higher
- Internet connection

## Examples

### Test a blog post
```bash
crawlerview https://yourblog.com/post/seo-tips
```

### Test a product page
```bash
crawlerview https://yourstore.com/products/widget
```

### Test localhost
```bash
crawlerview http://localhost:3000/about
```

## Why CrawlerView?

Modern search is increasingly powered by AI. ChatGPT, Claude, and other AI systems need to understand your content to answer user questions accurately. Traditional SEO tools don&apos;t test AI accessibility.

CrawlerView bridges this gap by showing you exactly what AI crawlers see, helping you optimize for the future of search.

## License

MIT

## Author

Built by Tenzetta - Financial data platform optimized for AI accessibility
