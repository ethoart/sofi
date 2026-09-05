import React, { useState, useEffect } from "react";
import { 
  User, Lock, Mail, Sparkles, ArrowRight, 
  UserCheck, CheckCircle2, AlertCircle, Key, RefreshCw, Check
} from "lucide-react";
import { motion } from "motion/react";
import { AuthUser } from "../types";
import sofiAvatar from "../assets/images/sofi_chibi_sticker_1788496148780.jpg";

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  language: "en" | "si";
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, language }) => {
  const [tab, setTab] = useState<"login" | "register" | "verify">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email verification state
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationUsername, setVerificationUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null);

  // Check SMTP configuration status
  useEffect(() => {
    fetch("/api/auth/smtp-status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.smtp?.configured !== undefined) {
          setSmtpConfigured(data.smtp.configured);
        }
      })
      .catch(() => {});
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresVerification) {
          setVerificationEmail(data.email || "");
          setVerificationUsername(data.username || username);
          setTab("verify");
          setError(language === "si" 
            ? "ඔබගේ ගිණුම තවම තහවුරු කර නොමැත. කරුණාකර ඔබගේ විද්‍යුත් තැපෑලට එවූ කේතය ඇතුළත් කරන්න."
            : "Your account is not verified yet. Please enter the 6-digit code sent to your email.");
          return;
        }
        throw new Error(data.error || "Login failed");
      }
      localStorage.setItem("sofi_auth_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !name) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, name, nickname })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }
      
      // Successfully registered, transition to 6-digit email verification
      if (data.requiresVerification) {
        setVerificationEmail(data.email);
        setVerificationUsername(data.username);
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setTab("verify");
        setSuccessMsg(data.message || (language === "si" 
          ? "තහවුරු කිරීමේ කේතය ඔබගේ විද්‍යුත් තැපෑලට එවන ලදී." 
          : `Verification code sent to ${data.email}.`));
        setResendCooldown(60);
        return;
      }

      localStorage.setItem("sofi_auth_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError(language === "si" 
        ? "කරුණාකර ඉලක්කම් 6 කේතය සම්පූර්ණයෙන් ඇතුළත් කරන්න." 
        : "Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: verificationUsername,
          email: verificationEmail,
          code: verificationCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Email verification failed.");
      }

      localStorage.setItem("sofi_auth_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err: any) {
      setError(err.message || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: verificationUsername,
          email: verificationEmail
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send code");
      }
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setSuccessMsg(language === "si" 
        ? "නව තහවුරු කිරීමේ කේතයක් එවන ලදී!" 
        : `A fresh verification code was sent to ${data.email || verificationEmail}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Error resending code");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Guest login failed");
      }
      localStorage.setItem("sofi_auth_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err: any) {
      setError(err.message || "Unable to start guest session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D0605] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6A3D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#160B09] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-5"
      >
        {/* App Branding & Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border-2 border-[#FF6A3D] p-1 bg-[#251511] shadow-xl shadow-orange-500/20">
              <img src={sofiAvatar} alt="Sofi" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#160B09] rounded-full" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Sofi AI</h1>
              <span className="text-[10px] bg-gradient-to-r from-[#FF6A3D]/20 to-amber-500/20 text-[#FF8A50] border border-[#FF6A3D]/30 px-2 py-0.5 rounded-full font-bold font-mono">
                v2.4 Pro
              </span>
            </div>
            <p className="text-xs text-amber-200/60 mt-1">
              {language === "si"
                ? "ඔබගේ පෞද්ගලික සහකරු • AWS SLM හා MongoDB මඟින් බලගැන්වේ"
                : "Personal AI Companion • Powered by AWS SLM & MongoDB"}
            </p>
          </div>
        </div>

        {/* Auth Tabs (Only shown when not in verification mode) */}
        {tab !== "verify" ? (
          <div className="grid grid-cols-2 bg-[#120706] p-1 rounded-2xl border border-white/5 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTab("login"); setError(null); setSuccessMsg(null); }}
              className={`py-2.5 rounded-xl transition cursor-pointer ${
                tab === "login"
                  ? "bg-[#FF6A3D] text-white shadow-md"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              {language === "si" ? "පුරනය වන්න" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => { setTab("register"); setError(null); setSuccessMsg(null); }}
              className={`py-2.5 rounded-xl transition cursor-pointer ${
                tab === "register"
                  ? "bg-[#FF6A3D] text-white shadow-md"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              {language === "si" ? "ලියාපදිංචි වන්න" : "Create Account"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gradient-to-r from-[#FF6A3D]/15 to-transparent px-3.5 py-2.5 rounded-2xl border border-[#FF6A3D]/20">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF8A50]">
              <Mail className="w-4 h-4" />
              <span>{language === "si" ? "විද්‍යුත් තැපැල් තහවුරු කිරීම" : "Email Verification"}</span>
            </div>
            <button
              type="button"
              onClick={() => { setTab("login"); setError(null); setSuccessMsg(null); }}
              className="text-[11px] text-amber-200/60 hover:text-white underline cursor-pointer"
            >
              {language === "si" ? "ආපසු" : "Back to Sign In"}
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Area */}
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-200/80 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF6A3D]" />
                <span>{language === "si" ? "පරිශීලක නම හෝ විද්‍යුත් තැපෑල" : "Username or Email"}</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. user or your@email.com"
                required
                className="w-full bg-[#1C100D] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A3D] transition"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-200/80 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#FF6A3D]" />
                  <span>{language === "si" ? "මුරපදය" : "Password"}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUsername("user");
                    setPassword("password123");
                  }}
                  className="text-[10px] text-[#FF8A50] hover:underline cursor-pointer font-mono"
                >
                  {language === "si" ? "නිරූපණ ගිණුම පුරවන්න" : "Fill Demo (user / password123)"}
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#1C100D] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A3D] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : language === "si" ? "පුරනය වන්න" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : tab === "register" ? (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-200/80">
                  {language === "si" ? "සම්පූර්ණ නම" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kasun Silva"
                  required
                  className="w-full bg-[#1C100D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-200/80">
                  {language === "si" ? "සුරතල් නම" : "Nickname"}
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Kasun"
                  className="w-full bg-[#1C100D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-amber-200/80">
                {language === "si" ? "පරිශීලක නම" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. kasun2026"
                required
                className="w-full bg-[#1C100D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#FF6A3D]" />
                  <span>{language === "si" ? "විද්‍යුත් තැපෑල (SMTP තහවුරු කිරීමට)" : "Email (For SMTP Verification)"}</span>
                </label>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kasun@gmail.com"
                required
                className="w-full bg-[#1C100D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-amber-200/80">
                {language === "si" ? "මුරපදය" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure password"
                required
                className="w-full bg-[#1C100D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A3D]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              <span>{loading ? "Sending verification code..." : language === "si" ? "ලියාපදිංචි වී කේතය ලබාගන්න" : "Continue to Email Verification"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          /* Email Verification Step */
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="bg-[#1F110D] border border-white/10 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {language === "si" ? (
                  <>අපි ඔබගේ විද්‍යුත් තැපැල් ලිපිනයට (<strong>{verificationEmail}</strong>) ඉලක්කම් 6 කේතයක් එවා ඇත්තෙමු. කරුණාකර එය මෙහි ඇතුළත් කරන්න.</>
                ) : (
                  <>We sent a 6-digit confirmation code to <strong className="text-white">{verificationEmail}</strong>. Please enter it below to activate your account.</>
                )}
              </p>

              {devCode && (
                <div className="mt-2 py-1.5 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-mono flex items-center justify-between">
                  <span>Dev / Test Code: <strong>{devCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(devCode)}
                    className="text-[10px] text-[#FF8A50] underline hover:text-white cursor-pointer ml-2"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-200/80 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#FF6A3D]" />
                <span>{language === "si" ? "ඉලක්කම් 6 තහවුරු කිරීමේ කේතය" : "6-Digit Verification Code"}</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
                required
                className="w-full bg-[#1C100D] border-2 border-[#FF6A3D]/40 focus:border-[#FF6A3D] rounded-2xl px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-white focus:outline-none transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Verifying..." : language === "si" ? "තහවුරු කර ගිණුමට පිවිසෙන්න" : "Verify & Complete Sign In"}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || loading}
                className="text-[#FF8A50] hover:text-amber-200 transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>
                  {resendCooldown > 0
                    ? `${language === "si" ? "නැවත එවන්න" : "Resend code in"} (${resendCooldown}s)`
                    : language === "si"
                    ? "කේතය නැවත එවන්න"
                    : "Resend Code"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setTab("login"); setError(null); setSuccessMsg(null); }}
                className="text-amber-200/50 hover:text-white transition cursor-pointer"
              >
                {language === "si" ? "පසුව කරන්න" : "Cancel"}
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        {tab !== "verify" && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#160B09] px-3 text-[11px] font-mono text-amber-200/40 uppercase">
                {language === "si" ? "හෝ" : "or"}
              </span>
            </div>

            {/* Guest Access Option */}
            <button
              type="button"
              onClick={handleGuestAccess}
              disabled={loading}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF6A3D]/40 text-amber-200 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2.5 group"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <div className="text-left">
                <span className="block text-white font-bold">
                  {language === "si" ? "ආගන්තුකයෙකු ලෙස ඉදිරියට යන්න" : "Continue as Guest"}
                </span>
                <span className="text-[10px] text-amber-200/50 block font-normal">
                  {language === "si" ? "මුරපදයක් හෝ ඊමේල් තහවුරු කිරීමක් අවශ්‍ය නොවේ" : "Instant 1-click access without email verification"}
                </span>
              </div>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

