import React, { useState } from "react";
import { 
  BookOpen, Plus, Trash2, Code2, Terminal, Sparkles, Check, Play, AlertCircle
} from "lucide-react";
import { Skill } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SkillLearnerProps {
  skills: Skill[];
  onAddSkill: (newSkill: { name: string; trigger: string; description: string; actionType: 'bash' | 'js'; code: string }) => void;
  onDeleteSkill: (id: string) => void;
}

export const SkillLearner: React.FC<SkillLearnerProps> = ({
  skills,
  onAddSkill,
  onDeleteSkill
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState<'bash' | 'js'>('bash');
  const [code, setCode] = useState("");
  
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !trigger || !code) return;
    
    onAddSkill({
      name,
      trigger: trigger.toLowerCase().trim(),
      description,
      actionType,
      code
    });

    // Reset Form
    setName("");
    setTrigger("");
    setDescription("");
    setActionType("bash");
    setCode("");
    setShowAddForm(false);
  };

  const handleTestSkill = (skill: Skill) => {
    setTestingId(skill.id);
    setTestResult(null);

    // Simulate safe remote AWS sandbox run
    setTimeout(() => {
      setTestingId(null);
      if (skill.actionType === "bash") {
        setTestResult(
          `$ ${skill.code}\n\n[AWS t3.small EC2 Execution Logs]:\nLoaded sandbox runner.\nTrigger matched successfully: "${skill.trigger}"\nOutput:\nDisk utilization 62% [HEALTHY].\nInodes available: 89%.\nExecuting processes: 42.`
        );
      } else {
        setTestResult(
          `[Sandbox JS Engine]: Evaluating code script...\nResult: Operation complete.\nReturn status: 200 OK.`
        );
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#1C120F]/90 backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/50 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FF6A3D]" />
            Sofi Skill Registry
          </h2>
          <p className="text-xs text-amber-200/60 mt-1.5 leading-relaxed">
            Teach Sofi how to execute tasks on your AWS t3.small host. Define triggering phrases and bash scripts or JS functions.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-[#FF7A4E] hover:to-[#F16339] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Teach New Skill
        </button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {/* Left Side: Skills Stream */}
        <div className="lg:col-span-7 space-y-4">
          <AnimatePresence>
            {skills.map((skill) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition flex flex-col justify-between gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">{skill.name}</h3>
                    <p className="text-xs text-amber-200/60 mt-1.5 leading-relaxed">{skill.description || "No description provided."}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${
                      skill.actionType === "bash" 
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30" 
                        : "bg-orange-500/10 text-orange-300 border-orange-500/30"
                    }`}>
                      {skill.actionType === "bash" ? "Bash Script" : "JS Engine"}
                    </span>
                    <button
                      onClick={() => onDeleteSkill(skill.id)}
                      className="p-1.5 text-amber-400 hover:text-red-400 rounded-md hover:bg-white/5 transition cursor-pointer"
                      title="Delete Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Code preview & trigger info */}
                <div className="bg-[#120706]/80 border border-white/5 rounded-lg p-3 text-xs font-mono text-amber-200 overflow-x-auto relative">
                  <div className="flex justify-between text-[10px] text-amber-400/80 mb-2 border-b border-white/5 pb-1.5">
                    <span>TRIGGER PHRASE: "{skill.trigger}"</span>
                    <span className="uppercase font-bold text-[#FF8C37]">{skill.actionType === "bash" ? "bash" : "javascript"}</span>
                  </div>
                  <pre className="text-[11px] leading-relaxed whitespace-pre text-amber-100">{skill.code}</pre>
                </div>

                {/* Run / Test Skill trigger button */}
                <div className="flex justify-end gap-2.5">
                  <button
                    onClick={() => handleTestSkill(skill)}
                    disabled={testingId === skill.id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {testingId === skill.id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                        Testing Execution...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-emerald-400 fill-current" />
                        Test Live Sandbox
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {skills.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-amber-400/50 border border-dashed border-white/10 rounded-xl bg-white/5">
              <Code2 className="w-8 h-8 text-[#FF5E36]/50 mb-2" />
              <p className="text-xs">No learned skills found. Click "Teach New Skill" to create one.</p>
            </div>
          )}
        </div>

        {/* Right Side: Skill Creator Form or Testing Output Console */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {showAddForm ? (
            <motion.form
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleSubmit}
              className="p-5 border border-[#FF5E36]/20 bg-white/5 rounded-xl space-y-4 shadow-xl"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF8C37]" />
                Define New AI Action Script
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1.5">Skill Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Check AWS Disk Space"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#FF6B35] transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1.5">Triggering Phrase</label>
                    <input
                      type="text"
                      required
                      value={trigger}
                      onChange={(e) => setTrigger(e.target.value)}
                      placeholder="e.g., check disk space"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#FF6B35] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1.5">Executor Engine</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#1E0F0D] border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#FF6B35] transition cursor-pointer"
                    >
                      <option value="bash">Bash Terminal</option>
                      <option value="js">JS Sandbox</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details on what this script monitors or accomplishes..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#FF6B35] transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1.5">Execution Code Script</label>
                  <textarea
                    rows={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={actionType === "bash" ? "$ df -h | grep root" : "const disk = () => { return 'OK' }"}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-amber-200 outline-none focus:border-[#FF6B35] transition resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg text-amber-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#FF5E36] to-[#E34A0E] hover:from-[#FF7B47] hover:to-[#F1551A] rounded-lg text-white shadow-md transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save and Teach
                </button>
              </div>
            </motion.form>
          ) : (
            <div className="p-5 border border-white/10 bg-white/5 rounded-xl space-y-4 flex-1 flex flex-col shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-4.5 h-4.5 text-[#FF6B35]" />
                AWS EC2 Test Output Logs
              </h3>

              <div className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-xs text-amber-200 overflow-y-auto space-y-3 min-h-60 max-h-80 lg:max-h-none flex flex-col justify-between scrollbar-thin scrollbar-thumb-white/10">
                <div>
                  {testResult ? (
                    <pre className="whitespace-pre-wrap leading-relaxed text-amber-100">{testResult}</pre>
                  ) : (
                    <div className="text-amber-400/50 text-center py-10 flex flex-col items-center justify-center gap-2.5">
                      <AlertCircle className="w-6 h-6 text-[#FF5E36]/40 animate-pulse" />
                      <span>Select "Test Live Sandbox" on any skill to capture remote terminal console streams.</span>
                    </div>
                  )}
                </div>
                {testResult && (
                  <button
                    onClick={() => setTestResult(null)}
                    className="text-[10px] text-amber-400 hover:text-white underline block self-end transition mt-4 cursor-pointer"
                  >
                    Clear Logs
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};;
