import React from "react";
import { 
  X, Settings, Zap, Cpu, Sparkles, CheckCircle2, Shield, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type SofiEdition = "free" | "pro";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "si";
  currentEdition: SofiEdition;
  onSelectEdition: (edition: SofiEdition) => void;
  onOpenProfile?: () => void;
  onOpenMemoryBank?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  currentEdition,
  onSelectEdition
}) => {
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
                <span>Sofi Pro (Big AI)</span>
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
                        Frontier Big AI APIs
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-200/70 mt-3 leading-relaxed">
                    Unlocks advanced reasoning, deep code generation, and frontier AI models.
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
                      <span><strong>Unified Gateway:</strong> Seamless routing</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#FF8A50]">BIG AI ACCESS</span>
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

            {/* Status Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-200/80">
                <Sparkles className="w-4 h-4 text-[#FF6A3D]" />
                <span>
                  {currentEdition === "pro"
                    ? "Sofi is active with Frontier Big AI models (Claude Opus, DeepSeek, GPT)."
                    : "Sofi is active with Local Qwen 2.5 + LBGM with real-time web retrieval."}
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
              Save & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
