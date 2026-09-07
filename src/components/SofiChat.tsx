import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Languages, HelpCircle, RefreshCw, Server, Copy, Check
} from "lucide-react";
import { Message, Skill } from "../types";
import { motion, AnimatePresence } from "motion/react";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface SofiChatProps {
  language: "en" | "si";
  setLanguage: (lang: "en" | "si") => void;
  skills: Skill[];
  onSkillTriggered: (skillName: string) => void;
  serverStatus: any;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export const SofiChat: React.FC<SofiChatProps> = ({
  language,
  setLanguage,
  skills,
  onSkillTriggered,
  serverStatus,
  externalPrompt,
  onClearExternalPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "sofi",
      text: language === "si" 
        ? "ආයුබෝවන්! මම සොෆී (Sofi). ඔබට අද කෙසේ උදව් විය යුතුද? මට ඔබේ AWS t3.small සේවාදායකය පාලනය කිරීමට, කුසලතා ඉගෙන ගැනීමට සහ ඔබ පවසන ඕනෑම වැඩක් කිරීමට හැකියි." 
        : "Hello! I am Sofi, your intelligent multi-purpose AI assistant. How can I help you today? I can manage your AWS t3.small host, trigger custom learned skills, and execute automated tasks.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2200);
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Sync language welcome message if no actual user chats yet
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "welcome") {
      setMessages([
        {
          id: "welcome",
          sender: "sofi",
          text: language === "si" 
            ? "ආයුබෝවන්! මම සොෆී (Sofi). ඔබට අද කෙසේ උදව් විය යුතුද? මට ඔබේ AWS t3.small සේවාදායකය පාලනය කිරීමට, කුසලතා ඉගෙන ගැනීමට සහ ඔබ පවසන ඕනෑම වැඩක් කිරීමට හැකියි." 
            : "Hello! I am Sofi, your intelligent multi-purpose AI assistant. How can I help you today? I can manage your AWS t3.small host, trigger custom learned skills, and execute automated tasks.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [language]);

  // Handle prompt passed from Bento dashboard quick actions
  useEffect(() => {
    if (externalPrompt) {
      setInputText(externalPrompt);
      if (onClearExternalPrompt) {
        onClearExternalPrompt();
      }
    }
  }, [externalPrompt]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "si" ? "si-LK" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInputText(text);
          sendMessage(text);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert(language === "si" 
        ? "ඔබේ බ්‍රවුසරය හඬ හඳුනාගැනීමට සහය නොදක්වයි. කරුණාකර Google Chrome හෝ Safari භාවිතා කරන්න." 
        : "Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Stop any speaking voice before listening
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.lang = language === "si" ? "si-LK" : "en-US";
      recognitionRef.current.start();
    }
  };

  // Speech Synthesis Output
  const speakText = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;

    // Cancel current speaking
    window.speechSynthesis.cancel();

    // Clean markdown tags or code blocks for clean reading
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .replace(/\[MCP.*?\]/g, "") // remove mcp tags
      .replace(/[*#_`]/g, "") // remove basic formatting
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "si" ? "si-LK" : "en-US";
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Try to find pleasant female voices with male rejection
    const voices = window.speechSynthesis.getVoices();
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

    let pickedVoice: SpeechSynthesisVoice | undefined;

    if (language === "si") {
      pickedVoice = voices.find(v => (v.lang.includes("si") || v.lang.includes("LK")) && !maleKeywords.some(m => v.name.toLowerCase().includes(m)));
    }

    if (!pickedVoice) {
      for (const kw of femaleKeywords) {
        const match = voices.find(v => v.name.toLowerCase().includes(kw));
        if (match) {
          pickedVoice = match;
          break;
        }
      }
    }

    if (!pickedVoice) {
      pickedVoice = voices.find(v => 
        (v.lang.startsWith("en") || v.lang.startsWith("si")) && 
        !maleKeywords.some(m => v.name.toLowerCase().includes(m))
      );
    }

    if (!pickedVoice && voices.length > 0) {
      pickedVoice = voices.find(v => !maleKeywords.some(m => v.name.toLowerCase().includes(m))) || voices[0];
    }

    if (pickedVoice) utterance.voice = pickedVoice;
    utterance.pitch = 1.25; // Distinctive sweet feminine pitch

    synthesisUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText("");
    inputRef.current?.focus();
    
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const storedKey = typeof window !== "undefined" ? localStorage.getItem("sofi_agentrouter_key") || "" : "";
      let guestId = typeof window !== "undefined" ? localStorage.getItem("sofi_guest_session_id") : null;
      if (!guestId) {
        guestId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
        if (typeof window !== "undefined") localStorage.setItem("sofi_guest_session_id", guestId);
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-session-id": guestId
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10), // send last 10 messages context
          language,
          agentRouterKey: storedKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        const sofiMsg: Message = {
          id: `sofi-${Date.now()}`,
          sender: "sofi",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchedSkill: data.matchedSkill
        };

        setMessages(prev => [...prev, sofiMsg]);
        setIsTyping(false);

        // Highlight skill execution
        if (data.matchedSkill) {
          onSkillTriggered(data.matchedSkill);
        }

        // Speak response out loud
        setTimeout(() => speakText(data.reply), 200);
      } else {
        throw new Error("API call failed");
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const errReply = language === "si" 
        ? "සමාවන්න, මට සේවාදායකය සමඟ සම්බන්ධ වීමට නොහැකි වුණා. කරුණාකර ඔබගේ ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න."
        : "I'm sorry, I encountered an error communicating with the server. Please check your connection.";
      
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "sofi",
          text: errReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div id="sofi-chat-window" className="flex flex-col h-full bg-[#1C120F]/90 backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/50">
      
      {/* 1. Sunset Gradient Header Banner (Exact match of Image 2 top card) */}
      <div className="bg-gradient-to-b from-[#FF6A3D] via-[#E5532B] to-[#C7431E] p-5 sm:p-6 text-white relative overflow-hidden shadow-lg">
        {/* Subtle glowing ambient circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        
        {/* Header Controls */}
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-white/20" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/90">Sofi Active Core</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "en" ? "si" : "en")}
              className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-black/20 hover:bg-black/30 backdrop-blur-md text-white border border-white/20 transition cursor-pointer flex items-center gap-1"
              title="Toggle English / Sinhala"
            >
              <span>{language === "en" ? "🇺🇸 EN" : "🇱🇰 සිංහල"}</span>
            </button>

            <button
              onClick={() => {
                if (!isMuted && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
                setIsMuted(!isMuted);
              }}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white border border-white/20 transition cursor-pointer"
              title={isMuted ? "Unmute Sofi Voice" : "Mute Sofi Voice"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Display Typography: "Let's Stay Connected" (Image 2 style) */}
        <div className="mt-3 relative z-10">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
            {language === "si" ? "සොෆී සමඟ සන්නිවේදනය" : "Let's Stay Connected"}
          </h2>
          <p className="text-xs text-white/80 mt-0.5">
            AWS EC2 t3.small • Voice & Command Router
          </p>
        </div>

        {/* Story/Agent Circular Carousel (Image 2 signature element!) */}
        <div className="flex items-center gap-3.5 mt-4 pt-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-10">
          {/* Add Skill Button */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={() => {
                const prompt = "How do I teach you a new skill for AWS EC2?";
                setInputText(prompt);
              }}
              className="w-12 h-12 rounded-full border-2 border-dashed border-white/60 hover:border-white bg-black/15 flex items-center justify-center text-white transition hover:scale-105 active:scale-95 cursor-pointer"
              title="Add / Inquire Skill"
            >
              <span className="text-lg font-bold">+</span>
            </button>
            <span className="text-[10px] font-medium text-white/90">Teach</span>
          </div>

          {/* Active Sofi Core */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-12 h-12 rounded-full ring-2 ring-white p-0.5 overflow-hidden shadow-md">
              <img src={sofiAvatar} alt="Sofi Core" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            </div>
            <span className="text-[10px] font-semibold text-white">Sofi Core</span>
          </div>

          {/* AWS EC2 Host */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-12 h-12 rounded-full bg-black/25 border border-white/30 flex items-center justify-center text-white shadow-md">
              <Server className="w-5 h-5 text-amber-200" />
            </div>
            <span className="text-[10px] font-medium text-white/90">t3.small</span>
          </div>

          {/* Voice Engine */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-12 h-12 rounded-full bg-black/25 border border-white/30 flex items-center justify-center text-white shadow-md">
              <Mic className="w-5 h-5 text-orange-200" />
            </div>
            <span className="text-[10px] font-medium text-white/90">Voice</span>
          </div>

          {/* Skills Count */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-12 h-12 rounded-full bg-black/25 border border-white/30 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-[10px] font-medium text-white/90">{skills.length} Skills</span>
          </div>
        </div>
      </div>

      {/* 2. Messages Stream Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10 bg-[#160E0C]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-end gap-2.5 sm:gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "sofi" && (
                <div className="w-8 h-8 rounded-full border border-orange-400/40 overflow-hidden shrink-0 shadow-md bg-[#251511]">
                  <img src={sofiAvatar} alt="Sofi Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[72%] rounded-3xl p-4 shadow-xl relative ${
                msg.sender === "user" 
                  ? "bg-gradient-to-tr from-[#FF6A3D] to-[#E5532B] text-white rounded-br-sm border border-orange-400/30 shadow-orange-500/10" 
                  : "bg-[#221714] backdrop-blur-md text-white border border-white/[0.07] rounded-bl-sm shadow-black/30"
              }`}>
                {/* Text Content */}
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text font-normal">{msg.text}</p>
                
                {/* Meta details (e.g. skills invoked) */}
                {msg.sender === "sofi" && msg.matchedSkill && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] sm:text-[11px] font-bold text-[#FF8A50] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6A3D] animate-spin" />
                    <span>Triggered AWS Skill: <strong>{msg.matchedSkill}</strong></span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleCopyText(msg.id, msg.text)}
                    className="flex items-center gap-1 text-[10px] text-amber-200/70 hover:text-white transition cursor-pointer p-0.5 rounded hover:bg-white/10"
                    title="Copy text"
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <span className={`text-[9px] leading-none ${
                    msg.sender === "user" ? "text-orange-200" : "text-amber-200/40"
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing loading bubble */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-full border border-orange-400/40 overflow-hidden shrink-0 animate-pulse bg-[#251511]">
                <img src={sofiAvatar} alt="Sofi Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="bg-[#221714] backdrop-blur-md text-amber-200 border border-white/[0.07] rounded-2xl rounded-bl-none p-3.5 shadow-lg flex items-center gap-2">
                <span className="text-xs font-semibold">Sofi is thinking...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] animate-bounce delay-200" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] animate-bounce delay-300" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Voice feedback waves while speaking or listening */}
      {(isSpeaking || isListening) && (
        <div className="px-5 py-2.5 bg-[#251713] border-t border-orange-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isListening ? "bg-[#FF6A3D] animate-pulse" : "bg-[#FF8A50] animate-bounce"}`} />
            <span className="text-xs font-bold text-amber-200">
              {isListening 
                ? (language === "si" ? "සොෆී සවන් දෙමින් පවතී..." : "Sofi is listening...") 
                : (language === "si" ? "සොෆී කතා කරයි..." : "Sofi is speaking...")
              }
            </span>
          </div>
          <div className="flex items-center gap-1 h-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <span
                key={i}
                className={`w-1 bg-gradient-to-t from-[#FF6A3D] to-[#FF8A50] rounded-full ${
                  isListening ? "animate-pulse" : "animate-bounce"
                }`}
                style={{
                  height: `${Math.floor(25 + Math.random() * 75)}%`,
                  animationDuration: `${0.35 + i * 0.04}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Floating Pill Input Area (Image 2 style bottom input) */}
      <div className="p-3 sm:p-4 bg-[#1C120F] border-t border-white/[0.06]">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center bg-[#130B09] border border-white/[0.08] focus-within:border-[#FF6A3D] rounded-2xl p-1.5 transition-all shadow-inner gap-2"
        >
          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleListen}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition cursor-pointer shrink-0 ${
              isListening 
                ? "bg-[#FF6A3D] text-white animate-pulse shadow-lg shadow-orange-500/30" 
                : "bg-white/5 hover:bg-white/10 text-amber-200/80 hover:text-white"
            }`}
            title="Voice Control Mode"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === "si" 
                ? "සිංහල හෝ English වලින් පවසන්න..." 
                : "Your message to Sofi..."
            }
            className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder:text-amber-200/30 outline-none"
          />

          {/* Send pill button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A3D] to-[#E5532B] hover:from-[#FF7A4E] hover:to-[#F16339] disabled:from-white/5 disabled:to-white/5 text-white disabled:text-white/20 flex items-center justify-center shadow-lg shadow-orange-500/25 transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
