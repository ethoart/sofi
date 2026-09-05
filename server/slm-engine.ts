import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const USER_PROFILE_FILE = path.join(DATA_DIR, "user_profile.json");
export const SOFI_PROFILE_FILE = path.join(DATA_DIR, "sofi_profile.json");
export const MEMORIES_FILE = path.join(DATA_DIR, "memories.json");
export const VOCAB_FILE = path.join(DATA_DIR, "language_vocab.json");

export function readJsonSafe<T>(filePath: string, defaultVal: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}`, e);
  }
  return defaultVal;
}

export function writeJsonSafe(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error writing ${filePath}`, e);
  }
}

// Ensure default User Profile exists
export function initUserProfile() {
  const existing = readJsonSafe(USER_PROFILE_FILE, null);
  if (!existing) {
    const defaultProfile = {
      id: "user-default",
      name: "User",
      nickname: "Friend",
      bio: "Software developer and technology enthusiast building with Sofi AI on AWS.",
      occupation: "Engineer & Creator",
      language: "en",
      interests: ["AI agents", "Cloud architecture", "Sinhala NLP", "Automation"],
      goals: ["Automate daily tasks with voice", "Build custom skills for AWS EC2", "Learn and teach language nuances"],
      preferences: {
        voiceSpeed: 1.0,
        voicePitch: 1.0,
        formality: "balanced",
        autoSpeak: true
      },
      customInstructions: "Call me by my nickname when appropriate. Remind me of ongoing tasks and keep answers concise and helpful.",
      updatedAt: new Date().toISOString()
    };
    writeJsonSafe(USER_PROFILE_FILE, defaultProfile);
    return defaultProfile;
  }
  return existing;
}

// Ensure default Sofi Profile exists
export function initSofiProfile() {
  const existing = readJsonSafe(SOFI_PROFILE_FILE, null);
  if (!existing) {
    const defaultSofi = {
      name: "Sofi",
      tagline: "Your Empathetic & Autonomous Multi-Purpose AI Companion",
      archetype: "Intelligent, Warm, Autonomous Assistant",
      temperament: "Helpful, proactive, caring, and technically adept",
      systemDirective: "Assist the user with tasks, remember their preferences, execute AWS & local operations reliably, and speak fluently in English and Sinhala.",
      speechVoice: "Google UK English Female / Natural Sinhala",
      avatarUrl: "/sofi-logo.jpg",
      capabilities: [
        "Continuous Background Voice & Wake Word ('Sofi' / 'සොෆී')",
        "Small Language Model (SLM) Cognitive Intent Engine",
        "Persistent Long-Term Memory & User Profiling",
        "Voice-Driven Language & Vocabulary Learning",
        "AWS t3.small Host Management & SSH Execution",
        "Model Context Protocol (MCP) Server Integration"
      ],
      updatedAt: new Date().toISOString()
    };
    writeJsonSafe(SOFI_PROFILE_FILE, defaultSofi);
    return defaultSofi;
  }
  return existing;
}

// Ensure default memories exist
export function initMemories() {
  const existing = readJsonSafe(MEMORIES_FILE, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    const initialMemories = [
      {
        id: "mem-1",
        category: "personal_fact",
        summary: "User operates Sofi on a dedicated cloud instance",
        detail: "User manages server infrastructure and personalized AI pipelines.",
        source: "profile",
        learnedAt: new Date(Date.now() - 86400000).toISOString(),
        usageCount: 4
      },
      {
        id: "mem-2",
        category: "preference",
        summary: "Prefers bilingual English and Sinhala voice interaction",
        detail: "User activates Sofi using voice wake words 'Sofi' or 'සොෆී'.",
        source: "voice_command",
        learnedAt: new Date(Date.now() - 43200000).toISOString(),
        usageCount: 7
      },
      {
        id: "mem-3",
        category: "task_rule",
        summary: "Keep client interface focused without admin clutter",
        detail: "User prefers the client portal to behave like a clean conversational AI app, with server admin isolated in /sofiadmin.",
        source: "learned",
        learnedAt: new Date().toISOString(),
        usageCount: 2
      }
    ];
    writeJsonSafe(MEMORIES_FILE, initialMemories);
    return initialMemories;
  }
  return existing;
}

// Ensure default vocabulary exists
export function initVocab() {
  const existing = readJsonSafe(VOCAB_FILE, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    const initialVocab = [
      {
        id: "voc-1",
        term: "ආයුබෝවන් (Ayubowan)",
        translation: "May you live long / Formal Sinhala Greeting",
        language: "sinhala",
        sampleUsage: "ආයුබෝවන්! මම සොෆී, ඔබේ කෘතිම බුද්ධි සහායිකාවයි.",
        learnedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "voc-2",
        term: "ස්තූතියි (Sthuthiyi)",
        translation: "Thank you",
        language: "sinhala",
        sampleUsage: "ඔබට බොහොම ස්තූතියි!",
        learnedAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: "voc-3",
        term: "සොෆී (Sofi)",
        translation: "Sofi AI assistant name in Sinhala script",
        language: "sinhala",
        sampleUsage: "සොෆී, අද දවසේ කාලගුණය කොහොමද?",
        learnedAt: new Date().toISOString()
      }
    ];
    writeJsonSafe(VOCAB_FILE, initialVocab);
    return initialVocab;
  }
  return existing;
}

// Sofi's Internal Cognitive SLM: Detects learning commands and facts in user input
export interface SlmAnalysisResult {
  intent: "chat" | "learn_memory" | "learn_vocab" | "query_memory" | "query_profile";
  extractedMemory?: {
    category: "personal_fact" | "preference" | "task_rule" | "language_word" | "conversation_highlight";
    summary: string;
    detail: string;
  };
  extractedVocab?: {
    term: string;
    translation: string;
    sampleUsage?: string;
  };
  matchedMemories: any[];
  relevantVocab: any[];
  localReply?: string;
}

export function analyzePromptWithSlm(prompt: string, language: "en" | "si"): SlmAnalysisResult {
  const text = (prompt || "").trim();
  const lower = text.toLowerCase();
  
  const allMemories = readJsonSafe(MEMORIES_FILE, []);
  const allVocab = readJsonSafe(VOCAB_FILE, []);
  const userProfile = readJsonSafe<any>(USER_PROFILE_FILE, { name: "User", nickname: "Friend", occupation: "Creator" });

  // 1. Check for explicit "remember" or "learn" commands
  // Examples:
  // "Remember that I like coffee"
  // "Please remember my favorite color is teal"
  // "Learn this: ..."
  // "Don't forget that ..."
  // "මතක තබාගන්න: ..."
  const rememberRegex = /^(?:please\s+)?(?:remember\s+that|remember\s+this|remember|keep\s+in\s+mind\s+that|don't\s+forget\s+that|note\s+that|save\s+to\s+memory|මතක\s+තබාගන්න|මතක\s+තියාගන්න)\s*[:,\-]?\s*(.+)$/i;
  const rememberMatch = text.match(rememberRegex);

  if (rememberMatch && rememberMatch[1]) {
    const rawFact = rememberMatch[1].trim();
    const isPreference = /like|love|prefer|favorite|enjoy|hate|dislike|කැමතියි|ආසයි/i.test(rawFact);
    const category = isPreference ? "preference" : "personal_fact";

    const newMem = {
      id: "mem-" + crypto.randomBytes(4).toString("hex"),
      category: category as any,
      summary: rawFact.length > 60 ? rawFact.slice(0, 57) + "..." : rawFact,
      detail: rawFact,
      source: "voice_command" as const,
      learnedAt: new Date().toISOString(),
      usageCount: 1
    };

    // Save to persistent database
    const updatedMemories = [newMem, ...allMemories.slice(0, 49)];
    writeJsonSafe(MEMORIES_FILE, updatedMemories);

    const localReply = language === "si"
      ? `මම එය සටහන් කරගත්තා! "${rawFact}" මගේ මතක ගබඩාවට එකතු කළා. ඉදිරි කටයුතු වලදී මම මෙය මතක තබා ගන්නම්.`
      : `I have committed that to my long-term memory! Saved: "${rawFact}". I will remember this in our future conversations and tasks.`;

    return {
      intent: "learn_memory",
      extractedMemory: newMem,
      matchedMemories: [newMem],
      relevantVocab: [],
      localReply
    };
  }

  // 2. Check for explicit vocabulary learning
  // Examples:
  // "Learn this word: kohomada means how are you"
  // "Learn Sinhala word: ස්තූතියි means thank you"
  // "Learn word: X = Y"
  const vocabRegex = /^(?:learn\s+(?:the\s+)?(?:word|phrase|vocab|language|sinhala\s+word|term))\s*[:,\-]?\s*([^=\-:]+?)\s*(?:means|=|is|තේරුම)\s*(.+)$/i;
  const vocabMatch = text.match(vocabRegex);

  if (vocabMatch && vocabMatch[1] && vocabMatch[2]) {
    const term = vocabMatch[1].trim();
    const translation = vocabMatch[2].trim();

    const newVocab = {
      id: "voc-" + crypto.randomBytes(4).toString("hex"),
      term,
      translation,
      language: /[\u0D80-\u0DFF]/.test(term) ? "sinhala" as const : "english" as const,
      sampleUsage: `${term} (${translation})`,
      learnedAt: new Date().toISOString()
    };

    const updatedVocab = [newVocab, ...allVocab.slice(0, 49)];
    writeJsonSafe(VOCAB_FILE, updatedVocab);

    // Also add to memory bank
    const newMem = {
      id: "mem-" + crypto.randomBytes(4).toString("hex"),
      category: "language_word" as const,
      summary: `Learned word: ${term} = ${translation}`,
      detail: `Vocabulary term '${term}' translates to '${translation}'.`,
      source: "voice_command" as const,
      learnedAt: new Date().toISOString(),
      usageCount: 1
    };
    writeJsonSafe(MEMORIES_FILE, [newMem, ...allMemories.slice(0, 49)]);

    const localReply = language === "si"
      ? `නව වචනයක් ඉගෙන ගත්තා! "${term}" හි තේරුම "${translation}". මගේ භාෂා ශබ්දකෝෂයට එය ඇතුළත් කළා.`
      : `Language learned! I have added "${term}" (meaning "${translation}") to my active vocabulary dictionary.`;

    return {
      intent: "learn_vocab",
      extractedVocab: newVocab,
      matchedMemories: [newMem],
      relevantVocab: [newVocab],
      localReply
    };
  }

  // 3. Check for query about memory / what Sofi knows about the user
  if (/what\s+(do\s+you\s+)?(remember|know)\s+about\s+me|tell\s+me\s+what\s+you\s+remember|show\s+my\s+memories|මාව\s+මතකද|මා\s+ගැන\s+දන්නේ\s+මොනවාද/i.test(lower)) {
    const recent = allMemories.slice(0, 5);
    let reply = "";
    if (language === "si") {
      reply = `මම ඔබ ගැන සහ ඔබේ රුචිකත්වයන් ගැන කරුණු රැසක් මතක තබාගෙන සිටිමි:\n\n` +
        recent.map((m: any, i: number) => `${i + 1}. ${m.summary}`).join("\n") +
        `\n\nඔබගේ නම: ${userProfile.name} (${userProfile.nickname}). ඔබට ඕනෑම වේලාවක මට නව තොරතුරු මතක් කර දිය හැකිය!`;
    } else {
      reply = `Here is what I currently remember about you in my persistent memory bank:\n\n` +
        recent.map((m: any, i: number) => `• **${m.category.toUpperCase()}**: ${m.detail}`).join("\n") +
        `\n\n**Profile**: ${userProfile.name} (${userProfile.nickname}) - ${userProfile.occupation}.\nI continuously utilize these historical memories to assist you with precision!`;
    }

    return {
      intent: "query_memory",
      matchedMemories: recent,
      relevantVocab: [],
      localReply: reply
    };
  }

  // 4. Find relevant memories to inject into LLM context
  const words = lower.split(/\s+/).filter(w => w.length > 3);
  const matchedMemories = allMemories.filter((m: any) => {
    const memText = (m.summary + " " + m.detail).toLowerCase();
    return words.some(w => memText.includes(w));
  }).slice(0, 4);

  // Find relevant vocabulary
  const relevantVocab = allVocab.filter((v: any) => {
    const vText = (v.term + " " + v.translation).toLowerCase();
    return words.some(w => vText.includes(w));
  }).slice(0, 3);

  return {
    intent: "chat",
    matchedMemories,
    relevantVocab
  };
}

// Build enriched prompt for Gemini / AgentRouter using user profile & historical memories
export function buildEnrichedSystemPrompt(language: "en" | "si", slmAnalysis: SlmAnalysisResult): string {
  const userProfile = readJsonSafe(USER_PROFILE_FILE, initUserProfile());
  const sofiProfile = readJsonSafe(SOFI_PROFILE_FILE, initSofiProfile());
  const allMemories = readJsonSafe(MEMORIES_FILE, initMemories());
  const allVocab = readJsonSafe(VOCAB_FILE, initVocab());

  const memoryHighlights = allMemories.slice(0, 6).map((m: any) => `- [${m.category}] ${m.detail}`).join("\n");
  const vocabHighlights = allVocab.slice(0, 6).map((v: any) => `- ${v.term}: ${v.translation}`).join("\n");

  return `You are ${sofiProfile.name}, ${sofiProfile.tagline}.
Archetype: ${sofiProfile.archetype}.
Temperament: ${sofiProfile.temperament}.
System Directive: ${sofiProfile.systemDirective}

YOU ARE RUNNING REAL TASKS WITH ADVANCED MULTI-MODEL CAPABILITIES (CLAUDE, CHATGPT, GEMINI, AND SOFI INTERNAL LBGM).
YOU ARE NOT A SIMULATOR. EVERYTHING YOU DO IS GROUNDED IN REAL EXECUTIONS, PERSISTENT MEMORIES, AND USER CONTEXT.

Current User Profile:
- Name: ${userProfile.name} (Call them: "${userProfile.nickname}")
- About/Bio: ${userProfile.bio}
- Occupation: ${userProfile.occupation}
- Preferred Language: ${language === "si" ? "Sinhala (සිංහල)" : "English"}
- Interests: ${userProfile.interests?.join(", ") || "Tech, AI"}
- Personal Goals: ${userProfile.goals?.join(", ") || "Productivity, Learning"}
- Formality Level: ${userProfile.preferences?.formality || "balanced"}
- User Custom Instructions: "${userProfile.customInstructions || "Be concise and empathetic."}"

Persistent Historical Memories about the user:
${memoryHighlights || "No memories stored yet."}

Learned Language Vocabulary & Nuances:
${vocabHighlights || "Standard vocabulary."}

CRITICAL OPERATIONAL RULES:
1. Embody Sofi with high empathy, intelligence, and warmth.
2. If language is Sinhala ('si'), speak natural, expressive, grammatically sound Sinhala with modern vocabulary.
3. If language is English ('en'), speak with clarity, technical elegance, and warmth.
4. When the user asks you to help them or do a task, reference their historical memories and personal profile when appropriate so they feel genuinely remembered.
5. If the user tells you to remember something or teaches you a word, acknowledge it warmly and confirm it has been saved to your long-term memory bank.
6. The user has access to an isolated admin dashboard at '/sofiadmin' with SSH access to the AWS server for maintenance. On this client portal, maintain an elegant, personal AI companion atmosphere.`;
}
