import React, { useState } from "react";
import { 
  ArrowUpRight, Sparkles, Server, HardDrive, Cpu, ShieldCheck, 
  Activity, Radio, Zap, Clock, ChevronRight, Terminal, RefreshCw,
  Search, Sliders, Bell, ArrowRight, CheckCircle2, Flame, Bot, Send, Download, Smartphone
} from "lucide-react";
import { motion } from "motion/react";
import { ServerStatus, Skill, McpServer } from "../types";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface BentoDashboardProps {
  serverStatus: ServerStatus | null;
  skills: Skill[];
  mcpServers: McpServer[];
  onNavigateTab: (tab: "dashboard" | "chat" | "skills" | "mcp" | "deploy" | "mobile") => void;
  onQuickPrompt: (prompt: string) => void;
  language: "en" | "si";
  onToggleLanguage: () => void;
  onRefreshStatus: () => void;
}

export const BentoDashboard: React.FC<BentoDashboardProps> = ({
  serverStatus,
  skills,
  mcpServers,
  onNavigateTab,
  onQuickPrompt,
  language,
  onToggleLanguage,
  onRefreshStatus
}) => {
  const [promptInput, setPromptInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "bash" | "js">("all");
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<number | null>(14);

  // 24-slot activity heatmap (4 time bands x 6 columns), mimicking the "Order time tracking" bento from image 1
  const heatmapData = [
    // 00-06 AM
    { id: 0, time: "00:00 - 03:00", value: 4, active: false, label: "Idle" },
    { id: 1, time: "03:00 - 06:00", value: 2, active: false, label: "Idle" },
    { id: 2, time: "01:00 - 02:00", value: 8, active: false, label: "Low" },
    { id: 3, time: "02:00 - 04:00", value: 12, active: false, label: "Low" },
    { id: 4, time: "04:00 - 05:00", value: 24, active: true, intensity: "mid", label: "Active" },
    { id: 5, time: "05:00 - 06:00", value: 36, active: true, intensity: "high", label: "High" },
    // 07-12 AM
    { id: 6, time: "07:00 - 08:00", value: 18, active: false, label: "Low" },
    { id: 7, time: "08:00 - 09:00", value: 45, active: false, label: "Normal" },
    { id: 8, time: "09:00 - 10:00", value: 92, active: true, intensity: "high", label: "Peak" },
    { id: 9, time: "10:00 - 11:00", value: 88, active: true, intensity: "high", label: "Peak" },
    { id: 10, time: "11:00 - 12:00", value: 65, active: false, label: "Normal" },
    { id: 11, time: "12:00 - 13:00", value: 50, active: false, label: "Normal" },
    // 01-06 PM
    { id: 12, time: "13:00 - 14:00", value: 40, active: false, label: "Normal" },
    { id: 13, time: "14:00 - 15:00", value: 78, active: true, intensity: "mid", label: "Active" },
    { id: 14, time: "15:00 - 16:00", value: 114, active: true, intensity: "max", label: "Surge" },
    { id: 15, time: "16:00 - 17:00", value: 60, active: false, label: "Normal" },
    { id: 16, time: "17:00 - 18:00", value: 95, active: true, intensity: "high", label: "Peak" },
    { id: 17, time: "18:00 - 19:00", value: 30, active: false, label: "Normal" },
    // 07-12 PM
    { id: 18, time: "19:00 - 20:00", value: 22, active: false, label: "Low" },
    { id: 19, time: "20:00 - 21:00", value: 55, active: false, label: "Normal" },
    { id: 20, time: "21:00 - 22:00", value: 108, active: true, intensity: "max", label: "Surge" },
    { id: 21, time: "22:00 - 23:00", value: 42, active: false, label: "Normal" },
    { id: 22, time: "23:00 - 00:00", value: 70, active: true, intensity: "mid", label: "Active" },
    { id: 23, time: "00:00 - 01:00", value: 15, active: false, label: "Low" },
  ];

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onQuickPrompt(promptInput.trim());
    setPromptInput("");
  };

  const quickActionChips = [
    { label: "Status Report", prompt: "Give me a quick status report of your system and active tasks." },
    { label: "Top Skills", prompt: "List your learned skills and their triggers." },
    { label: "Check Disk Space", prompt: "Check the current AWS disk space and memory utilization." },
    { label: "Sinhala Voice Mode", prompt: "සිංහලෙන් කතා කරමු! ඔබ කවුද සහ මට කළ හැකි දේ මොනවාද?" },
    { label: "Restart Daemon", prompt: "How do I restart the background systemd service on AWS?" },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header Profile & Quick Action Bar (Exact structure of image 1 top) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1B110E]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#FF6A3D] shadow-lg shadow-orange-500/20 p-0.5 bg-[#251511]">
              <img src={sofiAvatar} alt="Sofi Avatar" className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#FF6A3D] rounded-full border-2 border-[#1B110E] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">Sofi Agent Hub</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FF6A3D]/15 text-[#FF8A50] border border-[#FF6A3D]/30 rounded-full uppercase tracking-wider">
                Active Core
              </span>
            </div>
            <p className="text-xs text-amber-200/50 font-medium">aws.t3.small • Cloudflare Zero Trust Node</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={onToggleLanguage}
            className="px-3 py-2 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-amber-100 border border-white/[0.08] transition flex items-center gap-1.5 cursor-pointer"
            title="Switch Language"
          >
            <span className="text-sm">{language === "en" ? "🇺🇸" : "🇱🇰"}</span>
            <span>{language === "en" ? "EN" : "සිංහල"}</span>
          </button>

          <button
            onClick={onRefreshStatus}
            className="p-2.5 rounded-2xl text-amber-200/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/[0.08] transition cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigateTab("skills")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF7A4E] hover:to-[#F16339] shadow-lg shadow-orange-500/25 transition cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>+ Teach Skill</span>
          </button>
        </div>
      </div>

      {/* 2. Main Bento Grid (Asymmetric High-Fidelity Bento Boxes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: AI Query Card + Activity Heatmap (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">

          {/* BENTO CARD A: "Can I help you? Ask something to Sofi" (Exact Match of Image 1 Middle Card) */}
          <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl shadow-black/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A3D]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-[#FF6A3D]/15 transition duration-700" />

            <div className="relative z-10 space-y-4">
              <div>
                <span className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider block">Hi Operator,</span>
                <h3 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">Can I help you?</h3>
              </div>

              {/* Quick Action Suggestion Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {quickActionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => onQuickPrompt(chip.prompt)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#FF6A3D]/15 text-amber-100/80 hover:text-white border border-white/[0.06] hover:border-[#FF6A3D]/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#FF8A50]" />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              {/* Smart Search / Ask Bar with Glowing Orange Sparkle Button */}
              <form onSubmit={handlePromptSubmit} className="pt-2">
                <div className="flex items-center bg-[#130B09] border border-white/[0.08] focus-within:border-[#FF6A3D] rounded-2xl p-1.5 transition-all shadow-inner">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Ask something to Sofi in English or සිංහල..."
                    className="flex-1 bg-transparent px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-amber-200/30 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A3D] to-[#FF8A50] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition cursor-pointer shrink-0"
                    title="Send to Sofi"
                  >
                    <Sparkles className="w-5 h-5 fill-white/20" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* BENTO CARD B: "Order & Agent Time Tracking Heatmap" (Exact Match of Image 1 Middle Bottom Card) */}
          <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl shadow-black/40 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider block">Agent Activity Matrix</span>
                <h4 className="text-lg font-extrabold text-white tracking-tight mt-0.5">Execution time tracking</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">+842</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                  +8.5% vs last week
                </span>
              </div>
            </div>

            {/* Matrix Heatmap Grid */}
            <div className="pt-2 space-y-3">
              <div className="space-y-2">
                {/* 4 Time row groups */}
                {[
                  { label: "00 - 06 AM", slice: [0, 6] },
                  { label: "07 - 12 AM", slice: [6, 12] },
                  { label: "01 - 06 PM", slice: [12, 18] },
                  { label: "07 - 12 PM", slice: [18, 24] }
                ].map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-3">
                    <span className="w-20 text-[10px] font-mono text-amber-200/40 uppercase tracking-tight text-right">
                      {row.label}
                    </span>
                    <div className="flex-1 grid grid-cols-6 gap-2">
                      {heatmapData.slice(row.slice[0], row.slice[1]).map((cell) => {
                        const isSelected = selectedHeatmapCell === cell.id;
                        let bgClass = "bg-[#251713] hover:bg-[#321E19]";
                        if (cell.active) {
                          if (cell.intensity === "max") bgClass = "bg-[#FF6A3D] shadow-[0_0_12px_rgba(255,106,61,0.6)]";
                          else if (cell.intensity === "high") bgClass = "bg-[#E5532B] shadow-[0_0_8px_rgba(229,83,43,0.4)]";
                          else bgClass = "bg-[#B8401D]";
                        }

                        return (
                          <button
                            key={cell.id}
                            onClick={() => setSelectedHeatmapCell(cell.id)}
                            className={`h-6 rounded-lg transition-all transform hover:scale-105 cursor-pointer relative ${bgClass} ${
                              isSelected ? "ring-2 ring-white" : ""
                            }`}
                            title={`${cell.time}: ${cell.value} executions (${cell.label})`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06] text-[10px] text-amber-200/40">
                <span>Task Density (24h Activity)</span>
                <div className="flex items-center gap-1.5">
                  <span>Idle</span>
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#251713]" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#B8401D]" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#E5532B]" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FF6A3D]" />
                  <span>Surge</span>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO CARD C: AWS & Cloudflare Execution Route / Pipeline Tracker (Exact match of Image 1 bottom route card) */}
          <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 shadow-2xl shadow-black/40 space-y-3">
            <span className="text-[10px] font-semibold text-amber-200/50 uppercase tracking-wider block">Zero Trust Pipeline Route</span>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#140B09] border border-white/[0.06] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#251511] border border-white/[0.08] flex items-center justify-center text-[#FF8A50]">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Client Browser / Voice</span>
                  <span className="text-[10px] text-amber-200/40">Local Endpoint</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-amber-200/40 font-mono text-[10px] w-full sm:w-auto justify-center">
                <span className="w-2 h-2 rounded-full bg-[#FF6A3D] animate-ping" />
                <span className="border-b border-dashed border-[#FF6A3D]/40 w-12 sm:w-16 block" />
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-200 text-[9px]">24ms</span>
                <span className="border-b border-dashed border-[#FF6A3D]/40 w-12 sm:w-16 block" />
                <ArrowRight className="w-3.5 h-3.5 text-[#FF6A3D]" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6A3D] to-[#E5532B] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">AWS t3.small Host</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Cloudflared Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 2x2 Metric Tiles + Active Skills & Mobile Gateway (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">

          {/* 2x2 Bento Metric Tiles (Exact Match of Image 1 Right Screen "Items Tracking") */}
          <div className="grid grid-cols-2 gap-4">

            {/* Tile 1: vCPU Load */}
            <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 shadow-2xl shadow-black/40 flex flex-col justify-between hover:border-[#FF6A3D]/30 transition group">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-amber-200/60 leading-tight">Host CPU Load</span>
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-amber-200/60 group-hover:text-white group-hover:bg-[#FF6A3D]/20 transition">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {serverStatus?.cpuLoad ?? "14%"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                    +2.5% vs baseline
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 2: Memory Allocated */}
            <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 shadow-2xl shadow-black/40 flex flex-col justify-between hover:border-[#FF6A3D]/30 transition group">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-amber-200/60 leading-tight">RAM Utilization</span>
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-amber-200/60 group-hover:text-white group-hover:bg-[#FF6A3D]/20 transition">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {serverStatus?.memoryUsage ?? "642 MB"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full">
                    31% of 2GB
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 3: Skills Automated */}
            <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 shadow-2xl shadow-black/40 flex flex-col justify-between hover:border-[#FF6A3D]/30 transition group">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-amber-200/60 leading-tight">Skills Automated</span>
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-amber-200/60 group-hover:text-white group-hover:bg-[#FF6A3D]/20 transition">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {skills.length}
                  </span>
                  <span className="text-xs text-amber-200/50 font-medium">registered</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                    Bash & JS
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 4: MCP Nodes */}
            <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 shadow-2xl shadow-black/40 flex flex-col justify-between hover:border-[#FF6A3D]/30 transition group">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-amber-200/60 leading-tight">Tunnel & MCP</span>
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-amber-200/60 group-hover:text-white group-hover:bg-[#FF6A3D]/20 transition">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {mcpServers.length}
                  </span>
                  <span className="text-xs text-amber-200/50 font-medium">daemons</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FF6A3D]/15 text-[#FF8A50] border border-[#FF6A3D]/30 rounded-full">
                    Zero Trust
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* BENTO CARD D: Active Skills Quick Stack & Runner (Inspired by Image 4 Stacked Card) */}
          <div className="bg-[#1C120F]/90 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl shadow-black/40 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider block">Automation Library</span>
                <h4 className="text-base font-extrabold text-white tracking-tight mt-0.5">Quick Skill Trigger</h4>
              </div>
              <button
                onClick={() => onNavigateTab("skills")}
                className="text-xs font-bold text-[#FF8A50] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-3 text-xs">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer font-bold ${
                  activeCategory === "all" ? "bg-[#FF6A3D] text-white" : "text-amber-200/60 hover:text-white"
                }`}
              >
                All ({skills.length})
              </button>
              <button
                onClick={() => setActiveCategory("bash")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer font-bold ${
                  activeCategory === "bash" ? "bg-[#FF6A3D] text-white" : "text-amber-200/60 hover:text-white"
                }`}
              >
                Bash
              </button>
              <button
                onClick={() => setActiveCategory("js")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer font-bold ${
                  activeCategory === "js" ? "bg-[#FF6A3D] text-white" : "text-amber-200/60 hover:text-white"
                }`}
              >
                JS
              </button>
            </div>

            {/* List of skills */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {skills
                .filter(s => activeCategory === "all" || s.actionType === activeCategory)
                .slice(0, 3)
                .map((skill) => (
                  <div
                    key={skill.id}
                    className="p-3.5 rounded-2xl bg-[#140B09] border border-white/[0.06] hover:border-[#FF6A3D]/40 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{skill.name}</span>
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-200/70 font-mono">
                          {skill.actionType}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-200/50 truncate mt-0.5">
                        Trigger: "{skill.trigger}"
                      </p>
                    </div>

                    <button
                      onClick={() => onQuickPrompt(skill.trigger)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#FF6A3D] text-amber-200 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Run</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* BENTO CARD E: Mobile Voice Assistant & Android APK (Inspired by Image 2) */}
          <div className="bg-gradient-to-tr from-[#FF6A3D] to-[#E5532B] rounded-3xl p-5 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200/80 block">Android Engine & Daemon</span>
                <span className="text-[9px] bg-black/20 text-white font-mono px-2 py-0.5 rounded-full font-bold">v1.2.0</span>
              </div>
              <h5 className="text-sm font-extrabold tracking-tight">Sofi Android App & Background Voice</h5>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Run background service daemon ("Sofi" / "සොෆී") or download APK package.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href="/api/android/download"
                download="sofi-assistant-v1.2.apk"
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl bg-black/30 hover:bg-black/40 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Direct Download APK (14.8 MB)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>APK</span>
              </a>
              <button
                onClick={() => onNavigateTab("mobile")}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white text-[#E5532B] font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulator</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
