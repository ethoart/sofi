import React, { useState, useEffect } from "react";
import { 
  PanelRight, Download, Chrome, ExternalLink, X, Check, Copy, 
  Sparkles, Terminal, ShieldCheck, Cpu, ArrowRight, RefreshCw,
  Layers, Globe, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BrowserExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "si";
  onLaunchDockedSidebar?: () => void;
}

interface ExtensionInfoState {
  name: string;
  version: string;
  manifestVersion: number;
  description: string;
  zipSize: string;
  permissions: string[];
  features: string[];
  shortcut: string;
  downloadUrl: string;
  apiTargetUrl: string;
}

export const BrowserExtensionModal: React.FC<BrowserExtensionModalProps> = ({
  isOpen,
  onClose,
  language,
  onLaunchDockedSidebar
}) => {
  const [activeTab, setActiveTab] = useState<"install" | "features" | "config">("install");
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(window.location.origin);
  const [extensionInfo, setExtensionInfo] = useState<ExtensionInfoState | null>(null);
  const [buildMessage, setBuildMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCustomServerUrl(window.location.origin);
    fetch("/api/extension/info")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExtensionInfo(data);
        }
      })
      .catch((err) => console.error("Error fetching extension info:", err));
  }, [isOpen]);

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText("chrome://extensions");
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText(customServerUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      window.location.href = "/api/extension/download";
      setTimeout(() => setIsDownloading(false), 1500);
    } catch (err) {
      setIsDownloading(false);
    }
  };

  const handleRebuildWithUrl = async () => {
    setIsBuilding(true);
    setBuildMessage(null);
    try {
      const res = await fetch("/api/extension/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: customServerUrl })
      });
      const data = await res.json();
      if (data.success) {
        setBuildMessage(language === "si" 
          ? "නව සේවාදායක ලිපිනය සමඟ දිගුව සාර්ථකව ප්‍රතිනිර්මාණය කෙරිණි!" 
          : "Extension package successfully rebuilt with your custom server URL!");
        // Refresh info
        const infoRes = await fetch("/api/extension/info");
        const infoData = await infoRes.json();
        if (infoData.success) setExtensionInfo(infoData);
      }
    } catch (err) {
      setBuildMessage("Error building extension package.");
    } finally {
      setIsBuilding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#160B09] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1C100D]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6A3D]/20 border border-[#FF6A3D]/30 flex items-center justify-center text-[#FF6A3D]">
                <PanelRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{language === "si" ? "Sofi බ්‍රවුසර දිගුව සහ පැති තීරුව" : "Sofi Browser Extension & Side Panel"}</span>
                  <span className="text-[10px] bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    Manifest V3
                  </span>
                </h3>
                <p className="text-xs text-amber-200/60">
                  {language === "si" 
                    ? "ඕනෑම වෙබ් අඩවියක පිරික්සීමේදී Sofi පැති තීරුව (Sidebar) ලෙස භාවිතා කරන්න" 
                    : "Dock Sofi directly into your Chrome, Edge, or Brave sidebar while browsing"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200/60 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Hero Banner */}
          <div className="bg-gradient-to-r from-[#24120D] via-[#1A0C08] to-[#160B09] p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8A50] bg-[#FF6A3D]/10 px-2 py-0.5 rounded-md border border-[#FF6A3D]/25">
                  <Chrome className="w-3.5 h-3.5" />
                  Chrome • Edge • Brave
                </span>
                <span className="text-xs text-amber-200/50 font-mono">
                  {extensionInfo?.zipSize || "180 KB"} ZIP
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                {language === "si"
                  ? "පැති පුවරුව සක්‍රිය කිරීමට Ctrl+Shift+S ඔබන්න • සක්‍රිය ටැබ් එක ක්ෂණිකව සාරාංශගත කරන්න"
                  : "Shortcut: Ctrl+Shift+S • Instant Tab Summarizer • AgentRouter Multi-Model"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF6A3D] to-[#E05326] hover:from-[#FF7B52] hover:to-[#EB5F33] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-[#FF6A3D]/20 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? (language === "si" ? "බාගත වෙමින්..." : "Downloading...") : (language === "si" ? "දිගුව බාගන්න (.zip)" : "Download Extension (.zip)")}</span>
              </button>

              {onLaunchDockedSidebar && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchDockedSidebar();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Test Drive Docked Sidebar inside App"
                >
                  <PanelRight className="w-4 h-4 text-[#FF8A50]" />
                  <span className="hidden sm:inline">Try In-App</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#140806] px-5 pt-2 gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab("install")}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "install"
                  ? "border-[#FF6A3D] text-[#FF8A50]"
                  : "border-transparent text-amber-200/50 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{language === "si" ? "ස්ථාපන උපදෙස් (Installation)" : "1-Click Setup Guide"}</span>
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "features"
                  ? "border-[#FF6A3D] text-[#FF8A50]"
                  : "border-transparent text-amber-200/50 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === "si" ? "හැකියාවන් (Features)" : "Sidebar Capabilities"}</span>
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "config"
                  ? "border-[#FF6A3D] text-[#FF8A50]"
                  : "border-transparent text-amber-200/50 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === "si" ? "සේවාදායක සැකසුම (Config)" : "Server Configuration"}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {activeTab === "install" && (
              <div className="space-y-4">
                <div className="text-xs text-amber-200/80 leading-relaxed">
                  {language === "si"
                    ? "Sofi Chrome Manifest V3 Side Panel API තාක්ෂණය මත පදනම්ව නිමවා ඇති අතර, ඔබට ඕනෑම වෙබ් අඩවියක් නරඹන අතරතුර පැති පුවරුවක් ලෙස ක්‍රියාත්මක වේ."
                    : "Sofi uses the official Chrome Manifest V3 SidePanel API, allowing it to dock natively in your browser side panel beside any open website."}
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-[#FF6A3D] text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-white">
                        {language === "si" ? "දිගුව බාගත කර Extract කරන්න" : "Download & Extract ZIP"}
                      </h4>
                      <p className="text-[11px] text-amber-200/60 leading-relaxed">
                        {language === "si"
                          ? "ඉහත ඇති 'දිගුව බාගන්න' බොත්තම ක්ලික් කර බාගත වන sofi-browser-extension-v1.2.zip ගොනුව ඔබේ පරිගණකයේ සුදුසු තැනකට Extract කරන්න."
                          : "Click the Download button above and extract the downloaded sofi-browser-extension-v1.2.zip folder anywhere on your computer."}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-[#FF6A3D] text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xs font-bold text-white">
                        {language === "si" ? "බ්‍රවුසරයේ දිගු පිටුව (Extensions) විවෘත කරන්න" : "Open Extensions in Chrome / Edge / Brave"}
                      </h4>
                      <div className="flex items-center gap-2">
                        <code className="px-2.5 py-1 bg-black/50 border border-white/10 rounded-lg text-[11px] font-mono text-[#FF8A50]">
                          chrome://extensions
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyChromeUrl}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPath ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-200/60">
                        {language === "si"
                          ? "ඔබගේ බ්‍රවුසරයේ URL තීරුවේ chrome://extensions ටයිප් කර Enter ඔබන්න."
                          : "Paste this into your browser's address bar and press Enter."}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-[#FF6A3D] text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-white">
                        {language === "si" ? "Developer mode සක්‍රිය කර 'Load unpacked' ක්ලික් කරන්න" : "Enable Developer Mode & Click 'Load unpacked'"}
                      </h4>
                      <p className="text-[11px] text-amber-200/60 leading-relaxed">
                        {language === "si"
                          ? "ඉහළ දකුණු කෙළවරේ ඇති 'Developer mode' toggle එක On කරන්න. ඉන්පසු වම්පසින් 'Load unpacked' බොත්තම ක්ලික් කර Extract කළ sofi-browser-extension ෆෝල්ඩරය තෝරන්න."
                          : "Toggle on 'Developer mode' at the top-right. Then click the 'Load unpacked' button at the top-left and select your extracted folder."}
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FF6A3D]/10 border border-[#FF6A3D]/30">
                    <div className="w-6 h-6 rounded-full bg-[#FF6A3D] text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                      4
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{language === "si" ? "Sofi Toolbar එකට Pin කර Ctrl+Shift+S ඔබන්න!" : "Pin to Toolbar & Press Ctrl+Shift+S!"}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </h4>
                      <p className="text-[11px] text-amber-200/70 leading-relaxed">
                        {language === "si"
                          ? "ඔබගේ බ්‍රවුසර toolbar එකේ ඇති Puzzle icon එක ක්ලික් කර Sofi Pin කරගන්න. දැන් ඕනෑම වෙබ් අඩවියක සිටියදී Ctrl+Shift+S ඔබා පැති තීරුව විවෘත කළ හැක!"
                          : "Pin Sofi from the extensions puzzle icon. Now press Ctrl+Shift+S (or Cmd+Shift+S) on any webpage to toggle your AI side panel instantly!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "features" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-[#FF8A50] font-bold text-xs">
                      <PanelRight className="w-4 h-4" />
                      <span>Persistent Side Panel</span>
                    </div>
                    <p className="text-[11px] text-amber-200/60 leading-relaxed">
                      Docks alongside your browser window without obscuring web content. Follows you across different tabs seamlessly.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Globe className="w-4 h-4" />
                      <span>1-Click Tab Summarization</span>
                    </div>
                    <p className="text-[11px] text-amber-200/60 leading-relaxed">
                      Extracts DOM articles, research papers, news, and document text from the active tab and delivers key takeaways in seconds.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Cpu className="w-4 h-4" />
                      <span>AgentRouter Frontier Models</span>
                    </div>
                    <p className="text-[11px] text-amber-200/60 leading-relaxed">
                      Directly switch between Claude Opus 4.8, Claude Opus 5, DeepSeek v4 Flash, GLM 5.3, GPT-5.6 Sol, or Sofi LBGM inside the sidebar.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Context Menu Actions</span>
                    </div>
                    <p className="text-[11px] text-amber-200/60 leading-relaxed">
                      Highlight any text on any webpage and right-click "Ask Sofi: Explain" or "Translate to Sinhala" to trigger instant sidebar analysis.
                    </p>
                  </div>
                </div>

                {/* Permissions explanation */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[10px] text-amber-200/50">
                    Included Manifest V3 Permissions
                  </h4>
                  <ul className="text-[11px] text-amber-200/70 space-y-1 list-disc list-inside">
                    <li><code className="text-[#FF8A50]">sidePanel</code>: Required to render the official side panel companion.</li>
                    <li><code className="text-[#FF8A50]">activeTab</code>: Only reads the page text of the currently active tab upon user click.</li>
                    <li><code className="text-[#FF8A50]">storage</code>: Remembers your selected AI model and chat history locally.</li>
                    <li><code className="text-[#FF8A50]">contextMenus</code>: Enables right-click text actions.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "config" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">
                      Target Sofi API Server Endpoint:
                    </label>
                    <p className="text-[11px] text-amber-200/60">
                      The browser extension calls this URL to connect to Sofi's brain, database, and multi-model router.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customServerUrl}
                      onChange={(e) => setCustomServerUrl(e.target.value)}
                      placeholder="https://your-sofi-app.com"
                      className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF6A3D]"
                    />
                    <button
                      type="button"
                      onClick={handleCopyApiUrl}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedUrl ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleRebuildWithUrl}
                      disabled={isBuilding}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6A3D]/20 hover:bg-[#FF6A3D]/30 border border-[#FF6A3D]/40 text-[#FF8A50] rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isBuilding ? "animate-spin" : ""}`} />
                      <span>{isBuilding ? "Rebuilding Package..." : "Bake URL & Rebuild ZIP"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomServerUrl(window.location.origin)}
                      className="text-xs text-amber-200/50 hover:text-white underline cursor-pointer"
                    >
                      Reset to current origin
                    </button>
                  </div>

                  {buildMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                      {buildMessage}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-amber-200/60 leading-relaxed">
                  💡 <strong>Tip:</strong> Even after installing the extension, you can easily change the server URL anytime by clicking the gear icon (⚙️) in the side panel header!
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-[#120706] flex items-center justify-between">
            <div className="text-[11px] text-amber-200/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Version 1.2.0 • Compatible with Chromium 114+</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {language === "si" ? "වසන්න" : "Close"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
