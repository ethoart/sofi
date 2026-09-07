import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Languages, Brain, User, 
  CheckCircle2, ArrowRight, MessageSquare, History, Radio, BookmarkPlus,
  Menu, Plus, Smartphone, Code2, Microscope, Palette, QrCode, Copy, Check,
  Paperclip, Image as ImageIcon, FileText, X, ChevronDown, Cpu, Bot, UploadCloud,
  LogOut, PanelRight, PanelRightClose, Globe, Search, Settings, Zap, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Message, UserProfile, SofiProfile, MemoryItem, LanguageVocab, 
  AuthUser, ChatSession, SpecializedMode, Attachment, SupportedAiModel, SofiEdition
} from "../types";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { MemoryBankDrawer } from "./MemoryBankDrawer";
import { SideMenu } from "./SideMenu";
import { SettingsModal } from "./SettingsModal";
import { SkillsMenuModal } from "./SkillsMenuModal";
import { MobileApkModal } from "./MobileApkModal";
import { CreativeStudioPanel } from "./CreativeStudioPanel";
import { BrowserExtensionModal } from "./BrowserExtensionModal";
import { BrowserSidebarCompanion } from "./BrowserSidebarCompanion";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface ClientPortalProps {
  onNavigateToAdmin?: () => void;
  language: "en" | "si";
  setLanguage: (lang: "en" | "si") => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  onNavigateToAdmin,
  language,
  setLanguage,
  currentUser,
  onLogout
}) => {
  // Profiles & Memories State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sofiProfile, setSofiProfile] = useState<SofiProfile | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [vocab, setVocab] = useState<LanguageVocab[]>([]);

  // Navigation & Modals State
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMemoryBankOpen, setIsMemoryBankOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isSidebarDocked, setIsSidebarDocked] = useState(false);
  const [isCreativeOpen, setIsCreativeOpen] = useState(false);
  const [creativeInitialType, setCreativeInitialType] = useState<"image" | "video">("image");

  // Sofi Edition State: Free (Local Qwen + LBGM) vs Pro (Frontier Big AI APIs)
  const [sofiEdition, setSofiEdition] = useState<SofiEdition>(() => {
    return (localStorage.getItem("sofi_edition") as SofiEdition) || "free";
  });

  const handleSelectEdition = (edition: SofiEdition) => {
    setSofiEdition(edition);
    localStorage.setItem("sofi_edition", edition);
  };

  // Multi-Model Routing (User selectable & auto server-side intelligence)
  const [selectedModel, setSelectedModel] = useState<SupportedAiModel>("auto");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);

  const handleCopyMessageText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2200);
  };

  const handleCopyCodeText = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 2200);
  };

  // Document & Photo Upload State
  const [stagedAttachments, setStagedAttachments] = useState<Attachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Specialized Chat Mode (General, Coding, Research, Creative)
  const [activeMode, setActiveMode] = useState<SpecializedMode>("general");
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

  // Sessions & Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Voice Interaction State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [speechInterim, setSpeechInterim] = useState("");

  // Notification for newly learned facts/words
  const [learnedNotification, setLearnedNotification] = useState<{ title: string; detail: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper to build initial greeting based on mode
  const getGreetingForMode = (mode: SpecializedMode, lang: "en" | "si", nick?: string) => {
    const nameStr = nick ? ` ${nick}` : "";
    if (mode === "coding") {
      return lang === "si"
        ? `ආයුබෝවන්${nameStr}! Sofi Coding & DevOps Studio වෙත සාදරයෙන් පිළිගනිමු. මම AWS සේවාදායකයේ TypeScript, Python, Bash විධාන සහ Docker කළමනාකරණය කිරීමට සූදානම්. ඔබට අවශ්‍ය කේතය හෝ ගැටලුව කුමක්ද?`
        : `Hello${nameStr}! Welcome to Sofi Coding & DevOps Studio. I'm connected to the AWS t3.small host and ready to assist with TypeScript, backend APIs, Bash scripts, and software architecture. What are we building or debugging today?`;
    }
    if (mode === "research") {
      return lang === "si"
        ? `ආයුබෝවන්${nameStr}! Sofi Deep Research & Analysis වෙත සාදරයෙන් පිළිගනිමු. ගැඹුරු තාක්ෂණික වාර්තා, සංසන්දනාත්මක විශ්ලේෂණ හා ක්‍රමානුකූල පර්යේෂණ සඳහා මා සූදානම්.`
        : `Hello${nameStr}! Welcome to Sofi Deep Research Workspace. I conduct comprehensive multi-angle investigations, technical syntheses, and architectural breakdowns. What topic or system should I investigate?`;
    }
    if (mode === "creative") {
      return lang === "si"
        ? `ආයුබෝවන්${nameStr}! Sofi Creative Studio වෙත සාදරයෙන් පිළිගනිමු. AI පින්තූර හා වීඩියෝ නිෂ්පාදනය සඳහා පහත '+' බොත්තම හෝ විස්තරාත්මක prompts භාවිතා කරන්න!`
        : `Hello${nameStr}! Welcome to Sofi Creative Studio. You can generate custom AI artwork, character concepts, and 4K video motion storyboards using the '+' button or direct descriptive prompts.`;
    }
    return lang === "si"
      ? `ආයුබෝවන්${nameStr}! මම සොෆී (Sofi). මම ඔබගේ පෞද්ගලික පැතිකඩ සහ ඉතිහාසගත මතකයන් මත පදනම්ව ඔබට උදව් කිරීමට සූදානම්. ඕනෑම දෙයක් අසන්න!`
      : `Hello${nameStr}! I am Sofi, your intelligent AI companion. I'm actively remembering your preferences, profile details, and historical interactions to assist you with precision. How can I help you today?`;
  };

  // Fetch initial profiles, memories, and chat sessions
  const loadData = async () => {
    try {
      const [uRes, sRes, mRes, vRes, chatsRes] = await Promise.all([
        fetch("/api/profile/user").then(r => r.json()),
        fetch("/api/profile/sofi").then(r => r.json()),
        fetch("/api/memories").then(r => r.json()),
        fetch("/api/vocab").then(r => r.json()),
        fetch("/api/chats", {
          headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
        }).then(r => r.json())
      ]);
      setUserProfile(uRes);
      setSofiProfile(sRes);
      setMemories(mRes);
      setVocab(vRes);

      if (Array.isArray(chatsRes) && chatsRes.length > 0) {
        setSessions(chatsRes);
        // Load the first or most recent session
        const current = chatsRes[0];
        setActiveSessionId(current.id);
        setActiveMode(current.mode || "general");
        setMessages(current.messages || []);
      } else {
        // Create initial session
        startNewChat("general", uRes?.nickname);
      }
    } catch (err) {
      console.error("Error loading profile/memory data:", err);
      if (messages.length === 0) {
        startNewChat("general");
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Create a brand new chat session
  const startNewChat = (modeToUse: SpecializedMode = activeMode, nick?: string) => {
    const newId = "chat-" + Date.now();
    const initialMsg: Message = {
      id: "welcome-" + Date.now(),
      sender: "sofi",
      text: getGreetingForMode(modeToUse, language, nick || userProfile?.nickname),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newSession: ChatSession = {
      id: newId,
      title: modeToUse === "coding" 
        ? "New Coding Session" 
        : modeToUse === "research" 
        ? "New Research Session" 
        : modeToUse === "creative" 
        ? "New Creative Session" 
        : "New Conversation",
      mode: modeToUse,
      messages: [initialMsg],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setActiveSessionId(newId);
    setActiveMode(modeToUse);
    setMessages([initialMsg]);
    setSessions((prev) => [newSession, ...prev]);

    // Save session to MongoDB
    fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSession)
    }).catch(console.error);

    if (window.innerWidth < 1024) {
      setIsSideMenuOpen(false);
    }
  };

  // Switch session from history
  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setActiveMode(session.mode || "general");
    setMessages(session.messages || []);
    if (window.innerWidth < 1024) {
      setIsSideMenuOpen(false);
    }
  };

  // Delete session from history
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chats/${sessionId}`, { method: "DELETE" });
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          handleSelectSession(updated[0]);
        } else {
          startNewChat(activeMode);
        }
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  // Switch specialized mode
  const handleSwitchMode = (newMode: SpecializedMode) => {
    setActiveMode(newMode);
    startNewChat(newMode);
  };

  // Focus input on mount and keep continuous
  useEffect(() => {
    chatInputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, speechInterim]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = isWakeWordActive;
      rec.interimResults = true;
      rec.lang = language === "si" ? "si-LK" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setSpeechInterim(interim);

        if (final) {
          setSpeechInterim("");
          const cleanFinal = final.trim();

          // Wake-word checking
          if (isWakeWordActive) {
            const lower = cleanFinal.toLowerCase();
            if (lower.includes("sofi") || lower.includes("සොෆී") || lower.includes("hey sofi") || lower.includes("හේ සොෆී")) {
              const command = cleanFinal.replace(/hey sofi|sofi|හේ සොෆී|සොෆී/gi, "").trim();
              if (command.length > 0) {
                handleSendMessage(command);
              } else {
                speakText(language === "si" ? "ඔව්, මම අහගෙන ඉන්නේ." : "Yes, I am listening.");
              }
            }
          } else {
            handleSendMessage(cleanFinal);
            setIsListening(false);
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("Speech recognition error:", event.error);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        if (isWakeWordActive) {
          try {
            rec.start();
          } catch (e) {
            // Already started or busy
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, [language, isWakeWordActive]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(language === "si" ? "ඔබගේ බ්‍රවුසරය හඬ හඳුනාගැනීමට සහය නොදක්වයි." : "Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Mic start failed:", err);
      }
    }
  };

  const toggleWakeWordMode = () => {
    const nextState = !isWakeWordActive;
    setIsWakeWordActive(nextState);
    if (nextState) {
      try {
        recognitionRef.current?.start();
      } catch (e) {}
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  // Voice Initialization & Female Priority Selection
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const selectBestFemaleVoice = (voices: SpeechSynthesisVoice[], lang: "en" | "si"): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;

    const femaleKeywords = [
      "zira", "samantha", "karen", "victoria", "jenny", "aria", "susan", "eva",
      "female", "natural", "catherine", "hazel", "heera", "moira", "fiona", "tessa",
      "google uk english female", "google us english female", "serena", "alva", "clara",
      "stephanie", "zoe", "allison", "ava", "siri"
    ];

    const maleKeywords = [
      "david", "george", "mark", "james", "richard", "guy", "brian", "daniel",
      "alex", "fred", "ralph", "oliver", "tom", "ravi", "male", "man", "boy",
      "microsoft david", "microsoft george", "microsoft mark", "microsoft richard"
    ];

    // If Sinhala
    if (lang === "si") {
      const siMatch = voices.find(v => (v.lang.includes("si") || v.lang.includes("LK")) && !maleKeywords.some(m => v.name.toLowerCase().includes(m)));
      if (siMatch) return siMatch;
    }

    // Direct female named match
    for (const kw of femaleKeywords) {
      const match = voices.find(v => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }

    // English voice that is NOT male
    const nonMaleEn = voices.find(v => 
      v.lang.startsWith("en") && !maleKeywords.some(m => v.name.toLowerCase().includes(m))
    );
    if (nonMaleEn) return nonMaleEn;

    // General non-male
    const nonMaleAny = voices.find(v => !maleKeywords.some(m => v.name.toLowerCase().includes(m)));
    if (nonMaleAny) return nonMaleAny;

    return voices[0] || null;
  };

  useEffect(() => {
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
          const femaleVoice = selectBestFemaleVoice(v, language);
          if (femaleVoice) {
            setSelectedVoice(femaleVoice);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, [language]);

  // Text-To-Speech with guaranteed female voice selection and sweet pitch
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Strip markdown code blocks before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*`_~]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "si" ? "si-LK" : "en-US";
    utterance.rate = userProfile?.preferences?.voiceSpeed || 1.0;
    utterance.pitch = userProfile?.preferences?.voicePitch || 1.25; // Distinctive sweet feminine tone

    // Apply cached or detected female voice
    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = selectedVoice || selectBestFemaleVoice(voices, language);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleTestFemaleVoice = () => {
    setIsMuted(false);
    const testPhrase = language === "si" 
      ? "ආයුබෝවන්! මම සොෆී. මගේ ස්වභාවික කාන්තා හඬ දැන් සක්‍රියයි." 
      : "Hello! I am Sofi. My natural female voice is now active and ready.";
    speakText(testPhrase);
  };

  // Handle File Selection (Photos, Documents, PDF, Code)
  const handleFiles = async (fileList: FileList | File[]) => {
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" is larger than 25MB.`);
        continue;
      }

      const id = "att-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newAttachments.push({
          id,
          name: file.name,
          type: "image",
          mimeType: file.type || "image/jpeg",
          data: dataUrl,
          size: file.size
        });
      } else {
        const isText = file.type.includes("text") || 
          /\.(txt|md|json|csv|js|ts|jsx|tsx|py|html|css|xml|yml|yaml|sql|sh|log)$/i.test(file.name);
        if (isText) {
          const textContent = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
          });
          newAttachments.push({
            id,
            name: file.name,
            type: "document",
            mimeType: file.type || "text/plain",
            textContent,
            size: file.size
          });
        } else {
          // Binary doc like PDF, Word, etc.
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newAttachments.push({
            id,
            name: file.name,
            type: "document",
            mimeType: file.type || "application/octet-stream",
            data: dataUrl,
            size: file.size
          });
        }
      }
    }
    setStagedAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Send Message with Attachments & Multi-Model Intelligence
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    const currentAttachments = [...stagedAttachments];
    const hasText = !!text;
    const hasAttachments = currentAttachments.length > 0;

    if ((!hasText && !hasAttachments) || isTyping) return;

    const userMsgText = hasText 
      ? text 
      : (language === "si" ? "අමුණා ඇති ලේඛන / ඡායාරූප විශ්ලේෂණය කරන්න" : "Please analyze the attached document(s) / photo(s)");

    // Parse model mention with @ in the message text
    let activeModelToSend: SupportedAiModel = selectedModel;
    const mentionRegex = /@(\w+[-.\w]*)/i;
    const match = userMsgText.match(mentionRegex);
    if (match) {
      const mention = match[1].toLowerCase();
      let matchedModel: SupportedAiModel | null = null;
      if (mention === "auto" || mention === "autorouter") {
        matchedModel = "auto";
      } else if (mention === "gemini") {
        matchedModel = "gemini";
      } else if (mention === "gpt" || mention === "chatgpt" || mention === "gpt-4o") {
        matchedModel = "chatgpt";
      } else if (mention === "claude" || mention === "sonnet" || mention === "claude-3-5") {
        matchedModel = "claude";
      } else if (mention === "deepseek") {
        matchedModel = "deepseek-v4-flash";
      } else if (mention === "opus" || mention === "claude-opus") {
        matchedModel = "claude-opus-5";
      } else if (mention === "glm") {
        matchedModel = "glm-5.3";
      } else if (mention === "sol") {
        matchedModel = "gpt-5.6-sol";
      }

      if (matchedModel) {
        activeModelToSend = matchedModel;
        // Temporarily highlight the model state locally
        setSelectedModel(matchedModel);
      }
    }

    const userMsg: Message = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: userMsgText,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setStagedAttachments([]);
    setIsTyping(true);

    try {
      const storedAgentRouterKey = typeof window !== "undefined" ? localStorage.getItem("sofi_agentrouter_key") || "" : "";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          history: updatedMessages.slice(-8),
          language,
          mode: activeMode,
          edition: sofiEdition,
          sessionId: activeSessionId,
          selectedModel: activeModelToSend,
          attachments: currentAttachments,
          forceWebSearch: isWebSearchEnabled,
          agentRouterKey: storedAgentRouterKey || userProfile?.preferences?.agentRouterKey,

          userProfile: {
            ...userProfile,
            preferences: {
              ...(userProfile?.preferences || {}),
              agentRouterKey: storedAgentRouterKey || userProfile?.preferences?.agentRouterKey
            }
          }
        })
      });

      const data = await res.json();
      const sofiReply = data.reply || "I have analyzed your prompt.";

      const sofiMsg: Message = {
        id: "msg-" + Date.now() + 1,
        sender: "sofi",
        text: sofiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        matchedSkill: data.matchedSkill,
        modelUsed: data.modelUsed,
        modelLabel: data.modelLabel,
        routingReason: data.routingReason
      };

      const finalMessages = [...updatedMessages, sofiMsg];
      setMessages(finalMessages);

      // Auto-save session
      if (activeSessionId) {
        const titleSnippet = finalMessages.find(m => m.sender === "user")?.text.slice(0, 30) || "Conversation";
        const currentSession = sessions.find(s => s.id === activeSessionId);
        const sessionPayload: ChatSession = {
          id: activeSessionId,
          title: titleSnippet,
          mode: activeMode,
          messages: finalMessages,
          createdAt: currentSession?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionPayload)
        }).catch(console.error);

        // Update local session title
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: titleSnippet, messages: finalMessages } : s));
      }

      // If user taught a memory or vocab, reload and notify
      if (data.learnedFact) {
        setLearnedNotification({
          title: "Saved to Historical Memory Bank!",
          detail: data.learnedFact.summary
        });
        setTimeout(() => setLearnedNotification(null), 4000);
        loadData();
      } else if (data.learnedVocab) {
        setLearnedNotification({
          title: "New Language Word Learned!",
          detail: `${data.learnedVocab.term} = ${data.learnedVocab.translation}`
        });
        setTimeout(() => setLearnedNotification(null), 4000);
        loadData();
      }

      // Auto-speak if enabled in preferences
      if (userProfile?.preferences?.autoSpeak && !isMuted) {
        speakText(sofiReply);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: "msg-err-" + Date.now(),
        sender: "sofi",
        text: language === "si"
          ? "සමාවන්න, සම්බන්ධතාවයේ ගැටලුවක් මතු විය. කරුණාකර නැවත උත්සාහ කරන්න."
          : "Sorry, I encountered a temporary connection issue. Sofi local SLM fallback will assist you.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Skill Selection Callback from "+" button
  const handleSelectSkillAction = (action: string) => {
    if (action === "open-creative-image") {
      setCreativeInitialType("image");
      setIsCreativeOpen(true);
    } else if (action === "open-creative-video") {
      setCreativeInitialType("video");
      setIsCreativeOpen(true);
    } else if (action === "open-memory-drawer") {
      setIsMemoryBankOpen(true);
    } else if (action === "open-apk-modal") {
      setIsApkModalOpen(true);
    } else if (action === "upload-files") {
      fileInputRef.current?.click();
    }
  };

  // Insert generated media into chat
  const handleInsertMediaToChat = (mediaText: string) => {
    handleSendMessage(mediaText);
  };

  // Helper for rendering messages with code blocks and images
  const renderMessageContent = (text: string) => {
    // Check if markdown image ![alt](url)
    const imgMatch = text.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const url = imgMatch[2];
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-200/80">{alt}</p>
          <div className="rounded-2xl overflow-hidden border border-white/10 max-w-sm">
            <img src={url} alt={alt} className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      );
    }

    // Check if code block
    if (text.includes("```")) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return (
        <div className="space-y-2 select-text">
          {parts.map((part, i) => {
            if (part.startsWith("```")) {
              const lines = part.slice(3, -3).trim().split("\n");
              const lang = lines[0].trim();
              const code = lines.slice(1).join("\n");
              const codeKey = `code-${i}-${part.slice(0, 20)}`;
              const isCopied = copiedCodeKey === codeKey;

              return (
                <div key={i} className="my-2 rounded-2xl bg-[#0B0504] border border-white/10 overflow-hidden text-xs select-text">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#160B09] border-b border-white/5 font-mono text-[10px] text-amber-200/60">
                    <span className="font-semibold text-amber-300/80">{lang || "code"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCodeText(codeKey, code || lines.join("\n"))}
                      className="hover:text-white flex items-center gap-1 cursor-pointer transition text-amber-200/80"
                      title="Copy code to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto text-emerald-300 font-mono text-[11px] leading-relaxed select-text">
                    <code>{code || lines.join("\n")}</code>
                  </pre>
                </div>
              );
            }
            return <div key={i} className="whitespace-pre-wrap select-text">{part}</div>;
          })}
        </div>
      );
    }

    return <div className="whitespace-pre-wrap select-text">{text}</div>;
  };

  return (
    <div className="flex h-screen bg-[#0D0605] text-amber-100 font-sans overflow-hidden">
      {/* Hideable Left Side Menu (Requested by user) */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        currentUser={currentUser}
        activeSessionId={activeSessionId}
        sessions={sessions}
        activeMode={activeMode}
        currentEdition={sofiEdition}
        onNewChat={startNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onSelectMode={handleSwitchMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemoryDrawer={() => setIsMemoryBankOpen(true)}
        onOpenProfileDrawer={() => setIsProfileOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        onLogout={onLogout}
        language={language}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile / Web Top Navigation Header */}
        <header className="bg-[#160B09] border-b border-white/[0.08] px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-20 shrink-0">
          {/* Left: Hamburger Menu & Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200 border border-white/10 transition cursor-pointer"
              title="Toggle Left Menu"
            >
              <Menu className="w-4 h-4 text-[#FF8A50]" />
            </button>

            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border-2 border-[#FF6A3D] p-0.5 bg-[#251511] shadow-lg shadow-orange-500/20">
                <img src={sofiAvatar} alt="Sofi" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#160B09] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  {sofiProfile?.name || "Sofi AI"}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    const next = sofiEdition === "pro" ? "free" : "pro";
                    handleSelectEdition(next);
                  }}
                  className={`text-[9px] sm:text-[10px] border px-2.5 py-0.5 rounded-full font-bold font-mono transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    sofiEdition === "pro"
                      ? "bg-gradient-to-r from-[#FF6A3D] to-amber-500 text-white border-orange-400 hover:brightness-110"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  }`}
                  title={`Click to switch between Free and Pro (Currently: ${sofiEdition.toUpperCase()})`}
                >
                  <span>{sofiEdition === "pro" ? "✨ Pro Active" : "⚡ Free Active"}</span>
                  <span className="text-[8.5px] opacity-80 underline">Switch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1 text-amber-200/60 hover:text-amber-200 transition cursor-pointer"
                  title="Open Settings & Model Details"
                >
                  <Settings className="w-3 h-3" />
                </button>
              </div>

              {/* Mode indicator badge */}
              <div className="flex items-center gap-1.5 text-[10px] text-amber-200/60 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="capitalize font-bold text-[#FF8A50]">{activeMode} Mode</span>
                <span className="hidden md:inline text-amber-200/40">• {sofiEdition === "pro" ? "Big AI Gateway" : "Local Qwen & LBGM"}</span>
              </div>
            </div>
          </div>

          {/* Right: Workspaces pills & Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Mode Switcher (Desktop) */}
            <div className="hidden lg:flex items-center bg-[#120706] p-1 rounded-2xl border border-white/5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSwitchMode("general")}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === "general" ? "bg-[#FF6A3D] text-white shadow-sm" : "text-amber-200/60 hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>General</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("coding")}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === "coding" ? "bg-[#FF6A3D] text-white shadow-sm" : "text-amber-200/60 hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Coding</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("research")}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === "research" ? "bg-[#FF6A3D] text-white shadow-sm" : "text-amber-200/60 hover:text-white"
                }`}
              >
                <Microscope className="w-3.5 h-3.5" />
                <span>Research</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("creative")}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === "creative" ? "bg-[#FF6A3D] text-white shadow-sm" : "text-amber-200/60 hover:text-white"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Creative</span>
              </button>
            </div>

            {/* Mobile App APK Download Button (Requested with QR code) */}
            <button
              onClick={() => setIsApkModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FF6A3D]/10 hover:bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/30 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Download Mobile App APK via QR Code"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">APK</span>
              <QrCode className="w-3 h-3 text-[#FF8A50]" />
            </button>

            {/* Browser Extension Button */}
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FF6A3D]/10 hover:bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/30 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Sofi Browser Extension & Companion"
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Browser Ext</span>
            </button>

            {/* Language Selector */}
            <button
              onClick={() => setLanguage(language === "en" ? "si" : "en")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-200 rounded-xl border border-white/10 text-xs font-bold transition cursor-pointer"
              title="Toggle Language (English / සිංහල)"
            >
              <Languages className="w-3.5 h-3.5 text-[#FF6A3D]" />
              <span className="hidden sm:inline">{language === "en" ? "EN" : "සිංහල"}</span>
            </button>

            {/* Voice Audio Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }
                setIsMuted(!isMuted);
              }}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isMuted
                  ? "bg-white/5 border-white/10 text-amber-200/40"
                  : "bg-[#FF6A3D]/10 border-[#FF6A3D]/30 text-[#FF8A50]"
              }`}
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Floating Learned Notification */}
        <AnimatePresence>
          {learnedNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-18 right-6 z-40 bg-gradient-to-r from-emerald-900/90 to-[#140B09]/95 border border-emerald-500/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-md text-xs"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                <BookmarkPlus className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-extrabold text-white">{learnedNotification.title}</h5>
                <p className="text-emerald-200/80 text-[11px] mt-0.5">{learnedNotification.detail}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Conversational Workspace */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 md:py-6 max-w-4xl w-full mx-auto space-y-5">
          {/* Mode Welcome Banner */}
          {messages.length <= 1 && (
            <div className="bg-[#160B09] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6A3D]/20 border border-[#FF6A3D]/30 flex items-center justify-center text-[#FF6A3D]">
                  {activeMode === "coding" ? (
                    <Code2 className="w-5 h-5" />
                  ) : activeMode === "research" ? (
                    <Microscope className="w-5 h-5" />
                  ) : activeMode === "creative" ? (
                    <Palette className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {activeMode === "coding"
                      ? "Coding & DevOps Studio (AWS EC2)"
                      : activeMode === "research"
                      ? "Deep Research & Analysis"
                      : activeMode === "creative"
                      ? "Creative Studio & Media"
                      : "Personalized SLM Companion"}
                  </h3>
                  <p className="text-xs text-amber-200/60">
                    {activeMode === "coding"
                      ? "Specialized in software development, AWS host commands, and clean code"
                      : activeMode === "research"
                      ? "Structured technical reports, evidence synthesis, and architecture evaluations"
                      : activeMode === "creative"
                      ? "Generate AI artwork, prompts, and cinematic 4K video motion storyboards"
                      : "Voice-enabled companion learning your facts and Sinhala vocabulary"}
                  </p>
                </div>
              </div>

              {/* Quick Starters based on mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {(activeMode === "coding"
                  ? [
                      { text: "Write an AWS server status check script in TypeScript", label: "DevOps Script" },
                      { text: "Build a high-performance event bus with worker threads in Node.js", label: "Architecture Code" },
                      { text: "Build a secure token validation middleware for Express", label: "Backend API" },
                      { text: "Help me deploy a Docker container to AWS EC2", label: "Cloud Deployment" }
                    ]
                  : activeMode === "research"
                  ? [
                      { text: "Conduct a deep research report on SLM vs Large LLM latency", label: "System Research" },
                      { text: "Compare Claude 3.5 Sonnet vs GPT-4o for complex system reasoning", label: "Model Architecture" },
                      { text: "Multimodal AI benchmarks for document extraction and computer vision", label: "Multimodal AI" },
                      { text: "Provide a benchmark comparison of image generation models", label: "Model Benchmarks" }
                    ]
                  : activeMode === "creative"
                  ? [
                      { text: "Create an anime-style visual of Sofi in a neon server datacenter", label: "Anime Art" },
                      { text: "Generate a 4K cinematic video storyboard of a futuristic Colombo city", label: "Video Concept" },
                      { text: "Design a cyberpunk sticker mascot with glowing orange cat ears", label: "Visual Design" },
                      { text: "Craft high-detail image prompts for fantasy landscapes", label: "Prompt Engineering" }
                    ]
                  : [
                      { text: "Remember that I like morning coffee and working on cloud architecture", label: "Teach Preference" },
                      { text: "What do you remember about me in your historical memory bank?", label: "Check Memories" },
                      { text: "Learn word: ස්තූතියි means Thank you", label: "Teach Sinhala" },
                      { text: "Help me organize my tasks using my historical profile", label: "Personal Tasks" }
                    ]
                ).map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter.text)}
                    className="p-3 bg-[#1C120F] hover:bg-[#251814] border border-white/[0.08] hover:border-[#FF6A3D]/30 rounded-2xl text-left transition cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold text-[#FF8A50] uppercase tracking-wider block mb-1">
                      {starter.label}
                    </span>
                    <p className="text-xs text-white font-medium group-hover:text-amber-200 transition line-clamp-2">
                      "{starter.text}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Stream */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "sofi" && (
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#FF6A3D]/40 shrink-0 bg-[#251511] p-0.5 shadow-md">
                  <img src={sofiAvatar} alt="Sofi" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-3xl p-4 sm:p-4.5 space-y-2 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-[#FF6A3D] to-[#E5532B] text-white shadow-lg shadow-orange-500/10 rounded-tr-none"
                    : "bg-[#180E0B] border border-white/[0.08] text-amber-100 rounded-tl-none shadow-md"
                }`}
              >
                {/* Uploaded Attachments in message bubble */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id}>
                        {att.type === "image" && att.data ? (
                          <div className="rounded-xl overflow-hidden border border-white/20 max-w-[240px] bg-black/40">
                            <img src={att.data} alt={att.name} className="w-full max-h-48 object-cover rounded-xl" />
                            <div className="px-2 py-1 text-[10px] text-amber-200/70 truncate font-mono bg-black/60">
                              {att.name} ({Math.round(att.size / 1024)}KB)
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-black/40 border border-white/15 px-3 py-1.5 rounded-xl text-xs">
                            <FileText className="w-4 h-4 text-amber-300 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[180px]">{att.name}</p>
                              <span className="text-[10px] opacity-70 font-mono">{Math.round(att.size / 1024)}KB</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {renderMessageContent(msg.text)}

                {/* AI Model Dispatched Badge */}
                {msg.sender === "sofi" && msg.modelLabel && (
                  <div className="pt-1">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-amber-200/80">
                      {msg.modelUsed === "sofi-lbgm" && <span className="text-[#FF8A50] font-bold">⚡</span>}
                      {msg.modelUsed === "claude-3-5-sonnet" && <span className="text-indigo-400 font-bold">🧠</span>}
                      {msg.modelUsed === "gpt-4o" && <span className="text-emerald-400 font-bold">💡</span>}
                      {msg.modelUsed === "gemini-3.8-flash" && <span className="text-sky-400 font-bold">✨</span>}
                      <span className="font-semibold text-white">{msg.modelLabel}</span>
                    </div>
                  </div>
                )}

                {/* Matched Skill Badge if any */}
                {msg.matchedSkill && (
                  <div className="mt-2 text-[10px] font-mono bg-white/10 text-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit">
                    <Sparkles className="w-3 h-3 text-[#FF6A3D]" />
                    <span>Executed Skill: {msg.matchedSkill}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 pt-1 border-t border-white/5">
                  <span className="font-mono">{msg.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyMessageText(msg.id, msg.text)}
                      className="hover:opacity-100 transition cursor-pointer p-1 rounded-lg hover:bg-white/10 flex items-center gap-1 text-amber-200/80 hover:text-white"
                      title="Copy full text to clipboard"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                    {msg.sender === "sofi" && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="hover:opacity-100 transition cursor-pointer p-1 rounded-lg hover:bg-white/10 flex items-center gap-1 text-amber-200/80 hover:text-white"
                        title="Speak out loud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3.5 justify-start items-center">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#FF6A3D]/40 shrink-0 bg-[#251511] p-0.5">
                <img src={sofiAvatar} alt="Sofi" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
              </div>
              <div className="bg-[#180E0B] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#FF6A3D] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#FF6A3D] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#FF6A3D] animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-amber-200/50 ml-2 font-mono">
                  {activeMode === "coding"
                    ? (language === "si" ? "Sofi Auto-Intelligence: Coding & DevOps AI ක්‍රියාත්මකයි..." : "Sofi Auto-Intelligence: Routing to optimal code engine...")
                    : activeMode === "research"
                    ? (language === "si" ? "Sofi Auto-Intelligence: Deep Research & Strategy AI ක්‍රියාත්මකයි..." : "Sofi Auto-Intelligence: Routing to deep reasoning...")
                    : stagedAttachments.length > 0
                    ? (language === "si" ? "Sofi Auto-Intelligence: Multimodal Vision AI ක්‍රියාත්මකයි..." : "Sofi Auto-Intelligence: Routing to multimodal vision analysis...")
                    : (language === "si" ? "Sofi ස්වයංක්‍රීයව සුදුසුම AI Model එක තෝරාගනිමින් පිළිතුරු සකසයි..." : "Sofi Auto-Intelligence is selecting the optimal model & reasoning...")}
                </span>
              </div>
            </div>
          )}

          {/* Interim Speech Transcription Banner */}
          {speechInterim && (
            <div className="bg-[#FF6A3D]/10 border border-[#FF6A3D]/30 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-[#FF8A50]">
              <Radio className="w-4 h-4 animate-pulse shrink-0" />
              <span className="italic">Listening: "{speechInterim}"...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Dock with Upload, '+' Skill Button & Multi-Model Intelligence */}
        <div className="p-3 sm:p-5 bg-[#120706] border-t border-white/[0.08] shrink-0">
          <div className="max-w-4xl w-full mx-auto space-y-2">
            {/* Hidden File Input for Documents & Photos */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.csv,.ts,.js,.py,.html,.css,.sql,.sh,.log"
              className="hidden"
            />

            {/* Continuous Wake Word & Live Web Research Status Bar */}
            <div className="flex items-center justify-between text-[11px] text-amber-200/60 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleWakeWordMode}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition cursor-pointer border ${
                    isWakeWordActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-white/5 text-amber-200/50 border-white/10 hover:text-white"
                  }`}
                >
                  <Radio className={`w-3 h-3 ${isWakeWordActive ? "animate-pulse text-emerald-400" : ""}`} />
                  <span>
                    {isWakeWordActive ? "Wake-Word Active ('Sofi')" : "Enable Wake-Word"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition cursor-pointer border ${
                    isWebSearchEnabled
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                      : "bg-white/5 text-amber-200/50 border-white/10 hover:text-white"
                  }`}
                  title="Enable real-time live web research & source grounding"
                >
                  <Globe className={`w-3 h-3 ${isWebSearchEnabled ? "animate-spin text-cyan-400" : ""}`} />
                  <span>
                    {isWebSearchEnabled ? "Live Web Search: Active" : "Live Web Search: Auto"}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="text-[10px] text-amber-200/70 hover:text-white hidden sm:flex items-center gap-1.5 font-mono px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition cursor-pointer"
                title="Configure Sofi Edition & Models in Settings"
              >
                {sofiEdition === "pro" ? (
                  <>
                    <Zap className="w-3 h-3 text-[#FF8A50]" />
                    <span>Sofi Pro: Big AI Gateway</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3 h-3 text-emerald-400" />
                    <span>Sofi Free: Qwen + LBGM</span>
                  </>
                )}
              </button>
            </div>

            {/* Model @ Mention Auto-suggest list displayed only when typing "@" */}
            {sofiEdition === "pro" && inputText.includes("@") && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 px-1 no-scrollbar bg-[#120706] p-2 rounded-2xl border border-white/10 shadow-lg animate-in fade-in duration-200">
                <span className="text-[10px] font-mono text-[#FF8A50] shrink-0 font-bold uppercase tracking-wider mr-1">
                  Mention AI Model:
                </span>
                {[
                  { tag: "@auto", name: "Auto Router", shortcut: "auto" },
                  { tag: "@gemini", name: "Gemini", shortcut: "gemini" },
                  { tag: "@gpt", name: "ChatGPT 4o", shortcut: "gpt" },
                  { tag: "@claude", name: "Claude 3.5", shortcut: "claude" },
                  { tag: "@deepseek", name: "DeepSeek v4", shortcut: "deepseek" },
                  { tag: "@opus", name: "Claude Opus 5", shortcut: "opus" },
                  { tag: "@glm", name: "GLM 5.3", shortcut: "glm" },
                  { tag: "@sol", name: "GPT-5.6 Sol", shortcut: "sol" }
                ].map((m) => (
                  <button
                    key={m.tag}
                    type="button"
                    onClick={() => {
                      const lastAtIdx = inputText.lastIndexOf("@");
                      const prefix = inputText.substring(0, lastAtIdx);
                      setInputText(prefix + m.tag + " ");
                      chatInputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/5 hover:bg-[#FF6A3D]/20 text-amber-200 border border-white/10 hover:border-[#FF6A3D] transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span className="text-[#FF8A50] font-mono">{m.tag}</span>
                    <span className="text-[10px] text-white/50">({m.name})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Staged Attachments Preview Strip */}
            {stagedAttachments.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 px-1">
                {stagedAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 bg-[#1C100D] border border-white/15 px-2.5 py-1.5 rounded-xl text-xs text-amber-100 shrink-0 shadow-sm"
                  >
                    {att.type === "image" && att.data ? (
                      <img
                        src={att.data}
                        alt={att.name}
                        className="w-6 h-6 object-cover rounded-md border border-white/10"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-[#FF8A50]" />
                    )}
                    <span className="max-w-[130px] truncate font-medium">{att.name}</span>
                    <span className="text-[10px] text-amber-200/40 font-mono">
                      {Math.round(att.size / 1024)}KB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="hover:text-red-400 text-amber-200/50 p-0.5 rounded cursor-pointer transition"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStagedAttachments([])}
                  className="text-[11px] text-red-400/80 hover:text-red-300 font-bold px-2 py-1 bg-white/5 rounded-xl cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Rich Input Field with Upload, '+' and Send Button */}
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              className={`bg-[#1C100D] border rounded-3xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 shadow-2xl transition ${
                isDraggingOver 
                  ? "border-dashed border-2 border-[#FF6A3D] bg-[#FF6A3D]/10" 
                  : "border-white/10 focus-within:border-[#FF6A3D]"
              }`}
            >
              {/* '+' Skill Trigger Button (Requested by user) */}
              <button
                type="button"
                onClick={() => setIsSkillsModalOpen(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/5 hover:bg-[#FF6A3D]/20 text-[#FF8A50] border border-white/10 hover:border-[#FF6A3D]/40 flex items-center justify-center font-extrabold text-xl transition cursor-pointer shrink-0"
                title="Open Skills Menu (+ Image / Video Generation)"
              >
                +
              </button>

              {/* Upload Document / Photo Button (Requested by user) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border transition cursor-pointer shrink-0 ${
                  stagedAttachments.length > 0
                    ? "bg-[#FF6A3D]/20 border-[#FF6A3D]/50 text-[#FF8A50]"
                    : "bg-white/5 hover:bg-white/10 text-amber-200 border-white/10"
                }`}
                title="Upload documents and photos for AI prompt context"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Input Button */}
              <button
                onClick={toggleListening}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                    : "bg-white/5 hover:bg-white/10 text-amber-200"
                }`}
                title={isListening ? "Stop listening" : "Click to speak"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

               <input
                ref={chatInputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  sofiEdition === "pro"
                    ? (language === "si" ? "සොෆීගෙන් අසන්න (trigger කිරීමට @gpt, @claude, @deepseek, @opus ඇතුළත් කරන්න)..." : "Ask Sofi Pro (Type @gpt, @claude, @deepseek, @opus to trigger specific AI)...")
                    : (language === "si" ? "සොෆීගෙන් ඕනෑම දෙයක් අසන්න..." : "Ask Sofi anything...")
                }
                className="flex-1 bg-transparent text-xs sm:text-sm text-white px-2 focus:outline-none placeholder:text-amber-200/30 font-medium"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isTyping || (!inputText.trim() && stagedAttachments.length === 0)}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title="Send prompt with context"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Menu Popover / Sheet (Triggered by '+') */}
      <SkillsMenuModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        onSelectSkill={handleSelectSkillAction}
        onSelectMode={handleSwitchMode}
        language={language}
      />

      {/* Mobile App APK Download Modal with QR Code (Requested by user) */}
      <MobileApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        language={language}
      />

      {/* Browser Extension & Side Panel Modal */}
      <BrowserExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        language={language}
        onLaunchDockedSidebar={() => setIsSidebarDocked(true)}
      />

      {/* Docked Browser Sidebar Companion */}
      <BrowserSidebarCompanion
        isOpen={isSidebarDocked}
        onClose={() => setIsSidebarDocked(false)}
        language={language}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
      />

      {/* Creative Media Studio (Image & Video Generation) */}
      <CreativeStudioPanel
        isOpen={isCreativeOpen}
        initialType={creativeInitialType}
        onClose={() => setIsCreativeOpen(false)}
        onInsertToChat={handleInsertMediaToChat}
        language={language}
      />

      {/* User Profile & Sofi Profile Drawer */}
      {userProfile && sofiProfile && (
        <UserProfileDrawer
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userProfile={userProfile}
          sofiProfile={sofiProfile}
          onSaveUserProfile={async (updated) => {
            const res = await fetch("/api/profile/user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated)
            });
            if (res.ok) {
              const data = await res.json();
              setUserProfile(data.profile);
            }
          }}
          onSaveSofiProfile={async (updated) => {
            const res = await fetch("/api/profile/sofi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated)
            });
            if (res.ok) {
              const data = await res.json();
              setSofiProfile(data.profile);
            }
          }}
          onLogout={onLogout}
          language={language}
        />
      )}

      {/* Sofi Settings & Editions Modal (Free vs Pro) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        currentEdition={sofiEdition}
        onSelectEdition={handleSelectEdition}
        userProfile={userProfile || undefined}
        onSaveUserProfile={async (updated) => {
          const res = await fetch("/api/profile/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
          });
          if (res.ok) {
            const data = await res.json();
            setUserProfile(data.profile);
          }
        }}
        onOpenProfile={() => {
          setIsSettingsOpen(false);
          setIsProfileOpen(true);
        }}
        onOpenMemoryBank={() => {
          setIsSettingsOpen(false);
          setIsMemoryBankOpen(true);
        }}
      />

      {/* Historical Memory Bank Drawer */}
      <MemoryBankDrawer
        isOpen={isMemoryBankOpen}
        onClose={() => setIsMemoryBankOpen(false)}
        memories={memories}
        vocab={vocab}
        onAddMemory={async (mem) => {
          const res = await fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mem)
          });
          if (res.ok) loadData();
        }}
        onDeleteMemory={async (id) => {
          await fetch(`/api/memories/${id}`, { method: "DELETE" });
          loadData();
        }}
        onAddVocab={async (voc) => {
          const res = await fetch("/api/vocab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(voc)
          });
          if (res.ok) loadData();
        }}
        onDeleteVocab={async (id) => {
          await fetch(`/api/vocab/${id}`, { method: "DELETE" });
          loadData();
        }}
        language={language}
      />
    </div>
  );
};
