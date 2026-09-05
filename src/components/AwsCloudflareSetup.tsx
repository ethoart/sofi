import React, { useState } from "react";
import { 
  Server, Shield, Copy, Check, Terminal, ExternalLink, RefreshCw, FileCode2, HelpCircle
} from "lucide-react";
import { motion } from "motion/react";

export const AwsCloudflareSetup: React.FC = () => {
  const [domain, setDomain] = useState("sofi.yourdomain.com");
  const [token, setToken] = useState("eyJhIjoiMjgxYTU4MmVk...");
  
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  // Generate real AWS t3.small provision script
  const awsSetupScript = `# =========================================================================
# SOFI AGENT HUB - AWS T3.SMALL BOOTSTRAP SCRIPT
# Run these commands inside your AWS EC2 Ubuntu terminal to set up Node.js,
# pull this application repository, install dependencies, and run on Port 3000.
# =========================================================================

# 1. Update OS and download build environments
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential

# 2. Install Node.js v20 (LTS) & Package Managers
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Create app folder and clone repository
mkdir -p /home/ubuntu/sofi-agent
cd /home/ubuntu/sofi-agent

# [Note: Replace git URL with your exported repository link]
# git clone <your-sofi-repo-url> .

# 4. Install production dependencies and build bundles
npm install
npm run build

# 5. Install PM2 (Process Manager) to keep server running forever
sudo npm install -g pm2
pm2 start dist/server.cjs --name "sofi-agent"
pm2 save
pm2 startup`;

  // Generate real Cloudflare cloudflared service configuration
  const cloudflareServiceScript = `# =========================================================================
# CLOUDFLARE ZERO TRUST SYSTEMD SERVICE DEFINITION
# Automatically runs cloudflared as a daemon, feeding your Zero Trust Tunnel token.
# Exposes Port 3000 safely to the web through Cloudflare proxies.
# =========================================================================

# 1. Download Cloudflare Tunnel Daemon on AWS
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 2. Configure Cloudflare Tunnel system daemon
sudo tee /etc/systemd/system/cloudflared.service <<'EOF'
[Unit]
Description=Cloudflare Zero Trust Tunnel Daemon (Sofi Agent)
After=network.target

[Service]
TimeoutStartSec=0
Type=simple
User=root
ExecStart=/usr/bin/cloudflared --no-autoupdate tunnel run --token ${token || "<your-cloudflare-token-here>"}
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# 3. Trigger daemon-reload, enable on boot, and start tunnel
sudo systemctl daemon-reload
sudo systemctl enable cloudflared.service
sudo systemctl start cloudflared.service

# 4. Check status of tunnel link
sudo systemctl status cloudflared.service`;

  // Generate environment configurations
  const envFileContent = `# Environment settings for AWS t3.small deploy
NODE_ENV=production
PORT=3000

# AgentRouter config
AGENTROUTER_API_KEY="${token ? "sk-ar-..." : "your-key-here"}"

# Fallback Gemini API key (Required if fallback is active)
GEMINI_API_KEY="AI_STUDIO_PERSISTED_KEY"`;

  return (
    <div className="flex flex-col h-full bg-[#1C120F]/90 backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/50 p-6">
      <div className="border-b border-white/[0.06] pb-5 mb-6">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-[#FF6A3D]" />
          AWS Host & Cloudflare Zero Trust Deploy Guide
        </h2>
        <p className="text-xs text-amber-200/60 mt-1.5 leading-relaxed">
          Generate live systemd scripts, terminal commands, and configuration code to boot Sofi onto your AWS t3.small EC2 server and link it safely with Cloudflare tunnels.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 xl:grid-cols-12 gap-8 pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {/* Left Side Inputs Form */}
        <div className="xl:col-span-4 space-y-5">
          <div className="p-5 border border-white/5 bg-white/5 rounded-xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#FF8C37]" />
              Deployment Settings
            </h3>

            <div>
              <label className="block text-xs font-bold text-amber-200 mb-1.5">
                Target Custom Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="sofi.yourdomain.com"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#FF6B35] transition"
              />
              <span className="text-[10px] text-amber-200/40 mt-1.5 block">Your domain configured inside Cloudflare Dashboard</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-200 mb-1.5 flex justify-between">
                <span>Cloudflare Tunnel Token</span>
                <a href="https://one.dash.cloudflare.com/" target="_blank" rel="noreferrer" className="text-[10px] text-[#FF8C37] flex items-center gap-0.5 hover:underline font-semibold">
                  Get Token <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <textarea
                rows={3}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhIjoiMjgxYTU4MmVkMmQwN..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-[#FF6B35] transition resize-none"
              />
              <span className="text-[10px] text-amber-200/40 mt-1.5 block">Provided when creating a Zero Trust tunnel</span>
            </div>
          </div>

          <div className="p-4.5 bg-[#FF5E36]/10 rounded-xl border border-[#FF5E36]/20 text-xs text-amber-200 leading-relaxed shadow-xl">
            <h4 className="font-bold text-[#FF8C37] mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Why Cloudflare Zero Trust?
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              Cloudflare Zero Trust tunnels allow you to host web servers on home computers or AWS t3.small instances without opening any public router ports (like 80/443). The tunnel establishes a secure outgoing-only WebSocket link to Cloudflare edge networks, encrypting and routing your site safely under your own custom domain.
            </p>
          </div>
        </div>

        {/* Right Side: Copyable Script Editors */}
        <div className="xl:col-span-8 space-y-6">
          {/* STEP 1: AWS Bootstrap command code */}
          <div className="border border-white/5 rounded-xl overflow-hidden bg-white/5 shadow-xl">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#FF8C37]" />
                Step 1: Bootstrap AWS t3.small Host Terminal
              </span>
              <button
                onClick={() => copyToClipboard(awsSetupScript, "aws")}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition font-bold cursor-pointer"
              >
                {copiedType === "aws" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-300" />
                    Copy Script
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-black/40 font-mono text-xs text-amber-200 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <pre>{awsSetupScript}</pre>
            </div>
          </div>

          {/* STEP 2: Cloudflare cloudflared systemd configuration daemon script */}
          <div className="border border-white/5 rounded-xl overflow-hidden bg-white/5 shadow-xl">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-[#FF8C37]" />
                Step 2: Bind Cloudflare Zero Trust Tunnel
              </span>
              <button
                onClick={() => copyToClipboard(cloudflareServiceScript, "cf")}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition font-bold cursor-pointer"
              >
                {copiedType === "cf" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-300" />
                    Copy Script
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-black/40 font-mono text-xs text-amber-200 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <pre>{cloudflareServiceScript}</pre>
            </div>
          </div>

          {/* STEP 3: Config files example */}
          <div className="border border-white/5 rounded-xl overflow-hidden bg-white/5 shadow-xl">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-[#FF8C37]" />
                Step 3: Setup Production .env Variables
              </span>
              <button
                onClick={() => copyToClipboard(envFileContent, "env")}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition font-bold cursor-pointer"
              >
                {copiedType === "env" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-300" />
                    Copy File
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-black/40 font-mono text-xs text-amber-200">
              <pre>{envFileContent}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
