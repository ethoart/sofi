import React, { useState, useRef, useEffect } from "react";
import {
  PanelRightClose, PanelRightOpen, Send, Mic, MicOff, Volume2, 
  VolumeX, Sparkles, Copy, Check, Trash2, Cpu, Globe, ExternalLink,
  ChevronDown, X, RefreshCw
} from "lucide-react";
import { SupportedAiModel } from "../types";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface BrowserSidebarCompanionProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "si";
  onOpenExtensionModal: () => void;
}

interface SidebarMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  modelLabel?: string;
}

export const BrowserSidebarCompanion: React.FC<BrowserSidebarCompanionProps> = ({
  isOpen,
  onClose,
  language,
  onOpenExtensionModal
}) => {
  const [messages, setMessages] = useState<SidebarMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: language === "si" 
        ? "ආයුබෝවන්! මම ඔබේ Sofi Browser Side Panel සහකාරියයි. ඔබට වෙබ් පිටු සාරාංශගත කිරීමට, ගැටළු විමසීමට සහ බහු-ආකෘති (Multi-Model) තාක්ෂණයෙන් පිළිතුරු ලබා ගැනීමට මම සූදානම්."
        : "Hello! I am your docked Sofi Browser Side Panel companion. Use me to summarize articles, research topics, or run multi-model AI reasoning while you work.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelLabel: "Sofi Side Panel"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Web Speech API
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${text}` : text));
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isLoading) return;

    const userMsg: SidebarMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          selectedModel: "auto",
          language,
          mode: "general"
        })
      });

      const data = await res.json();
      const botMsg: SidebarMessage = {
        id: `ast-${Date.now()}`,
        sender: "assistant",
        text: data.reply || (language === "si" ? "පිළිතුරක් නොලැබුණි." : "No response generated."),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelLabel: data.modelLabel || "Sofi AI"
      };
      setMessages((prev) => [...prev, botMsg]);

      if (isSpeaking && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(data.reply.replace(/<[^>]*>?/gm, ''));
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: language === "si" 
            ? "සම්බන්ධතා දෝෂයකි. කරුණාකර සේවාදායක සම්බන්ධතාවය පරීක්ෂා කරන්න." 
            : "Connection error. Please check backend connectivity.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          modelLabel: "System"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleQuickTool = (action: "summarize" | "explain" | "translate") => {
    if (action === "summarize") {
      handleSendMessage(
        language === "si"
          ? "කරුණාකර මෙම පිටුවේ ප්‍රධාන තොරතුරු සහ වැදගත් කරුණු සාරාංශයක් ලෙස ලබා දෙන්න."
          : "Please summarize the core points, key takeaways, and action items of this current session."
      );
    } else if (action === "explain") {
      handleSendMessage(
        language === "si"
          ? "මම අවධානය යොමු කළ යුතු වැදගත්ම තාක්ෂණික හෝ සංකල්පීය කරුණු සරලව විස්තර කරන්න."
          : "Please explain the fundamental concepts and technical highlights in simple terms."
      );
    } else if (action === "translate") {
      handleSendMessage("කරුණාකර සාරාංශය සිංහල භාෂාවෙන් පැහැදිලි කරන්න.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 bottom-0 right-0 z-40 w-80 sm:w-96 bg-[#140806] border-l border-white/10 shadow-2xl flex flex-col font-sans transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-white/10 bg-[#1A0C08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={sofiAvatar}
              alt="Sofi"
              className="w-8 h-8 rounded-xl object-cover border border-[#FF6A3D] shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1A0C08]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">Sofi Side Panel</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/30 rounded">
                Docked
              </span>
            </div>
            <span className="text-[10px] text-amber-200/50 block font-mono">
              Companion Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenExtensionModal}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-200/70 hover:text-white transition cursor-pointer"
            title="Get Chrome Extension (.zip)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-200/70 hover:text-white transition cursor-pointer"
            title="Clear Messages"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-200/70 hover:text-white transition cursor-pointer"
            title="Close Side Panel"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sofi Auto-Intelligence Status Bar */}
      <div className="px-3 py-1.5 bg-[#180E0B] border-b border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-amber-200/80">
          <Sparkles className="w-3 h-3 text-[#FF6A3D] animate-pulse" />
          <span className="text-[11px] font-bold text-white">Sofi Auto-Intelligence</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/30 rounded font-mono">
          Smart Auto
        </span>
      </div>

      {/* Quick Tools Ribbon */}
      <div className="px-3 py-1.5 bg-[#120705] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        <button
          type="button"
          onClick={() => handleQuickTool("summarize")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF6A3D]/10 hover:bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/25 font-bold transition shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>Summarize</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickTool("explain")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-200/80 border border-white/10 font-bold transition shrink-0 cursor-pointer"
        >
          <span>Explain</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickTool("translate")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-200/80 border border-white/10 font-bold transition shrink-0 cursor-pointer"
        >
          <span>සිංහල</span>
        </button>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="text-[10px] font-mono font-bold text-[#FF8A50]">
                {m.sender === "user" ? "You" : (m.modelLabel || "Sofi")}
              </span>
              <span className="text-[9px] text-amber-200/40">{m.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[92%] relative group ${
                m.sender === "user"
                  ? "bg-gradient-to-tr from-[#FF6A3D] to-[#E05326] text-white rounded-tr-none shadow-md shadow-[#FF6A3D]/10"
                  : "bg-[#1C0E0B] border border-white/10 text-amber-100/90 rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {m.sender === "assistant" && (
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-amber-200/50">
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                  >
                    {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                        const utter = new SpeechSynthesisUtterance(m.text.replace(/<[^>]*>?/gm, ''));
                        window.speechSynthesis.speak(utter);
                      }
                    }}
                    className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Speak</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-[#1C0E0B] border border-white/10 rounded-2xl rounded-tl-none w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] animate-bounce [animation-delay:0s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] animate-bounce [animation-delay:0.4s]" />
            <span className="text-[10px] text-amber-200/50 font-mono ml-1">
              Sofi is generating...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-white/10 bg-[#160B09]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="space-y-2"
        >
          <div className="relative bg-[#0F0705] border border-white/15 focus-within:border-[#FF6A3D] rounded-xl p-2 transition">
            <textarea
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={language === "si" ? "පැති පුවරුවෙන් ඕනෑම දෙයක් විමසන්න..." : "Ask Sofi side panel anything..."}
              className="w-full bg-transparent text-xs text-white placeholder-amber-200/40 resize-none outline-none"
            />

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isListening ? "bg-rose-500/20 text-rose-400 animate-pulse" : "hover:bg-white/5 text-amber-200/60"
                  }`}
                  title={isListening ? "Listening..." : "Voice input"}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isSpeaking ? "bg-[#FF6A3D]/20 text-[#FF8A50]" : "hover:bg-white/5 text-amber-200/60"
                  }`}
                  title={isSpeaking ? "Voice Readout ON" : "Voice Readout OFF"}
                >
                  {isSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-3 py-1.5 bg-[#FF6A3D] hover:bg-[#FF7B52] disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md shadow-[#FF6A3D]/20"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
