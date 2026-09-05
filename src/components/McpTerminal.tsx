import React, { useState } from "react";
import { 
  Terminal, ShieldCheck, Cpu, HardDrive, RefreshCw, Layers, Plus, Check, Play, AlertTriangle, ShieldAlert
} from "lucide-react";
import { McpServer } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface McpTerminalProps {
  mcpServers: McpServer[];
  onAddMcpServer: (name: string, url: string) => void;
  serverStatus: any;
  onRefreshStatus: () => void;
}

export const McpTerminal: React.FC<McpTerminalProps> = ({
  mcpServers,
  onAddMcpServer,
  serverStatus,
  onRefreshStatus
}) => {
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  
  const [activeMcpId, setActiveMcpId] = useState<string>(mcpServers[0]?.id || "");
  const [selectedTool, setSelectedTool] = useState<any>(mcpServers[0]?.tools[0] || null);
  const [toolParams, setToolParams] = useState<string>("{}");
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const activeServer = mcpServers.find(s => s.id === activeMcpId) || mcpServers[0];

  const handleAddServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName || !newServerUrl) return;
    onAddMcpServer(newServerName, newServerUrl);
    setNewServerName("");
    setNewServerUrl("");
    setShowAddServer(false);
  };

  const handleExecuteTool = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    setExecutionOutput(null);

    let parsedParams = {};
    try {
      parsedParams = JSON.parse(toolParams);
    } catch (e) {
      setIsExecuting(false);
      setExecutionOutput(`[Client Error]: Invalid JSON parameters entered:\n${(e as Error).message}`);
      return;
    }

    try {
      const response = await fetch("/api/mcp/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId: activeServer.id,
          toolName: selectedTool.name,
          arguments: parsedParams
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExecutionOutput(data.result);
      } else {
        throw new Error("Failed to contact MCP agent host daemon");
      }
    } catch (err) {
      setExecutionOutput(`[MCP Execution Fault]: Communication broken with backend daemon at ${activeServer.url}.\nEnsure cloudflared tunnel client is linked.`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleServerTabChange = (id: string) => {
    setActiveMcpId(id);
    const server = mcpServers.find(s => s.id === id);
    if (server && server.tools.length > 0) {
      setSelectedTool(server.tools[0]);
      setToolParams(JSON.stringify(
        Object.keys(server.tools[0].inputSchema?.properties || {}).reduce((acc: any, key) => {
          acc[key] = "";
          return acc;
        }, {}),
        null,
        2
      ));
    } else {
      setSelectedTool(null);
      setToolParams("{}");
    }
  };

  const handleSelectTool = (tool: any) => {
    setSelectedTool(tool);
    // Auto populate sample arguments
    const defaults: any = {};
    if (tool.inputSchema?.properties) {
      Object.keys(tool.inputSchema.properties).forEach((key) => {
        const prop = tool.inputSchema.properties[key];
        defaults[key] = prop.type === "string" ? (key === "path" ? "server.ts" : "default_val") : 0;
      });
    }
    setToolParams(JSON.stringify(defaults, null, 2));
  };

  return (
    <div className="flex flex-col h-full bg-[#1C120F]/90 backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/50 p-6 space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#FF6A3D]" />
            Model Context Protocol (MCP) Hub
          </h2>
          <p className="text-xs text-amber-200/60 mt-1 leading-relaxed">
            Standardized toolboxes for Sofi to control servers, filesystems, and run processes on your AWS EC2 environment.
          </p>
        </div>

        <button
          onClick={() => setShowAddServer(!showAddServer)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-[#FF7A4E] hover:to-[#F16339] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Connect MCP Server
        </button>
      </div>

      {/* Grid containing server status info cards (Bento style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#140B09] flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#251511] border border-white/[0.08] flex items-center justify-center text-[#FF8A50]">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] text-amber-200/50 font-bold uppercase tracking-wider">AWS EC2 CPU Load</span>
            <span className="block text-sm font-extrabold text-white mt-0.5">{serverStatus?.cpu || 0}% Usage</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#140B09] flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#251511] border border-white/[0.08] flex items-center justify-center text-[#FF8A50]">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-amber-200/50 font-bold uppercase tracking-wider">AWS Memory (RAM)</span>
            <span className="block text-sm font-extrabold text-white mt-0.5">{serverStatus?.memory?.used || 0} GB / 2.00 GB</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#140B09] flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-amber-200/50 font-bold uppercase tracking-wider">Cloudflare Proxy Tunnel</span>
            <span className="block text-sm font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Active (1 tunnel)
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {/* Left Side: MCP Servers list & tool schema preview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* List of Registered MCP Servers */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider block mb-2">Connected MCP Servers</span>
            {mcpServers.map((server) => (
              <button
                key={server.id}
                onClick={() => handleServerTabChange(server.id)}
                className={`w-full text-left p-3.5 rounded-2xl border flex justify-between items-center transition cursor-pointer ${
                  (activeServer?.id === server.id)
                    ? "border-[#FF6A3D] bg-[#251511] shadow-lg shadow-orange-500/10"
                    : "border-white/[0.06] bg-[#140B09] hover:bg-[#1A0E0B]"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className={`w-3.5 h-3.5 ${activeServer?.id === server.id ? "text-[#FF8A50]" : "text-amber-200/60"}`} />
                    {server.name}
                  </h4>
                  <span className="text-[10px] text-amber-200/40 mt-1 block font-mono">{server.url}</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Connected
                </span>
              </button>
            ))}
          </div>

          {/* Tools List for Active Server */}
          {activeServer && (
            <div className="border border-white/[0.06] bg-[#140B09] rounded-2xl p-4.5 flex-1 shadow-xl">
              <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider block mb-3">
                Exposed Tools ({activeServer.tools.length})
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {activeServer.tools.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => handleSelectTool(tool)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                      selectedTool?.name === tool.name
                        ? "border-[#FF6A3D] bg-[#251511] text-[#FF8A50]"
                        : "border-white/[0.06] bg-[#1A0D0B] text-amber-100 hover:bg-[#20100D]"
                    }`}
                  >
                    <div className="font-bold font-mono text-white flex items-center justify-between">
                      <span>{tool.name}</span>
                      <Play className="w-3 h-3 text-[#FF6A3D] fill-current" />
                    </div>
                    <p className="text-[10px] text-amber-200/60 mt-1.5 leading-relaxed">{tool.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Tool Execution sandbox terminal */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="border border-white/[0.06] rounded-2xl p-5 bg-[#140B09] flex-1 flex flex-col justify-between gap-4 shadow-xl">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider block">Sandbox Execution Interface</span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    Tool: <span className="font-mono text-[#FF8A50]">{selectedTool?.name || "None Selected"}</span>
                  </h3>
                </div>
                <span className="text-[10px] bg-white/5 text-amber-200 px-2.5 py-0.5 rounded-full font-mono border border-white/10 uppercase tracking-wider">
                  Schema Safe
                </span>
              </div>

              {/* Arguments JSON Input */}
              <div>
                <label className="block text-xs font-bold text-amber-100 mb-1.5 flex items-center justify-between">
                  <span>Input Arguments (JSON Object)</span>
                  <span className="text-[10px] text-amber-200/40">JSON Schema Validated</span>
                </label>
                <textarea
                  rows={4}
                  value={toolParams}
                  onChange={(e) => setToolParams(e.target.value)}
                  className="w-full p-3 bg-[#0D0605] text-amber-100 font-mono text-xs rounded-xl border border-white/[0.08] outline-none focus:border-[#FF6A3D] transition resize-none"
                />
              </div>

              {/* Tool Input Schema parameters help card */}
              {selectedTool && (
                <div className="p-3.5 bg-[#251511] rounded-xl border border-white/[0.06] text-[11px] leading-relaxed text-amber-100 shadow-inner">
                  <div className="font-bold text-[#FF8A50] mb-1.5">Expected Input Properties:</div>
                  <pre className="font-mono text-[10px] bg-[#0D0605] p-2.5 rounded-lg border border-white/5 max-h-24 overflow-y-auto text-amber-200 scrollbar-thin scrollbar-thumb-white/10">
                    {JSON.stringify(selectedTool.inputSchema?.properties || {}, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
              <button
                onClick={handleExecuteTool}
                disabled={isExecuting || !selectedTool}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF7A4E] hover:to-[#F16339] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-white fill-current" />
                    Run MCP Tool
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Console logger display */}
          <div className="border border-white/[0.06] bg-[#0D0605] rounded-2xl p-4 font-mono text-xs text-amber-100 min-h-48 max-h-60 overflow-y-auto flex flex-col justify-between shadow-xl scrollbar-thin scrollbar-thumb-white/10">
            <div>
              <div className="flex justify-between items-center text-[10px] text-amber-200/50 mb-3 border-b border-white/5 pb-1.5">
                <span>MCP RESPONSE MONITOR</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Link
                </span>
              </div>
              {executionOutput ? (
                <pre className="whitespace-pre-wrap leading-relaxed text-amber-50">{executionOutput}</pre>
              ) : (
                <div className="text-amber-200/30 py-6 text-center">
                  Output of executed MCP tools on t3.small will be logged here in real-time.
                </div>
              )}
            </div>
            {executionOutput && (
              <button
                onClick={() => setExecutionOutput(null)}
                className="text-[10px] text-amber-200/50 hover:text-white underline block self-end transition mt-4 cursor-pointer"
              >
                Reset Outputs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add custom connection modal */}
      {showAddServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleAddServerSubmit}
            className="w-full max-w-md bg-[#1C120F] rounded-3xl p-6 border border-white/[0.08] shadow-2xl space-y-4 shadow-black/60"
          >
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF6A3D]" />
              Register External MCP Server
            </h3>
            <p className="text-xs text-amber-200/60 leading-relaxed">
              Introduce a new local or remote MCP bridge server. Expose specific docker containers, file folders, or execution layers directly to Sofi.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-amber-100 mb-1.5">Server Name</label>
                <input
                  type="text"
                  required
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="e.g., SQLite DB Handler"
                  className="w-full px-3.5 py-2.5 bg-[#0D0605] border border-white/[0.08] rounded-xl text-xs text-white outline-none focus:border-[#FF6A3D] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-100 mb-1.5">Server API URL/Endpoint</label>
                <input
                  type="url"
                  required
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="http://localhost:3025"
                  className="w-full px-3.5 py-2.5 bg-[#0D0605] border border-white/[0.08] rounded-xl text-xs text-white outline-none focus:border-[#FF6A3D] transition"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddServer(false)}
                className="px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-xl text-amber-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF7A4E] hover:to-[#F16339] rounded-xl text-white transition cursor-pointer shadow-md shadow-orange-500/20"
              >
                Establish Link
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
};
