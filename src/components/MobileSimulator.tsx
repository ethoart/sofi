import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone, Volume2, Wifi, Battery, Play, Square, Sparkles, MessageSquareCode, Mic, Radio, Bell, Download, Terminal, CheckCircle2, Shield, FileCode, ArrowDownToLine, RefreshCw, Cpu
} from "lucide-react";
import { Message, Skill } from "../types";
import { motion, AnimatePresence } from "motion/react";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface MobileSimulatorProps {
  language: "en" | "si";
  skills: Skill[];
  onSkillTriggered: (skillName: string) => void;
  serverStatus: any;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  language,
  skills,
  onSkillTriggered,
  serverStatus
}) => {
  const [activeView, setActiveView] = useState<"daemon" | "android-build">("daemon");
  const [backgroundService, setBackgroundService] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [speechOutput, setSpeechOutput] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([
    "Sofi service initialized.",
    "Foreground service waiting..."
  ]);

  // Android build state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([
    "[READY] Android build script initialized.",
    "[TARGET] com.sofi.ai.assistant (v1.2.0)",
    "Click 'Execute Run Script' or 'Download APK' below."
  ]);
  const [buildSuccess, setBuildSuccess] = useState(false);

  const wakeWordRecognitionRef = useRef<any>(null);
  const activeSpeechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopWakeWordListener();
      stopActiveSpeechCapture();
    };
  }, []);

  // Set up continuous background wake-word detection (Sofi or සොෆී)
  const startWakeWordListener = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog("Background Voice Recognition is not supported in this browser.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === "si" ? "si-LK" : "en-US";

      rec.onstart = () => {
        setWakeWordActive(true);
        addLog(`Listening for wake word "${language === "si" ? "සොෆී" : "Sofi"}"...`);
      };

      rec.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.toLowerCase().trim();
            addLog(`Captured ambient sound: "${text}"`);
            
            // Check if triggers wake-word
            if (text.includes("sofi") || text.includes("සොෆී") || text.includes("sofie")) {
              triggerVoiceActivation();
              break;
            }
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("Wake word engine error", e);
        if (e.error !== "no-speech") {
          addLog(`Error in background listener: ${e.error}`);
        }
      };

      rec.onend = () => {
        if (backgroundService) {
          try {
            rec.start();
          } catch (e) {
            // ignore
          }
        } else {
          setWakeWordActive(false);
        }
      };

      wakeWordRecognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      addLog(`Failed starting wake word: ${err.message}`);
    }
  };

  const stopWakeWordListener = () => {
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.abort();
      wakeWordRecognitionRef.current = null;
    }
    setWakeWordActive(false);
  };

  const triggerVoiceActivation = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1109.73, audioCtx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context disabled
    }

    setIsWakingUp(true);
    addLog("Wake word DETECTED! Awakening Sofi...");
    stopWakeWordListener();

    setTimeout(() => {
      startActiveSpeechCapture();
    }, 400);
  };

  const startActiveSpeechCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language === "si" ? "si-LK" : "en-US";

    rec.onstart = () => {
      addLog("Microphone ACTIVE - Capturing your prompt now...");
    };

    rec.onresult = async (event: any) => {
      const commandText = event.results[0][0].transcript;
      if (commandText) {
        setSpeechOutput(commandText);
        addLog(`Captured Command: "${commandText}"`);
        await runCapturedCommand(commandText);
      }
    };

    rec.onerror = (e: any) => {
      addLog(`Command capture error: ${e.error}`);
      setIsWakingUp(false);
      restartBackgroundIfEnabled();
    };

    rec.onend = () => {
      setIsWakingUp(false);
      restartBackgroundIfEnabled();
    };

    activeSpeechRecognitionRef.current = rec;
    rec.start();
  };

  const stopActiveSpeechCapture = () => {
    if (activeSpeechRecognitionRef.current) {
      activeSpeechRecognitionRef.current.abort();
      activeSpeechRecognitionRef.current = null;
    }
    setIsWakingUp(false);
  };

  const restartBackgroundIfEnabled = () => {
    setTimeout(() => {
      if (backgroundService) {
        startWakeWordListener();
      }
    }, 600);
  };

  const runCapturedCommand = async (command: string) => {
    try {
      const storedKey = typeof window !== "undefined" ? localStorage.getItem("sofi_agentrouter_key") || "" : "";
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: command,
          language,
          agentRouterKey: storedKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`Sofi Response: "${data.reply.slice(0, 100)}..."`);
        
        if (data.matchedSkill) {
          onSkillTriggered(data.matchedSkill);
          addLog(`Triggered server task: [${data.matchedSkill}]`);
        }

        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.reply);
          utterance.lang = language === "si" ? "si-LK" : "en-US";
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (e) {
      addLog("Failed executing command to backend server.");
    }
  };

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${time}] ${text}`, ...prev.slice(0, 25)]);
  };

  const handleToggleBackground = () => {
    const newState = !backgroundService;
    setBackgroundService(newState);
    
    if (newState) {
      addLog("Background service STARTED. Exited standby.");
      startWakeWordListener();
    } else {
      addLog("Background service TERMINATED. Standby active.");
      stopWakeWordListener();
      stopActiveSpeechCapture();
    }
  };

  // Run Android script handler
  const handleExecuteAndroidScript = async () => {
    setIsBuilding(true);
    setBuildSuccess(false);
    setBuildLogs(["[START] Executing ./run-android.sh on server..."]);

    try {
      const res = await fetch("/api/android/run-script", {
        method: "POST"
      });
      const data = await res.json();
      
      if (data.success && data.logs) {
        for (let i = 0; i < data.logs.length; i++) {
          await new Promise(r => setTimeout(r, 120));
          setBuildLogs(prev => [...prev, data.logs[i]]);
        }
        setBuildSuccess(true);
      } else {
        setBuildLogs(prev => [...prev, `[ERROR] Build failed: ${data.error || "Unknown"}`]);
      }
    } catch (e: any) {
      setBuildLogs(prev => [...prev, `[ERROR] Network error executing run script: ${e.message}`]);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDownloadApk = () => {
    window.location.href = "/api/android/download";
  };

  const handleDownloadScript = () => {
    window.location.href = "/api/android/script";
  };

  return (
    <div className="flex flex-col h-full bg-[#1C120F] rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/50 p-4 sm:p-6 space-y-5">
      {/* Upper header */}
      <div className="border-b border-white/[0.06] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#FF6A3D]" />
            Sofi Android Mobile Engine & Daemon
          </h2>
          <p className="text-xs text-amber-200/60 mt-0.5 leading-relaxed">
            Directly test the mobile voice daemon, execute the Android run script, and download the compiled APK file.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2 bg-[#120A08] p-1 rounded-2xl border border-white/[0.06] shrink-0">
          <button
            onClick={() => setActiveView("daemon")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === "daemon"
                ? "bg-[#FF6A3D] text-white shadow-md shadow-orange-500/20"
                : "text-amber-200/60 hover:text-white"
            }`}
          >
            Voice Daemon
          </button>
          <button
            onClick={() => setActiveView("android-build")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === "android-build"
                ? "bg-[#FF6A3D] text-white shadow-md shadow-orange-500/20"
                : "text-amber-200/60 hover:text-white"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>APK & Run Script</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center justify-center overflow-y-auto">
        {/* Left Column: Simulated Phone Frame with Dynamic Island and Chibi Sticker */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[300px] h-[580px] rounded-[44px] bg-[#120706] border-[8px] border-[#2E1815] shadow-[0_0_50px_rgba(255,106,61,0.2)] relative overflow-hidden flex flex-col justify-between p-3.5 ring-4 ring-white/5 shrink-0">
            
            {/* Dynamic Island Notch */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30 flex items-center justify-between px-2.5 border border-white/10 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A3D] animate-ping" />
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[8px] text-white/80 font-mono">Sofi</span>
              </div>
            </div>

            {/* Status bar top */}
            <div className="flex justify-between items-center px-4 pt-1.5 text-[10px] text-amber-100/70 font-semibold z-20">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-[#FF8A50]" />
                <Battery className="w-3.5 h-3.5 text-[#FF8A50]" />
              </div>
            </div>

            {/* Phone Screen Display */}
            <div className="flex-1 bg-gradient-to-b from-[#241311] via-[#1A0D0B] to-[#120706] rounded-[30px] mt-2 mb-2 flex flex-col justify-between overflow-hidden relative border border-white/[0.08] shadow-inner">
              
              {/* Voice pulse indicator overlay */}
              <AnimatePresence>
                {isWakingUp && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0E0302]/95 backdrop-blur-md flex flex-col items-center justify-center z-30 p-4"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-[#FF6A3D]/20 animate-ping absolute" />
                      <div className="w-20 h-20 rounded-full bg-orange-500/30 animate-pulse absolute border border-orange-500/40" />
                      <div className="w-16 h-16 rounded-full border-2 border-[#FF6A3D] overflow-hidden z-20 shadow-[0_0_25px_rgba(255,106,61,0.6)] bg-[#1C120F]">
                        <img src={sofiAvatar} alt="Sofi Chibi Sticker" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-gradient-to-r from-[#FF8A50] to-[#FF6A3D] bg-clip-text text-transparent mt-4 uppercase tracking-wider animate-pulse">
                      {language === "si" ? "සවන් දෙමින්..." : "Sofi Listening..."}
                    </span>
                    <span className="text-[10px] text-amber-100 mt-2.5 italic max-w-[90%] text-center truncate">
                      {speechOutput || "Speak command..."}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Sunset Header Card inside phone */}
              <div className="bg-gradient-to-b from-[#FF6A3D] to-[#E5532B] p-4 text-white rounded-b-2xl shadow-md">
                <div className="flex justify-between items-center text-[10px] text-white/80">
                  <span>Android Service</span>
                  <span className="bg-black/20 px-2 py-0.5 rounded-full font-bold">AWS Connected</span>
                </div>
                <h4 className="text-sm font-extrabold mt-1 tracking-tight">Sofi AI Companion</h4>
                
                {/* Micro avatar row with chibi sticker */}
                <div className="flex items-center gap-2 mt-2 pt-1">
                  <div className="w-7 h-7 rounded-full ring-2 ring-white p-0.5 overflow-hidden bg-white/10">
                    <img src={sofiAvatar} alt="Sofi Chibi" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[10px] font-semibold text-white">com.sofi.ai.assistant</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-auto" />
                </div>
              </div>

              {/* Screen Body with Chibi sticker mascot */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
                <div className="relative group">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border-2 transition-all duration-300 overflow-hidden p-1 shadow-2xl ${
                    wakeWordActive 
                      ? "border-[#FF6A3D] shadow-[0_0_35px_rgba(255,106,61,0.6)] bg-[#FF6A3D]/20 scale-105" 
                      : "border-white/10 bg-[#1C120F] hover:border-white/20"
                  }`}>
                    <img 
                      src={sofiAvatar} 
                      alt="Sofi Chibi Avatar" 
                      className={`w-full h-full object-cover rounded-2xl ${wakeWordActive ? "animate-pulse" : ""}`} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>

                  {wakeWordActive && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF6A3D]"></span>
                    </span>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-xs font-extrabold text-white tracking-wide">Wake Word Engine</h3>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed max-w-[210px] mx-auto">
                    {backgroundService 
                      ? `Listening for "${language === "si" ? "සොෆී" : "Sofi"}" in background.`
                      : "Daemon standby. Toggle the switch below to activate voice capture."
                    }
                  </p>
                </div>
              </div>

              {/* Bottom Control & Phone Floating Navbar */}
              <div className="p-3 space-y-2">
                <button
                  onClick={handleToggleBackground}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                    backgroundService 
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/20" 
                      : "bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] text-white shadow-orange-500/25"
                  }`}
                >
                  {backgroundService ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Voice Daemon</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Voice Daemon</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-around bg-black/40 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 text-[10px]">
                  <span className="text-white font-bold px-2 py-0.5 bg-[#FF6A3D] rounded-xl">Voice</span>
                  <span className="text-amber-200/50">Skills</span>
                  <span className="text-amber-200/50">Logs</span>
                </div>
              </div>
            </div>

            {/* Bottom home capsule indicator */}
            <div className="w-28 h-1 bg-white/20 rounded-full mx-auto mb-1" />
          </div>
        </div>

        {/* Right Column: Bento Cards for Android Build, Run Script & Telemetry */}
        <div className="lg:col-span-7 flex flex-col gap-4 self-stretch">
          
          {activeView === "android-build" ? (
            <>
              {/* Card 1: Android APK Package Card */}
              <div className="bg-[#140B09] border border-white/[0.06] rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#251511] border border-orange-500/20 p-1 shrink-0 overflow-hidden shadow-md">
                      <img src={sofiAvatar} alt="Chibi Icon" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        Sofi AI Assistant for Android
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                          v1.2.0
                        </span>
                      </h3>
                      <p className="text-xs font-mono text-amber-200/60">Package: com.sofi.ai.assistant</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-amber-200 bg-[#251511] px-3 py-1 rounded-xl border border-white/[0.06]">
                    Size: ~14.8 MB
                  </span>
                </div>

                {/* Technical Specs Bento Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-[#1C120F] border border-white/[0.04] p-2.5 rounded-2xl">
                    <span className="text-[10px] text-amber-200/50 block font-semibold">Min SDK</span>
                    <span className="text-white font-bold">API 28 (Android 9)</span>
                  </div>
                  <div className="bg-[#1C120F] border border-white/[0.04] p-2.5 rounded-2xl">
                    <span className="text-[10px] text-amber-200/50 block font-semibold">Target SDK</span>
                    <span className="text-white font-bold">API 35 (Android 15)</span>
                  </div>
                  <div className="bg-[#1C120F] border border-white/[0.04] p-2.5 rounded-2xl">
                    <span className="text-[10px] text-amber-200/50 block font-semibold">Architecture</span>
                    <span className="text-white font-bold">Universal APK</span>
                  </div>
                  <div className="bg-[#1C120F] border border-white/[0.04] p-2.5 rounded-2xl">
                    <span className="text-[10px] text-amber-200/50 block font-semibold">Signature</span>
                    <span className="text-emerald-400 font-bold">Release Signed</span>
                  </div>
                </div>

                {/* Action Buttons: Run Script & Download APK */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={handleDownloadApk}
                    className="flex-1 min-w-[170px] bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition cursor-pointer"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Download APK (v1.2.0)</span>
                  </button>

                  <button
                    onClick={handleExecuteAndroidScript}
                    disabled={isBuilding}
                    className="flex-1 min-w-[170px] bg-[#251511] hover:bg-[#301B16] border border-orange-500/30 text-[#FF8A50] px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {isBuilding ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running Gradle Build...</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="w-4 h-4" />
                        <span>Run Script (assembleRelease)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadScript}
                    className="px-3.5 py-3 bg-[#1C120F] hover:bg-[#251511] border border-white/[0.08] text-amber-200/80 hover:text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    title="Download run-android.sh"
                  >
                    <FileCode className="w-4 h-4 text-[#FF8A50]" />
                    <span>run-android.sh</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Interactive Terminal Log for Run Script */}
              <div className="bg-[#140B09] border border-white/[0.06] rounded-3xl p-5 shadow-xl flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#FF6A3D]" />
                    Android Build & Run Script Output (run-android.sh)
                  </span>
                  {buildSuccess && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      BUILD SUCCESSFUL
                    </span>
                  )}
                </div>

                <div className="mt-3 font-mono text-xs text-amber-100/90 h-52 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 pr-2">
                  {buildLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`leading-relaxed ${
                        log.includes("[SUCCESS]") 
                          ? "text-emerald-400 font-bold" 
                          : log.includes("[ERROR]") 
                            ? "text-red-400 font-bold" 
                            : log.includes("[AAPT2]") || log.includes("[DEX]") 
                              ? "text-[#FF8A50]" 
                              : "text-amber-100/80"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-amber-200/50">
                  <span>Direct install command: <code className="text-[#FF8A50] bg-black/40 px-1.5 py-0.5 rounded font-mono">adb install -r sofi-assistant-v1.2.apk</code></span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Card 1: How Background Voice Works */}
              <div className="bg-[#140B09] border border-white/[0.06] rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#251511] border border-white/[0.08] flex items-center justify-center text-[#FF8A50] shadow-md">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Continuous Background Pipeline</h4>
                    <p className="text-xs text-amber-200/60">Android Foreground Service & AWS EC2 Bridge</p>
                  </div>
                </div>

                <p className="text-xs text-amber-100/70 leading-relaxed">
                  When activated, Sofi maintains an active lightweight audio recognition loop. Once the wake-word <strong className="text-[#FF8A50]">"Sofi"</strong> or <strong className="text-[#FF8A50]">"සොෆී"</strong> is detected, the audio frame streams directly to the AWS EC2 instance through the Cloudflare Zero Trust tunnel for instant command execution.
                </p>

                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider block mb-2">Available Voice Triggers:</span>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span 
                        key={skill.id}
                        className="text-[10px] font-semibold bg-white/5 text-amber-200 border border-white/[0.08] px-3 py-1 rounded-xl flex items-center gap-1.5 hover:border-[#FF6A3D]/40 transition"
                      >
                        <Sparkles className="w-3 h-3 text-[#FF6A3D]" />
                        "{skill.trigger}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Live Daemon Telemetry Logs */}
              <div className="bg-[#140B09] border border-white/[0.06] rounded-3xl p-5 shadow-xl flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6A3D] animate-ping" />
                    Live Daemon Terminal Output
                  </span>
                  <span className="text-[10px] font-mono text-amber-200/40">stdout / stderr</span>
                </div>

                <div className="mt-3 font-mono text-xs text-amber-100/90 h-52 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 pr-2">
                  {logs.map((log, index) => (
                    <div key={index} className="leading-relaxed hover:text-[#FF8A50] transition">
                      {log}
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-amber-200/50">
                  <span>Switch to <strong className="text-[#FF8A50] cursor-pointer" onClick={() => setActiveView("android-build")}>APK & Run Script</strong> tab to download package</span>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
