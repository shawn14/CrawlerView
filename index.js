/**
 * CrawlerView - Node.js API
 *
 * Programmatic access to crawler testing functionality
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const zlib = require('zlib');

const AI_CRAWLERS = {
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-Web/1.0; +support@anthropic.com)',
  GoogleBot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  BingBot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
};

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

        return fetchURL(redirectUrl, userAgent, redirectCount + 1, newChain)
          .then(resolve)
          .catch(reject);
      }

      const chunks = [];
      let stream = res;

      const encoding = res.headers['content-encoding'];
      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf-8');
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          html,
          finalUrl: url,
          redirectChain
        });
      });
      stream.on('error', (err) => reject(new Error(`Decompression error: ${err.message}`)));
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

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
    score: 0,
    // Extracted content
    titleText: '',
    descriptionText: '',
    h1Text: '',
    contentPreview: ''
  };

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1];
    const textContent = bodyContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    results.hasContent = textContent.length > 200;
    results.contentLength = textContent.length;
    results.contentPreview = textContent.substring(0, 250);

    if (textContent.length < 200) {
      results.issues.push(`Very little text content (${textContent.length} chars)`);
    }
  } else {
    results.issues.push('No <body> tag found');
  }

  const noscriptMatch = html.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/i);
  if (noscriptMatch) {
    results.hasNoscript = true;
    const noscriptText = noscriptMatch[1].replace(/<[^>]+>/g, '').trim();
    results.noscriptLength = noscriptText.length;

    if (noscriptText.length < 100) {
      results.issues.push('Noscript content is minimal');
    }
  } else {
    results.issues.push('No <noscript> fallback');
  }

  const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches && jsonLdMatches.length > 0) {
    results.hasStructuredData = true;
    results.structuredDataCount = jsonLdMatches.length;
  } else {
    results.issues.push('No structured data (JSON-LD) found');
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    results.hasTitle = true;
    results.titleText = titleMatch[1].replace(/\s+/g, ' ').trim();
  } else {
    results.issues.push('Missing <title> tag');
  }

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
  if (descMatch) {
    results.hasDescription = true;
    results.descriptionText = descMatch[1].replace(/\s+/g, ' ').trim();
  } else {
    results.issues.push('Missing meta description');
  }

  results.hasMetaTags = results.hasTitle && results.hasDescription;

  // Extract H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    results.hasH1 = true;
    const h1Content = h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    results.h1Text = h1Content;
  } else {
    results.issues.push('No <h1> heading');
  }

  const loadingPatterns = [
    /class="[^"]*loading[^"]*"/i,
    /class="[^"]*spinner[^"]*"/i,
    /aria-busy="true"/i,
    /Loading\.\.\./i
  ];

  for (const pattern of loadingPatterns) {
    if (pattern.test(html)) {
      results.hasLoadingState = true;
      results.issues.push('Loading state detected in HTML');
      break;
    }
  }

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

    if (robotsTxt.match(/User-agent:\s*GPTBot[\s\S]*?Disallow:\s*\//i)) {
      issues.push('GPTBot is blocked in robots.txt');
    }
    if (robotsTxt.match(/User-agent:\s*Claude-Web[\s\S]*?Disallow:\s*\//i)) {
      issues.push('Claude-Web is blocked in robots.txt');
    }
    if (robotsTxt.match(/User-agent:\s*\*[\s\S]*?Disallow:\s*\//i)) {
      issues.push('All bots may be blocked (User-agent: * with Disallow)');
    }

    return { accessible: true, content: robotsTxt, issues };
  } catch (error) {
    return { accessible: false, error: error.message };
  }
}

function getErrorExplanation(statusCode, errorMessage) {
  const explanations = {
    429: 'The site is rate-limiting requests. This is typically the site\'s protection against bots, not an issue with our crawler. Try again in a few minutes.',
    403: 'The site is blocking this crawler. The site may have bot protection or specifically block this user agent.',
    503: 'The site is temporarily unavailable or overloaded. This is a server-side issue, not a crawler problem.',
    502: 'Bad gateway - the site\'s server is having issues. This is a temporary server problem.',
    504: 'Gateway timeout - the site took too long to respond. The site may be slow or having server issues.',
    'ECONNREFUSED': 'Connection refused - the site is not accepting connections. The site may be down or blocking the request.',
    'ETIMEDOUT': 'Request timed out - the site took too long to respond (>10 seconds). The site may be slow or unresponsive.',
    'ENOTFOUND': 'DNS lookup failed - the domain name could not be resolved. Check if the URL is correct.',
    'ECONNRESET': 'Connection reset - the site closed the connection unexpectedly. This could be bot protection.'
  };

  if (explanations[statusCode]) return explanations[statusCode];
  if (errorMessage && errorMessage.includes('timeout')) return explanations['ETIMEDOUT'];
  if (errorMessage && errorMessage.includes('ECONNREFUSED')) return explanations['ECONNREFUSED'];
  if (errorMessage && errorMessage.includes('ENOTFOUND')) return explanations['ENOTFOUND'];
  if (errorMessage && errorMessage.includes('ECONNRESET')) return explanations['ECONNRESET'];

  return 'An unexpected error occurred while trying to crawl this site.';
}

async function fetchWithRetry(url, userAgent, maxRetries = 3) {
  const attempts = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();

    try {
      const response = await fetchURL(url, userAgent);
      const responseTime = Date.now() - startTime;

      // Check if this is an HTTP error that shouldn't be retried (4xx, 5xx)
      const isHttpError = response.statusCode >= 400;
      const shouldRetry = !isHttpError && response.statusCode !== 200;

      attempts.push({
        attempt,
        success: !isHttpError,
        statusCode: response.statusCode,
        responseTime,
        timestamp: new Date().toISOString()
      });

      // If it's an HTTP error (4xx, 5xx), don't retry - return immediately
      if (isHttpError || response.statusCode === 200) {
        return { response, attempts };
      }

      // For other non-200 codes (redirects, etc.), continue to retry
      if (attempt < maxRetries && shouldRetry) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return { response, attempts };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      attempts.push({
        attempt,
        success: false,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString()
      });

      // Retry on network errors (timeout, connection refused, etc.)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

async function testURL(url) {
  const results = {
    url,
    robotsTxt: await testRobotsTxt(url),
    crawlers: []
  };

  for (const [name, userAgent] of Object.entries(AI_CRAWLERS)) {
    try {
      const { response, attempts } = await fetchWithRetry(url, userAgent);

      if (response.statusCode !== 200) {
        const explanation = getErrorExplanation(response.statusCode);
        results.crawlers.push({
          name,
          error: `HTTP ${response.statusCode}`,
          errorDetails: {
            statusCode: response.statusCode,
            explanation,
            attempts,
            timestamp: new Date().toISOString()
          },
          score: 0
        });
        continue;
      }

      const analysis = analyzeHTML(response.html, name);
      analysis.redirectChain = response.redirectChain;
      analysis.diagnostics = {
        attempts,
        finalResponseTime: attempts[attempts.length - 1].responseTime
      };
      results.crawlers.push(analysis);
    } catch (error) {
      const explanation = getErrorExplanation(null, error.message);
      results.crawlers.push({
        name,
        error: error.message,
        errorDetails: {
          errorMessage: error.message,
          explanation,
          attempts: [],
          timestamp: new Date().toISOString()
        },
        score: 0
      });
    }
  }

  const validScores = results.crawlers.filter(c => !c.error).map(c => c.score);
  results.averageScore = validScores.length > 0
    ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
    : 0;

  return results;
}

module.exports = {
  testURL,
  testRobotsTxt,
  fetchURL,
  analyzeHTML,
  AI_CRAWLERS
};
