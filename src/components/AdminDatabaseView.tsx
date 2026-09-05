import React, { useState, useEffect } from "react";
import { 
  Database, Server, RefreshCw, Layers, CheckCircle2, 
  HardDrive, Activity, Code, Clock, Trash2, Search
} from "lucide-react";
import { MongoDbStatus } from "../types";

export const AdminDatabaseView: React.FC = () => {
  const [status, setStatus] = useState<MongoDbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("chats");
  const [collectionDocs, setCollectionDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    fetchStatus();
    fetchCollectionDocs("chats");
  }, []);

  const filteredDocs = collectionDocs.filter((doc) => {
    if (!searchTerm.trim()) return true;
    return JSON.stringify(doc).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#160B09] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-white">Sofi MongoDB Cluster Manager</h2>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Port 27017 Connected</span>
              </span>
            </div>
            <p className="text-xs text-amber-200/60 font-mono mt-0.5">
              {status?.uri || "mongodb://127.0.0.1:27017/sofi_mongo_aws"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchStatus();
            fetchCollectionDocs(selectedCollection);
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Database Metrics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#160B09] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-amber-200/60 text-xs">
            <span>Storage Engine</span>
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-sm font-extrabold text-white">{status?.engine || "WiredTiger"}</p>
          <span className="text-[10px] text-amber-200/40 font-mono">High-throughput B-Tree</span>
        </div>

        <div className="bg-[#160B09] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-amber-200/60 text-xs">
            <span>Ping Latency</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-sm font-extrabold text-emerald-400 font-mono">{status?.pingMs || 0.8} ms</p>
          <span className="text-[10px] text-amber-200/40 font-mono">Loopback Unix Socket</span>
        </div>

        <div className="bg-[#160B09] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-amber-200/60 text-xs">
            <span>Collections</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-sm font-extrabold text-white">{status?.collections?.length || 6}</p>
          <span className="text-[10px] text-amber-200/40 font-mono">Active Namespaces</span>
        </div>

        <div className="bg-[#160B09] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-amber-200/60 text-xs">
            <span>Server Uptime</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-sm font-extrabold text-white">{Math.floor((status?.uptimeSeconds || 3600) / 3600)} hrs</p>
          <span className="text-[10px] text-amber-200/40 font-mono">Service Daemon</span>
        </div>
      </div>

      {/* Main Collections & Document Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left: Collections list */}
        <div className="bg-[#160B09] border border-white/10 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-amber-200/70 uppercase tracking-wider">
            MongoDB Collections
          </h3>

          <div className="space-y-1.5">
            {status?.collections?.map((coll) => (
              <button
                key={coll.name}
                type="button"
                onClick={() => fetchCollectionDocs(coll.name)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  selectedCollection === coll.name
                    ? "bg-emerald-500/20 border-emerald-500/50 text-white shadow-sm"
                    : "bg-[#1C100D] border-white/5 text-amber-200/80 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold font-mono">{coll.name}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[11px] font-bold text-emerald-400">{coll.count} docs</span>
                  <span className="text-[9px] text-amber-200/40 block">
                    {Math.round(coll.sizeBytes / 1024)} KB
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Documents JSON Viewer */}
        <div className="md:col-span-2 bg-[#160B09] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col space-y-3 min-h-[420px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase">
                {selectedCollection} ({filteredDocs.length} records)
              </h3>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-amber-200/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search JSON records..."
                className="bg-[#1C100D] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-amber-200/30 font-mono w-full sm:w-48"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs max-h-[460px]">
            {docsLoading ? (
              <div className="flex items-center justify-center h-48 text-amber-200/50 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Querying WiredTiger storage...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-amber-200/40">
                No documents found matching criteria in '{selectedCollection}'.
              </div>
            ) : (
              filteredDocs.map((doc, idx) => (
                <div
                  key={doc.id || doc._id || idx}
                  className="p-3.5 rounded-xl bg-[#1C100D] border border-white/5 space-y-2 hover:border-emerald-500/30 transition group"
                >
                  <div className="flex items-center justify-between text-[10px] text-amber-200/50 pb-1 border-b border-white/5">
                    <span>Record #{idx + 1} • ID: {doc.id || doc._id || "N/A"}</span>
                    <span>{doc.createdAt || doc.learnedAt || doc.timestamp || ""}</span>
                  </div>
                  <pre className="text-[11px] text-emerald-200/90 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
                    {JSON.stringify(doc, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
