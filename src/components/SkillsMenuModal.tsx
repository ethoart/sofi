import React from "react";
import { 
  Sparkles, Image as ImageIcon, Video, Code2, Microscope, 
  Brain, Languages, Smartphone, Paperclip, X, ArrowUpRight, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SpecializedMode } from "../types";

interface SkillsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (action: string) => void;
  onSelectMode: (mode: SpecializedMode) => void;
  language: "en" | "si";
}

export const SkillsMenuModal: React.FC<SkillsMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectSkill,
  onSelectMode,
  language
}) => {
  if (!isOpen) return null;

  const skills = [
    {
      id: "generate-image",
      icon: ImageIcon,
      color: "from-pink-500/20 to-rose-500/20 text-rose-400 border-rose-500/30",
      title: language === "si" ? "පින්තූරයක් සාදන්න (AI Image)" : "Generate AI Image",
      desc: language === "si" ? "Anime, Cinematic හෝ 3D චිත්‍රයක් නිෂ්පාදනය කරන්න" : "Create anime art, photoreal cinematic, or 3D visuals",
      action: () => {
        onSelectSkill("open-creative-image");
        onClose();
      }
    },
    {
      id: "generate-video",
      icon: Video,
      color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
      title: language === "si" ? "වීඩියෝවක් සාදන්න (AI Video)" : "Generate AI Video",
      desc: language === "si" ? "4K සිනමාමය වීඩියෝ සංකල්පයක් හා කැමරා චලන සාදන්න" : "Generate 4K cinematic video concepts & motion storyboards",
      action: () => {
        onSelectSkill("open-creative-video");
        onClose();
      }
    },
    {
      id: "coding-studio",
      icon: Code2,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
      title: language === "si" ? "කේතකරණ මැදිරිය (Coding Studio)" : "Coding & DevOps Studio",
      desc: language === "si" ? "TypeScript, AWS, Docker, Bash විධාන හා පිරික්සුම්" : "Specialized code development, AWS scripts, and bug fixing",
      action: () => {
        onSelectMode("coding");
        onClose();
      }
    },
    {
      id: "deep-research",
      icon: Microscope,
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
      title: language === "si" ? "ගැඹුරු පර්යේෂණ (Deep Research)" : "Deep Research Workspace",
      desc: language === "si" ? "සවිස්තරාත්මක වාර්තා, විශ්ලේෂණ සහ නිර්දේශ" : "In-depth multi-source investigative reports & architecture",
      action: () => {
        onSelectMode("research");
        onClose();
      }
    },
    {
      id: "teach-memory",
      icon: Brain,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      title: language === "si" ? "මතකයක් උගන්වන්න (Teach Fact)" : "Save Memory Fact",
      desc: language === "si" ? "ඔබ ගැන තොරතුරක් Sofi ගේ මතක ගබඩාවට එක් කරන්න" : "Anchor personal preferences or knowledge into Sofi's memory",
      action: () => {
        onSelectSkill("open-memory-drawer");
        onClose();
      }
    },
    {
      id: "mobile-apk",
      icon: Smartphone,
      color: "from-orange-500/20 to-red-500/20 text-[#FF8A50] border-orange-500/30",
      title: language === "si" ? "ජංගම APK බාගැනීම (Mobile App)" : "Download Mobile APK (QR)",
      desc: language === "si" ? "Android දුරකථනයට Sofi යෙදුම ස්ථාපනය කරන්න" : "Scan QR code to install Sofi v1.2 APK on Android",
      action: () => {
        onSelectSkill("open-apk-modal");
        onClose();
      }
    },
    {
      id: "upload-files",
      icon: Paperclip,
      color: "from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30",
      title: language === "si" ? "ලේඛන සහ ඡායාරූප විශ්ලේෂණය" : "Document & Photo Context",
      desc: language === "si" ? "PDF, රූප සහ කේත ගොනු AI ආකෘති මඟින් විශ්ලේෂණය කරන්න" : "Upload documents, photos, or code files for multi-model AI analysis",
      action: () => {
        onSelectSkill("upload-files");
        onClose();
      }
    }
  ];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#160B09] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-amber-100 p-5 space-y-4 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF6A3D]/20 text-[#FF6A3D] flex items-center justify-center font-extrabold text-lg">
                +
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  {language === "si" ? "Sofi කුසලතා සහ මෙවලම් (Skills)" : "Sofi Skills & Capabilities"}
                </h3>
                <p className="text-[11px] text-amber-200/60">
                  {language === "si" ? "ක්‍රියාත්මක කිරීමට කුසලතාවයක් තෝරන්න" : "Select an action, workspace, or generative tool"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200/60 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grid of Skills */}
          <div className="overflow-y-auto space-y-2 pr-1">
            {skills.map((skill) => {
              const Icon = skill.icon;
              return (
                <button
                  key={skill.id}
                  onClick={skill.action}
                  className="w-full p-3 bg-[#1C100D] hover:bg-[#251511] border border-white/5 hover:border-[#FF6A3D]/40 rounded-2xl text-left transition cursor-pointer flex items-center gap-3.5 group"
                >
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${skill.color} border flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white group-hover:text-[#FF8A50] transition">
                        {skill.title}
                      </h4>
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-200/40 group-hover:text-[#FF6A3D] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                    </div>
                    <p className="text-[11px] text-amber-200/60 truncate mt-0.5">
                      {skill.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
