#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');
const zlib = require('zlib');
const { CRAWLER_INFO, SCORING_EXPLANATIONS, SCORE_RANGES, COMMON_FIXES } = require('./explanations.js');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * AI crawler user agents
 */
const AI_CRAWLERS = {
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-Web/1.0; +support@anthropic.com)',
  GoogleBot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  BingBot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
};

/**
 * Fetch URL with specific user agent (with compression support and redirect following)
 */
function fetchURL(url, userAgent, redirectCount = 0, redirectChain = []) {
  const MAX_REDIRECTS = 5;

  if (redirectCount >= MAX_REDIRECTS) {
    return Promise.reject(new Error(`Too many redirects (${redirectCount})`));
  }

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    };

    const req = client.request(options, (res) => {
      // Handle redirects (301, 302, 307, 308)
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        const newChain = [...redirectChain, { from: url, to: redirectUrl, status: res.statusCode }];

        // Follow the redirect
        return fetchURL(redirectUrl, userAgent, redirectCount + 1, newChain)
          .then(resolve)
          .catch(reject);
      }

      const chunks = [];
      let stream = res;

      // Handle compression
      const encoding = res.headers['content-encoding'];
      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const html = buffer.toString('utf-8');

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          html: html,
          finalUrl: url,
          redirectChain: redirectChain
        });
      });

      stream.on('error', (err) => {
        reject(new Error(`Decompression error: ${err.message}`));
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Analyze HTML for AI crawler accessibility
 */
function analyzeHTML(html, crawlerName) {
  const results = {
    crawler: crawlerName,
    hasContent: false,
    contentLength: 0,
    hasNoscript: false,
    noscriptLength: 0,
    hasStructuredData: false,
    structuredDataCount: 0,
    hasMetaTags: false,
    hasTitle: false,
    hasDescription: false,
    hasH1: false,
    hasLoadingState: false,
    issues: [],
    score: 0
  };

  // Check for basic content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1];
    const textContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                   .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                   .replace(/<[^>]+>/g, '')
                                   .replace(/\s+/g, ' ')
                                   .trim();

    results.hasContent = textContent.length > 200;
    results.contentLength = textContent.length;

    if (textContent.length < 200) {
      results.issues.push(`Very little text content (${textContent.length} chars) - AI may not understand page`);
    }
  } else {
    results.issues.push('No <body> tag found - invalid HTML');
  }

  // Check for noscript content
  const noscriptMatch = html.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/i);
  if (noscriptMatch) {
    results.hasNoscript = true;
    const noscriptText = noscriptMatch[1].replace(/<[^>]+>/g, '').trim();
    results.noscriptLength = noscriptText.length;

    if (noscriptText.length < 100) {
      results.issues.push('Noscript content is minimal - provide more fallback content');
    }
  } else {
    results.issues.push('No <noscript> fallback - AI without JS support may not see content');
  }

  // Check for structured data
  const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches && jsonLdMatches.length > 0) {
    results.hasStructuredData = true;
    results.structuredDataCount = jsonLdMatches.length;
  } else {
    results.issues.push('No structured data (JSON-LD) found - missing rich snippet opportunity');
  }

  // Check for meta tags
  results.hasTitle = /<title[^>]*>/.test(html);
  results.hasDescription = /<meta\s+name="description"/i.test(html);
  results.hasMetaTags = results.hasTitle && results.hasDescription;

  if (!results.hasTitle) {
    results.issues.push('Missing <title> tag - critical for AI understanding');
  }
  if (!results.hasDescription) {
    results.issues.push('Missing meta description - AI may not understand page purpose');
  }

  // Check for H1
  results.hasH1 = /<h1[^>]*>/.test(html);
  if (!results.hasH1) {
    results.issues.push('No <h1> heading - missing primary topic indicator');
  }

  // Check for loading states (bad sign)
  const loadingPatterns = [
    /class="[^"]*loading[^"]*"/i,
    /class="[^"]*spinner[^"]*"/i,
    /aria-busy="true"/i,
    /Loading\.\.\./i
  ];

  for (const pattern of loadingPatterns) {
    if (pattern.test(html)) {
      results.hasLoadingState = true;
      results.issues.push('Loading state detected in HTML - page may be client-side rendered only');
      break;
    }
  }

  // Calculate score
  let score = 100;
  if (!results.hasContent) score -= 30;
  if (!results.hasNoscript) score -= 10;
  if (!results.hasStructuredData) score -= 15;
  if (!results.hasMetaTags) score -= 20;
  if (!results.hasH1) score -= 10;
  if (results.hasLoadingState) score -= 15;

  results.score = Math.max(0, score);

  return results;
}

/**
 * Test robots.txt accessibility
 */
async function testRobotsTxt(baseUrl) {
  const robotsUrl = new URL('/robots.txt', baseUrl).href;

  try {
    const response = await fetchURL(robotsUrl, AI_CRAWLERS.GPTBot);

    if (response.statusCode !== 200) {
      return {
        accessible: false,
        error: `robots.txt returned status ${response.statusCode}`
      };
    }

    const robotsTxt = response.html;
    const issues = [];

    // Check for AI-specific blocks
    if (robotsTxt.match(/User-agent:\s*GPTBot[\s\S]*?Disallow:\s*\//i)) {
      issues.push('GPTBot is blocked in robots.txt');
    }
    if (robotsTxt.match(/User-agent:\s*Claude-Web[\s\S]*?Disallow:\s*\//i)) {
      issues.push('Claude-Web is blocked in robots.txt');
    }
    if (robotsTxt.match(/User-agent:\s*\*[\s\S]*?Disallow:\s*\//i)) {
      issues.push('All bots may be blocked (User-agent: * with Disallow)');
    }

    return {
      accessible: true,
      content: robotsTxt,
      issues
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message
    };
  }
}

/**
 * Main test function
 */
async function runTests(url, showExplanations = false) {
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}`);
  console.log(`CRAWLERVIEW - AI CRAWLER ACCESSIBILITY TEST`);
  console.log(`${'='.repeat(70)}${colors.reset}`);
  console.log(`Testing URL: ${colors.blue}${url}${colors.reset}\n`);

  // Test robots.txt
  console.log(`${colors.bright}1. Checking robots.txt...${colors.reset}`);
  const robotsTest = await testRobotsTxt(url);

  if (robotsTest.accessible) {
    console.log(`${colors.green}✓ robots.txt accessible${colors.reset}`);
    if (robotsTest.issues.length > 0) {
      console.log(`${colors.yellow}⚠ Issues found:${colors.reset}`);
      robotsTest.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
  } else {
    console.log(`${colors.red}✗ robots.txt not accessible: ${robotsTest.error}${colors.reset}`);
  }
  console.log('');

  // Test with each AI crawler
  console.log(`${colors.bright}2. Testing with AI crawler user agents...${colors.reset}\n`);

  const crawlerResults = [];

  for (const [name, userAgent] of Object.entries(AI_CRAWLERS)) {
    console.log(`${colors.bright}Testing as ${name}:${colors.reset}`);

    try {
      const response = await fetchURL(url, userAgent);

      // Show redirect chain if present
      if (response.redirectChain && response.redirectChain.length > 0) {
        console.log(`${colors.cyan}  Redirects followed:${colors.reset}`);
        response.redirectChain.forEach(redirect => {
          console.log(`    ${redirect.status}: ${redirect.from} → ${redirect.to}`);
        });
      }

      if (response.statusCode !== 200) {
        console.log(`${colors.red}✗ HTTP ${response.statusCode} - Page not accessible${colors.reset}\n`);
        continue;
      }

      const analysis = analyzeHTML(response.html, name);
      crawlerResults.push(analysis);

      // Display results
      const scoreColor = analysis.score >= 80 ? colors.green :
                        analysis.score >= 60 ? colors.yellow : colors.red;

      console.log(`${scoreColor}  Score: ${analysis.score}/100${colors.reset}`);
      console.log(`  Content length: ${analysis.contentLength} chars ${analysis.hasContent ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
      console.log(`  Noscript: ${analysis.hasNoscript ? colors.green + '✓' : colors.red + '✗'}${colors.reset} (${analysis.noscriptLength} chars)`);
      console.log(`  Structured data: ${analysis.hasStructuredData ? colors.green + '✓' : colors.red + '✗'}${colors.reset}${analysis.structuredDataCount > 0 ? ` (${analysis.structuredDataCount} schemas)` : ''}`);
      console.log(`  Meta tags: ${analysis.hasMetaTags ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
      console.log(`  H1 heading: ${analysis.hasH1 ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
      console.log(`  Loading state: ${analysis.hasLoadingState ? colors.red + '✗ Found' : colors.green + '✓ None'}${colors.reset}`);

      if (analysis.issues.length > 0) {
        console.log(`${colors.yellow}  Issues:${colors.reset}`);
        analysis.issues.forEach(issue => {
          console.log(`    - ${issue}`);
        });
      }

      console.log('');
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}\n`);
    }
  }

  // Summary
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(70)}${colors.reset}`);

  if (crawlerResults.length === 0) {
    console.log(`${colors.red}No successful tests - page may not be accessible to AI crawlers${colors.reset}`);
    return;
  }

  const avgScore = crawlerResults.reduce((sum, r) => sum + r.score, 0) / crawlerResults.length;
  const scoreColor = avgScore >= 80 ? colors.green : avgScore >= 60 ? colors.yellow : colors.red;

  console.log(`${scoreColor}Average Score: ${avgScore.toFixed(1)}/100${colors.reset}`);
  console.log('');

  // Recommendations
  const allIssues = [...new Set(crawlerResults.flatMap(r => r.issues))];

  if (allIssues.length > 0) {
    console.log(`${colors.yellow}${colors.bright}RECOMMENDATIONS:${colors.reset}`);
    allIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    console.log('');
  }

  // Final verdict
  const scoreRange = avgScore >= 80 ? SCORE_RANGES.excellent :
                     avgScore >= 60 ? SCORE_RANGES.good :
                     avgScore >= 40 ? SCORE_RANGES.fair : SCORE_RANGES.poor;

  if (avgScore >= 80) {
    console.log(`${colors.green}${colors.bright}✓ ${scoreRange.label}: ${scoreRange.verdict}${colors.reset}`);
  } else if (avgScore >= 60) {
    console.log(`${colors.yellow}${colors.bright}⚠ ${scoreRange.label}: ${scoreRange.verdict}${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ ${scoreRange.label}: ${scoreRange.verdict}${colors.reset}`);
  }

  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);

  // Show detailed explanations if requested
  if (showExplanations) {
    console.log('');
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}`);
    console.log(`DETAILED EXPLANATIONS & FIX RECOMMENDATIONS`);
    console.log(`${'='.repeat(70)}${colors.reset}`);
    console.log('');

    // Determine which issues to explain
    const issueTypes = new Set();
    crawlerResults.forEach(result => {
      if (!result.hasContent) issueTypes.add('content');
      if (!result.hasNoscript) issueTypes.add('noscript');
      if (!result.hasStructuredData) issueTypes.add('structuredData');
      if (!result.hasMetaTags) issueTypes.add('metaTags');
      if (!result.hasH1) issueTypes.add('h1');
      if (result.hasLoadingState) issueTypes.add('loadingState');
    });

    // Show crawler info
    console.log(`${colors.bright}${colors.blue}About the AI Crawlers Tested:${colors.reset}\n`);
    Object.values(CRAWLER_INFO).forEach(crawler => {
      console.log(`${colors.bright}${crawler.name}${colors.reset}`);
      console.log(`  Purpose: ${crawler.description}`);
      console.log(`  Documentation: ${colors.cyan}${crawler.documentation}${colors.reset}`);
      console.log('');
    });

    console.log(`${colors.cyan}${'—'.repeat(70)}${colors.reset}\n`);

    // Show explanations for each issue type found
    if (issueTypes.size > 0) {
      console.log(`${colors.bright}${colors.yellow}Issues Found & How to Fix Them:${colors.reset}\n`);

      issueTypes.forEach(issueType => {
        const explanation = SCORING_EXPLANATIONS[issueType];
        if (!explanation) return;

        console.log(`${colors.bright}${colors.red}❌ ${explanation.title}${colors.reset}`);
        console.log(`${colors.yellow}Impact: ${explanation.impact}${colors.reset}`);
        console.log('');

        if (explanation.why) {
          console.log(`${colors.bright}Why This Matters:${colors.reset}`);
          console.log(`  ${explanation.why.general}`);
          console.log('');
        }

        if (explanation.fix) {
          console.log(`${colors.bright}${colors.green}How to Fix:${colors.reset}`);
          if (explanation.fix.recommended) {
            explanation.fix.recommended.forEach((rec, i) => {
              console.log(`  ${i + 1}. ${rec}`);
            });
            console.log('');
          }

          if (explanation.fix.example) {
            console.log(`${colors.bright}Code Example:${colors.reset}`);
            console.log(`${colors.cyan}${explanation.fix.example}${colors.reset}`);
            console.log('');
          }
        }

        console.log(`${colors.cyan}${'—'.repeat(70)}${colors.reset}\n`);
      });
    }

    // Show common fix patterns
    console.log(`${colors.bright}${colors.blue}Common Fix Patterns:${colors.reset}\n`);

    if (issueTypes.has('content') || issueTypes.has('loadingState')) {
      const fix = COMMON_FIXES.clientSideRendering;
      console.log(`${colors.bright}Problem: ${fix.problem}${colors.reset}`);
      console.log(`Detection: ${fix.detection}\n`);
      console.log(`${colors.green}Solutions:${colors.reset}`);
      fix.solutions.forEach((solution, i) => {
        console.log(`  ${i + 1}. ${colors.bright}${solution.name}${colors.reset}`);
        console.log(`     Approach: ${solution.approach}`);
        console.log(`     Difficulty: ${solution.difficulty}`);
        console.log(`     Migration: ${solution.migration}`);
      });
      console.log('');
    }

    if (issueTypes.has('metaTags') || issueTypes.has('structuredData')) {
      const fix = COMMON_FIXES.missingMetadata;
      console.log(`${colors.bright}Problem: ${fix.problem}${colors.reset}`);
      console.log(`${colors.green}Quick Fixes:${colors.reset}`);
      fix.solutions.forEach((solution, i) => {
        console.log(`  ${i + 1}. ${solution}`);
      });
      console.log('');
      console.log(`${colors.bright}Testing Tools:${colors.reset}`);
      fix.tools.forEach(tool => {
        console.log(`  • ${colors.cyan}${tool}${colors.reset}`);
      });
      console.log('');
    }

    // Show robots.txt guidance
    if (robotsTest.issues && robotsTest.issues.length > 0) {
      const fix = COMMON_FIXES.robotsBlocking;
      console.log(`${colors.bright}${colors.red}Robots.txt Issues Detected${colors.reset}`);
      console.log(`${colors.green}Solutions:${colors.reset}`);
      fix.solutions.forEach((solution, i) => {
        console.log(`  ${i + 1}. ${solution}`);
      });
      console.log(`\n${colors.yellow}⚠ Warning: ${fix.warning}${colors.reset}\n`);
    }

    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}For more detailed guidance, visit the official documentation:${colors.reset}`);
    console.log(`  • OpenAI GPTBot: ${colors.cyan}https://platform.openai.com/docs/gptbot${colors.reset}`);
    console.log(`  • Anthropic ClaudeBot: ${colors.cyan}https://support.claude.com/en/articles/8896518${colors.reset}`);
    console.log(`  • Google Search: ${colors.cyan}https://developers.google.com/search${colors.reset}`);
    console.log(`  • Bing Webmaster: ${colors.cyan}https://www.bing.com/webmasters${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  } else {
    console.log('');
    console.log(`${colors.cyan}Tip: Run with ${colors.bright}--explain${colors.reset}${colors.cyan} for detailed fix recommendations${colors.reset}`);
    console.log(`${colors.cyan}Example: crawlerview --explain ${url}${colors.reset}`);
  }
}

// CLI execution
const args = process.argv.slice(2);
const explainFlag = args.includes('--explain') || args.includes('-e');
const helpFlag = args.includes('--help') || args.includes('-h');
const url = args.find(arg => !arg.startsWith('-'));

if (helpFlag) {
  console.log(`${colors.bright}${colors.cyan}CrawlerView - AI Crawler Accessibility Testing${colors.reset}`);
  console.log('');
  console.log('Usage: crawlerview [options] <url>');
  console.log('');
  console.log('Options:');
  console.log('  -e, --explain    Show detailed explanations and fix recommendations');
  console.log('  -h, --help       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  crawlerview https://example.com');
  console.log('  crawlerview --explain https://example.com');
  console.log('  crawlerview -e https://myblog.com/post');
  console.log('');
  console.log('Crawlers tested:');
  console.log('  - GPTBot (OpenAI/ChatGPT)');
  console.log('  - ClaudeBot (Anthropic/Claude)');
  console.log('  - Googlebot (Google Search)');
  console.log('  - BingBot (Microsoft Bing)');
  process.exit(0);
}

if (!url) {
  console.error(`${colors.red}Error: Please provide a URL to test${colors.reset}`);
  console.error(`Usage: crawlerview [options] <url>`);
  console.error(`Example: crawlerview https://example.com`);
  console.error(`Run 'crawlerview --help' for more information`);
  process.exit(1);
}

// Validate URL
try {
  new URL(url);
} catch (error) {
  console.error(`${colors.red}Error: Invalid URL: ${url}${colors.reset}`);
  process.exit(1);
}

runTests(url, explainFlag).catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
