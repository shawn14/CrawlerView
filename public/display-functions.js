// Copy to clipboard functionality
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    button.textContent = '✗ Failed';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  });
}

// Create a copy button element
function createCopyButton(text) {
  const button = document.createElement('button');
  button.className = 'copy-btn';
  button.textContent = 'Copy';
  button.onclick = () => copyToClipboard(text, button);
  return button;
}

// Enhanced display explanations with crawler-specific excerpts
function displayDetailedExplanations(results) {
  const container = document.getElementById('detailedExplanations');
  if (!container) return;

  // Collect all unique issue types from all crawlers
  const issueTypes = new Set();
  results.crawlers.forEach(crawler => {
    if (!crawler.hasContent) issueTypes.add('content');
    if (!crawler.hasNoscript) issueTypes.add('noscript');
    if (!crawler.hasStructuredData) issueTypes.add('structuredData');
    if (!crawler.hasMetaTags) issueTypes.add('metaTags');
    if (!crawler.hasH1) issueTypes.add('h1');
    if (crawler.hasLoadingState) issueTypes.add('loadingState');
  });

  if (issueTypes.size === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="detailed-report">';

  // Overall score summary
  html += `
    <div class="report-section">
      <h2>Detailed Analysis</h2>
      <p class="score-range">${getScoreRangeDescription(results.averageScore)}</p>
    </div>
  `;

  // Issues found
  html += '<div class="report-section"><h2>Issues Found & How to Fix Them</h2>';

  issueTypes.forEach(issueKey => {
    const explanation = window.SCORING_EXPLANATIONS[issueKey];

    if (explanation) {
      html += `
        <div class="issue-card">
          <div class="issue-header">
            <h3>${explanation.title}</h3>
            <span class="issue-impact">Impact: ${explanation.weight} points</span>
          </div>

          <div class="issue-why">
            <h4>Why This Matters</h4>
            <p>${explanation.why.general}</p>
          </div>
      `;

        // Crawler-specific documentation excerpts
        if (explanation.crawlers) {
          html += '<div class="crawler-excerpts">';
          html += '<h4>What the Crawlers Say</h4>';

          ['GPTBot', 'ClaudeBot', 'GoogleBot', 'BingBot'].forEach(crawler => {
            const crawlerInfo = explanation.crawlers[crawler];
            if (crawlerInfo) {
              html += `
                <div class="crawler-excerpt">
                  <div class="crawler-name">${crawler}</div>
                  <blockquote>
                    <p>${crawlerInfo.excerpt}</p>
                    <footer>
                      <cite>
                        <a href="${crawlerInfo.link}" target="_blank" rel="noopener">
                          ${crawlerInfo.source}
                        </a>
                      </cite>
                    </footer>
                  </blockquote>
                  <div class="crawler-impact">
                    <strong>Impact:</strong> ${crawlerInfo.impact}
                  </div>
                </div>
              `;
            }
          });

          html += '</div>'; // Close crawler-excerpts
        }

      // AI Agent Prompt section
      if (explanation.aiAgentPrompt) {
        const promptId = `prompt-${issueKey}`;
        html += `
          <div class="ai-agent-section">
            <h4>🤖 Use with AI Coding Agent</h4>
            <p class="ai-prompt-description">Copy this prompt and paste it into Claude Code, Cursor, or any AI coding assistant to automatically fix this issue:</p>
            <div class="ai-prompt-wrapper">
              <div class="ai-prompt-header">
                <span class="prompt-label">AI Agent Prompt</span>
                <button class="copy-btn" onclick="copyCode('${promptId}', this)">Copy Prompt</button>
              </div>
              <pre><code id="${promptId}" class="ai-prompt-code">${escapeHtml(explanation.aiAgentPrompt)}</code></pre>
            </div>
          </div>
        `;
      }

      // Fix recommendations
      if (explanation.fix) {
        html += `
          <div class="fix-section">
            <h4>How to Fix</h4>
        `;

        // Recommendations with copy buttons
        if (explanation.fix.recommended && explanation.fix.recommended.length > 0) {
          html += '<div class="recommendations"><ul>';
          explanation.fix.recommended.forEach((rec, idx) => {
            const recId = `rec-${issueKey}-${idx}`;
            html += `
              <li>
                <div class="recommendation-item">
                  <span id="${recId}">${rec}</span>
                  <button class="copy-btn-small" onclick="copyText('${recId}', this)">Copy</button>
                </div>
              </li>
            `;
          });
          html += '</ul></div>';
        }

        // Code example with copy button
        if (explanation.fix.example) {
          const codeId = `code-${issueKey}-${Math.random().toString(36).substr(2, 9)}`;
          html += `
            <div class="code-block-wrapper">
              <div class="code-header">
                <span class="code-label">html</span>
                <button class="copy-btn" onclick="copyCode('${codeId}', this)">Copy</button>
              </div>
              <pre><code id="${codeId}" class="language-html">${escapeHtml(explanation.fix.example)}</code></pre>
            </div>
          `;
        }

        html += '</div>'; // Close fix-section
      }

      html += '</div>'; // Close issue-card
    }
  });

  html += '</div>'; // Close report-section

  html += '</div>'; // Close detailed-report
  container.innerHTML = html;
}

// Helper function to copy code from pre/code blocks
function copyCode(elementId, button) {
  const element = document.getElementById(elementId);
  if (element) {
    copyToClipboard(element.textContent, button);
  }
}

// Helper function to copy text from any element
function copyText(elementId, button) {
  const element = document.getElementById(elementId);
  if (element) {
    copyToClipboard(element.textContent, button);
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to get issue key from issue text
function getIssueKey(issueText) {
  const mapping = {
    'Low content length': 'content',
    'No noscript fallback': 'noscript',
    'No structured data': 'structuredData',
    'Missing meta tags': 'metaTags',
    'No H1 heading': 'h1',
    'Loading state detected': 'loadingState'
  };
  return mapping[issueText] || issueText.toLowerCase().replace(/\s+/g, '');
}

// Helper function to get score range description
function getScoreRangeDescription(score) {
  if (score >= 80) {
    return '🎉 Excellent - AI crawlers can fully understand your content';
  } else if (score >= 60) {
    return '👍 Good - Minor improvements recommended';
  } else if (score >= 40) {
    return '⚠️ Fair - Several issues need attention';
  } else {
    return '❌ Poor - Major accessibility problems';
  }
}
