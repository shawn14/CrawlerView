# CrawlerView Changelog

## v1.1.0 - 2025-10-16

### Added
- **Automatic redirect following** - Now follows HTTP redirects (301, 302, 307, 308) like real AI crawlers
- **Redirect chain display** - Shows complete redirect path in cyan color
- **Redirect loop detection** - Prevents infinite loops with 5-redirect maximum
- **Final URL tracking** - Reports the actual URL tested after following redirects

### Fixed
- URLs with www redirects now work correctly (e.g., `tenzetta.com` → `www.tenzetta.com`)
- HTTP 308 (Permanent Redirect) now handled properly

### Technical Details
- Enhanced `fetchURL()` function with recursive redirect following
- Added `redirectCount` and `redirectChain` parameters
- Updated both `cli.js` and `index.js` API
- Redirect chain displayed before test results for transparency

### Example Output
```
Testing as GPTBot:
  Redirects followed:
    308: https://tenzetta.com → https://www.tenzetta.com/
  Score: 100/100
  ...
```

## v1.0.0 - 2025-10-16

### Initial Release
- Test 4 major AI crawlers (GPTBot, Claude-Web, Googlebot, BingBot)
- Validate meta tags, structured data, and accessibility
- Score pages 0-100 based on SEO best practices
- Detect common issues blocking AI understanding
- Handle gzip, deflate, and brotli compression
- Zero dependencies - pure Node.js
