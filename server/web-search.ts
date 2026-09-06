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
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Query Wikipedia REST API & Opensearch for grounded factual knowledge
 */
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const cleanTerm = query.trim();

  // 1. Direct Wikipedia REST Summary API (High quality concise paragraph)
  try {
    const encoded = encodeURIComponent(cleanTerm.replace(/\s+/g, "_"));
    const restUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const res = await fetch(restUrl, {
      headers: { "User-Agent": "SofiAIAssistant/2.0 (https://sofi.ai; research@sofi.ai)" },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.extract && data.extract.trim()) {
        results.push({
          title: data.title || cleanTerm,
          snippet: data.extract,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
          source: "Wikipedia Encyclopedia"
        });
      }
    }
  } catch (e) {
    // Continue
  }

  // 2. Wikipedia Opensearch API for related titles
  try {
    const encoded = encodeURIComponent(cleanTerm);
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encoded}&limit=3&namespace=0&format=json`;
    
    const res = await fetch(url, {
      headers: { "User-Agent": "SofiAIAssistant/2.0 (https://sofi.ai; research@sofi.ai)" },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const data = await res.json();
      const titles: string[] = data[1] || [];
      const descriptions: string[] = data[2] || [];
      const urls: string[] = data[3] || [];

      for (let i = 0; i < titles.length; i++) {
        if (descriptions[i] && descriptions[i].trim() && !results.some(r => r.title === titles[i])) {
          results.push({
            title: titles[i],
            snippet: descriptions[i],
            url: urls[i] || `https://en.wikipedia.org/wiki/${encodeURIComponent(titles[i])}`,
            source: "Wikipedia"
          });
        }
      }
    }
  } catch (e) {
    // Ignore error
  }

  return results;
}

/**
 * Query DuckDuckGo Instant Answer / HTML Search for live web information
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const encoded = encodeURIComponent(query.trim());

  // 1. DuckDuckGo Instant Answer JSON API
  try {
    const jsonUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
    
    const res = await fetch(jsonUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SofiAgent/2.0" },
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();

      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL || "https://duckduckgo.com/?q=" + encoded,
          source: data.AbstractSource || "DuckDuckGo Knowledge"
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

  // 2. DuckDuckGo Lite / HTML Search for broader web results
  if (results.length < 3) {
    try {
      const htmlUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

      const res = await fetch(htmlUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: AbortSignal.timeout(4500)
      });

      if (res.ok) {
        const text = await res.text();
        const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
        const titleRegex = /<a class="result__url[^>]*>([\s\S]*?)<\/a>/gi;
        
        let match;
        let count = 0;
        while ((match = snippetRegex.exec(text)) !== null && count < 4) {
          const rawSnippet = stripHtml(match[1]);
          if (rawSnippet && rawSnippet.length > 20) {
            results.push({
              title: `${query} — Live Web Result ${count + 1}`,
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

  const clean = prompt.toLowerCase().trim();
  
  // Exclude single simple greetings or memory commands
  if (/^(hi|hello|hey|ayubowan|kohomada|good\s+(morning|night)|thanks|sthuthiyi|bye)$/i.test(clean)) {
    return false;
  }
  if (/^(who\s+are\s+you|what\s+is\s+your\s+name|what\s+do\s+you\s+remember)$/i.test(clean)) {
    return false;
  }

  // Explicit search & query triggers
  if (/(search|google|browse|research|look\s+up|find\s+out|tell\s+me\s+about|what\s+is|what\s+are|who\s+is|who\s+was|where\s+is|how\s+to|why\s+is|when\s+did|explain|details\s+of|information\s+on|news|price|weather|stock|crypto|xmr|btc|sol|eth|token|coin|monero|bitcoin|solana|ethereum|ai|docker|kubernetes|react|nextjs|python|rust|golang|market|status|specifications|features|guide|overview|summary)/i.test(clean)) {
    return true;
  }

  // Time-sensitive queries
  if (/(today|yesterday|tomorrow|this\s+week|this\s+year|2024|2025|2026|latest|breaking|score|price|status|current|newest)/i.test(clean)) {
    return true;
  }

  // Any substantive question
  if (clean.endsWith("?") || clean.length > 15) {
    return true;
  }

  return false;
}

/**
 * Perform multi-source live web research for Sofi
 */
export async function performLiveWebResearch(query: string): Promise<WebResearchReport> {
  const cleanQuery = query
    .replace(/^(search\s+the\s+web\s+for|search\s+for|look\s+up|please\s+research|research\s+on|tell\s+me\s+about|what\s+is|who\s+is|explain)\s+/i, "")
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
    if (!uniqueUrls.has(r.url) && finalResults.length < 6) {
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
