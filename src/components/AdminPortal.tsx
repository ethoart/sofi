import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, ShieldCheck, Lock, LogOut, ArrowLeft, RefreshCw, Server, Cpu, HardDrive, 
  Activity, Play, CheckCircle2, AlertCircle, Sparkles, Layers, Smartphone, KeyRound, Database
} from "lucide-react";
import { CommandExecutionResult, ServerStatus } from "../types";
import { AwsCloudflareSetup } from "./AwsCloudflareSetup";
import { McpTerminal } from "./McpTerminal";
import { SkillLearner } from "./SkillLearner";
import { MobileSimulator } from "./MobileSimulator";
import { AdminDatabaseView } from "./AdminDatabaseView";

interface AdminPortalProps {
  onExitToClient: () => void;
  language: "en" | "si";
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExitToClient, language }) => {
  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => sessionStorage.getItem("sofi_admin_token"));
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Tab Navigation
  const [activeTab, setActiveTab] = useState<"ssh" | "updates" | "database" | "aws" | "mcp" | "skills" | "android">("ssh");

  // Real Interactive SSH Terminal State
  const [commandInput, setCommandInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandExecutionResult[]>([
    {
      command: "uname -a && uptime",
      stdout: "Linux ip-172-31-42-10 6.1.0-aws #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\n 22:00:00 up 3 days, 14:22, 1 user, load average: 0.12, 0.08, 0.05",
      stderr: "",
      exitCode: 0,
      timestamp: new Date().toISOString()
    }
  ]);

  // System Update Manager State
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Verify stored token on mount
  useEffect(() => {
    if (authToken) {
      fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${authToken}` }
      })
        .then((res) => {
          if (!res.ok) {
            sessionStorage.removeItem("sofi_admin_token");
            setAuthToken(null);
          }
        })
        .catch(() => {
          sessionStorage.removeItem("sofi_admin_token");
          setAuthToken(null);
        });
    }
  }, [authToken]);

  // Fetch Server Stats
  useEffect(() => {
    if (!authToken) return;
    const fetchStatus = () => {
      fetch("/api/status")
        .then((res) => res.json())
        .then((data) => setServerStatus(data))
        .catch(console.error);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [authToken]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commandHistory]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput.trim(), password: passwordInput })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("sofi_admin_token", data.token);
        setAuthToken(data.token);
        setUsernameInput("");
        setPasswordInput("");
      } else {
        setAuthError(data.error || "Authentication failed. Check your server .env credentials.");
      }
    } catch (err: any) {
      setAuthError("Failed to connect to authentication server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sofi_admin_token");
    setAuthToken(null);
  };

  const handleExecCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || commandInput).trim();
    if (!cmd || isExecuting || !authToken) return;

    setIsExecuting(true);
    try {
      const res = await fetch("/api/admin/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ command: cmd })
      });

      const data = await res.json();
      setCommandHistory((prev) => [
        ...prev,
        {
          command: cmd,
          stdout: data.stdout || "",
          stderr: data.stderr || "",
          exitCode: data.exitCode ?? (data.success ? 0 : 1),
          timestamp: data.timestamp || new Date().toISOString()
        }
      ]);
      setCommandInput("");
    } catch (err: any) {
      setCommandHistory((prev) => [
        ...prev,
        {
          command: cmd,
          stdout: "",
          stderr: "SSH Connection Error: Failed to dispatch command to server.",
          exitCode: 1,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunSystemUpdate = async () => {
    if (!authToken || isUpdating) return;
    setIsUpdating(true);
    setUpdateLogs(["[SYSTEM] Connecting to AWS host update daemon..."]);

    try {
      const res = await fetch("/api/admin/system-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success && data.logs) {
        setUpdateLogs(data.logs);
      } else {
        setUpdateLogs((prev) => [...prev, `[ERROR] Update returned: ${data.error || "Failed"}`]);
      }
    } catch (err: any) {
      setUpdateLogs((prev) => [...prev, `[FATAL] Update error: ${err.message}`]);
    } finally {
      setIsUpdating(false);
    }
  };

  // ==================== LOGIN SCREEN ====================
  if (!authToken) {
    return (
      <div className="min-h-screen bg-[#0D0605] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6A3D]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#160B09] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onExitToClient}
              className="flex items-center gap-1.5 text-xs text-amber-200/60 hover:text-white transition cursor-pointer font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Client Portal</span>
            </button>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF8A50] bg-[#FF6A3D]/10 border border-[#FF6A3D]/30 px-2.5 py-1 rounded-full font-bold">
              /sofiadmin
            </span>
          </div>

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#FF6A3D] to-[#E5532B] rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Sofi Admin Access</h2>
            <p className="text-xs text-amber-200/60 mt-1">
              Protected administration & interactive AWS SSH console
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-200/80 block">Admin Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Configured in SOFI_ADMIN_USER"
                className="w-full bg-[#1C100D] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6A3D] transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-200/80 block">Admin Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Configured in SOFI_ADMIN_PASSWORD"
                className="w-full bg-[#1C100D] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6A3D] transition"
                required
              />
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-[11px] text-amber-200/60 leading-relaxed">
              <span className="font-bold text-amber-200 block mb-0.5">Server Credentials:</span>
              Stored in server environment variables: <code className="text-[#FF8A50]">SOFI_ADMIN_USER</code> & <code className="text-[#FF8A50]">SOFI_ADMIN_PASSWORD</code> (default: admin / sofi_aws_2026).
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoggingIn ? "Verifying Credentials..." : "Authenticate Admin Session"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== AUTHENTICATED ADMIN CONSOLE ====================
  return (
    <div className="min-h-screen bg-[#0D0605] text-amber-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-[#160B09] border-b border-white/[0.08] px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6A3D] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white">Sofi AWS Control Node</h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  SSH Connected
                </span>
              </div>
              <p className="text-[11px] text-amber-200/50">AWS EC2 (t3.small) • Cloudflare Zero Trust Tunnel</p>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          {serverStatus && (
            <>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-[#FF6A3D]" />
                <span>CPU: {serverStatus.cpu}%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-[11px]">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>RAM: {serverStatus.memory.used}G / {serverStatus.memory.total}G</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExitToClient}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-amber-200 text-xs font-bold rounded-xl border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Client Portal</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition cursor-pointer"
            title="Log out admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-[#120706] border-b border-white/[0.06] px-6 flex items-center gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "ssh", label: "Interactive AWS SSH", icon: Terminal },
          { id: "database", label: "MongoDB Database", icon: Database },
          { id: "updates", label: "System & AWS Updates", icon: RefreshCw },
          { id: "aws", label: "Cloudflare & Infrastructure", icon: Server },
          { id: "mcp", label: "MCP Protocol Servers", icon: Layers },
          { id: "skills", label: "Skills Engine", icon: Sparkles },
          { id: "android", label: "Android APK Pipeline", icon: Smartphone }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
                isActive
                  ? "border-[#FF6A3D] text-[#FF8A50] bg-[#FF6A3D]/10"
                  : "border-transparent text-amber-200/60 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Admin Body Panels */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === "ssh" && (
          <div className="space-y-4">
            {/* Quick Command Chips */}
            <div className="bg-[#160B09] border border-white/10 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-extrabold text-amber-200/60 uppercase tracking-wider shrink-0 mr-1">
                Quick Commands:
              </span>
              {[
                "uptime",
                "df -h",
                "free -m",
                "uname -a",
                "ps aux | head -10",
                "node -v",
                "ls -la data/",
                "git status",
                "npm list --depth=0"
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleExecCommand(cmd)}
                  disabled={isExecuting}
                  className="px-2.5 py-1 bg-white/5 hover:bg-[#FF6A3D]/20 hover:text-[#FF8A50] hover:border-[#FF6A3D]/30 border border-white/10 text-amber-200 font-mono text-[11px] rounded-lg transition cursor-pointer shrink-0"
                >
                  $ {cmd}
                </button>
              ))}
            </div>

            {/* Interactive Terminal Window */}
            <div className="bg-[#0A0403] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[560px]">
              <div className="bg-[#140806] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-amber-200/60 ml-2">
                    ubuntu@ip-172-31-42-10:~ (AWS t3.small EC2)
                  </span>
                </div>
                <button
                  onClick={() => setCommandHistory([])}
                  className="text-[11px] text-amber-200/50 hover:text-white transition cursor-pointer font-mono"
                >
                  Clear Buffer
                </button>
              </div>

              {/* Scrollable Command Output Area */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-4">
                <div className="text-amber-200/40 leading-relaxed border-b border-white/5 pb-2">
                  [Sofi Real Host Executor] Authenticated session active. Commands execute directly on the AWS host environment.
                </div>

                {commandHistory.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-[#FF6A3D] font-bold">$</span>
                      <span className="font-semibold">{item.command}</span>
                      <span className="text-[10px] text-amber-200/30 ml-auto">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {item.stdout && (
                      <pre className="text-emerald-400 bg-black/40 p-3 rounded-xl whitespace-pre-wrap leading-relaxed overflow-x-auto border border-emerald-500/10">
                        {item.stdout}
                      </pre>
                    )}

                    {item.stderr && (
                      <pre className="text-red-400 bg-red-950/20 p-3 rounded-xl whitespace-pre-wrap leading-relaxed overflow-x-auto border border-red-500/20">
                        {item.stderr}
                      </pre>
                    )}

                    <div className="text-[10px] text-amber-200/40 flex items-center gap-2">
                      <span>Exit Code: {item.exitCode}</span>
                      {item.exitCode === 0 ? (
                        <span className="text-emerald-400 font-bold">✓ Success</span>
                      ) : (
                        <span className="text-red-400 font-bold">✕ Non-zero exit</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal Command Input Prompt */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecCommand();
                }}
                className="p-3 bg-[#120705] border-t border-white/10 flex items-center gap-2"
              >
                <span className="text-[#FF6A3D] font-bold font-mono pl-2">$</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Enter shell command (e.g. df -h, uptime, ls -la)..."
                  className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-amber-200/30"
                  disabled={isExecuting}
                />
                <button
                  type="submit"
                  disabled={isExecuting || !commandInput.trim()}
                  className="px-4 py-1.5 bg-[#FF6A3D] hover:bg-[#FF8A50] text-white font-bold text-xs rounded-xl font-mono cursor-pointer disabled:opacity-50 transition"
                >
                  {isExecuting ? "Running..." : "Run"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "updates" && (
          <div className="space-y-5">
            <div className="bg-[#160B09] border border-white/10 rounded-3xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
                    <RefreshCw className="w-5 h-5 text-[#FF6A3D]" />
                    <span>Sofi System & AWS Update Engine</span>
                  </h3>
                  <p className="text-xs text-amber-200/60 mt-1">
                    Synchronize node dependencies, inspect memory database integrity, and verify Cloudflare tunnel heartbeats.
                  </p>
                </div>

                <button
                  onClick={handleRunSystemUpdate}
                  disabled={isUpdating}
                  className="px-5 py-3 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? "animate-spin" : ""}`} />
                  <span>{isUpdating ? "Checking & Updating..." : "Run System Update Check"}</span>
                </button>
              </div>

              {/* Real Logs Output */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-200/80 uppercase tracking-wider font-mono">
                  Update Execution Log
                </h4>
                <div className="bg-[#0A0403] border border-white/10 rounded-2xl p-4 font-mono text-xs space-y-2 min-h-[220px]">
                  {updateLogs.length === 0 ? (
                    <div className="text-amber-200/40 text-center py-12">
                      Click "Run System Update Check" to start system verification and package synchronization.
                    </div>
                  ) : (
                    updateLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF6A3D]" />
                        <span>{log}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <AdminDatabaseView />
        )}

        {activeTab === "aws" && (
          <AwsCloudflareSetup />
        )}

        {activeTab === "mcp" && (
          <McpTerminal />
        )}

        {activeTab === "skills" && (
          <SkillLearner />
        )}

        {activeTab === "android" && (
          <MobileSimulator />
        )}
      </div>
    </div>
  );
};
