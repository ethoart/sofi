import React, { useState } from "react";
import { 
  X, Brain, Search, Trash2, Plus, Sparkles, BookOpen, Mic, CheckCircle2, History, Languages, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MemoryItem, LanguageVocab } from "../types";

interface MemoryBankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  vocab: LanguageVocab[];
  onAddMemory: (memory: Partial<MemoryItem>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onAddVocab: (vocab: Partial<LanguageVocab>) => Promise<void>;
  onDeleteVocab: (id: string) => Promise<void>;
  language: "en" | "si";
}

export const MemoryBankDrawer: React.FC<MemoryBankDrawerProps> = ({
  isOpen,
  onClose,
  memories,
  vocab,
  onAddMemory,
  onDeleteMemory,
  onAddVocab,
  onDeleteVocab,
  language
}) => {
  const [activeTab, setActiveTab] = useState<"memories" | "vocab">("memories");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddingMem, setIsAddingMem] = useState(false);
  const [newMemSummary, setNewMemSummary] = useState("");
  const [newMemCategory, setNewMemCategory] = useState<MemoryItem["category"]>("personal_fact");

  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [newVocabTerm, setNewVocabTerm] = useState("");
  const [newVocabTranslation, setNewVocabTranslation] = useState("");
  const [newVocabUsage, setNewVocabUsage] = useState("");

  if (!isOpen) return null;

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = (m.summary + " " + m.detail).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredVocab = vocab.filter((v) => {
    return (v.term + " " + v.translation + " " + v.sampleUsage).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemSummary.trim()) return;
    await onAddMemory({
      summary: newMemSummary.trim(),
      detail: newMemSummary.trim(),
      category: newMemCategory,
      source: "chat"
    });
    setNewMemSummary("");
    setIsAddingMem(false);
  };

  const handleCreateVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVocabTerm.trim() || !newVocabTranslation.trim()) return;
    await onAddVocab({
      term: newVocabTerm.trim(),
      translation: newVocabTranslation.trim(),
      sampleUsage: newVocabUsage.trim() || `${newVocabTerm.trim()} (${newVocabTranslation.trim()})`,
      language: /[\u0D80-\u0DFF]/.test(newVocabTerm) ? "sinhala" : "english"
    });
    setNewVocabTerm("");
    setNewVocabTranslation("");
    setNewVocabUsage("");
    setIsAddingVocab(false);
  };

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
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {language === "si" ? "සොෆීගේ මතක ගබඩාව" : "Sofi's Memory Bank"}
                </h3>
                <p className="text-xs text-amber-200/60">
                  {language === "si"
                    ? "ඉතිහාසගත මතකයන් හා ඉගෙනගත් වචන"
                    : `${memories.length} historical memories & ${vocab.length} learned vocabulary`}
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

          {/* Sub-tabs: Memories vs Vocabulary */}
          <div className="flex border-b border-white/[0.06] bg-[#120706]">
            <button
              onClick={() => setActiveTab("memories")}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
                activeTab === "memories"
                  ? "border-[#FF6A3D] text-[#FF8A50] bg-[#FF6A3D]/10"
                  : "border-transparent text-amber-200/60 hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{language === "si" ? "ඉතිහාස මතකයන්" : "Historical Memories"} ({memories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("vocab")}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
                activeTab === "vocab"
                  ? "border-[#FF6A3D] text-[#FF8A50] bg-[#FF6A3D]/10"
                  : "border-transparent text-amber-200/60 hover:text-white"
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === "si" ? "ඉගෙනගත් වචන" : "Learned Vocab"} ({vocab.length})</span>
            </button>
          </div>

          {/* Search Bar & Action */}
          <div className="p-4 border-b border-white/[0.06] bg-[#160D0A] space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-amber-200/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    activeTab === "memories"
                      ? "Search remembered facts, preferences..."
                      : "Search vocabulary, terms, translations..."
                  }
                  className="w-full bg-[#1F1411] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>

              {activeTab === "memories" ? (
                <button
                  onClick={() => setIsAddingMem(!isAddingMem)}
                  className="px-3 py-2 bg-[#FF6A3D] hover:bg-[#FF8A50] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Memory</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAddingVocab(!isAddingVocab)}
                  className="px-3 py-2 bg-[#FF6A3D] hover:bg-[#FF8A50] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Word</span>
                </button>
              )}
            </div>

            {/* Category Pills for Memories */}
            {activeTab === "memories" && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: "all", label: "All" },
                  { id: "personal_fact", label: "Facts" },
                  { id: "preference", label: "Preferences" },
                  { id: "task_rule", label: "Rules" },
                  { id: "language_word", label: "Words" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                      categoryFilter === cat.id
                        ? "bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/40"
                        : "bg-white/5 text-amber-200/60 hover:text-white border border-transparent"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Form (Collapsible) */}
          {activeTab === "memories" && isAddingMem && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateMemory}
              className="p-4 bg-[#1E110E] border-b border-white/10 space-y-3"
            >
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6A3D]" />
                <span>Add Historical Memory Directly</span>
              </h4>
              <input
                type="text"
                value={newMemSummary}
                onChange={(e) => setNewMemSummary(e.target.value)}
                placeholder="e.g. Likes morning briefings at 8am, works on AWS..."
                className="w-full bg-[#140B09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
                required
              />
              <div className="flex items-center justify-between gap-3">
                <select
                  value={newMemCategory}
                  onChange={(e) => setNewMemCategory(e.target.value as any)}
                  className="bg-[#140B09] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-200 focus:outline-none"
                >
                  <option value="personal_fact">Personal Fact</option>
                  <option value="preference">Preference</option>
                  <option value="task_rule">Task Rule</option>
                  <option value="language_word">Language Word</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingMem(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-amber-200/60 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#FF6A3D] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#FF8A50]"
                  >
                    Save Memory
                  </button>
                </div>
              </div>
            </motion.form>
          )}

          {activeTab === "vocab" && isAddingVocab && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateVocab}
              className="p-4 bg-[#1E110E] border-b border-white/10 space-y-3"
            >
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-[#FF6A3D]" />
                <span>Teach Sofi a New Word / Phrase</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newVocabTerm}
                  onChange={(e) => setNewVocabTerm(e.target.value)}
                  placeholder="Term (e.g. ස්තූතියි)"
                  className="bg-[#140B09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
                  required
                />
                <input
                  type="text"
                  value={newVocabTranslation}
                  onChange={(e) => setNewVocabTranslation(e.target.value)}
                  placeholder="Meaning (e.g. Thank you)"
                  className="bg-[#140B09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
                  required
                />
              </div>
              <input
                type="text"
                value={newVocabUsage}
                onChange={(e) => setNewVocabUsage(e.target.value)}
                placeholder="Sample sentence or usage (optional)..."
                className="w-full bg-[#140B09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingVocab(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-amber-200/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FF6A3D] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#FF8A50]"
                >
                  Teach Word
                </button>
              </div>
            </motion.form>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Info notice explaining how Sofi remembers */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-200/80 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-200">How Sofi uses your memories:</span>
                <p className="mt-0.5 text-amber-200/70">
                  Every voice command ("Remember that...", "Learn this word...") or chat fact is indexed by Sofi's internal SLM. Sofi retrieves these memories on every prompt to personalize answers and execute tasks!
                </p>
              </div>
            </div>

            {activeTab === "memories" ? (
              filteredMemories.length === 0 ? (
                <div className="text-center py-12 text-amber-200/40 text-xs">
                  No memories found matching your search.
                </div>
              ) : (
                filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3.5 bg-[#1C120F] border border-white/[0.08] hover:border-white/15 rounded-2xl transition group relative"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-amber-200/70 border border-white/10">
                        {mem.category.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-200/40">
                          {new Date(mem.learnedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          className="opacity-0 group-hover:opacity-100 text-amber-200/40 hover:text-red-400 transition cursor-pointer p-1"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-white mb-1 leading-snug">{mem.summary}</h5>
                    {mem.detail && mem.detail !== mem.summary && (
                      <p className="text-[11px] text-amber-200/60 leading-relaxed">{mem.detail}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-amber-200/40 border-t border-white/5 pt-1.5">
                      <span className="flex items-center gap-1">
                        {mem.source === "voice_command" && <Mic className="w-3 h-3 text-[#FF6A3D]" />}
                        <span>Source: {mem.source}</span>
                      </span>
                      <span>Referenced {mem.usageCount || 1} times</span>
                    </div>
                  </div>
                ))
              )
            ) : (
              filteredVocab.length === 0 ? (
                <div className="text-center py-12 text-amber-200/40 text-xs">
                  No learned vocabulary found. Teach Sofi a word using voice or the button above!
                </div>
              ) : (
                filteredVocab.map((voc) => (
                  <div
                    key={voc.id}
                    className="p-3.5 bg-[#1C120F] border border-white/[0.08] hover:border-white/15 rounded-2xl transition group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">{voc.term}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#FF6A3D]" />
                        <span className="text-xs font-bold text-[#FF8A50]">{voc.translation}</span>
                      </div>
                      <button
                        onClick={() => onDeleteVocab(voc.id)}
                        className="opacity-0 group-hover:opacity-100 text-amber-200/40 hover:text-red-400 transition cursor-pointer p-1"
                        title="Delete word"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {voc.sampleUsage && (
                      <p className="text-[11px] text-amber-200/60 italic mt-1 bg-black/20 p-2 rounded-xl">
                        "{voc.sampleUsage}"
                      </p>
                    )}
                    <div className="mt-2 text-[10px] text-amber-200/40 flex items-center justify-between">
                      <span className="capitalize">{voc.language}</span>
                      <span>Learned: {new Date(voc.learnedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
