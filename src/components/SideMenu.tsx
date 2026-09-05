import React from "react";
import { 
  Plus, MessageSquare, Code2, Microscope, Palette, 
  Brain, User, Smartphone, LogOut, 
  ChevronLeft, Trash2, Clock, Sparkles, PanelRight, Settings, Zap, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthUser, ChatSession, SpecializedMode, SofiEdition } from "../types";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  activeSessionId: string | null;
  sessions: ChatSession[];
  activeMode: SpecializedMode;
  currentEdition: SofiEdition;
  onNewChat: (mode?: SpecializedMode) => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onSelectMode: (mode: SpecializedMode) => void;
  onOpenSettings: () => void;
  onOpenMemoryDrawer: () => void;
  onOpenProfileDrawer: () => void;
  onOpenApkModal: () => void;
  onOpenExtensionModal?: () => void;
  onLogout: () => void;
  language: "en" | "si";
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeSessionId,
  sessions,
  activeMode,
  currentEdition,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onSelectMode,
  onOpenSettings,
  onOpenMemoryDrawer,
  onOpenProfileDrawer,
  onOpenApkModal,
  onOpenExtensionModal,
  onLogout,
  language
}) => {
  const specializedPanels = [
    {
      mode: "general" as SpecializedMode,
      name: language === "si" ? "සාමාන්‍ය සහකරු" : "General Companion",
      icon: MessageSquare,
      color: "text-[#FF8A50]",
      badge: "SLM Memory"
    },
    {
      mode: "coding" as SpecializedMode,
      name: language === "si" ? "කේතකරණ මැදිරිය" : "Coding & DevOps",
      icon: Code2,
      color: "text-amber-400",
      badge: "Dev Studio"
    },
    {
      mode: "research" as SpecializedMode,
      name: language === "si" ? "ගැඹුරු පර්යේෂණ" : "Deep Research",
      icon: Microscope,
      color: "text-cyan-400",
      badge: "In-Depth"
    },
    {
      mode: "creative" as SpecializedMode,
      name: language === "si" ? "නිර්මාණශීලී මැදිරිය" : "Creative & Media",
      icon: Palette,
      color: "text-rose-400",
      badge: "Img & Vid"
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[#160B09] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl font-sans ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Version Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1A0C08]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={sofiAvatar}
                alt="Sofi"
                className="w-10 h-10 rounded-2xl object-cover border-2 border-[#FF6A3D] shadow-md shadow-orange-500/20"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#160B09] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white tracking-tight">Sofi AI</span>
                <span className={`text-[10px] border px-1.5 py-0.2 rounded-md font-mono font-bold uppercase ${
                  currentEdition === "pro"
                    ? "bg-[#FF6A3D]/20 text-[#FF8A50] border-[#FF6A3D]/40"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                }`}>
                  {currentEdition === "pro" ? "Pro (Big AI)" : "Free (Local LLM)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentEdition === "pro" ? "AgentRouter Connected" : "Local Qwen & LBGM"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-[#FF6A3D]/20 text-amber-200/80 hover:text-white transition cursor-pointer"
              title="Sofi Settings & Free/Pro Editions"
            >
              <Settings className="w-4 h-4 text-[#FF8A50]" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200/60 hover:text-white transition cursor-pointer"
              title="Collapse Menu"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action: New Chat Button */}
        <div className="p-3 border-b border-white/5">
          <button
            type="button"
            onClick={() => onNewChat(activeMode)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>{language === "si" ? "නව සංවාදයක්" : "New Chat"}</span>
            </div>
            <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded-full text-amber-200 uppercase">
              {activeMode}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Section 1: Specialized Chat Panels (Requested by user) */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-200/40 px-2 tracking-wider">
              {language === "si" ? "විශේෂිත මැදිරි (Workspaces)" : "Specialized Workspaces"}
            </span>

            <div className="space-y-1">
              {specializedPanels.map((panel) => {
                const Icon = panel.icon;
                const isSelected = activeMode === panel.mode;
                return (
                  <button
                    key={panel.mode}
                    type="button"
                    onClick={() => onSelectMode(panel.mode)}
                    className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer flex items-center justify-between group border ${
                      isSelected
                        ? "bg-[#251511] border-[#FF6A3D]/40 text-white shadow-sm"
                        : "bg-transparent border-transparent hover:bg-white/5 text-amber-200/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg bg-black/40 ${panel.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">{panel.name}</span>
                    </div>

                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? "bg-[#FF6A3D] text-white font-bold" : "bg-white/5 text-amber-200/40"
                    }`}>
                      {panel.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Chat History */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] uppercase font-bold text-amber-200/40 tracking-wider">
                {language === "si" ? "පැරණි සංවාද" : "Chat History"}
              </span>
              <span className="text-[10px] font-mono text-amber-200/40">
                {sessions.length}
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="p-4 text-center text-amber-200/40 text-xs bg-white/5 rounded-2xl border border-white/5">
                No past sessions yet. Start talking with Sofi!
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {sessions.map((sess) => {
                  const isCurrent = sess.id === activeSessionId;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => onSelectSession(sess)}
                      className={`group w-full p-2 rounded-xl text-left transition cursor-pointer flex items-center justify-between border ${
                        isCurrent
                          ? "bg-[#2A1611] border-[#FF6A3D]/50 text-white"
                          : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10 text-amber-200/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-[#FF8A50]" : "text-amber-200/40"}`} />
                        <span className="text-xs truncate block font-medium">
                          {sess.title || "Conversation"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono text-amber-200/40 uppercase">
                          {sess.mode || "gen"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => onDeleteSession(sess.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-amber-200/40 transition cursor-pointer"
                          title="Delete chat session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: App Modules & Quick Links */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-amber-200/40 px-2 tracking-wider">
              {language === "si" ? "පද්ධති මෙවලම්" : "System Tools"}
            </span>

            <div className="space-y-1">
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-full p-2.5 rounded-xl bg-[#FF6A3D]/10 hover:bg-[#FF6A3D]/20 border border-[#FF6A3D]/30 text-white text-xs font-bold flex items-center justify-between transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[#FF8A50] group-hover:rotate-45 transition-transform duration-200" />
                  <span>{language === "si" ? "සොෆී සැකසුම් (Sofi Settings)" : "Sofi Settings & Editions"}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                  currentEdition === "pro"
                    ? "bg-[#FF6A3D] text-white"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}>
                  {currentEdition === "pro" ? "Pro (Big AI)" : "Free (Local)"}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenMemoryDrawer}
                className="w-full p-2 rounded-xl hover:bg-white/5 text-amber-200/80 hover:text-white text-xs font-bold flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span>{language === "si" ? "මතක ගබඩාව" : "Memory Bank"}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  SLM
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenProfileDrawer}
                className="w-full p-2 rounded-xl hover:bg-white/5 text-amber-200/80 hover:text-white text-xs font-bold flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>{language === "si" ? "පැතිකඩ (About Me)" : "Profiles & About Me"}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenApkModal}
                className="w-full p-2 rounded-xl hover:bg-white/5 text-amber-200/80 hover:text-white text-xs font-bold flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#FF8A50]" />
                  <span>{language === "si" ? "ජංගම යෙදුම (iOS & Android)" : "Mobile App (iOS & Android)"}</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded">
                  TestFlight / APK
                </span>
              </button>

              {onOpenExtensionModal && (
                <button
                  type="button"
                  onClick={onOpenExtensionModal}
                  className="w-full p-2 rounded-xl hover:bg-white/5 text-amber-200/80 hover:text-white text-xs font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PanelRight className="w-4 h-4 text-cyan-400" />
                    <span>{language === "si" ? "බ්‍රවුසර දිගුව (Sidebar)" : "Browser Extension & Side Panel"}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    MV3
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Current User & Logout */}
        <div className="p-3 border-t border-white/10 bg-[#120706] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6A3D] to-amber-500 flex items-center justify-center text-white text-xs font-extrabold uppercase shrink-0">
              {currentUser?.name ? currentUser.name[0] : "U"}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold text-white truncate block">
                {currentUser?.name || "User"}
              </span>
              <span className="text-[10px] text-amber-200/50 truncate block font-mono">
                {currentUser?.isGuest ? "Guest Access" : `@${currentUser?.username}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl hover:bg-white/10 text-amber-200/60 hover:text-red-400 transition cursor-pointer"
            title="Log Out / Switch User"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
