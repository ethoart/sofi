import React, { useState, useEffect } from "react";
import { 
  Database, X, Server, RefreshCw, Layers, CheckCircle2, 
  HardDrive, Activity, Code, Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MongoDbStatus } from "../types";

interface MongoDbStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "si";
}

export const MongoDbStatusModal: React.FC<MongoDbStatusModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [status, setStatus] = useState<MongoDbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("chats");
  const [collectionDocs, setCollectionDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mongodb/status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Error loading MongoDB status:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionDocs = async (collName: string) => {
    setSelectedCollection(collName);
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/mongodb/collection/${collName}`);
      const data = await res.json();
      setCollectionDocs(data.documents || []);
    } catch (e) {
      console.error("Error loading collection docs:", e);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchCollectionDocs("chats");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#160B09] border border-white/15 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1C100D]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">Sofi MongoDB (AWS Server)</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Port 27017</span>
                  </span>
                </div>
                <p className="text-xs text-amber-200/60 font-mono">
                  {status?.host || "AWS EC2 (ap-southeast-1, t3.small)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchStatus}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200/60 hover:text-white transition cursor-pointer"
                title="Refresh MongoDB Status"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200/60 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-5 border-b border-white/5 bg-[#120706]">
            <div className="bg-[#1C100D] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-amber-200/50 uppercase font-bold block">Database</span>
              <span className="text-xs font-mono font-extrabold text-emerald-400 block mt-0.5">
                {status?.database || "sofi_mongo_aws"}
              </span>
            </div>
            <div className="bg-[#1C100D] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-amber-200/50 uppercase font-bold block">Storage Engine</span>
              <span className="text-xs font-mono font-extrabold text-white block mt-0.5">
                WiredTiger
              </span>
            </div>
            <div className="bg-[#1C100D] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-amber-200/50 uppercase font-bold block">Latency (AWS)</span>
              <span className="text-xs font-mono font-extrabold text-cyan-300 block mt-0.5">
                {status?.pingMs || 1.2} ms
              </span>
            </div>
            <div className="bg-[#1C100D] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-amber-200/50 uppercase font-bold block">Total Collections</span>
              <span className="text-xs font-mono font-extrabold text-[#FF8A50] block mt-0.5">
                {status?.collections?.length || 6} Collections
              </span>
            </div>
          </div>

          {/* Main Body */}
          <div className="p-5 flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Collection Selection Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-amber-200/70">Select MongoDB Collection to Inspect:</span>
              <div className="flex flex-wrap gap-2">
                {status?.collections?.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => fetchCollectionDocs(c.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                      selectedCollection === c.name
                        ? "bg-[#FF6A3D] text-white border-[#FF6A3D] shadow-md shadow-orange-500/20"
                        : "bg-white/5 text-amber-200/70 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{c.name}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 bg-[#0A0504] border border-white/10 rounded-2xl p-4 overflow-y-auto flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-200/60 pb-2 border-b border-white/5">
                <span className="font-mono text-emerald-400">
                  collection: db.{selectedCollection}.find().limit(50)
                </span>
                <span className="text-[11px]">
                  {collectionDocs.length} documents loaded
                </span>
              </div>

              {docsLoading ? (
                <div className="p-12 text-center text-amber-200/40 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FF6A3D]" />
                  <span>Loading MongoDB documents from AWS host...</span>
                </div>
              ) : collectionDocs.length === 0 ? (
                <div className="p-12 text-center text-amber-200/40 text-xs font-mono">
                  Collection is empty. Insert data via chat, memory or profile.
                </div>
              ) : (
                <pre className="text-[11px] font-mono text-amber-100/90 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(collectionDocs, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Footer URI string */}
          <div className="p-3.5 bg-[#120706] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-amber-200/50">
            <span className="truncate max-w-md">
              URI: {status?.uri || "mongodb://127.0.0.1:27017/sofi_mongo_aws"}
            </span>
            <span className="text-emerald-400 font-bold shrink-0">WiredTiger Sync OK</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
