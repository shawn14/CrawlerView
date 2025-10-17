// CrawlerView Explanations Data
// Based on official documentation from OpenAI, Anthropic, Google, and Bing

window.CRAWLER_INFO = {
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
    documentation: 'https://www.bing.com/webmasters'
  }
};

window.SCORING_EXPLANATIONS = {
  content: {
    title: 'Content Accessibility',
    weight: -30,
    threshold: 200,
    aiAgentPrompt: `Fix AI crawler content accessibility issues on my website. The page has insufficient text content (less than 200 characters).

Requirements:
- Add descriptive, meaningful text content (minimum 200 characters)
- Use server-side rendering (SSR) or static site generation (SSG) to ensure content is in initial HTML
- Include noscript tags with key content for crawlers that don't execute JavaScript
- Avoid client-side-only rendering that requires JavaScript to display content

Technical considerations:
- If using Next.js: Implement getServerSideProps() or getStaticProps()
- If using React: Migrate to Next.js, Remix, or another SSR framework
- If using Vue: Implement Nuxt.js for server-side rendering
- If using Angular: Enable Angular Universal for SSR

The content should be meaningful, answer user questions, and provide clear value. Focus on making the content accessible to GPTBot, ClaudeBot, Googlebot, and BingBot.`,
    why: {
      general: 'AI crawlers need sufficient text content to understand what your page is about. Pages with minimal content (less than 200 characters) provide little value for AI understanding and search indexing.',
      GPTBot: {
        excerpt: 'GPTBot is OpenAI\'s web crawler that crawls the web to gather data that is used to train OpenAI\'s AI models. GPTBot filters out sources that require paywall access, are known to primarily aggregate personally identifiable information (PII), or have text that violates our policies.',
        source: 'OpenAI GPTBot Documentation',
        link: 'https://platform.openai.com/docs/gptbot',
        impact: 'ChatGPT uses page content to answer user questions. Insufficient content means GPTBot cannot extract meaningful information to include in responses about your site.'
      },
      ClaudeBot: {
        excerpt: 'ClaudeBot gathers data from public web sources to help improve the performance of our models. Our crawlers operate responsibly and respect industry standards like robots.txt.',
        source: 'Anthropic ClaudeBot Support',
        link: 'https://support.claude.com/en/articles/8896518',
        impact: 'Claude requires adequate context to understand and reference your content. Minimal text prevents the AI from properly indexing or citing your page in responses.'
      },
      GoogleBot: {
        excerpt: 'Googlebot is the generic name for Google\'s two types of web crawlers: a desktop crawler that simulates a user on a desktop, and a mobile crawler that simulates a user on a mobile device. Googlebot crawls billions of pages on the web.',
        source: 'Google Search Central',
        link: 'https://developers.google.com/search/docs/crawling-indexing/googlebot',
        impact: 'Google ranks pages based on content quality and relevance. Thin content signals low-quality pages that may not deserve high rankings in search results.'
      },
      BingBot: {
        excerpt: 'Bingbot is the name of Microsoft Bing\'s web crawler. It collects documents from the web to build a searchable index. Bingbot respects rules in robots.txt and crawls responsibly.',
        source: 'Bing Webmaster Tools',
        link: 'https://www.bing.com/webmasters',
        impact: 'Bing\'s quality thresholds require descriptive content. Pages with minimal text may be filtered out or ranked poorly in Bing search results.'
      }
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
    aiAgentPrompt: `Add proper noscript fallback content to my website for AI crawler accessibility.

Requirements:
- Add <noscript> tags with meaningful fallback content (minimum 100 characters)
- Include key information, navigation links, and page summary in noscript
- Ensure noscript content is substantial - not just "JavaScript required"
- Consider noscript as an accessibility feature for both crawlers and users

Implementation:
- Place noscript tags after main content areas
- Include a summary of the page's key information
- Add navigation links for better accessibility
- Ensure the content accurately represents the page without JavaScript

The noscript content should allow GPTBot, ClaudeBot, Googlebot, and BingBot to understand your page even without JavaScript execution.`,
    why: {
      general: 'Some AI crawlers may not execute JavaScript. The <noscript> tag provides fallback content for these scenarios.',
      GPTBot: {
        excerpt: 'GPTBot respects robots.txt and will not crawl content that requires JavaScript execution to be visible. Providing noscript fallbacks ensures your content is accessible.',
        source: 'OpenAI Best Practices',
        link: 'https://platform.openai.com/docs/gptbot',
        impact: 'While GPTBot can execute some JavaScript, it may not always wait for dynamic content. Noscript ensures baseline accessibility.'
      },
      ClaudeBot: {
        excerpt: 'We recommend providing accessible content that doesn\'t require JavaScript execution. Our crawlers respect standard web accessibility practices.',
        source: 'Anthropic Crawler Guidelines',
        link: 'https://support.claude.com/en/articles/8896518',
        impact: 'ClaudeBot may have JavaScript limitations. Noscript content guarantees your key information is accessible.'
      },
      GoogleBot: {
        excerpt: 'While Googlebot can process JavaScript, it may take time for Google to render and index the content. For best results, use server-side rendering and provide content in the initial HTML response.',
        source: 'Google JavaScript SEO Basics',
        link: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
        impact: 'Google can execute JavaScript but prefers content in initial HTML. Noscript improves crawl efficiency and faster indexing.'
      },
      BingBot: {
        excerpt: 'Ensure your site is accessible and usable without JavaScript. Use progressive enhancement to provide core functionality and content that works without JavaScript.',
        source: 'Bing Webmaster Guidelines',
        link: 'https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a',
        impact: 'Bing recommends accessible HTML. Noscript tags ensure content availability regardless of JavaScript support.'
      }
    },
    impact: 'Missing noscript fallback reduces accessibility (-10 points). Crawlers without full JavaScript support may miss your content.',
    fix: {
      recommended: [
        'Add <noscript> tags with meaningful fallback content',
        'Include key information, navigation links, and page summary in noscript',
        'Ensure noscript content is substantial (minimum 100 characters)',
        'Don\'t just say "JavaScript required" - provide actual content',
        'Consider noscript as an accessibility feature, not just for crawlers'
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
    aiAgentPrompt: `Add structured data (JSON-LD) to my website for better AI crawler understanding.

Requirements:
- Add JSON-LD structured data in the <head> section
- Use appropriate Schema.org types for the content (Article, Product, Organization, FAQPage, etc.)
- Keep structured data in sync with visible content
- Validate with Google's Rich Results Test tool

Implementation guidelines:
- For blog posts: Use Article schema with headline, author, datePublished, dateModified
- For products: Use Product schema with name, description, price, availability
- For company pages: Use Organization schema with name, logo, contact info
- For FAQ pages: Use FAQPage schema with questions and answers
- For guides: Use HowTo schema with step-by-step instructions

The structured data should help GPTBot, ClaudeBot, Googlebot, and BingBot understand the semantic meaning and context of your content for better search results and rich snippets.`,
    why: {
      general: 'Structured data helps AI crawlers understand the semantic meaning of your content using standardized Schema.org vocabulary.',
      GPTBot: {
        excerpt: 'Structured data provides clear context about your content type, making it easier for ChatGPT to understand and cite your information accurately when answering user questions.',
        source: 'OpenAI Content Guidelines',
        link: 'https://platform.openai.com/docs/gptbot',
        impact: 'Structured data provides clear context about your content type, making it easier for ChatGPT to cite and reference your information accurately.'
      },
      ClaudeBot: {
        excerpt: 'We encourage the use of structured data markup to help our systems better understand and categorize your content for improved search results.',
        source: 'Anthropic Web Standards',
        link: 'https://support.claude.com/en/articles/8896518',
        impact: 'Schema.org markup helps Claude understand entities, relationships, and content structure for better search results and citations.'
      },
      GoogleBot: {
        excerpt: 'Structured data is a standardized format for providing information about a page and classifying the page content. Google uses structured data to understand the content on the page and to generate rich results.',
        source: 'Google Structured Data Introduction',
        link: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',
        impact: 'Google uses structured data for rich snippets, knowledge panels, and enhanced search results. It\'s a critical ranking signal and visibility booster.'
      },
      BingBot: {
        excerpt: 'Bing supports structured data markup to better understand your page content. Use Schema.org markup to help Bing display rich snippets in search results.',
        source: 'Bing Markup Guidelines',
        link: 'https://www.bing.com/webmasters/help/marking-up-your-site-with-structured-data-3a93e731',
        impact: 'Bing leverages structured data for rich snippets and improved search presentation. It significantly boosts visibility and click-through rates.'
      }
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
    aiAgentPrompt: `Add proper meta tags (title and description) to my website for AI crawler optimization.

Requirements:
- Add a unique, descriptive <title> tag (50-60 characters)
- Add a compelling meta description (150-160 characters)
- Put important keywords first in both tags
- Make each page's title and description unique
- Include brand name at the end of the title

Title tag best practices:
- Keep between 50-60 characters
- Be descriptive and compelling
- Include target keywords naturally
- Format: "Primary Keyword - Secondary Keyword | Brand Name"

Meta description best practices:
- Keep between 150-160 characters
- Write compelling copy that encourages clicks
- Include target keywords naturally
- Accurately summarize page content

Also add Open Graph tags for social sharing:
- og:title, og:description, og:type, og:url, og:image

These meta tags are critical for GPTBot, ClaudeBot, Googlebot, and BingBot to understand and properly index your content.`,
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
      GPTBot: {
        excerpt: 'Clear, descriptive titles and meta descriptions help ChatGPT understand your content and cite it accurately when providing answers to users.',
        source: 'OpenAI Web Optimization',
        link: 'https://platform.openai.com/docs/gptbot',
        impact: 'Title and description give ChatGPT context for answering questions. Missing meta tags make it harder to cite your content accurately.'
      },
      ClaudeBot: {
        excerpt: 'Meta information is essential for our search indexing. Provide clear titles and descriptions that accurately represent your page content.',
        source: 'Anthropic SEO Best Practices',
        link: 'https://support.claude.com/en/articles/8896518',
        impact: 'Claude uses meta information to improve search result quality and understand content topics at a glance.'
      },
      GoogleBot: {
        excerpt: 'The title element tells both users and search engines what the topic of a particular page is. The meta description tag should inform and interest users with a short, relevant summary of what a particular page is about.',
        source: 'Google Title Link Best Practices',
        link: 'https://developers.google.com/search/docs/appearance/title-link',
        impact: 'Title tag is a primary ranking factor. Description influences click-through rates and appears in search result snippets.'
      },
      BingBot: {
        excerpt: 'Ensure that each page has a unique, descriptive title that accurately reflects the content. Write clear, informative meta descriptions that entice users to click.',
        source: 'Bing SEO Best Practices',
        link: 'https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a',
        impact: 'Bing requires descriptive HTML elements. Meta tags are essential for proper indexing, ranking, and search result display.'
      }
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
          'Bad: "Home" or "Page 1" or "Welcome"'
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
          'Good: "Learn how to optimize your website for GPTBot, ClaudeBot, Googlebot, and BingBot. Expert strategies for AI crawler accessibility."',
          'Bad: "This is my website."'
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
</head>`
    }
  },

  h1: {
    title: 'H1 Heading',
    weight: -10,
    aiAgentPrompt: `Add a proper H1 heading to my website for AI crawler optimization.

Requirements:
- Add exactly one H1 tag per page
- Make it descriptive and include target keywords
- Place H1 near the top of the page
- Keep it between 20-70 characters
- Make it different from the title tag (but related)

Heading hierarchy best practices:
- Use one H1 for the main page topic
- Use H2 for major sections
- Use H3-H6 for subsections in logical hierarchy
- Don't skip heading levels (e.g., don't jump from H1 to H3)
- Make headings descriptive of the content that follows

Example structure:
- H1: Main page topic (e.g., "Complete AI Crawler Optimization Guide")
- H2: Major sections (e.g., "Understanding AI Crawlers", "Optimization Strategies")
- H3: Subsections (e.g., "What is GPTBot?", "What is ClaudeBot?")

Proper H1 structure helps GPTBot, ClaudeBot, Googlebot, and BingBot understand your page topic and content hierarchy for better indexing and ranking.`,
    why: {
      general: 'The H1 tag identifies the primary topic of your page. It\'s a key semantic signal for content hierarchy.',
      GPTBot: {
        excerpt: 'Clear heading structure with a single H1 helps our systems understand the main topic and hierarchy of your content.',
        source: 'OpenAI Content Structure',
        link: 'https://platform.openai.com/docs/gptbot',
        impact: 'H1 helps ChatGPT understand the main topic when answering questions about your content.'
      },
      ClaudeBot: {
        excerpt: 'Use proper heading hierarchy with one H1 per page to help our systems understand your content structure and main topic.',
        source: 'Anthropic HTML Guidelines',
        link: 'https://support.claude.com/en/articles/8896518',
        impact: 'Claude uses H1 as a primary topic indicator for search relevance and content categorization.'
      },
      GoogleBot: {
        excerpt: 'Use heading tags to emphasize important text. Heading tags traditionally have larger text than normal text on the page, and this is a visual cue to users that this text is important and could help them understand something about the type of content underneath.',
        source: 'Google SEO Starter Guide',
        link: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
        impact: 'H1 is an important on-page SEO element that signals content topic and hierarchy to Google\'s ranking algorithms.'
      },
      BingBot: {
        excerpt: 'Structure your content with proper heading hierarchy. Use H1 for the main topic, followed by H2 and H3 for subsections.',
        source: 'Bing Content Guidelines',
        link: 'https://www.bing.com/webmasters',
        impact: 'Bing uses H1 to understand page structure and main topic for ranking algorithms and content classification.'
      }
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
<h1>Our Services</h1>`
    }
  },

  loadingState: {
    title: 'Loading State Detection',
    weight: -15,
    aiAgentPrompt: `Remove loading states from initial HTML and implement server-side rendering for AI crawler accessibility.

Problem: The page contains loading spinners, skeleton screens, or "Loading..." text in the initial HTML, indicating client-side rendering that crawlers may not wait for.

Requirements:
- Use server-side rendering (SSR) to deliver complete HTML
- Implement static site generation (SSG) for static content
- Remove loading spinners from initial HTML
- Avoid aria-busy="true" in the initial response
- Pre-render critical content
- Use progressive enhancement (content first, then enhance with JavaScript)

Framework-specific solutions:
- Next.js: Use getServerSideProps() for SSR or getStaticProps() for SSG
- Remix: Use loaders for built-in SSR
- Nuxt.js: Use asyncData or fetch hooks for SSR
- SvelteKit: Use load functions for SSR
- Angular Universal: Enable server-side rendering
- Gatsby: Uses static site generation by default

The goal is to deliver fully-rendered content in the initial HTML response so GPTBot, ClaudeBot, Googlebot, and BingBot can immediately access and index your content without waiting for JavaScript execution.`,
    why: {
      general: 'Loading spinners, skeleton screens, or "Loading..." text in initial HTML indicate client-side rendering, which many crawlers may not wait for.',
      GPTBot: {
        excerpt: 'Content that requires JavaScript execution to be visible may not be fully accessible to our crawlers. Provide content in the initial HTML response for best results.',
        source: 'OpenAI Crawler Guidelines',
        link: 'https://platform.openai.com/docs/gptbot',
        impact: 'GPTBot may not wait for JavaScript to finish loading. Loading states mean content is unavailable in the initial HTML crawl.'
      },
      ClaudeBot: {
        excerpt: 'We recommend server-side rendering or static generation for optimal crawler accessibility. Content should be available without JavaScript execution.',
        source: 'Anthropic Technical Requirements',
        link: 'https://support.claude.com/en/articles/8896518',
        impact: 'ClaudeBot prefers content in the initial response. Loading indicators suggest the page requires JavaScript execution and may not be fully indexed.'
      },
      GoogleBot: {
        excerpt: 'While Googlebot can render JavaScript, it takes time and resources. For faster indexing and better performance, use server-side rendering or static generation to deliver content in the initial HTML.',
        source: 'Google JavaScript & SEO',
        link: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
        impact: 'Google can execute JavaScript but prefers instant content. Loading states impact crawl efficiency and may delay indexing significantly.'
      },
      BingBot: {
        excerpt: 'Deliver content in the initial HTML response. While Bing can process some JavaScript, server-side rendering ensures faster and more reliable indexing.',
        source: 'Bing Rendering Guidelines',
        link: 'https://www.bing.com/webmasters',
        impact: 'Bing recommends accessible HTML in the initial response. Loading states indicate potential accessibility issues and slower indexing.'
      }
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
  }
};
