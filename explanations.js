/**
 * CrawlerView Score Explanations & Fix Recommendations
 * Based on official documentation from OpenAI, Anthropic, Google, and Bing
 */

const CRAWLER_INFO = {
  GPTBot: {
    name: 'GPTBot (OpenAI)',
    description: 'OpenAI\'s web crawler that collects content to train and improve AI models like ChatGPT',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)',
    purpose: 'Crawls the web to consume knowledge for AI features and provide AI-generated answers to questions',
    respectsRobotsTxt: true,
    dataFiltering: 'Filters out paywalled, illegal, and personally identifiable information before training',
    documentation: 'https://platform.openai.com/docs/gptbot'
  },
  ClaudeBot: {
    name: 'ClaudeBot (Anthropic)',
    description: 'Anthropic\'s web crawler that collects content for AI model training and web search',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-Web/1.0; +support@anthropic.com)',
    purpose: 'Gathers data from public web sources for model development, search indexing, and user-directed content retrieval',
    respectsRobotsTxt: true,
    respectsCrawlDelay: true,
    dataFiltering: 'Respects anti-circumvention technology and crawl-delay settings',
    documentation: 'https://support.claude.com/en/articles/8896518'
  },
  GoogleBot: {
    name: 'Googlebot (Google)',
    description: 'Google\'s primary crawler for search indexing, running simultaneously across thousands of machines',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    purpose: 'Discovers and scans websites to index content for Google Search',
    respectsRobotsTxt: true,
    protocolSupport: 'HTTP/1.1 and HTTP/2',
    compression: 'Supports gzip, deflate, and Brotli',
    caching: 'Uses ETag and Last-Modified headers for efficient recrawling',
    documentation: 'https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers'
  },
  BingBot: {
    name: 'BingBot (Microsoft Bing)',
    description: 'Microsoft\'s web crawler for Bing search engine indexing',
    userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    purpose: 'Discovers and indexes content for Bing Search',
    respectsRobotsTxt: true,
    respectsNoIndex: true,
    features: 'Crawl control, robots.txt tester, IndexNow protocol support',
    documentation: 'https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0'
  }
};

const SCORING_EXPLANATIONS = {
  content: {
    title: 'Content Accessibility',
    weight: -30,
    threshold: 200,
    why: {
      general: 'AI crawlers need sufficient text content to understand what your page is about. Pages with minimal content (less than 200 characters) provide little value for AI understanding and search indexing.',
      GPTBot: 'ChatGPT uses page content to answer user questions. Insufficient content means GPTBot cannot extract meaningful information to include in responses.',
      ClaudeBot: 'Claude requires adequate context to understand and reference your content. Minimal text prevents the AI from properly indexing or citing your page.',
      GoogleBot: 'Google ranks pages based on content quality and relevance. Thin content signals low-quality pages that may not deserve high rankings.',
      BingBot: 'Bing\'s quality thresholds require descriptive content. Pages with minimal text may be filtered out or ranked poorly.'
    },
    impact: 'Missing or insufficient content is the most critical issue (-30 points). AI crawlers cannot understand your page without adequate text.',
    fix: {
      recommended: [
        'Add descriptive, meaningful text content (minimum 200 characters)',
        'Use server-side rendering (SSR) or static site generation (SSG) to ensure content is in initial HTML',
        'Include noscript tags with key content for crawlers that don\'t execute JavaScript',
        'Write content that answers user questions and provides clear value',
        'Avoid client-side-only rendering that requires JavaScript to display content'
      ],
      technical: [
        'Next.js: Use getServerSideProps() or getStaticProps() for SSR/SSG',
        'React: Consider Next.js, Remix, or other SSR frameworks',
        'Vue: Use Nuxt.js for server-side rendering',
        'Angular: Enable Angular Universal for SSR',
        'Add meaningful content in <noscript> tags as fallback'
      ],
      example: `<!-- Good: Content in initial HTML -->
<body>
  <h1>Understanding AI Crawler Accessibility</h1>
  <p>AI crawlers like GPTBot and ClaudeBot need to access your content
     to understand and index your pages. This comprehensive guide explains
     how to optimize your website for AI accessibility...</p>

  <!-- Fallback for non-JS crawlers -->
  <noscript>
    <p>Key content summary available even without JavaScript enabled.</p>
  </noscript>
</body>

<!-- Bad: JavaScript-only content -->
<body>
  <div id="root"></div> <!-- Empty until JS loads -->
  <script src="app.js"></script>
</body>`
    }
  },

  noscript: {
    title: 'Noscript Fallback',
    weight: -10,
    threshold: 100,
    why: {
      general: 'Some AI crawlers may not execute JavaScript. The <noscript> tag provides fallback content for these scenarios.',
      GPTBot: 'While GPTBot can execute some JavaScript, it may not always wait for dynamic content. Noscript ensures baseline accessibility.',
      ClaudeBot: 'ClaudeBot may have JavaScript limitations. Noscript content guarantees your key information is accessible.',
      GoogleBot: 'Google can execute JavaScript but prefers content in initial HTML. Noscript improves crawl efficiency.',
      BingBot: 'Bing recommends accessible HTML. Noscript tags ensure content availability regardless of JavaScript support.'
    },
    impact: 'Missing noscript fallback reduces accessibility (-10 points). Crawlers without full JavaScript support may miss your content.',
    fix: {
      recommended: [
        'Add <noscript> tags with meaningful fallback content',
        'Include key information, navigation links, and page summary in noscript',
        'Ensure noscript content is substantial (minimum 100 characters)',
        'Don\'t just say "JavaScript required" - provide actual content',
        'Consider noscript as a accessibility feature, not just for crawlers'
      ],
      example: `<noscript>
  <div class="noscript-content">
    <h2>Page Content Available</h2>
    <p>This page contains comprehensive information about AI crawler
       optimization, including guides for GPTBot, ClaudeBot, Googlebot,
       and BingBot accessibility.</p>
    <nav>
      <a href="/guides">Guides</a> |
      <a href="/docs">Documentation</a> |
      <a href="/contact">Contact</a>
    </nav>
  </div>
</noscript>`
    }
  },

  structuredData: {
    title: 'Structured Data (JSON-LD)',
    weight: -15,
    why: {
      general: 'Structured data helps AI crawlers understand the semantic meaning of your content using standardized Schema.org vocabulary.',
      GPTBot: 'Structured data provides clear context about your content type, making it easier for ChatGPT to cite and reference your information accurately.',
      ClaudeBot: 'Schema.org markup helps Claude understand entities, relationships, and content structure for better search results and citations.',
      GoogleBot: 'Google uses structured data for rich snippets, knowledge panels, and enhanced search results. It\'s a critical ranking signal.',
      BingBot: 'Bing leverages structured data for rich snippets and improved search presentation. It significantly boosts visibility.'
    },
    impact: 'Missing structured data loses rich snippet opportunities (-15 points). Your content is harder for AI to categorize and reference.',
    fix: {
      recommended: [
        'Add JSON-LD structured data in <head> section',
        'Use appropriate Schema.org types for your content',
        'Include Organization, Article, Product, FAQPage, or other relevant schemas',
        'Validate with Google\'s Rich Results Test tool',
        'Keep structured data in sync with visible content'
      ],
      schemas: {
        Article: 'Blog posts, news articles, guides',
        Product: 'E-commerce product pages',
        Organization: 'About pages, company information',
        FAQPage: 'Frequently asked questions',
        HowTo: 'Step-by-step guides and tutorials',
        LocalBusiness: 'Business locations and services',
        Review: 'Product/service reviews',
        Recipe: 'Cooking instructions and ingredients'
      },
      example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Guide to AI Crawler Optimization",
  "author": {
    "@type": "Person",
    "name": "Jane Developer"
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-16",
  "description": "Learn how to optimize your website for GPTBot, ClaudeBot, Googlebot, and BingBot with proven strategies.",
  "publisher": {
    "@type": "Organization",
    "name": "Tech Guides",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/guide"
  }
}
</script>`
    }
  },

  metaTags: {
    title: 'Meta Tags (Title & Description)',
    weight: -20,
    components: {
      title: {
        importance: 'Critical',
        weight: -15,
        why: 'The <title> tag is the single most important on-page SEO element for all crawlers'
      },
      description: {
        importance: 'High',
        weight: -5,
        why: 'Meta description helps AI understand page purpose and appears in search results'
      }
    },
    why: {
      general: 'Meta tags provide concise summaries that help AI crawlers quickly understand page content and purpose.',
      GPTBot: 'Title and description give ChatGPT context for answering questions. Missing meta tags make it harder to cite your content accurately.',
      ClaudeBot: 'Claude uses meta information to improve search result quality and understand content topics at a glance.',
      GoogleBot: 'Title tag is a primary ranking factor. Description influences click-through rates in search results.',
      BingBot: 'Bing requires descriptive HTML elements. Meta tags are essential for proper indexing and ranking.'
    },
    impact: 'Missing meta tags severely impacts discoverability (-20 points). AI cannot properly categorize or present your content.',
    fix: {
      title: {
        recommended: [
          'Keep titles between 50-60 characters',
          'Put important keywords first',
          'Make each page title unique',
          'Include brand name at the end',
          'Be descriptive and compelling'
        ],
        examples: [
          'Good: "AI Crawler Optimization Guide | Complete SEO Strategies"',
          'Bad: "Home" or "Page 1" or "Welcome"',
          'Good: "iPhone 15 Pro Review: Camera, Battery & Performance Tests"',
          'Bad: "Product Review"'
        ]
      },
      description: {
        recommended: [
          'Keep descriptions between 150-160 characters',
          'Write compelling copy that encourages clicks',
          'Include target keywords naturally',
          'Accurately summarize page content',
          'Make each description unique'
        ],
        examples: [
          'Good: "Learn how to optimize your website for GPTBot, ClaudeBot, Googlebot, and BingBot. Expert strategies for AI crawler accessibility, structured data, and SEO best practices."',
          'Bad: "This is my website."',
          'Good: "Compare iPhone 15 Pro specs, camera quality, battery life, and real-world performance. Detailed review with photo samples and benchmark tests."',
          'Bad: "Read our review."'
        ]
      },
      example: `<head>
  <!-- Title: Most critical meta tag -->
  <title>AI Crawler Optimization: Complete Guide for SEO Success</title>

  <!-- Description: Summary for search results -->
  <meta name="description" content="Master AI crawler optimization with proven strategies for GPTBot, ClaudeBot, Googlebot, and BingBot. Improve SEO rankings and AI accessibility.">

  <!-- Open Graph for social sharing -->
  <meta property="og:title" content="AI Crawler Optimization Guide">
  <meta property="og:description" content="Complete guide to optimizing for AI crawlers and improving SEO">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://example.com/guide">
  <meta property="og:image" content="https://example.com/guide-image.jpg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="AI Crawler Optimization Guide">
  <meta name="twitter:description" content="Master AI crawler optimization for better SEO">
</head>`
    }
  },

  h1: {
    title: 'H1 Heading',
    weight: -10,
    why: {
      general: 'The H1 tag identifies the primary topic of your page. It\'s a key semantic signal for content hierarchy.',
      GPTBot: 'H1 helps ChatGPT understand the main topic when answering questions about your content.',
      ClaudeBot: 'Claude uses H1 as a primary topic indicator for search relevance and content categorization.',
      GoogleBot: 'H1 is an important on-page SEO element that signals content topic and hierarchy.',
      BingBot: 'Bing uses H1 to understand page structure and main topic for ranking algorithms.'
    },
    impact: 'Missing H1 heading loses topic clarity (-10 points). Crawlers cannot easily identify your page\'s primary focus.',
    fix: {
      recommended: [
        'Use exactly one H1 per page',
        'Make it descriptive and include target keywords',
        'Place H1 near the top of the page',
        'Keep it between 20-70 characters',
        'Make it different from the title tag (but related)',
        'Use H2-H6 for subheadings in logical hierarchy'
      ],
      example: `<!-- Good structure -->
<h1>Complete AI Crawler Optimization Guide</h1>
<h2>Understanding AI Crawlers</h2>
<h3>What is GPTBot?</h3>
<h3>What is ClaudeBot?</h3>
<h2>Optimization Strategies</h2>
<h3>Meta Tags</h3>
<h3>Structured Data</h3>

<!-- Bad: Multiple H1s -->
<h1>Welcome</h1>
<h1>About Us</h1>
<h1>Our Services</h1>

<!-- Bad: No H1 -->
<h2>Welcome to our site</h2>
<p>Content here...</p>`
    }
  },

  loadingState: {
    title: 'Loading State Detection',
    weight: -15,
    why: {
      general: 'Loading spinners, skeleton screens, or "Loading..." text in initial HTML indicate client-side rendering, which many crawlers may not wait for.',
      GPTBot: 'GPTBot may not wait for JavaScript to finish loading. Loading states mean content is unavailable in the initial HTML.',
      ClaudeBot: 'ClaudeBot prefers content in the initial response. Loading indicators suggest the page requires JavaScript execution.',
      GoogleBot: 'While Google can execute JavaScript, it prefers instant content. Loading states impact crawl efficiency and may delay indexing.',
      BingBot: 'Bing recommends accessible HTML in the initial response. Loading states indicate potential accessibility issues.'
    },
    impact: 'Loading states in HTML suggest content unavailability (-15 points). Crawlers may index an empty or incomplete page.',
    fix: {
      recommended: [
        'Use server-side rendering (SSR) to deliver complete HTML',
        'Implement static site generation (SSG) for static content',
        'Remove loading spinners from initial HTML',
        'Avoid aria-busy="true" in the initial response',
        'Pre-render critical content',
        'Use progressive enhancement (content first, then enhance)'
      ],
      frameworks: {
        'Next.js': 'Use getServerSideProps() for SSR or getStaticProps() for SSG',
        'Remix': 'Built-in SSR with loaders',
        'Nuxt.js': 'Use asyncData or fetch for SSR',
        'SvelteKit': 'Use load functions for SSR',
        'Angular Universal': 'Enable server-side rendering',
        'Gatsby': 'Static site generation by default'
      },
      antiPatterns: [
        '❌ <div class="loading-spinner"></div>',
        '❌ <div aria-busy="true">Loading...</div>',
        '❌ <div class="skeleton-loader"></div>',
        '❌ <p>Please wait while content loads...</p>'
      ],
      example: `<!-- Bad: Client-side only -->
<body>
  <div id="root">
    <div class="spinner">Loading...</div>
  </div>
  <script src="app.js"></script>
</body>

<!-- Good: Server-rendered content -->
<body>
  <div id="root">
    <h1>AI Crawler Optimization</h1>
    <p>This content is immediately available to crawlers...</p>
  </div>
  <script src="app.js"></script> <!-- Enhances after -->
</body>`
    }
  },

  robotsTxt: {
    title: 'Robots.txt Configuration',
    why: {
      general: 'Robots.txt controls which parts of your site crawlers can access. All major AI crawlers respect robots.txt directives.',
      GPTBot: 'GPTBot honors robots.txt. You can block it entirely or allow specific sections using "User-agent: GPTBot".',
      ClaudeBot: 'ClaudeBot respects robots.txt and crawl-delay directives. Block with "User-agent: ClaudeBot".',
      GoogleBot: 'Googlebot always respects robots.txt rules for automatic crawls.',
      BingBot: 'BingBot honors robots.txt. Bing Webmaster Tools includes a robots.txt tester.'
    },
    fix: {
      allowAll: `# Allow all crawlers (including AI)
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://example.com/sitemap.xml`,

      blockAllAI: `# Block all AI crawlers
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Claude-Web
Disallow: /

# Allow traditional search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /`,

      selective: `# Allow AI crawlers to specific sections
User-agent: GPTBot
Allow: /blog/
Allow: /docs/
Disallow: /private/

User-agent: ClaudeBot
Crawl-delay: 1
Allow: /

# Block sensitive directories for everyone
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /user-data/`,

      recommended: [
        'Place robots.txt at domain root (https://example.com/robots.txt)',
        'Test with Google Search Console or Bing Webmaster Tools',
        'Use specific User-agent directives for granular control',
        'Include Sitemap location for better discovery',
        'Be careful with Disallow: / (blocks entire site)',
        'Use Crawl-delay to control ClaudeBot speed if needed',
        'Apply rules to each subdomain separately'
      ],
      testing: {
        Google: 'Google Search Console > robots.txt Tester',
        Bing: 'Bing Webmaster Tools > Robots.txt Tester',
        general: 'Test thoroughly - incorrect robots.txt can block your entire site'
      }
    }
  }
};

const SCORE_RANGES = {
  excellent: {
    min: 80,
    max: 100,
    label: 'EXCELLENT',
    color: 'green',
    verdict: 'Your page is highly accessible to AI crawlers. Content is well-structured, complete, and optimized for AI understanding.',
    impact: 'AI systems can easily understand, index, and cite your content. You\'re well-positioned for AI-powered search and references.'
  },
  good: {
    min: 60,
    max: 79,
    label: 'GOOD',
    color: 'yellow',
    verdict: 'Your page is accessible to AI crawlers but has room for improvement. Address the issues below to maximize AI visibility.',
    impact: 'AI crawlers can access your content, but some optimization opportunities remain. Improvements will enhance AI understanding and search visibility.'
  },
  fair: {
    min: 40,
    max: 59,
    label: 'FAIR',
    color: 'yellow',
    verdict: 'Your page has several accessibility issues that limit AI crawler understanding. Multiple improvements are needed.',
    impact: 'AI crawlers may struggle to fully understand or index your content. This could limit visibility in AI-powered search and reduce citation accuracy.'
  },
  poor: {
    min: 0,
    max: 39,
    label: 'POOR',
    color: 'red',
    verdict: 'Your page has critical accessibility problems. AI crawlers likely cannot properly understand or index your content.',
    impact: 'AI systems may skip or misunderstand your content entirely. Urgent fixes needed to participate in AI-powered search and ensure proper AI citations.'
  }
};

const COMMON_FIXES = {
  clientSideRendering: {
    problem: 'Your site uses client-side rendering (React, Vue, Angular SPA)',
    detection: 'Empty initial HTML, loading states, minimal content',
    solutions: [
      {
        name: 'Next.js (React)',
        approach: 'Add SSR/SSG with getServerSideProps or getStaticProps',
        difficulty: 'Medium',
        migration: 'Can be gradual - migrate page by page'
      },
      {
        name: 'Nuxt.js (Vue)',
        approach: 'Use asyncData or fetch for server-side data',
        difficulty: 'Medium',
        migration: 'Framework swap - requires more work'
      },
      {
        name: 'Angular Universal',
        approach: 'Enable server-side rendering',
        difficulty: 'Hard',
        migration: 'Significant configuration changes'
      },
      {
        name: 'Prerendering (Quick Fix)',
        approach: 'Use services like Prerender.io or Rendertron',
        difficulty: 'Easy',
        migration: 'Add middleware, no code changes needed'
      }
    ]
  },

  missingMetadata: {
    problem: 'Missing or inadequate meta tags and structured data',
    solutions: [
      'Add unique, descriptive <title> tags (50-60 chars)',
      'Write compelling meta descriptions (150-160 chars)',
      'Implement JSON-LD structured data with Schema.org',
      'Add Open Graph tags for social sharing',
      'Include Twitter Card meta tags',
      'Ensure every page has an H1 tag'
    ],
    tools: [
      'Google Rich Results Test: https://search.google.com/test/rich-results',
      'Schema.org validator: https://validator.schema.org/',
      'Facebook Open Graph debugger: https://developers.facebook.com/tools/debug/',
      'Twitter Card validator: https://cards-dev.twitter.com/validator'
    ]
  },

  robotsBlocking: {
    problem: 'Robots.txt is blocking AI crawlers',
    solutions: [
      'Review robots.txt file at https://yourdomain.com/robots.txt',
      'Remove or modify "Disallow: /" for AI crawler user agents',
      'Test with Google Search Console robots.txt tester',
      'Consider allowing specific directories while blocking sensitive areas',
      'Remember: robots.txt is public and doesn\'t protect sensitive data'
    ],
    warning: 'Never rely on robots.txt for security. Use proper authentication instead.'
  }
};

module.exports = {
  CRAWLER_INFO,
  SCORING_EXPLANATIONS,
  SCORE_RANGES,
  COMMON_FIXES
};
