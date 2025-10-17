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
    score: 0
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

  results.hasTitle = /<title[^>]*>/.test(html);
  results.hasDescription = /<meta\s+name="description"/i.test(html);
  results.hasMetaTags = results.hasTitle && results.hasDescription;

  if (!results.hasTitle) results.issues.push('Missing <title> tag');
  if (!results.hasDescription) results.issues.push('Missing meta description');

  results.hasH1 = /<h1[^>]*>/.test(html);
  if (!results.hasH1) results.issues.push('No <h1> heading');

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

async function testURL(url) {
  const results = {
    url,
    robotsTxt: await testRobotsTxt(url),
    crawlers: []
  };

  for (const [name, userAgent] of Object.entries(AI_CRAWLERS)) {
    try {
      const response = await fetchURL(url, userAgent);

      if (response.statusCode !== 200) {
        results.crawlers.push({
          name,
          error: `HTTP ${response.statusCode}`,
          score: 0
        });
        continue;
      }

      const analysis = analyzeHTML(response.html, name);
      results.crawlers.push(analysis);
    } catch (error) {
      results.crawlers.push({
        name,
        error: error.message,
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
