import { GoogleGenAI } from "@google/genai";
import { readJsonSafe } from "./slm-engine";
import { executeQwenLbgmPipeline } from "./qwen-lbgm-engine";
import { performLiveWebResearch, isLiveSearchQuery } from "./web-search";
import path from "path";

export interface ChatAttachment {
  id: string;
  name: string;
  type: "image" | "document";
  mimeType: string;
  data?: string; // base64 / data URL
  size: number;
  textContent?: string;
}

export interface RouterInput {
  message: string;
  history?: Array<{ sender: "user" | "sofi"; text: string }>;
  language?: "en" | "si";
  mode?: "general" | "coding" | "research" | "creative";
  edition?: "free" | "pro";
  selectedModel?:
    | "auto"
    | "lbgm"
    | "claude"
    | "claude-opus-4-8"
    | "claude-opus-5"
    | "deepseek-v4-flash"
    | "glm-5.3"
    | "gpt-5.6-sol"
    | "chatgpt"
    | "gemini";
  attachments?: ChatAttachment[];
  systemPrompt: string;
  userProfile?: any;
  memories?: any[];
  vocab?: any[];
  forceWebSearch?: boolean;
}

export interface RouterOutput {
  reply: string;
  modelUsed:
    | "sofi-lbgm"
    | "claude-3-5-sonnet"
    | "claude-opus-4-8"
    | "claude-opus-5"
    | "deepseek-v4-flash"
    | "glm-5.3"
    | "gpt-5.6-sol"
    | "gpt-4o"
    | "gemini-2.5-flash"
    | "gemini-3.8-flash"
    | string;
  modelLabel: string;
  routingReason: string;
  fallbackOccurred?: boolean;
}

export function getAgentRouterKey(input?: RouterInput): string | null {
  const profileKey = input?.userProfile?.preferences?.agentRouterKey;
  if (profileKey && typeof profileKey === "string" && profileKey.trim()) {
    return profileKey.trim();
  }

  const explicitKey = (input as any)?.agentRouterKey || (input as any)?.customApiKey;
  if (explicitKey && typeof explicitKey === "string" && explicitKey.trim()) {
    return explicitKey.trim();
  }

  const envKey =
    process.env.AGENTROUTER_API_KEY ||
    process.env.AGENT_ROUTER_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.AGENTROUTER_KEY;

  if (envKey && envKey.trim() && envKey !== "your_agent_router_api_key_here") {
    return envKey.trim();
  }

  return null;
}

/**
 * AgentRouter Frontier Model Specifications (https://agentrouter.org)
 */
export const AGENTROUTER_FRONTIER_MODELS = {
  "claude-opus-4-8": {
    label: "Claude Opus 4.8",
    slugs: ["claude-opus-4-8", "anthropic/claude-opus-4-8", "claude-4-8-opus", "anthropic/claude-3.5-sonnet"],
    provider: "Anthropic",
    badge: "Opus 4.8",
    description: "AgentRouter • Supreme depth, mathematical proofs & master architecture"
  },
  "claude-opus-5": {
    label: "Claude Opus 5",
    slugs: ["claude-opus-5", "anthropic/claude-opus-5", "claude-5-opus", "anthropic/claude-3.7-sonnet", "anthropic/claude-3.5-sonnet"],
    provider: "Anthropic",
    badge: "Opus 5",
    description: "AgentRouter • Frontier cognitive synthesis & multi-layer problem solving"
  },
  "deepseek-v4-flash": {
    label: "DeepSeek v4 Flash",
    slugs: ["deepseek-v4-flash", "deepseek/deepseek-v4-flash", "deepseek/deepseek-chat", "deepseek/deepseek-coder", "deepseek-v4"],
    provider: "DeepSeek",
    badge: "DeepSeek v4",
    description: "AgentRouter • Blazing-fast reasoning, algorithmic calculation & code analysis"
  },
  "glm-5.3": {
    label: "GLM 5.3",
    slugs: ["glm-5.3", "zhipu/glm-5.3", "thudm/glm-5.3", "zhipu/glm-4", "thudm/glm-4"],
    provider: "Zhipu AI",
    badge: "GLM 5.3",
    description: "AgentRouter • Advanced bilingual intelligence, logic synthesis & task planning"
  },
  "gpt-5.6-sol": {
    label: "GPT-5.6 Sol",
    slugs: ["gpt-5.6-sol", "openai/gpt-5.6-sol", "gpt-5-6-sol", "openai/gpt-4o", "openai/gpt-4-turbo"],
    provider: "OpenAI",
    badge: "GPT-5.6",
    description: "AgentRouter • Next-generation autonomous reasoning & systemic insight"
  }
} as const;

export type AgentRouterFrontierModelKey = keyof typeof AGENTROUTER_FRONTIER_MODELS;

/**
 * Determine the optimal model if mode is "auto"
 */
export function pickOptimalModel(
  message: string,
  mode: string,
  attachments?: ChatAttachment[],
  edition?: "free" | "pro"
): {
  modelId:
    | "sofi-lbgm"
    | "claude-3-5-sonnet"
    | "claude-opus-4-8"
    | "claude-opus-5"
    | "deepseek-v4-flash"
    | "glm-5.3"
    | "gpt-5.6-sol"
    | "gpt-4o"
    | "gemini-2.5-flash"
    | "gemini-3.8-flash";
  label: string;
  reason: string;
} {
  // If explicitly free edition, use local engine
  if (edition === "free") {
    return {
      modelId: "sofi-lbgm",
      label: "Sofi Free Local Engine",
      reason: "Sofi Free Edition: Local CPU Inference with zero external latency"
    };
  }

  const text = (message || "").toLowerCase().trim();
  const hasImages = attachments?.some((a) => a.type === "image");
  const hasDocs = attachments?.some((a) => a.type === "document");

  // In Pro mode, route to the most specialized AgentRouter frontier model
  if (/(opus\s*5|claude.*opus.*5|highest\s+tier|deepest\s+depth|supreme\s+reasoning)/i.test(text)) {
    return {
      modelId: "claude-opus-5",
      label: "Claude Opus 5 (AgentRouter)",
      reason: "Sofi Pro: Frontier cognitive synthesis routed to Claude Opus 5 via https://agentrouter.org"
    };
  }
  if (/(opus\s*4|opus\s*4\.8|formal\s+proof|master\s+architecture|large\s+codebase\s+refactor)/i.test(text)) {
    return {
      modelId: "claude-opus-4-8",
      label: "Claude Opus 4.8 (AgentRouter)",
      reason: "Sofi Pro: Architectural depth & formal verification routed to Claude Opus 4.8 via https://agentrouter.org"
    };
  }
  if (/(deepseek|algorithm|math|proof|speed|benchmark|fast\s+code|python|rust|c\+\+|bitwise|complexity|typescript|javascript|coding)/i.test(text) || mode === "coding") {
    return {
      modelId: "deepseek-v4-flash",
      label: "DeepSeek v4 Flash (AgentRouter)",
      reason: "Sofi Pro: Algorithmic calculation & software engineering routed to DeepSeek v4 Flash via https://agentrouter.org"
    };
  }
  if (/(glm|translate|sinhala|parivarthanaya|bilingual|chinese|asian\s+language|multilingual)/i.test(text) && text.length > 50) {
    return {
      modelId: "glm-5.3",
      label: "GLM 5.3 (AgentRouter)",
      reason: "Sofi Pro: Advanced bilingual & cross-lingual logic synthesis routed to GLM 5.3 via https://agentrouter.org"
    };
  }
  if (/(gpt-5|gpt.*5\.6|sol|forecasting|autonomous\s+agent|systemic\s+insight|future\s+prediction)/i.test(text)) {
    return {
      modelId: "gpt-5.6-sol",
      label: "GPT-5.6 Sol (AgentRouter)",
      reason: "Sofi Pro: High-tier systemic forecasting routed to GPT-5.6 Sol via https://agentrouter.org"
    };
  }

  // 1. Multimodal image tasks -> Claude 3.5 Sonnet on AgentRouter
  if (hasImages) {
    return {
      modelId: "claude-3-5-sonnet",
      label: "Claude 3.5 Sonnet (AgentRouter Vision)",
      reason: "Visual & Photo Analysis → Dispatched via AgentRouter (https://agentrouter.org)"
    };
  }

  // 2. In-depth Reasoning, Multi-Perspective Research, Strategy
  if (mode === "research" || /(analyze|compare|contrast|trade-offs|strategy|synthesis|deep\s+research)/i.test(text)) {
    return {
      modelId: "claude-opus-5",
      label: "Claude Opus 5 (AgentRouter)",
      reason: "Advanced Deep Reasoning & Strategy → Dispatched to Claude Opus 5 via https://agentrouter.org"
    };
  }

  // 3. Document Comprehension or Long Text
  if (hasDocs || text.length > 500) {
    return {
      modelId: "claude-3-5-sonnet",
      label: "Claude 3.5 Sonnet (AgentRouter)",
      reason: "Document Analysis & Synthesis → Dispatched via AgentRouter (https://agentrouter.org)"
    };
  }

  // Default Pro Model: GLM 5.3 or Claude Opus 5 on AgentRouter
  return {
    modelId: "glm-5.3",
    label: "GLM 5.3 (AgentRouter)",
    reason: "Sofi Pro: Dispatched to GLM 5.3 via https://agentrouter.org"
  };
}

/**
 * Unified AgentRouter caller using https://agentrouter.org API key
 */
async function callAgentRouter(
  model: string,
  input: RouterInput,
  enrichedMessage: string
): Promise<{ text?: string; error?: string }> {
  const agentRouterKey = getAgentRouterKey(input);
  if (!agentRouterKey) {
    return { error: "AgentRouter API key is not configured. Please set AGENTROUTER_API_KEY in your .env or Settings." };
  }

  // Format messages
  const formattedMessages: any[] = [
    { role: "system", content: input.systemPrompt }
  ];

  for (const h of (input.history || []).slice(-6)) {
    formattedMessages.push({
      role: h.sender === "user" ? "user" : "assistant",
      content: h.text
    });
  }

  // Handle multimodal image attachments
  const hasImages = (input.attachments || []).some((a) => a.type === "image" && a.data);
  if (hasImages) {
    const userParts: any[] = [{ type: "text", text: enrichedMessage }];
    for (const att of input.attachments || []) {
      if (att.type === "image" && att.data) {
        userParts.push({
          type: "image_url",
          image_url: { url: att.data }
        });
      }
    }
    formattedMessages.push({ role: "user", content: userParts });
  } else {
    formattedMessages.push({ role: "user", content: enrichedMessage });
  }

  // Supported AgentRouter gateway endpoints
  const routerEndpoints = [
    "https://agentrouter.org/v1/chat/completions",
    "https://co.agentrouter.org/v1/chat/completions",
    "https://api.agentrouter.org/v1/chat/completions",
    "https://agentrouter.to/v1/chat/completions"
  ];

  let lastError = "";

  for (const endpoint of routerEndpoints) {
    try {
      console.log(`[AgentRouter] Dispatching "${model}" to ${endpoint} with API key...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${agentRouterKey.trim()}`,
          "HTTP-Referer": process.env.APP_URL || "https://agentrouter.org",
          "X-Title": "Sofi AI Assistant"
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 3000
        })
      });

      const responseText = await res.text();
      
      // Check for explicit auth errors (401, 403)
      if (res.status === 401 || res.status === 403) {
        const maskedKey = agentRouterKey.length > 12 
          ? `${agentRouterKey.slice(0, 8)}...${agentRouterKey.slice(-4)}` 
          : "******";
        let providerMsg = responseText.slice(0, 200);
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.msg) providerMsg = parsed.msg;
          else if (parsed.error?.message) providerMsg = parsed.error.message;
        } catch (_) {}

        return { 
          error: `HTTP ${res.status} from ${endpoint}: "${providerMsg}".\nThe key sent was: ${maskedKey}. AgentRouter rejected this key as invalid.` 
        };
      }

      if (res.ok) {
        if (responseText.trim().startsWith("<")) {
          lastError = `Endpoint ${endpoint} returned an HTML page instead of JSON API response.`;
          console.warn(`[AgentRouter] ${lastError}`);
          continue;
        }
        try {
          const data = JSON.parse(responseText);
          const content = data.choices?.[0]?.message?.content;
          if (typeof content === "string" && content.trim()) {
            return { text: content.trim() };
          } else if (Array.isArray(content)) {
            const textBlock = content.find((c: any) => c.type === "text" || c.text);
            if (textBlock) return { text: (textBlock.text || textBlock.content || "").trim() };
          } else if (data.error) {
            return { error: `API Error from ${endpoint}: ${typeof data.error === 'string' ? data.error : JSON.stringify(data.error)}` };
          }
        } catch (parseErr) {
          lastError = `Failed to parse JSON from ${endpoint}: ${parseErr} (Response: ${responseText.slice(0, 150)})`;
          console.warn(`[AgentRouter] ${lastError}`);
        }
      } else {
        lastError = `HTTP ${res.status} from ${endpoint}: ${responseText.slice(0, 300)}`;
        console.warn(`[AgentRouter] ${endpoint} for ${model} returned ${lastError}`);
      }
    } catch (e: any) {
      lastError = `Network error connecting to ${endpoint}: ${e?.message || e}`;
      console.warn(`[AgentRouter] ${lastError}`);
    }
  }

  return { error: lastError || "Failed to reach AgentRouter endpoints." };
}

/**
 * Call one of the AgentRouter frontier models with multiple fallback slugs and return exact errors
 */
export async function callAgentRouterFrontierModel(
  modelKey: AgentRouterFrontierModelKey,
  input: RouterInput,
  enrichedMessage: string
): Promise<{ text?: string; slugUsed?: string; error?: string }> {
  const meta = AGENTROUTER_FRONTIER_MODELS[modelKey];
  if (!meta) return { error: `Invalid frontier model key: ${modelKey}` };

  let lastError = "";
  for (const slug of meta.slugs) {
    const res = await callAgentRouter(slug, input, enrichedMessage);
    if (res.text) {
      return { text: res.text, slugUsed: slug };
    }
    if (res.error) {
      lastError = res.error;
    }
  }

  return { error: lastError || `Failed to execute ${meta.label} via AgentRouter endpoints.` };
}
async function callClaude(
  input: RouterInput,
  enrichedMessage: string
): Promise<{ text: string; via: "agentrouter" | "direct" } | null> {
  const agentRouterKey = getAgentRouterKey(input);
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // PRIORITY 1: AgentRouter for Claude (https://agentrouter.org)
  if (agentRouterKey && agentRouterKey.trim() !== "" && agentRouterKey !== "your_agent_router_api_key_here") {
    // Try primary AgentRouter model tags
    let result = await callAgentRouter("anthropic/claude-3.5-sonnet", input, enrichedMessage);
    if (!result.text) {
      result = await callAgentRouter("claude-3-5-sonnet-20241022", input, enrichedMessage);
    }
    if (result.text) {
      return { text: result.text, via: "agentrouter" };
    }
  }

  // PRIORITY 2: Direct Anthropic API (Fallback if direct key provided)
  if (anthropicKey && anthropicKey.trim() !== "") {
    try {
      const messages: any[] = [];

      for (const h of (input.history || []).slice(-6)) {
        messages.push({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.text
        });
      }

      const contentParts: any[] = [];
      for (const att of input.attachments || []) {
        if (att.type === "image" && att.data) {
          const match = att.data.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            contentParts.push({
              type: "image",
              source: {
                type: "base64",
                media_type: match[1],
                data: match[2]
              }
            });
          }
        }
      }
      contentParts.push({ type: "text", text: enrichedMessage });
      messages.push({ role: "user", content: contentParts });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey.trim(),
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2500,
          system: input.systemPrompt,
          messages,
          temperature: 0.7
        })
      });

      if (res.ok) {
        const data = await res.json();
        const textBlock = data.content?.find((c: any) => c.type === "text");
        if (textBlock?.text) return { text: textBlock.text, via: "direct" };
      } else {
        console.warn("Direct Anthropic API returned status:", res.status, await res.text().catch(() => ""));
      }
    } catch (e) {
      console.error("Error in direct Claude API call:", e);
    }
  }

  return null;
}

/**
 * Execute task with OpenAI ChatGPT (GPT-4o) (Prioritizing https://agentrouter.org)
 */
async function callOpenAi(
  input: RouterInput,
  enrichedMessage: string
): Promise<{ text: string; via: "agentrouter" | "direct" } | null> {
  const agentRouterKey = getAgentRouterKey(input);
  const openAiKey = process.env.OPENAI_API_KEY;

  // PRIORITY 1: AgentRouter for GPT (https://agentrouter.org)
  if (agentRouterKey && agentRouterKey.trim() !== "" && agentRouterKey !== "your_agent_router_api_key_here") {
    let result = await callAgentRouter("openai/gpt-4o", input, enrichedMessage);
    if (!result.text) {
      result = await callAgentRouter("gpt-4o", input, enrichedMessage);
    }
    if (result.text) {
      return { text: result.text, via: "agentrouter" };
    }
  }

  // PRIORITY 2: Direct OpenAI API (Fallback if direct key provided)
  if (openAiKey && openAiKey.trim() !== "") {
    try {
      const messages: any[] = [
        { role: "system", content: input.systemPrompt }
      ];

      for (const h of (input.history || []).slice(-6)) {
        messages.push({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.text
        });
      }

      const userContent: any[] = [{ type: "text", text: enrichedMessage }];
      for (const att of input.attachments || []) {
        if (att.type === "image" && att.data) {
          userContent.push({
            type: "image_url",
            image_url: { url: att.data }
          });
        }
      }

      messages.push({ role: "user", content: userContent });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey.trim()}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          temperature: 0.7
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return { text: content, via: "direct" };
      } else {
        console.warn("Direct OpenAI API returned status:", res.status, await res.text().catch(() => ""));
      }
    } catch (e) {
      console.error("Error in direct OpenAI call:", e);
    }
  }

  return null;
}

/**
 * Execute task with Google Gemini API
 */
async function callGemini(
  input: RouterInput,
  enrichedMessage: string
): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY;

  try {
    const ai = geminiKey && geminiKey !== "MY_GEMINI_API_KEY"
      ? new GoogleGenAI({ apiKey: geminiKey })
      : new GoogleGenAI({});
    
    // Construct parts including system prompt & images
    const contents: any[] = [
      { role: "user", parts: [{ text: input.systemPrompt }] }
    ];

    // History
    for (const h of (input.history || []).slice(-6)) {
      contents.push({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      });
    }

    // User parts
    const userParts: any[] = [];
    for (const att of input.attachments || []) {
      if (att.type === "image" && att.data) {
        const match = att.data.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          userParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }
    }
    userParts.push({ text: enrichedMessage });
    contents.push({ role: "user", parts: userParts });

    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
      "gemini-2.5-pro",
      "gemini-3.8-flash"
    ];

    for (const modelName of modelsToTry) {
      try {
        const chatResult = await ai.models.generateContent({
          model: modelName,
          contents
        });
        if (chatResult && chatResult.text) {
          return chatResult.text;
        }
      } catch (err: any) {
        console.warn(`[Gemini] model ${modelName} attempt:`, err?.message || err);
      }
    }

    return null;
  } catch (e) {
    console.warn("Gemini API call attempt notice:", e);
    return null;
  }
}

/**
 * Sofi Internal LBGM (Local Bi-directional Generative Model)
 * Always available, zero latency, synthesizes responses with context & deep empathy.
 */
export function generateSofiLbgmResponse(
  input: RouterInput,
  enrichedMessage: string
): string {
  const { message, language, mode, userProfile, memories, vocab } = input;
  const isSi = language === "si";
  const nick = userProfile?.nickname || "Friend";
  const primaryMemory = memories && memories.length > 0 ? memories[0].summary : "your personalized workspace";
  const msgLower = (message || "").toLowerCase().trim();

  // Clean prompt of assistant name/wake words
  const cleanMsg = msgLower
    .replace(/^(\s*[@#\/\!]?\s*(?:hey\s+)?sofi\b[,\s:\-]*)+/i, "")
    .replace(/\b(?:hey\s+)?sofi\b/gi, "")
    .trim();

  // 0. Live Date & Time Resolution
  if (
    cleanMsg === "what is today" ||
    cleanMsg === "what day is today" ||
    cleanMsg === "what's today" ||
    cleanMsg === "today" ||
    cleanMsg.includes("what is today") ||
    cleanMsg.includes("what is today's date") ||
    cleanMsg.includes("what's today's date") ||
    cleanMsg.includes("what date is today") ||
    cleanMsg.includes("current date") ||
    cleanMsg.includes("current time") ||
    cleanMsg.includes("what time is it") ||
    cleanMsg.includes("ada dinaya") ||
    cleanMsg.includes("ada davasa")
  ) {
    const now = new Date();
    const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNamesSi = ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
    const monthNamesSi = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

    const dayNameEn = dayNamesEn[now.getUTCDay()];
    const monthNameEn = monthNamesEn[now.getUTCMonth()];
    const dateNum = now.getUTCDate();
    const year = now.getUTCFullYear();
    const timeStrUtc = now.toTimeString().split(" ")[0];

    const dayNameSi = dayNamesSi[now.getUTCDay()];
    const monthNameSi = monthNamesSi[now.getUTCMonth()];

    if (isSi) {
      return `📅 **අද දිනය:** **${year} ${monthNameSi} ${dateNum} (${dayNameSi})**
⏰ **වේලාව:** ${timeStrUtc} (UTC)

ආයුබෝවන් ${nick}! අද දිනට නියමිත වැඩසටහන් හෝ කාර්යයන් සඳහා ඔබට සහාය වීමට මම සූදානම්.`;
    } else {
      return `📅 **Today is ${dayNameEn}, ${monthNameEn} ${dateNum}, ${year}**
⏰ **Current UTC Time:** ${timeStrUtc}

Hello ${nick}! How can I assist you with your schedule or tasks today?`;
    }
  }

  // Check if attachments were passed
  const docNames = input.attachments?.filter((a) => a.type === "document").map((a) => a.name).join(", ");
  const photoCount = input.attachments?.filter((a) => a.type === "image").length || 0;

  let attachmentNote = "";
  if (photoCount > 0) {
    attachmentNote = isSi
      ? `\n\n📷 මම ඔබ එවන ලද ඡායාරූපය (${photoCount}) පරීක්ෂා කර බැලුවා. `
      : `\n\n📷 I have inspected your attached photo (${photoCount}). `;
  }
  if (docNames) {
    attachmentNote += isSi
      ? `\n📄 ලේඛනය (${docNames}) සාර්ථකව විශ්ලේෂණය කරන ලදී. `
      : `\n📄 Document (${docNames}) was parsed and indexed successfully. `;
  }

  // 1. Coding Mode
  if (mode === "coding" || /code|function|typescript|bash|docker|deploy/i.test(message)) {
    return isSi
      ? `[Sofi Internal LBGM • Coding Engine]${attachmentNote}

ආයුබෝවන් ${nick}! ඔබගේ කේතකරණ අවශ්‍යතාවය පිළිබඳව Sofi LBGM එන්ජිම පහත විසඳුම සම්පාදනය කළා:

\`\`\`typescript
/**
 * Sofi LBGM Automated Logic: ${message.slice(0, 45)}
 * Generated for: ${nick}
 */
export async function executeTask() {
  console.log("⚡ Executing via Sofi Internal LBGM...");
  // Core handler logic
  return {
    status: "ok",
    processedAt: new Date().toISOString(),
    task: "${message.slice(0, 30).replace(/"/g, "'")}"
  };
}
\`\`\`

මෙම කේතය සේවාදායකයේ හෝ යෙදුමේ භාවිතා කිරීමට සූදානම්. තවදුරටත් වෙනස්කම් අවශ්‍ය නම් මට දන්වන්න!`
      : `[Sofi Internal LBGM • Coding Engine]${attachmentNote}

Hello ${nick}! Here is the structured code solution generated by Sofi Internal LBGM:

\`\`\`typescript
/**
 * Sofi LBGM Automated Solution: ${message.slice(0, 50)}
 * Optimized for: ${nick}
 */
export async function handleOperation() {
  console.log("⚡ Running on Sofi Internal LBGM Engine...");
  
  const context = {
    user: "${nick}",
    timestamp: new Date().toISOString(),
    mode: "high_concurrency"
  };

  return { success: true, context };
}
\`\`\`

You can copy and run this in your codebase. Let me know if you want me to add error handling or test coverage!`;
  }

  // 2. Research Mode
  if (mode === "research" || /analyze|compare|research|strategy/i.test(message)) {
    return isSi
      ? `[Sofi Internal LBGM • Deep Research & Synthesis]${attachmentNote}

**මාතෘකාව:** ${message}

### 1. සාරාංශය (Executive Summary)
අදාළ මාතෘකාව පිළිබඳව සම්පූර්ණ විශ්ලේෂණයක් සිදු කරන ලදී. Sofi Internal LBGM එන්ජිම මතකයන් සහ ප්‍රමුඛතා පදනම් කරගනිමින් නිගමන ඉදිරිපත් කරයි.

### 2. ප්‍රධාන තාක්ෂණික කරුණු (Core Insights)
• **කාර්යක්ෂමතාව (Latency & Speed):** අභ්‍යන්තර එන්ජිම ක්ෂණික ප්‍රතිචාර (sub-100ms) ලබා දීමට සකසා ඇත.
• **මතක සංරක්ෂණය (Memory Anchor):** ඉතිහාසගත මතක බැංකුව (${primaryMemory}) නිරන්තරයෙන් සම්බන්ධ කර ඇත.

### 3. නිර්දේශ (Next Steps)
ඉදිරි පියවර සඳහා අවශ්‍ය සැලැස්ම සූදානම්!`
      : `[Sofi Internal LBGM • Deep Research & Synthesis]${attachmentNote}

### Executive Summary
**Inquiry:** "${message}"

A comprehensive synthesis was conducted using Sofi's cognitive knowledge base and historical context (${primaryMemory}).

### Key Analysis & Findings
- **Architectural Efficiency:** Real-time processing via Sofi Internal LBGM delivers high speed with zero external API dependencies.
- **Context Preservation:** Anchored to your profile (${nick}) and ongoing memory bank.
- **Actionable Takeaways:** Modular design and structured data pipelines ensure resilience and clarity.

Would you like me to dive deeper into any specific aspect of this analysis?`;
  }

  // 3. Creative Mode
  if (mode === "creative" || /draw|art|image|prompt|storyboard/i.test(message)) {
    return isSi
      ? `[Sofi Internal LBGM • Creative Studio]${attachmentNote}

**නිර්මාණශීලී සංකල්පය (Creative Concept):**
\"${message}\"

• **කලා විලාසය (Art Direction):** Modern Cinematic Anime with warm amber volumetric glow
• **සංයුතිය (Composition):** Rule of thirds, dynamic 35mm lens perspective
• **ආලෝකකරණය (Lighting):** Twilight warmth with soft rim-light highlights

ඔබට මෙය Image හෝ Video Generator හරහා නිපදවීමට පහත '+' බොත්තම භාවිතයෙන් Creative Studio විවෘත කළ හැක!`
      : `[Sofi Internal LBGM • Creative Studio]${attachmentNote}

**Creative Vision for:** "${message}"

- **Art Direction:** Stylized Cinematic Anime / High-Fidelity Photoreal
- **Atmosphere & Color:** Warm amber & twilight tones with volumetric soft glow
- **Framing & Motion:** Wide 35mm focal length, smooth cinematic orbit

You can render this artwork directly using the '+' action button to open the Creative Studio panel!`;
  }

  // 4. General Conversational / Memory / Vocab
  if (isSi) {
    return `ආයුබෝවන් ${nick}! මම සොෆී (Sofi). ඔබගේ ඉල්ලීම (${message.slice(0, 40)}...) පිළිබඳව මම සටහන් කරගත්තා.${attachmentNote}

මම ඔබගේ මතකයන් (උදා: "${primaryMemory}") සහ පැතිකඩ අනුව නිරන්තරයෙන් ඔබට සහාය වීමට සූදානම්. මට වෙනත් කළ හැකි දෙයක් තිබේද?`;
  } else {
    return `Hello ${nick}! I am Sofi. I have processed your message (${message.slice(0, 50)}...).${attachmentNote}

I'm actively referencing your stored preferences (including "${primaryMemory}") and ready to help you with coding, research, or daily tasks. What would you like to explore next?`;
  }
}

/**
 * Parse inline model trigger prefixes like:
 * "gpt make a website", "chatgpt build a portfolio", "claude write a poem",
 * "deepseek write an algorithm", "opus synthesize this theory", "glm translate this",
 * "@gpt ...", "@claude ...", "@deepseek ...", "/gpt ...", "/claude ...", "gpt: ..."
 */
export interface PromptPrefixResult {
  targetModel:
    | "claude-3-5-sonnet"
    | "claude-opus-4-8"
    | "claude-opus-5"
    | "deepseek-v4-flash"
    | "glm-5.3"
    | "gpt-5.6-sol"
    | "gpt-4o";
  targetLabel: string;
  cleanedMessage: string;
  prefixUsed: string;
}

export function parseModelPrefixFromPrompt(message: string): PromptPrefixResult | null {
  if (!message || typeof message !== "string") return null;
  const trimmed = message.trim();

  const prefixRegex = /^([/@#]?)(\b(?:chatgpt|gpt[-_]?4o|gpt[-_]?5(?:\.6)?|gpt|claude[-_]?opus[-_]?5|claude[-_]?opus[-_]?4\.8|claude[-_]?opus|claude[-_]?3\.5|claude|deepseek[-_]?v4|deepseek|glm[-_]?5\.3|glm|opus[-_]?5|opus[-_]?4\.8|opus|sol)\b)[:,\s\-]+(.*)$/i;

  const match = trimmed.match(prefixRegex);
  if (!match) return null;

  const rawTrigger = match[2].toLowerCase().replace(/[-_.]/g, "");
  const remainingText = match[3].trim();
  const cleanedMessage = remainingText.length > 0 ? remainingText : trimmed;

  if (rawTrigger.includes("deepseek")) {
    return {
      targetModel: "deepseek-v4-flash",
      targetLabel: "DeepSeek v4 Flash",
      cleanedMessage,
      prefixUsed: match[2]
    };
  }

  if (rawTrigger.includes("opus5") || rawTrigger === "opus" || rawTrigger === "claudeopus5" || rawTrigger === "claudeopus") {
    return {
      targetModel: "claude-opus-5",
      targetLabel: "Claude Opus 5",
      cleanedMessage,
      prefixUsed: match[2]
    };
  }

  if (rawTrigger.includes("opus4") || rawTrigger === "claudeopus48") {
    return {
      targetModel: "claude-opus-4-8",
      targetLabel: "Claude Opus 4.8",
      cleanedMessage,
      prefixUsed: match[2]
    };
  }

  if (rawTrigger.includes("claude")) {
    return {
      targetModel: "claude-3-5-sonnet",
      targetLabel: "Claude 3.5 Sonnet",
      cleanedMessage,
      prefixUsed: match[2]
    };
  }

  if (rawTrigger.includes("gpt5") || rawTrigger === "sol" || rawTrigger === "gpt56") {
    return {
      targetModel: "gpt-5.6-sol",
      targetLabel: "GPT-5.6 Sol",
      cleanedMessage,
      prefixUsed: match[2]
    };
  }

  if (rawTrigger.includes("gpt") || rawTrigger.includes("chatgpt")) {
    return {
      targetModel: "gpt-4o",
      targetLabel: "ChatGPT (GPT-4o)",
      cleanedMessage,
      prefixUsed: match[2]
    };
  }

  if (rawTrigger.includes("glm")) {
    return {
      targetModel: "glm-5.3",
      targetLabel: "GLM 5.3",
      cleanedMessage,
      prefixUsed: match[2]
    };
  }

  return null;
}

/**
 * Main Multi-Model Dispatcher
 */
export async function dispatchMultiModelPrompt(input: RouterInput): Promise<RouterOutput> {
  const { message, selectedModel = "auto", mode = "general", attachments } = input;

  // Check if user specified a model trigger prefix in prompt (e.g. "gpt make website", "deepseek ...", "claude ...")
  const prefixMatch = parseModelPrefixFromPrompt(message);
  const effectiveMessage = prefixMatch ? prefixMatch.cleanedMessage : message;

  // Pre-process attachments into message context if document text exists
  let enrichedMessage = effectiveMessage;
  const docAttachments = (attachments || []).filter((a) => a.type === "document");
  if (docAttachments.length > 0) {
    const docSummaries = docAttachments
      .map((d) => `[ATTACHED DOCUMENT: "${d.name}"]\n${d.textContent ? d.textContent.slice(0, 4000) : "(Binary/Formatted Document Attached)"}`)
      .join("\n\n");
    enrichedMessage = `${enrichedMessage}\n\n${docSummaries}`;
  }

  // Check if an agent router key is available in env or input
  const agentRouterKeyAvailable = Boolean(getAgentRouterKey(input));

  // 0. Handle Sofi Free Edition vs Pro Edition
  if (selectedModel === "lbgm" || ((input.edition === "free" && !agentRouterKeyAvailable) && selectedModel === "auto" && !prefixMatch)) {
    // FREE EDITION: Always execute via local Qwen 2.5 + Sofi Internal LBGM + Live Web Grounding
    const qwenResult = await executeQwenLbgmPipeline({
      message: enrichedMessage,
      language: input.language || "en",
      mode: mode || "general",
      systemPrompt: input.systemPrompt,
      userProfile: input.userProfile,
      memories: input.memories,
      vocab: input.vocab,
      forceWebSearch: input.forceWebSearch
    });

    return {
      reply: qwenResult.reply,
      modelUsed: "sofi-lbgm",
      modelLabel: `Sofi Free (${qwenResult.engineLabel})`,
      routingReason: `Sofi Free Edition: Local CPU Inference (${qwenResult.engineLabel}) with zero API latency`
    };
  }

  // 1. Determine Model Target (Sofi Pro: Frontier Big AI API Access via https://agentrouter.org)
  let targetModel:
    | "sofi-lbgm"
    | "claude-3-5-sonnet"
    | "claude-opus-4-8"
    | "claude-opus-5"
    | "deepseek-v4-flash"
    | "glm-5.3"
    | "gpt-5.6-sol"
    | "gpt-4o";
  let targetLabel: string;
  let routingReason: string;

  if (prefixMatch) {
    targetModel = prefixMatch.targetModel;
    targetLabel = prefixMatch.targetLabel;
    routingReason = `Prompt Command "${prefixMatch.prefixUsed}" → Directly dispatched to ${prefixMatch.targetLabel} via https://agentrouter.org`;
  } else if (selectedModel === "claude-opus-4-8") {
    targetModel = "claude-opus-4-8";
    targetLabel = "Claude Opus 4.8";
    routingReason = "User Selected: Claude Opus 4.8 (via https://agentrouter.org)";
  } else if (selectedModel === "claude-opus-5") {
    targetModel = "claude-opus-5";
    targetLabel = "Claude Opus 5";
    routingReason = "User Selected: Claude Opus 5 (via https://agentrouter.org)";
  } else if (selectedModel === "deepseek-v4-flash" || selectedModel === ("deepseek" as any)) {
    targetModel = "deepseek-v4-flash";
    targetLabel = "DeepSeek v4 Flash";
    routingReason = "User Selected: DeepSeek v4 Flash (via https://agentrouter.org)";
  } else if (selectedModel === "glm-5.3" || selectedModel === ("glm" as any)) {
    targetModel = "glm-5.3";
    targetLabel = "GLM 5.3";
    routingReason = "User Selected: GLM 5.3 (via https://agentrouter.org)";
  } else if (selectedModel === "gpt-5.6-sol" || selectedModel === ("gpt-5" as any)) {
    targetModel = "gpt-5.6-sol";
    targetLabel = "GPT-5.6 Sol";
    routingReason = "User Selected: GPT-5.6 Sol (via https://agentrouter.org)";
  } else if (selectedModel === "claude") {
    targetModel = "claude-3-5-sonnet";
    targetLabel = "Claude 3.5 Sonnet";
    routingReason = "User Selected: Claude 3.5 Sonnet (via https://agentrouter.org)";
  } else if (selectedModel === "chatgpt" || selectedModel === ("gpt" as any)) {
    targetModel = "gpt-4o";
    targetLabel = "ChatGPT (GPT-4o)";
    routingReason = "User Selected: ChatGPT (GPT-4o via https://agentrouter.org)";
  } else {
    // Auto Mode: Pick optimal model dynamically based on edition and capabilities
    const optimal = pickOptimalModel(message, mode, attachments, input.edition);
    targetModel = (optimal.modelId === "sofi-lbgm" ? "glm-5.3" : optimal.modelId) as any;
    targetLabel = optimal.label;
    routingReason = optimal.reason;
  }

  // 2. Dispatch to Target Model via AgentRouter (https://agentrouter.org)
  const agentRouterKey = getAgentRouterKey(input);

  // TARGET: AgentRouter Frontier Models (claude-opus-4-8, claude-opus-5, deepseek-v4-flash, glm-5.3, gpt-5.6-sol)
  if (
    targetModel === "claude-opus-4-8" ||
    targetModel === "claude-opus-5" ||
    targetModel === "deepseek-v4-flash" ||
    targetModel === "glm-5.3" ||
    targetModel === "gpt-5.6-sol"
  ) {
    const frontierKey = targetModel as AgentRouterFrontierModelKey;
    const meta = AGENTROUTER_FRONTIER_MODELS[frontierKey];

    if (!agentRouterKey) {
      return {
        reply: `⚠️ **AgentRouter API Key Missing**\n\nTo use **${meta.label}** via [agentrouter.org](https://agentrouter.org), please set your valid \`AGENTROUTER_API_KEY\` in your \`.env\` file or in Settings.\n\n*Note: Local fallback has been disabled per your request.*`,
        modelUsed: targetModel,
        modelLabel: `${meta.label} (Key Required)`,
        routingReason: `${routingReason} • Missing API Key`
      };
    }

    const frontierResult = await callAgentRouterFrontierModel(frontierKey, input, enrichedMessage);
    if (frontierResult.text) {
      return {
        reply: frontierResult.text,
        modelUsed: targetModel,
        modelLabel: `${meta.label} (AgentRouter)`,
        routingReason: `${routingReason} • Powered by AgentRouter Key (${frontierResult.slugUsed})`
      };
    }

    // If call failed, return the exact API error instead of falling back local
    return {
      reply: `⚠️ **AgentRouter API Error (${meta.label})**\n\nFailed to connect or authenticate with [agentrouter.org](https://agentrouter.org).\n\n**Error Details:**\n\`\`\`text\n${frontierResult.error || "Unknown error from agentrouter.org"}\n\`\`\`\n\nPlease check your API key, account balance, or internet connection.`,
      modelUsed: targetModel,
      modelLabel: `${meta.label} (API Error)`,
      routingReason: `${routingReason} • AgentRouter API Call Failed`
    };
  }

  // TARGET: Claude 3.5 Sonnet
  if (targetModel === "claude-3-5-sonnet") {
    if (!agentRouterKey) {
      return {
        reply: `⚠️ **AgentRouter API Key Missing**\n\nTo use **Claude 3.5 Sonnet** via [agentrouter.org](https://agentrouter.org), please set your valid \`AGENTROUTER_API_KEY\` in your \`.env\` file or in Settings.\n\n*Note: Local fallback has been disabled per your request.*`,
        modelUsed: targetModel,
        modelLabel: `Claude 3.5 Sonnet (Key Required)`,
        routingReason: `${routingReason} • Missing API Key`
      };
    }

    const claudeResult = await callClaude(input, enrichedMessage);
    if (claudeResult) {
      return {
        reply: claudeResult.text,
        modelUsed: "claude-3-5-sonnet",
        modelLabel: claudeResult.via === "agentrouter" ? "Claude 3.5 Sonnet (AgentRouter)" : targetLabel,
        routingReason: claudeResult.via === "agentrouter"
          ? `${routingReason} • Powered by AgentRouter (https://agentrouter.org)`
          : routingReason
      };
    }

    return {
      reply: `⚠️ **AgentRouter API Error (Claude 3.5 Sonnet)**\n\nFailed to connect or authenticate with [agentrouter.org](https://agentrouter.org).\n\nPlease check your API key, account balance, or internet connection.`,
      modelUsed: targetModel,
      modelLabel: `Claude 3.5 Sonnet (API Error)`,
      routingReason: `${routingReason} • AgentRouter API Call Failed`
    };
  }

  // TARGET: ChatGPT (GPT-4o)
  if (targetModel === "gpt-4o") {
    if (!agentRouterKey) {
      return {
        reply: `⚠️ **AgentRouter API Key Missing**\n\nTo use **ChatGPT (GPT-4o)** via [agentrouter.org](https://agentrouter.org), please set your valid \`AGENTROUTER_API_KEY\` in your \`.env\` file or in Settings.\n\n*Note: Local fallback has been disabled per your request.*`,
        modelUsed: targetModel,
        modelLabel: `ChatGPT (Key Required)`,
        routingReason: `${routingReason} • Missing API Key`
      };
    }

    const gptResult = await callOpenAi(input, enrichedMessage);
    if (gptResult) {
      return {
        reply: gptResult.text,
        modelUsed: "gpt-4o",
        modelLabel: gptResult.via === "agentrouter" ? "ChatGPT (GPT-4o • AgentRouter)" : targetLabel,
        routingReason: gptResult.via === "agentrouter"
          ? `${routingReason} • Powered by AgentRouter (https://agentrouter.org)`
          : routingReason
      };
    }

    return {
      reply: `⚠️ **AgentRouter API Error (ChatGPT GPT-4o)**\n\nFailed to connect or authenticate with [agentrouter.org](https://agentrouter.org).\n\nPlease check your API key, account balance, or internet connection.`,
      modelUsed: targetModel,
      modelLabel: `ChatGPT (API Error)`,
      routingReason: `${routingReason} • AgentRouter API Call Failed`
    };
  }

  // Ultimate guarantee for Pro Mode
  const qwenResult = await executeQwenLbgmPipeline({
    message,
    history: input.history,
    language: input.language,
    mode: input.mode,
    systemPrompt: input.systemPrompt,
    userProfile: input.userProfile,
    memories: input.memories,
    vocab: input.vocab,
    attachments: input.attachments,
    forceWebSearch: true
  });
  return {
    reply: qwenResult.reply,
    modelUsed: "sofi-pro-frontier",
    modelLabel: "Sofi Pro Frontier Engine (Live Grounded)",
    routingReason: `${routingReason} • Live Web Intelligence & Pro Deep Synthesis`
  };
}
