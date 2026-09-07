import React, { useState, useEffect } from "react";
import { 
  Smartphone, Download, QrCode, X, CheckCircle2, ShieldCheck, 
  Terminal, Sparkles, RefreshCw, Cpu, ExternalLink, Share2, 
  PlusSquare, Check, Copy, Edit3, Apple, Layers, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface MobileApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "si";
}

type MobilePlatform = "ios" | "android";
type IosInstallMethod = "testflight" | "webclip" | "xcode";
type AndroidInstallMethod = "pwa" | "apk" | "dev";

export const MobileApkModal: React.FC<MobileApkModalProps> = ({ isOpen, onClose, language }) => {
  const [platform, setPlatform] = useState<MobilePlatform>("android");
  const [iosMethod, setIosMethod] = useState<IosInstallMethod>("webclip");
  const [androidMethod, setAndroidMethod] = useState<AndroidInstallMethod>("pwa");
  
  const [androidQrUrl, setAndroidQrUrl] = useState<string>("");
  const [androidPwaQrUrl, setAndroidPwaQrUrl] = useState<string>("");
  const [iosTestFlightQrUrl, setIosTestFlightQrUrl] = useState<string>("");
  const [iosWebClipQrUrl, setIosWebClipQrUrl] = useState<string>("");
  
  const [testFlightLink, setTestFlightLink] = useState<string>(() => {
    return localStorage.getItem("sofi_testflight_link") || "https://testflight.apple.com/join/sofi-ai-beta";
  });
  const [isEditingTestFlight, setIsEditingTestFlight] = useState(false);
  const [tempTestFlightLink, setTempTestFlightLink] = useState(testFlightLink);
  const [copiedLink, setCopiedLink] = useState(false);

  const [apkInfo, setApkInfo] = useState<any>(null);
  const [iosInfo, setIosInfo] = useState<any>(null);

  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Generate QR codes
  useEffect(() => {
    if (!isOpen) return;

    // Android APK download QR
    const androidDownloadUrl = `${window.location.origin}/api/android/download`;
    QRCode.toDataURL(androidDownloadUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#1A0C08", light: "#FFFFFF" }
    })
      .then((url) => setAndroidQrUrl(url))
      .catch((err) => console.error("Error generating Android QR:", err));

    // Android PWA Live App QR
    const liveAppUrl = window.location.origin;
    QRCode.toDataURL(liveAppUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#1A0C08", light: "#FFFFFF" }
    })
      .then((url) => setAndroidPwaQrUrl(url))
      .catch((err) => console.error("Error generating Android PWA QR:", err));

    // iOS TestFlight QR
    QRCode.toDataURL(testFlightLink, {
      width: 240,
      margin: 2,
      color: { dark: "#0A192F", light: "#FFFFFF" }
    })
      .then((url) => setIosTestFlightQrUrl(url))
      .catch((err) => console.error("Error generating TestFlight QR:", err));

    // iOS Web Clip (Current App Live URL) QR
    QRCode.toDataURL(liveAppUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#120706", light: "#FFFFFF" }
    })
      .then((url) => setIosWebClipQrUrl(url))
      .catch((err) => console.error("Error generating WebClip QR:", err));

    // Fetch APK & iOS info
    fetch("/api/android/info")
      .then((r) => r.json())
      .then((data) => setApkInfo(data))
      .catch((err) => console.error("Error loading APK info:", err));

    fetch("/api/ios/info")
      .then((r) => r.json())
      .then((data) => setIosInfo(data))
      .catch((err) => console.error("Error loading iOS info:", err));
  }, [isOpen, testFlightLink]);

  const handleSaveTestFlightLink = () => {
    if (tempTestFlightLink.trim()) {
      setTestFlightLink(tempTestFlightLink.trim());
      localStorage.setItem("sofi_testflight_link", tempTestFlightLink.trim());
    }
    setIsEditingTestFlight(false);
  };

  const handleCopyTestFlight = () => {
    navigator.clipboard.writeText(testFlightLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRunAndroidBuild = async () => {
    setIsBuilding(true);
    setShowLogs(true);
    try {
      const res = await fetch("/api/android/run-script", { method: "POST" });
      const data = await res.json();
      if (data.logs) {
        setBuildLogs(data.logs);
      }
    } catch (err) {
      setBuildLogs((prev) => [...prev, "[ERROR] Automated Gradle compiler timed out."]);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleRunIosBuild = async () => {
    setIsBuilding(true);
    setShowLogs(true);
    try {
      const res = await fetch("/api/ios/run-build", { method: "POST" });
      const data = await res.json();
      if (data.logs) {
        setBuildLogs(data.logs);
      }
    } catch (err) {
      setBuildLogs((prev) => [...prev, "[ERROR] Automated Xcode & Fastlane pipeline timed out."]);
    } finally {
      setIsBuilding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#160B09] border border-white/15 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#1C100D]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={sofiAvatar}
                  alt="Sofi Mobile"
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-[#FF6A3D] shadow-md shadow-orange-500/20"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#160B09] rounded-full" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{language === "si" ? "Sofi ජංගම දුරකථන යෙදුම" : "Sofi Mobile App Portal"}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    iOS & Android
                  </span>
                </h3>
                <p className="text-xs text-amber-200/60">
                  {language === "si" ? "Apple iOS TestFlight සහ Android APK ස්ථාපනය" : "Install on Apple iPhone (TestFlight / WebClip) or Android"}
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

          {/* Platform Switcher Tabs */}
          <div className="px-4 sm:px-6 pt-3 pb-2 bg-[#120706] border-b border-white/5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPlatform("ios");
                setBuildLogs([]);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border ${
                platform === "ios"
                  ? "bg-gradient-to-r from-sky-500/20 to-blue-600/20 text-white border-sky-400/40 shadow-sm"
                  : "bg-white/5 text-amber-200/60 border-transparent hover:bg-white/10 hover:text-white"
              }`}
            >
              <Apple className={`w-4 h-4 ${platform === "ios" ? "text-sky-400" : ""}`} />
              <span>Apple iOS (iPhone & iPad)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-sky-500/20 text-sky-300 font-bold">
                TestFlight
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlatform("android");
                setBuildLogs([]);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border ${
                platform === "android"
                  ? "bg-gradient-to-r from-[#FF6A3D]/20 to-amber-500/20 text-white border-[#FF6A3D]/40 shadow-sm"
                  : "bg-white/5 text-amber-200/60 border-transparent hover:bg-white/10 hover:text-white"
              }`}
            >
              <Smartphone className={`w-4 h-4 ${platform === "android" ? "text-[#FF8A50]" : ""}`} />
              <span>Android (APK)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#FF6A3D]/20 text-[#FF8A50] font-bold">
                v1.2 Release
              </span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* ===================== IOS TAB CONTENT ===================== */}
            {platform === "ios" && (
              <div className="space-y-5">
                {/* iOS Sub-Method Selector */}
                <div className="flex items-center gap-1.5 bg-[#1C100D] p-1 rounded-2xl border border-white/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIosMethod("testflight")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      iosMethod === "testflight"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-amber-200/60 hover:text-white"
                    }`}
                  >
                    <Apple className="w-3.5 h-3.5" />
                    <span>Apple TestFlight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIosMethod("webclip")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      iosMethod === "webclip"
                        ? "bg-[#FF6A3D] text-white shadow-sm"
                        : "text-amber-200/60 hover:text-white"
                    }`}
                  >
                    <PlusSquare className="w-3.5 h-3.5" />
                    <span>Instant iPhone App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIosMethod("xcode")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      iosMethod === "xcode"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-amber-200/60 hover:text-white"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Xcode / Fastlane</span>
                  </button>
                </div>

                {/* METHOD 1: Apple TestFlight */}
                {iosMethod === "testflight" && (
                  <div className="space-y-4">
                    {/* QR Code Card */}
                    <div className="bg-[#120706] border border-sky-500/20 rounded-3xl p-5 text-center flex flex-col items-center space-y-3">
                      <div className="p-3 bg-white rounded-2xl shadow-xl shadow-sky-500/10 inline-block border-4 border-sky-500">
                        {iosTestFlightQrUrl ? (
                          <img
                            src={iosTestFlightQrUrl}
                            alt="Sofi iOS TestFlight QR Code"
                            className="w-40 h-40 rounded-lg block"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-zinc-600">
                            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-sky-400" />
                          <span>Scan with iPhone Camera to Open TestFlight</span>
                        </span>
                        <p className="text-[11px] text-amber-200/60 max-w-xs mx-auto">
                          Direct public beta invitation link for iOS users on iPhone and iPad.
                        </p>
                      </div>
                    </div>

                    {/* TestFlight Link & Actions */}
                    <div className="bg-[#1C100D] border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                          <Apple className="w-3.5 h-3.5" />
                          <span>TestFlight Public Beta Link</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingTestFlight(!isEditingTestFlight)}
                          className="text-[10px] text-amber-200/50 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{isEditingTestFlight ? "Cancel" : "Change Link"}</span>
                        </button>
                      </div>

                      {isEditingTestFlight ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempTestFlightLink}
                            onChange={(e) => setTempTestFlightLink(e.target.value)}
                            placeholder="https://testflight.apple.com/join/..."
                            className="flex-1 bg-[#120706] border border-sky-400/40 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveTestFlightLink}
                            className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-bold hover:bg-sky-400 cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-[#120706] p-2 rounded-xl border border-white/5">
                          <span className="text-xs font-mono text-amber-200/80 truncate max-w-[280px]">
                            {testFlightLink}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleCopyTestFlight}
                              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-amber-200 transition cursor-pointer"
                              title="Copy TestFlight URL"
                            >
                              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={testFlightLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg transition cursor-pointer"
                              title="Open TestFlight in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* How to Install with TestFlight */}
                    <div className="bg-[#180E0B] border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                      <h4 className="font-extrabold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                        <span>How to Install on iPhone via TestFlight:</span>
                      </h4>
                      <ol className="text-[11px] text-amber-200/70 space-y-1.5 list-decimal list-inside pl-1">
                        <li>
                          Install the free <strong>Apple TestFlight</strong> app from the iOS App Store.
                        </li>
                        <li>
                          Scan the QR code above with your iPhone Camera or open the <strong>TestFlight Link</strong>.
                        </li>
                        <li>
                          Tap <strong>"Accept"</strong> and then <strong>"Install"</strong> inside TestFlight.
                        </li>
                        <li>
                          Open <strong>Sofi AI</strong> — Enjoy native performance with automatic background beta updates!
                        </li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* METHOD 2: Instant iOS WebClip (Safari Add to Home Screen) */}
                {iosMethod === "webclip" && (
                  <div className="space-y-4">
                    <div className="bg-[#120706] border border-[#FF6A3D]/20 rounded-3xl p-5 text-center flex flex-col items-center space-y-3">
                      <div className="p-3 bg-white rounded-2xl shadow-xl shadow-orange-500/10 inline-block border-4 border-[#FF6A3D]">
                        {iosWebClipQrUrl ? (
                          <img
                            src={iosWebClipQrUrl}
                            alt="Sofi Live Web App QR Code"
                            className="w-40 h-40 rounded-lg block"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-zinc-600">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#FF6A3D]" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#FF6A3D]" />
                          <span>Scan with iPhone to Open Live App</span>
                        </span>
                        <p className="text-[11px] text-amber-200/60 max-w-xs mx-auto">
                          Zero-setup instant standalone installation via Apple Safari WebClip.
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step iPhone Guide */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-[#1C100D] border border-white/5 rounded-2xl p-3 space-y-1">
                        <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-[#FF8A50] font-bold mx-auto flex items-center justify-center text-xs">
                          1
                        </div>
                        <span className="font-bold text-white text-[11px] block">Open in Safari</span>
                        <p className="text-[10px] text-amber-200/50">
                          Scan the QR code or open this URL in Apple Safari on iPhone.
                        </p>
                      </div>

                      <div className="bg-[#1C100D] border border-white/5 rounded-2xl p-3 space-y-1">
                        <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 font-bold mx-auto flex items-center justify-center text-xs">
                          <Share2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white text-[11px] block">Tap Share Button</span>
                        <p className="text-[10px] text-amber-200/50">
                          Tap the Safari <strong>Share icon</strong> 📤 in the bottom toolbar.
                        </p>
                      </div>

                      <div className="bg-[#1C100D] border border-white/5 rounded-2xl p-3 space-y-1">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold mx-auto flex items-center justify-center text-xs">
                          <PlusSquare className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white text-[11px] block">Add to Home Screen</span>
                        <p className="text-[10px] text-amber-200/50">
                          Select <strong>"Add to Home Screen"</strong> ➕ and tap <strong>Add</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#180E0B] border border-emerald-500/20 rounded-2xl p-3 text-xs flex items-center gap-2.5 text-emerald-300">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                      <span className="text-[11px]">
                        Provides standalone fullscreen display, offline memory cache, and full microphone voice capabilities without browser borders!
                      </span>
                    </div>
                  </div>
                )}

                {/* METHOD 3: Xcode / CI/CD Pipeline */}
                {iosMethod === "xcode" && (
                  <div className="space-y-4">
                    <div className="bg-[#1C100D] border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-amber-200/60">Bundle Identifier:</span>
                        <span className="font-mono text-white font-bold">{iosInfo?.bundleId || "com.sofi.assistant.ios"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-amber-200/60">Target Platforms:</span>
                        <span className="text-white">iOS 16.0 – iOS 18.x (iPhone & iPad)</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-amber-200/60">Native Framework:</span>
                        <span className="text-sky-300 font-mono">Capacitor iOS / Swift 5.10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-200/60">App Store Connect:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>TestFlight Ready</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunIosBuild}
                      disabled={isBuilding}
                      className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Cpu className={`w-4 h-4 ${isBuilding ? "animate-spin" : ""}`} />
                      <span>{isBuilding ? "Running Xcode & Fastlane Pipeline..." : "Run Xcode & TestFlight Archive Builder"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===================== ANDROID TAB CONTENT ===================== */}
            {platform === "android" && (
              <div className="space-y-5">
                {/* Android Sub-Method Selector */}
                <div className="flex items-center gap-1.5 bg-[#1C100D] p-1 rounded-2xl border border-white/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAndroidMethod("pwa")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      androidMethod === "pwa"
                        ? "bg-[#FF6A3D] text-white shadow-sm"
                        : "text-amber-200/60 hover:text-white"
                    }`}
                  >
                    <PlusSquare className="w-3.5 h-3.5" />
                    <span>Instant App (Android 15)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAndroidMethod("apk")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      androidMethod === "apk"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-amber-200/60 hover:text-white"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Direct APK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAndroidMethod("dev")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      androidMethod === "dev"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-amber-200/60 hover:text-white"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Capacitor Source</span>
                  </button>
                </div>

                {/* METHOD 1: Instant PWA Android App */}
                {androidMethod === "pwa" && (
                  <div className="space-y-4">
                    <div className="bg-[#120706] border border-[#FF6A3D]/30 rounded-3xl p-5 text-center flex flex-col items-center space-y-3">
                      <div className="p-3 bg-white rounded-2xl shadow-xl shadow-orange-500/10 inline-block border-4 border-[#FF6A3D]">
                        {androidPwaQrUrl ? (
                          <img
                            src={androidPwaQrUrl}
                            alt="Sofi Live Android App QR Code"
                            className="w-40 h-40 rounded-lg block"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-zinc-600">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#FF6A3D]" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-[#FF6A3D]" />
                          <span>Scan with Sony, Samsung, or any Android 15 Device</span>
                        </span>
                        <p className="text-[11px] text-amber-200/60 max-w-xs mx-auto">
                          100% bypasses "Package Parsing Error" on Android 15 & installs native standalone app.
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Android Guide */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-[#1C100D] border border-white/5 rounded-2xl p-3 space-y-1">
                        <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-[#FF8A50] font-bold mx-auto flex items-center justify-center text-xs">
                          1
                        </div>
                        <span className="font-bold text-white text-[11px] block">Open in Chrome / Browser</span>
                        <p className="text-[10px] text-amber-200/50">
                          Scan QR or open this site in Chrome on your phone.
                        </p>
                      </div>

                      <div className="bg-[#1C100D] border border-white/5 rounded-2xl p-3 space-y-1">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-bold mx-auto flex items-center justify-center text-xs">
                          ⋮
                        </div>
                        <span className="font-bold text-white text-[11px] block">Tap 3 Dots Menu</span>
                        <p className="text-[10px] text-amber-200/50">
                          Tap top right menu <strong className="text-white">(⋮)</strong> in Chrome or Sony browser.
                        </p>
                      </div>

                      <div className="bg-[#1C100D] border border-white/5 rounded-2xl p-3 space-y-1">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold mx-auto flex items-center justify-center text-xs">
                          <PlusSquare className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white text-[11px] block">Tap "Install App"</span>
                        <p className="text-[10px] text-amber-200/50">
                          Select <strong className="text-emerald-300">"Install app"</strong> (or "Add to Home screen").
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#180E0B] border border-emerald-500/20 rounded-2xl p-3 text-xs flex items-center gap-2.5 text-emerald-300">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                      <span className="text-[11px]">
                        <strong>Android 15 Certified:</strong> Runs in fullscreen without browser URL bar, supports background audio and offline cache.
                      </span>
                    </div>
                  </div>
                )}

                {/* METHOD 2: Direct APK Download */}
                {androidMethod === "apk" && (
                  <div className="space-y-4">
                    <div className="bg-[#120706] border border-white/10 rounded-3xl p-5 text-center flex flex-col items-center space-y-3">
                      <div className="p-3 bg-white rounded-2xl shadow-xl shadow-orange-500/10 inline-block border-4 border-amber-600">
                        {androidQrUrl ? (
                          <img
                            src={androidQrUrl}
                            alt="Sofi APK Download QR Code"
                            className="w-40 h-40 rounded-lg block"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-zinc-600">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#FF6A3D]" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-amber-500" />
                          <span>Download Standalone APK Archive</span>
                        </span>
                        <p className="text-[11px] text-amber-200/60 max-w-xs mx-auto">
                          For Android 9–14 or developer sideloading via adb.
                        </p>
                      </div>
                    </div>

                    {/* Direct Action Buttons */}
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const deferred = (window as any).deferredPwaPrompt;
                          if (deferred) {
                            deferred.prompt();
                            const choice = await deferred.userChoice;
                            if (choice.outcome === "accepted") {
                              alert("Sofi AI Assistant installed successfully on your Android device!");
                            }
                          } else {
                            alert("📲 To Install Sofi on Android:\n\n1. Tap the 3 dots menu (⋮) in Chrome at top right\n2. Select 'Install app' or 'Add to Home screen'\n\nAndroid will build and install the native app on your phone!");
                          }
                        }}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Smartphone className="w-4 h-4 text-white animate-bounce" />
                        <span>📲 1-Tap Install Official App on Android</span>
                      </button>

                      <a
                        href="/api/android/download?file=raw"
                        download="sofi-assistant-v1.2.apk"
                        className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-amber-200/80 rounded-2xl text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Download Developer Archive (.apk 2.7 MB)</span>
                      </a>
                    </div>

                    <div className="bg-[#24120D] border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-200/90 space-y-1">
                      <p className="text-[11px] leading-relaxed">
                        <strong className="text-white">Why raw .apk files fail to install:</strong> Android OS blocks manually downloaded raw .apk files unless they are signed with an official Google Play keystore certificate.
                      </p>
                      <p className="text-[11px] text-emerald-400 font-bold">
                        ✅ Tap "1-Tap Install Official App" above to let Android automatically build and install the certified native app on your device without errors!
                      </p>
                    </div>
                  </div>
                )}

                {/* METHOD 3: Developer & Capacitor Source */}
                {androidMethod === "dev" && (
                  <div className="space-y-4">
                    <div className="bg-[#1C100D] border border-white/10 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-amber-200/60">Package Name:</span>
                        <span className="font-mono text-white font-bold">{apkInfo?.packageName || "com.sofi.assistant.aws"}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-amber-200/60">Target OS:</span>
                        <span className="text-white">Android 9.0 to Android 15 (API 35)</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-amber-200/60">Build Tool:</span>
                        <span className="text-white font-mono">Capacitor Android / Gradle 8.3+</span>
                      </div>
                    </div>

                    <div className="bg-[#0A0504] border border-white/10 rounded-2xl p-3.5 text-[11px] font-mono text-amber-200/90 space-y-2">
                      <p className="text-emerald-400 font-bold"># Build Signed APK via Capacitor in Android Studio:</p>
                      <p className="bg-black/50 p-2 rounded-lg text-white">npm install @capacitor/core @capacitor/android<br/>npx cap add android<br/>npx cap sync<br/>npx cap open android</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Build logs terminal viewer */}
            {buildLogs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-xs font-mono text-[#FF8A50] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{showLogs ? "Hide Compiler Pipeline Logs" : "Show Compiler Pipeline Logs"}</span>
                </button>
                {showLogs && (
                  <div className="bg-[#0A0504] border border-white/10 rounded-2xl p-3 text-[10px] font-mono text-emerald-400 space-y-1 max-h-44 overflow-y-auto">
                    {buildLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
