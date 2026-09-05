import React, { useState } from "react";
import { 
  X, User, Bot, Sparkles, Save, Sliders, Volume2, ShieldCheck, Heart, Target, Briefcase, FileText, CheckCircle2,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, SofiProfile } from "../types";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  sofiProfile: SofiProfile;
  onSaveUserProfile: (profile: UserProfile) => Promise<void>;
  onSaveSofiProfile: (profile: SofiProfile) => Promise<void>;
  language: "en" | "si";
  onLogout?: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  sofiProfile,
  onSaveUserProfile,
  onSaveSofiProfile,
  language,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<"user" | "sofi">("user");
  const [uProfile, setUProfile] = useState<UserProfile>(userProfile);
  const [sProfile, setSProfile] = useState<SofiProfile>(sofiProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize when props update
  React.useEffect(() => {
    setUProfile(userProfile);
  }, [userProfile]);

  React.useEffect(() => {
    setSProfile(sofiProfile);
  }, [sofiProfile]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveUserProfile(uProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSofi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSofiProfile(sProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = (tag: string) => {
    if (!tag.trim() || uProfile.interests.includes(tag.trim())) return;
    setUProfile({ ...uProfile, interests: [...uProfile.interests, tag.trim()] });
  };

  const handleRemoveInterest = (tag: string) => {
    setUProfile({ ...uProfile, interests: uProfile.interests.filter(i => i !== tag) });
  };

  const handleAddGoal = (goal: string) => {
    if (!goal.trim() || uProfile.goals.includes(goal.trim())) return;
    setUProfile({ ...uProfile, goals: [...uProfile.goals, goal.trim()] });
  };

  const handleRemoveGoal = (goal: string) => {
    setUProfile({ ...uProfile, goals: uProfile.goals.filter(g => g !== goal) });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: 380 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 380 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="w-full max-w-lg bg-[#140B09] border-l border-white/[0.08] h-full flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-[#190E0B]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#FF6A3D]/20 border border-[#FF6A3D]/30 flex items-center justify-center text-[#FF6A3D]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {language === "si" ? "පැතිකඩ කළමනාකරණය" : "Profiles & Identity"}
                </h3>
                <p className="text-xs text-amber-200/60">
                  {language === "si" ? "ඔබ සහ සොෆී සඳහා පෞද්ගලිකත්ව විස්තර" : "Customize who you are & who Sofi is for you"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-200/70 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tabs: About Me vs Sofi's Profile */}
          <div className="flex border-b border-white/[0.06] bg-[#120706]">
            <button
              onClick={() => setActiveTab("user")}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
                activeTab === "user"
                  ? "border-[#FF6A3D] text-[#FF8A50] bg-[#FF6A3D]/10"
                  : "border-transparent text-amber-200/60 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{language === "si" ? "මගේ විස්තර (About Me)" : "About Me (User Profile)"}</span>
            </button>
            <button
              onClick={() => setActiveTab("sofi")}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
                activeTab === "sofi"
                  ? "border-[#FF6A3D] text-[#FF8A50] bg-[#FF6A3D]/10"
                  : "border-transparent text-amber-200/60 hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{language === "si" ? "සොෆීගේ පැතිකඩ" : "Sofi Profile"}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Profile saved! Sofi will apply this in all interactions.</span>
              </motion.div>
            )}

            {activeTab === "user" ? (
              <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
                {/* Name & Nickname */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-200/80 block">Your Full Name</label>
                    <input
                      type="text"
                      value={uProfile.name}
                      onChange={(e) => setUProfile({ ...uProfile, name: e.target.value })}
                      placeholder="e.g. Alex Silva"
                      className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-200/80 block">Nickname / Preferred Call</label>
                    <input
                      type="text"
                      value={uProfile.nickname}
                      onChange={(e) => setUProfile({ ...uProfile, nickname: e.target.value })}
                      placeholder="e.g. Alex"
                      className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D]"
                    />
                  </div>
                </div>

                {/* Occupation / Role */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#FF6A3D]" />
                    <span>Occupation / Primary Focus</span>
                  </label>
                  <input
                    type="text"
                    value={uProfile.occupation}
                    onChange={(e) => setUProfile({ ...uProfile, occupation: e.target.value })}
                    placeholder="e.g. Full Stack Developer & Cloud Architect"
                    className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D]"
                  />
                </div>

                {/* Bio / About Me */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FF6A3D]" />
                    <span>About Me (Sofi reads this to understand your context)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={uProfile.bio}
                    onChange={(e) => setUProfile({ ...uProfile, bio: e.target.value })}
                    placeholder="Describe yourself, your work style, projects, or background..."
                    className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D] leading-relaxed resize-none"
                  />
                </div>

                {/* Interests */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#FF6A3D]" />
                    <span>Interests & Passions</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {uProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="bg-white/5 border border-white/10 text-amber-200 px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="text-amber-200/40 hover:text-red-400 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="interest-input"
                      type="text"
                      placeholder="Add interest (e.g. AI, Sinhala Literature)..."
                      className="flex-1 bg-[#1C120F] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#FF6A3D]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddInterest((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#FF6A3D]" />
                    <span>Active Goals (Sofi actively helps you achieve these)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {uProfile.goals.map((goal) => (
                      <span
                        key={goal}
                        className="bg-[#FF6A3D]/10 border border-[#FF6A3D]/20 text-[#FF8A50] px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5"
                      >
                        {goal}
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(goal)}
                          className="text-[#FF8A50]/60 hover:text-red-400 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a goal (press Enter)..."
                    className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#FF6A3D]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGoal((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>

                {/* Custom Instructions */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#FF6A3D]" />
                    <span>Custom Directives for Sofi</span>
                  </label>
                  <textarea
                    rows={2}
                    value={uProfile.customInstructions}
                    onChange={(e) => setUProfile({ ...uProfile, customInstructions: e.target.value })}
                    placeholder="Specific instructions on how Sofi should respond to you..."
                    className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D] leading-relaxed resize-none"
                  />
                </div>

                {/* Tone & Formality */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-amber-200/80 block">Response Formality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["casual", "balanced", "formal"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setUProfile({
                          ...uProfile,
                          preferences: { ...uProfile.preferences, formality: mode }
                        })}
                        className={`py-2 rounded-xl text-xs font-bold capitalize transition border cursor-pointer ${
                          uProfile.preferences.formality === mode
                            ? "bg-[#FF6A3D] text-white border-[#FF6A3D]"
                            : "bg-[#1C120F] border-white/10 text-amber-200/70 hover:text-white"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Saving..." : "Save My Profile"}</span>
                  </button>
                </div>

                {onLogout && (
                  <div className="pt-3 border-t border-white/10 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 hover:text-red-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>{language === "si" ? "ගිණුමෙන් පිටවන්න" : "Log Out / Switch Account"}</span>
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleSaveSofi} className="space-y-4 text-xs">
                {/* Sofi Avatar & Identity Card */}
                <div className="bg-[#1C120F] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-[#FF6A3D] overflow-hidden p-0.5 bg-[#251511] shrink-0 shadow-lg">
                    <img src={sofiAvatar} alt="Sofi Avatar" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{sProfile.name}</h4>
                    <p className="text-[11px] text-amber-200/70">{sProfile.tagline}</p>
                    <span className="inline-block mt-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                      SLM Engine Active
                    </span>
                  </div>
                </div>

                {/* Sofi Name & Tagline */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-200/80 block">Assistant Name</label>
                    <input
                      type="text"
                      value={sProfile.name}
                      onChange={(e) => setSProfile({ ...sProfile, name: e.target.value })}
                      className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-200/80 block">Archetype</label>
                    <input
                      type="text"
                      value={sProfile.archetype}
                      onChange={(e) => setSProfile({ ...sProfile, archetype: e.target.value })}
                      className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D]"
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200/80 block">Tagline</label>
                  <input
                    type="text"
                    value={sProfile.tagline}
                    onChange={(e) => setSProfile({ ...sProfile, tagline: e.target.value })}
                    className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D]"
                  />
                </div>

                {/* Temperament */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200/80 block">Temperament / Personality Tone</label>
                  <input
                    type="text"
                    value={sProfile.temperament}
                    onChange={(e) => setSProfile({ ...sProfile, temperament: e.target.value })}
                    className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D]"
                  />
                </div>

                {/* System Directive */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6A3D]" />
                    <span>System Directive / Core Behavior</span>
                  </label>
                  <textarea
                    rows={4}
                    value={sProfile.systemDirective}
                    onChange={(e) => setSProfile({ ...sProfile, systemDirective: e.target.value })}
                    className="w-full bg-[#1C120F] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FF6A3D] leading-relaxed resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Saving..." : "Save Sofi's Profile"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
