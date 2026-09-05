/**
 * Live Web Search & Real-Time Research Engine for Sofi
 * Enables zero-cost live web access, Wikipedia knowledge grounding,
 * DuckDuckGo search extraction, and real-time news/fact gathering.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface WebResearchReport {
  query: string;
  summary: string;
  results: SearchResult[];
  timestamp: string;
  hasRealTimeData: boolean;
}

/**
 * Clean and strip HTML tags
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Query Wikipedia API for grounded factual knowledge
 */
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encoded}&limit=3&namespace=0&format=json`;
    
    const res = await fetch(url, {
      headers: { "User-Agent": "SofiAIAssistant/1.2 (https://sofi.ai; research@sofi.ai)" },
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) return [];
    const data = await res.json();
    
    // Format: [query, [titles], [descriptions], [urls]]
    const titles: string[] = data[1] || [];
    const descriptions: string[] = data[2] || [];
    const urls: string[] = data[3] || [];

    const results: SearchResult[] = [];
    for (let i = 0; i < titles.length; i++) {
      if (descriptions[i] && descriptions[i].trim()) {
        results.push({
          title: titles[i],
          snippet: descriptions[i],
          url: urls[i] || `https://en.wikipedia.org/wiki/${encodeURIComponent(titles[i])}`,
          source: "Wikipedia"
        });
      }
    }
    return results;
  } catch (e) {
    return [];
  }
}

/**
 * Query DuckDuckGo Instant Answer / HTML Search for live web information
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. DuckDuckGo Instant Answer JSON API
  try {
    const encoded = encodeURIComponent(query.trim());
    const jsonUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
    
    const res = await fetch(jsonUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SofiAgent/1.2" },
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();

      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL || "https://duckduckgo.com/?q=" + encoded,
          source: data.AbstractSource || "DuckDuckGo Instant Answer"
        });
      }

      // Related topics
      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 3)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || query,
              snippet: topic.Text,
              url: topic.FirstURL,
              source: "DuckDuckGo Knowledge"
            });
          }
        }
      }
    }
  } catch (e) {
    // Continue to HTML fallback
  }

  // 2. DuckDuckGo Lite HTML Search for broader web results
  if (results.length < 2) {
    try {
      const encoded = encodeURIComponent(query.trim());
      const htmlUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

      const res = await fetch(htmlUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: AbortSignal.timeout(4500)
      });

      if (res.ok) {
        const text = await res.text();
        // Extract results using regex on result snippets
        const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
        const titleRegex = /<a class="result__url[^>]*>([\s\S]*?)<\/a>/gi;
        
        let match;
        let count = 0;
        while ((match = snippetRegex.exec(text)) !== null && count < 3) {
          const rawSnippet = stripHtml(match[1]);
          if (rawSnippet && rawSnippet.length > 20) {
            results.push({
              title: `${query} — Web Search Result ${count + 1}`,
              snippet: rawSnippet,
              url: `https://duckduckgo.com/?q=${encoded}`,
              source: "Live Web"
            });
            count++;
          }
        }
      }
    } catch (e) {
      // Ignore network timeouts gracefully
    }
  }

  return results;
}

/**
 * Determine if a user query requires live web search or research
 */
export function isLiveSearchQuery(prompt: string, mode?: string): boolean {
  if (mode === "research") return true;

  const clean = prompt.toLowerCase();
  
  // Explicit search triggers
  if (/(search\s+for|search\s+the\s+web|look\s+up|google\s+|browse\s+|research\s+|find\s+out\s+about|who\s+is|what\s+is\s+the\s+latest|current\s+news|today's|weather\s+in|stock\s+price|release\s+date)/i.test(clean)) {
    return true;
  }

  // Time-sensitive queries
  if (/(today|yesterday|tomorrow|this\s+week|this\s+year|2025|2026|latest|breaking|score|price|status|current|newest)/i.test(clean)) {
    return true;
  }

  // Technical inquiry needing docs or benchmarks
  if (/(benchmark|comparison|docs\s+for|specifications\s+of|github\s+repo\s+for|npm\s+package)/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Perform multi-source live web research for Sofi
 */
export async function performLiveWebResearch(query: string): Promise<WebResearchReport> {
  const cleanQuery = query
    .replace(/^(search\s+the\s+web\s+for|search\s+for|look\s+up|please\s+research|research\s+on)\s+/i, "")
    .trim();

  const [wikiResults, ddgResults] = await Promise.all([
    searchWikipedia(cleanQuery),
    searchDuckDuckGo(cleanQuery)
  ]);

  // Combine and deduplicate
  const combined = [...wikiResults, ...ddgResults];
  const uniqueUrls = new Set<string>();
  const finalResults: SearchResult[] = [];

  for (const r of combined) {
    if (!uniqueUrls.has(r.url) && finalResults.length < 5) {
      uniqueUrls.add(r.url);
      finalResults.push(r);
    }
  }

  let summary = "";
  if (finalResults.length > 0) {
    summary = finalResults
      .map((r, i) => `[${i + 1}] **${r.title}** (${r.source}): ${r.snippet}`)
      .join("\n\n");
  }

  return {
    query: cleanQuery,
    summary,
    results: finalResults,
    timestamp: new Date().toISOString(),
    hasRealTimeData: finalResults.length > 0
  };
}
