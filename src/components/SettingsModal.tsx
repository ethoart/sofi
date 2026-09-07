import React, { useState } from "react";
import { 
  X, Settings, Zap, Cpu, Sparkles, CheckCircle2, Shield, Check, Key, ExternalLink, Eye, EyeOff,
  Loader2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";

export type SofiEdition = "free" | "pro";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "si";
  currentEdition: SofiEdition;
  onSelectEdition: (edition: SofiEdition) => void;
  onOpenProfile?: () => void;
  onOpenMemoryBank?: () => void;
  userProfile?: UserProfile;
  onSaveUserProfile?: (profile: UserProfile) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  currentEdition,
  onSelectEdition,
  userProfile,
  onSaveUserProfile
}) => {
  const [agentRouterKey, setAgentRouterKey] = useState<string>(() => {
    return userProfile?.preferences?.agentRouterKey || (typeof window !== "undefined" ? localStorage.getItem("sofi_agentrouter_key") || "" : "");
  });
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    return userProfile?.preferences?.openRouterKey || (typeof window !== "undefined" ? localStorage.getItem("sofi_openrouter_key") || "" : "");
  });
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [isOpenRouterSaved, setIsOpenRouterSaved] = useState(false);
  const [isOpenRouterTesting, setIsOpenRouterTesting] = useState(false);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<{ success: boolean; message: string } | null>(null);

  React.useEffect(() => {
    if (userProfile?.preferences?.agentRouterKey) {
      setAgentRouterKey(userProfile.preferences.agentRouterKey);
    }
  }, [userProfile?.preferences?.agentRouterKey]);

  React.useEffect(() => {
    if (userProfile?.preferences?.openRouterKey) {
      setOpenRouterKey(userProfile.preferences.openRouterKey);
    }
  }, [userProfile?.preferences?.openRouterKey]);

  const handleSaveKey = async () => {
    const key = agentRouterKey.trim();
    if (typeof window !== "undefined") {
      localStorage.setItem("sofi_agentrouter_key", key);
    }
    
    // Sync key to server runtime environment immediately
    if (key) {
      fetch("/api/config/agentrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      }).catch(() => {});
    }

    if (userProfile && onSaveUserProfile) {
      await onSaveUserProfile({
        ...userProfile,
        preferences: {
          ...userProfile.preferences,
          agentRouterKey: key
        }
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestKey = async () => {
    const keyToTest = agentRouterKey.trim();
    if (!keyToTest) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/agentrouter/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyToTest })
      });
      const data = await res.json();
      setTestResult({
        success: !!data.success,
        message: data.message || (data.success ? "Key verified! Connected to AgentRouter." : "Verification failed.")
      });

      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("sofi_agentrouter_key", keyToTest);
        }
        if (userProfile && onSaveUserProfile) {
          onSaveUserProfile({
            ...userProfile,
            preferences: {
              ...userProfile.preferences,
              agentRouterKey: keyToTest
            }
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Failed to reach server to test key."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveOpenRouterKey = async () => {
    const key = openRouterKey.trim();
    if (typeof window !== "undefined") {
      localStorage.setItem("sofi_openrouter_key", key);
    }
    
    // Sync key to server runtime environment immediately
    if (key) {
      fetch("/api/config/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      }).catch(() => {});
    }

    if (userProfile && onSaveUserProfile) {
      await onSaveUserProfile({
        ...userProfile,
        preferences: {
          ...userProfile.preferences,
          openRouterKey: key
        }
      });
    }
    setIsOpenRouterSaved(true);
    setTimeout(() => setIsOpenRouterSaved(false), 2500);
  };

  const handleTestOpenRouterKey = async () => {
    const keyToTest = openRouterKey.trim();
    if (!keyToTest) return;
    setIsOpenRouterTesting(true);
    setOpenRouterTestResult(null);

    try {
      const res = await fetch("/api/openrouter/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyToTest })
      });
      const data = await res.json();
      setOpenRouterTestResult({
        success: !!data.success,
        message: data.message || (data.success ? "Key verified! Connected to OpenRouter." : "Verification failed.")
      });

      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("sofi_openrouter_key", keyToTest);
        }
        if (userProfile && onSaveUserProfile) {
          onSaveUserProfile({
            ...userProfile,
            preferences: {
              ...userProfile.preferences,
              openRouterKey: keyToTest
            }
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      setOpenRouterTestResult({
        success: false,
        message: err?.message || "Failed to reach server to test key."
      });
    } finally {
      setIsOpenRouterTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="w-full max-w-xl bg-[#140B09] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#190E0B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6A3D]/20 border border-[#FF6A3D]/30 flex items-center justify-center text-[#FF6A3D]">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    {language === "si" ? "සොෆී සැකසුම් (Sofi Settings)" : "Sofi Edition Settings"}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase border ${
                    currentEdition === "pro"
                      ? "bg-gradient-to-r from-[#FF6A3D] to-amber-500 text-white border-orange-400/40 shadow-sm"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {currentEdition === "pro" ? "Sofi Pro" : "Sofi Free"}
                  </span>
                </div>
                <p className="text-xs text-amber-200/60 mt-0.5">
                  {language === "si" 
                    ? "ඔබට අවශ්‍ය Sofi මාදිලිය තෝරන්න (Free හෝ Pro)" 
                    : "Choose between Sofi Free and Sofi Pro edition"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-200/70 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Segmented Switch Control */}
          <div className="p-4 bg-[#100706] border-b border-white/[0.06]">
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => onSelectEdition("free")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                  currentEdition === "free"
                    ? "bg-emerald-500 text-black shadow-md"
                    : "text-amber-200/60 hover:text-white"
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Sofi Free (Local LLM)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectEdition("pro")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                  currentEdition === "pro"
                    ? "bg-[#FF6A3D] text-white shadow-md shadow-orange-500/30"
                    : "text-amber-200/60 hover:text-white"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Sofi Pro (AgentRouter)</span>
              </button>
            </div>
          </div>

          {/* Body Content - Two Option Cards */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* OPTION 1: FREE EDITION CARD */}
              <div
                onClick={() => onSelectEdition("free")}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  currentEdition === "free"
                    ? "bg-[#1E110E] border-emerald-500 shadow-xl shadow-emerald-950/40"
                    : "bg-[#160B09] border-white/10 hover:border-white/20 hover:bg-[#1A0E0B]"
                }`}
              >
                {currentEdition === "free" && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-white text-sm">Sofi Free</h5>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        Local LLM & LBGM
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-200/70 mt-3 leading-relaxed">
                    Zero-cost on-device intelligence with sub-10ms response time and full data privacy.
                  </p>

                  <div className="mt-4 space-y-2 text-[11px] text-amber-100/80">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Qwen 2.5</strong> Local Intelligence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Sofi LBGM Engine:</strong> Instant answers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Live Web Research:</strong> DuckDuckGo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>$0 / month:</strong> No API keys required</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">FREE FOREVER</span>
                  <button
                    type="button"
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                      currentEdition === "free"
                        ? "bg-emerald-500 text-black font-extrabold"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {currentEdition === "free" ? "Selected" : "Select Free"}
                  </button>
                </div>
              </div>

              {/* OPTION 2: PRO EDITION CARD */}
              <div
                onClick={() => onSelectEdition("pro")}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  currentEdition === "pro"
                    ? "bg-[#25130E] border-[#FF6A3D] shadow-xl shadow-orange-950/50"
                    : "bg-[#160B09] border-white/10 hover:border-white/20 hover:bg-[#1A0E0B]"
                }`}
              >
                {currentEdition === "pro" && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#FF6A3D] text-white flex items-center justify-center shadow-md shadow-[#FF6A3D]/40">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FF6A3D]/20 border border-[#FF6A3D]/40 flex items-center justify-center text-[#FF6A3D]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-white text-sm">Sofi Pro</h5>
                      <span className="text-[10px] text-[#FF8A50] font-mono font-bold">
                        AgentRouter Frontier
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-200/70 mt-3 leading-relaxed">
                    Direct access to premier frontier intelligence via <strong>https://agentrouter.org</strong>.
                  </p>

                  <div className="mt-4 space-y-2 text-[11px] text-amber-100/80">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A3D] shrink-0" />
                      <span><strong>Claude Opus 4.8 & 5:</strong> Deep coding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A3D] shrink-0" />
                      <span><strong>DeepSeek v4 Flash:</strong> Fast logic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A3D] shrink-0" />
                      <span><strong>GPT-5.6 Sol & GLM 5.3</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6A3D] shrink-0" />
                      <span><strong>AgentRouter Gateway:</strong> Unified API</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#FF8A50]">AGENTROUTER</span>
                  <button
                    type="button"
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                      currentEdition === "pro"
                        ? "bg-[#FF6A3D] text-white font-extrabold shadow-sm shadow-[#FF6A3D]/40"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {currentEdition === "pro" ? "Selected" : "Select Pro"}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Engine Status Banner */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-emerald-200">
                    AI Studio Engine Active (Zero Key Setup Required)
                  </p>
                  <p className="text-[11px] text-emerald-300/70">
                    Sofi runs seamlessly with the built-in server-side intelligence engine. You do not need to provide a Gemini API key.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold shrink-0">
                Ready
              </span>
            </div>

            {/* AgentRouter API Key Configuration Box (Optional) */}
            <div className="p-4 rounded-2xl bg-[#1A0D0A] border border-[#FF6A3D]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <Key className="w-4 h-4 text-[#FF6A3D]" />
                  <span>AgentRouter API Key (Optional)</span>
                </div>
                <a
                  href="https://agentrouter.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#FF8A50] hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-[11px] text-amber-200/70 leading-relaxed">
                Enter your <a href="https://agentrouter.org" target="_blank" rel="noreferrer" className="text-[#FF8A50] underline">agentrouter.org</a> API key to unlock Claude Opus 5, Claude Opus 4.8, DeepSeek v4 Flash, GLM 5.3, GPT-5.6 Sol, Claude 3.5 Sonnet, and GPT-4o in Sofi Pro.
              </p>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={agentRouterKey}
                    onChange={(e) => {
                      setAgentRouterKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="sk-ar-... (AgentRouter API Key)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF6A3D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-200/50 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || !agentRouterKey.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6A3D]" /> : <Zap className="w-3.5 h-3.5 text-[#FF6A3D]" />}
                  <span>{isTesting ? "Testing..." : "Test Key"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={!agentRouterKey.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSaved
                      ? "bg-emerald-500 text-black shadow-md"
                      : "bg-[#FF6A3D] hover:bg-[#FF8A50] text-white shadow-md shadow-orange-500/20"
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                  <span>{isSaved ? "Saved!" : "Save Key"}</span>
                </button>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1 leading-snug">
                    <span className="font-bold">{testResult.success ? "Connection Verified: " : "Connection Error: "}</span>
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}

              {agentRouterKey ? (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AgentRouter Key configured • All frontier models active</span>
                </div>
              ) : (
                <div className="text-[10px] text-amber-400/80">
                  <span>No key set yet • Sofi Pro will guide you to https://agentrouter.org</span>
                </div>
              )}
            </div>

            {/* OpenRouter API Key Configuration Box (Highly Recommended) */}
            <div className="p-4 rounded-2xl bg-[#0C121E] border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <Key className="w-4 h-4 text-blue-400" />
                  <span>OpenRouter API Key (Highly Recommended)</span>
                </div>
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Get OpenRouter Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-[11px] text-blue-200/70 leading-relaxed">
                Enter your <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-blue-400 underline">openrouter.ai</a> API key to enjoy seamless access to Claude 3.7 Sonnet, DeepSeek R1, DeepSeek V3, Claude 3.5 Sonnet, and GPT-4o with zero WAF blocks or latency.
              </p>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showOpenRouterKey ? "text" : "password"}
                    value={openRouterKey}
                    onChange={(e) => {
                      setOpenRouterKey(e.target.value);
                      setOpenRouterTestResult(null);
                    }}
                    placeholder="sk-or-... (OpenRouter API Key)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-200/50 hover:text-white"
                  >
                    {showOpenRouterKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestOpenRouterKey}
                  disabled={isOpenRouterTesting || !openRouterKey.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isOpenRouterTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Zap className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{isOpenRouterTesting ? "Testing..." : "Test Key"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveOpenRouterKey}
                  disabled={!openRouterKey.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isOpenRouterSaved
                      ? "bg-emerald-500 text-black shadow-md"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  }`}
                >
                  {isOpenRouterSaved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                  <span>{isOpenRouterSaved ? "Saved!" : "Save Key"}</span>
                </button>
              </div>

              {/* Test Result Feedback */}
              {openRouterTestResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                  openRouterTestResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}>
                  {openRouterTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1 leading-snug">
                    <span className="font-bold">{openRouterTestResult.success ? "Connection Verified: " : "Connection Error: "}</span>
                    <span>{openRouterTestResult.message}</span>
                  </div>
                </div>
              )}

              {openRouterKey ? (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OpenRouter Key configured • High-capacity models active</span>
                </div>
              ) : (
                <div className="text-[10px] text-blue-400/80">
                  <span>No key set yet • Easily link your key from https://openrouter.ai</span>
                </div>
              )}
            </div>

            {/* Status Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-200/80">
                <Sparkles className="w-4 h-4 text-[#FF6A3D]" />
                <span>
                  {currentEdition === "pro"
                    ? (openRouterKey ? "Sofi Pro active via OpenRouter." : "Sofi Pro active via AgentRouter.")
                    : "Sofi Free active with Local Qwen 2.5 + LBGM with real-time web retrieval."}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-[#120706] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-200/60">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sofi AI • Privacy & Memory Active</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#FF6A3D] hover:bg-[#FF8A50] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-orange-500/20"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
