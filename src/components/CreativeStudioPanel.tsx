import React, { useState, useEffect } from "react";
import { 
  Sparkles, Image as ImageIcon, Video, X, Download, Copy, 
  Send, RefreshCw, Wand2, Film, Check, Play, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MediaJob } from "../types";

interface CreativeStudioPanelProps {
  isOpen: boolean;
  initialType?: "image" | "video";
  onClose: () => void;
  onInsertToChat?: (mediaText: string) => void;
  language: "en" | "si";
}

export const CreativeStudioPanel: React.FC<CreativeStudioPanelProps> = ({
  isOpen,
  initialType = "image",
  onClose,
  onInsertToChat,
  language
}) => {
  const [mediaType, setMediaType] = useState<"image" | "video">(initialType);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [selectedStyle, setSelectedStyle] = useState<string>("Anime / Manga Artwork");
  const [selectedImageModel, setSelectedImageModel] = useState<string>("google/imagen-3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJobs, setGeneratedJobs] = useState<MediaJob[]>([]);
  const [activeJob, setActiveJob] = useState<MediaJob | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMediaType(initialType);
    if (initialType === "video") {
      setAspectRatio("16:9");
    } else {
      setAspectRatio("1:1");
    }
  }, [initialType]);

  // Load existing media jobs from MongoDB
  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (Array.isArray(data)) {
        setGeneratedJobs(data);
        if (data.length > 0 && !activeJob) {
          setActiveJob(data[0]);
        }
      }
    } catch (e) {
      console.error("Error loading media jobs:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mediaType,
          prompt,
          aspectRatio,
          style: selectedStyle,
          model: selectedImageModel
        })
      });
      const data = await res.json();
      if (data.success && data.job) {
        setGeneratedJobs((prev) => [data.job, ...prev]);
        setActiveJob(data.job);
      }
    } catch (e) {
      console.error("Error generating media:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const samplePrompts = [
    mediaType === "image" 
      ? "Sofi anime girl with warm neon cat ears holding glowing AWS server drive, ultra detailed"
      : "Cinematic 4K drone orbit over futuristic high-tech Colombo server hub with glowing orange fiber optic lines",
    mediaType === "image"
      ? "Cyberpunk hacker workstation with dual curved monitors, terminal running Sofi MongoDB on AWS"
      : "Dramatic slow-motion zoom into Sofi AI holographic core with particle effects and ambient twilight glow",
    mediaType === "image"
      ? "Cute chibi Sofi sticker mascot smiling in traditional Sri Lankan batik scarf, high quality"
      : "First person perspective walking into an ultra-modern datacenter with pulsating server racks"
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#160B09] border border-white/15 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1C100D]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-orange-500/20 border border-pink-500/30 flex items-center justify-center text-[#FF8A50]">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    {language === "si" ? "Sofi නිර්මාණශීලී මාධ්‍ය මැදිරිය" : "Sofi Creative Media Studio"}
                  </h3>
                  <span className="text-[10px] bg-[#FF6A3D]/20 text-[#FF8A50] border border-[#FF6A3D]/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    AI Gen Engine
                  </span>
                </div>
                <p className="text-xs text-amber-200/60">
                  {language === "si" ? "උසස් AI මඟින් පින්තූර හා වීඩියෝ සංකල්ප නිෂ්පාදනය කරන්න" : "High-fidelity AI image and video concept generation"}
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

          {/* Type Selector (Image vs Video) */}
          <div className="flex items-center gap-2 px-6 pt-4 bg-[#120706] border-b border-white/5">
            <button
              onClick={() => {
                setMediaType("image");
                setAspectRatio("1:1");
              }}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                mediaType === "image"
                  ? "border-[#FF6A3D] text-[#FF8A50]"
                  : "border-transparent text-amber-200/60 hover:text-white"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>{language === "si" ? "AI පින්තූර නිෂ්පාදනය" : "AI Image Generator"}</span>
            </button>

            <button
              onClick={() => {
                setMediaType("video");
                setAspectRatio("16:9");
              }}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                mediaType === "video"
                  ? "border-[#FF6A3D] text-[#FF8A50]"
                  : "border-transparent text-amber-200/60 hover:text-white"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{language === "si" ? "AI වීඩියෝ චිත්‍රාගාරය" : "AI Video Storyboard"}</span>
            </button>
          </div>

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Generator Controls */}
            <div className="lg:col-span-6 space-y-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200/80 flex items-center justify-between">
                    <span>{language === "si" ? "විස්තරාත්මක විමසුම (Prompt)" : "Creative Prompt"}</span>
                    <span className="text-[10px] text-amber-200/50">Be descriptive</span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      mediaType === "image"
                        ? "Describe the visual scene, subject, lighting, and mood..."
                        : "Describe the video action, camera movement, scene pacing, and atmosphere..."
                    }
                    rows={3}
                    className="w-full bg-[#1C100D] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6A3D] transition resize-none"
                  />
                </div>

                {/* Prompt Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-200/50 block">Quick Inspiration:</span>
                  <div className="space-y-1">
                    {samplePrompts.map((sp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrompt(sp)}
                        className="w-full text-left p-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] text-amber-200/80 truncate block transition cursor-pointer border border-white/5"
                      >
                        ⚡ {sp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200/80">
                    {language === "si" ? "මාන අනුපාතය (Aspect Ratio)" : "Aspect Ratio"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1:1", "16:9", "9:16", "4:3"].map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                          aspectRatio === ratio
                            ? "bg-[#FF6A3D] text-white border-[#FF6A3D] shadow-md shadow-orange-500/20"
                            : "bg-white/5 text-amber-200/70 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                 {/* Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200/80">
                    {language === "si" ? "කලාත්මක විලාසය (Art Style)" : "Art Style"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Anime / Manga Artwork",
                      "Photorealistic Cinematic",
                      "Cyberpunk 3D",
                      "Minimalist Concept"
                    ].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setSelectedStyle(style)}
                        className={`py-2 px-3 rounded-xl text-[11px] font-bold text-left transition cursor-pointer border truncate ${
                          selectedStyle === style
                            ? "bg-[#FF6A3D] text-white border-[#FF6A3D]"
                            : "bg-white/5 text-amber-200/70 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Image Model Selector (Requested by User) */}
                {mediaType === "image" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-200/80">
                      {language === "si" ? "පින්තූර ආකෘතිය (AI Model)" : "AI Image Model"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "google/imagen-3", label: "🍌 Nano Banana" },
                        { id: "openai/dall-e-3", label: "💡 GPT Image" },
                        { id: "black-forest-labs/flux-schnell", label: "⚡ Flux Schnell" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedImageModel(m.id)}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border truncate ${
                            selectedImageModel === m.id
                              ? "bg-[#FF6A3D] text-white border-[#FF6A3D] shadow-md shadow-orange-500/10"
                              : "bg-white/5 text-amber-200/70 border-white/10 hover:border-white/20"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-3 bg-gradient-to-r from-[#FF6A3D] to-[#E5532B] hover:from-[#FF8A50] hover:to-[#FF6A3D] text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{mediaType === "video" ? "Synthesizing Video Keyframes..." : "Rendering AI Artwork..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {mediaType === "video" 
                          ? language === "si" ? "වීඩියෝව නිෂ්පාදනය කරන්න" : "Generate AI Video Storyboard" 
                          : language === "si" ? "පින්තූරය නිෂ්පාදනය කරන්න" : "Generate AI Artwork"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Preview Stage & Gallery */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <div className="flex-1 bg-[#120706] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden group">
                {activeJob ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-[300px] w-full flex items-center justify-center bg-black">
                      <img
                        src={activeJob.mediaUrl}
                        alt={activeJob.prompt}
                        className="max-h-[300px] w-full object-cover rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                      {activeJob.type === "video" && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-[#FF6A3D]/90 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 group-hover:scale-110 transition">
                            <Play className="w-6 h-6 ml-0.5" />
                          </div>
                          <span className="absolute bottom-3 right-3 text-[10px] font-mono font-bold bg-black/70 px-2 py-0.5 rounded-full text-white">
                            {activeJob.videoDuration || "4.5s (24fps 4K)"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white truncate max-w-[200px]">
                          {activeJob.prompt}
                        </span>
                        <span className="text-[10px] font-mono text-amber-200/50">
                          {activeJob.style} • {activeJob.aspectRatio}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {onInsertToChat && (
                          <button
                            type="button"
                            onClick={() => {
                              onInsertToChat(
                                activeJob.type === "video"
                                  ? `[Generated AI Video Concept: "${activeJob.prompt}"]\nView: ${activeJob.mediaUrl}`
                                  : `![AI Generated Image - ${activeJob.prompt}](${activeJob.mediaUrl})`
                              );
                              onClose();
                            }}
                            className="flex-1 py-2 bg-[#FF6A3D] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Insert to Chat</span>
                          </button>
                        )}

                        <a
                          href={activeJob.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-amber-200/80 hover:text-white transition cursor-pointer"
                          title="Open Full Image"
                        >
                          <Eye className="w-4 h-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activeJob.mediaUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-amber-200/80 hover:text-white transition cursor-pointer"
                          title="Copy Link"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-amber-200/40 p-8">
                    <Sparkles className="w-8 h-8 mx-auto text-amber-200/20" />
                    <p className="text-xs">No media generated yet. Enter a prompt to start!</p>
                  </div>
                )}
              </div>

              {/* History thumbnails */}
              {generatedJobs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-200/50">Recent MongoDB Media Assets:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {generatedJobs.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => setActiveJob(job)}
                        className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer relative ${
                          activeJob?.id === job.id ? "border-[#FF6A3D]" : "border-white/10 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={job.mediaUrl} alt={job.prompt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {job.type === "video" && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
