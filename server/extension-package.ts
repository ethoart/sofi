import fs from "fs";
import path from "path";
import * as archiverPkg from "archiver";

const archiver = (archiverPkg as any).default || archiverPkg;

const DATA_DIR = path.join(process.cwd(), "data");
const EXTENSION_DIR = path.join(DATA_DIR, "sofi-browser-extension");
const EXTENSION_ZIP_PATH = path.join(DATA_DIR, "sofi-browser-extension.zip");
const PUBLIC_DIR = path.join(process.cwd(), "public");

export interface ExtensionInfo {
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

/**
 * Returns extension metadata and active server URL
 */
export function getExtensionInfo(serverUrl: string): ExtensionInfo {
  const zipExists = fs.existsSync(EXTENSION_ZIP_PATH);
  let zipSize = "0 KB";
  if (zipExists) {
    const stats = fs.statSync(EXTENSION_ZIP_PATH);
    zipSize = `${(stats.size / 1024).toFixed(1)} KB`;
  }

  return {
    name: "Sofi AI - Browser Side Panel & Companion",
    version: "1.2.0",
    manifestVersion: 3,
    description: "Sofi AI browser side panel for instant webpage summarization, deep research, selection explanation, and frontier multi-model reasoning.",
    zipSize,
    permissions: [
      "sidePanel (Chrome Side Panel API)",
      "activeTab (Extract current webpage content)",
      "scripting (Read selected text & webpage body)",
      "storage (Save user preferences & chat history)",
      "contextMenus (Right-click Ask Sofi on any page)"
    ],
    features: [
      "Chrome Manifest V3 SidePanel API (Docked sidebar while browsing)",
      "1-Click 'Summarize Tab' with intelligent key takeaways",
      "Explain or translate highlighted text on any webpage",
      "Direct integration with AgentRouter Frontier Models (Claude Opus 4.8 / 5, DeepSeek v4, GLM 5.3, GPT-5.6 Sol)",
      "Speech-to-Text voice query & Text-to-Speech playback",
      "Sinhala and English dual-language AI comprehension",
      "Configurable custom server endpoint (Cloud / Localhost / AWS)"
    ],
    shortcut: "Ctrl+Shift+S (Cmd+Shift+S on macOS)",
    downloadUrl: "/api/extension/download",
    apiTargetUrl: serverUrl
  };
}

/**
 * Generates all extension source files and bundles them into sofi-browser-extension.zip
 */
export async function buildExtensionPackage(options?: { serverUrl?: string }): Promise<string> {
  const targetServerUrl = options?.serverUrl && options.serverUrl.trim() !== ""
    ? options.serverUrl.replace(/\/$/, "")
    : (process.env.APP_URL || "https://ais-dev-ggcji5sa7y72yd4mltsvbo-181219863575.asia-east1.run.app").replace(/\/$/, "");

  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EXTENSION_DIR)) {
    fs.mkdirSync(EXTENSION_DIR, { recursive: true });
  }
  const iconsDir = path.join(EXTENSION_DIR, "icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Copy icon if available, or generate standard icon
  const candidateIcons = [
    path.join(PUBLIC_DIR, "sofi-chibi.png"),
    path.join(PUBLIC_DIR, "sofi-logo.jpg"),
    path.join(process.cwd(), "src/assets/images/sofi_chibi_sticker_1788496148780.jpg"),
    path.join(process.cwd(), "src/assets/images/sofi_anime_face_1788458075658.jpg")
  ];

  let copiedIcon = false;
  for (const iconPath of candidateIcons) {
    if (fs.existsSync(iconPath)) {
      try {
        fs.copyFileSync(iconPath, path.join(iconsDir, "icon16.png"));
        fs.copyFileSync(iconPath, path.join(iconsDir, "icon48.png"));
        fs.copyFileSync(iconPath, path.join(iconsDir, "icon128.png"));
        fs.copyFileSync(iconPath, path.join(EXTENSION_DIR, "icon48.png"));
        copiedIcon = true;
        break;
      } catch (e) {
        console.warn("[Extension Builder] Icon copy warning:", e);
      }
    }
  }

  // If no image file found, write a valid fallback 1x1 orange PNG buffer so Chrome never throws missing icon error
  if (!copiedIcon || !fs.existsSync(path.join(iconsDir, "icon48.png"))) {
    const pngFallback = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(path.join(iconsDir, "icon16.png"), pngFallback);
    fs.writeFileSync(path.join(iconsDir, "icon48.png"), pngFallback);
    fs.writeFileSync(path.join(iconsDir, "icon128.png"), pngFallback);
  }

  // 1. manifest.json
  const manifest = {
    manifest_version: 3,
    name: "Sofi AI - Browser Side Panel & Companion",
    version: "1.2.0",
    description: "Sofi AI sidebar companion. Instant webpage summarization, selection explanation, and multi-model AI reasoning.",
    permissions: [
      "sidePanel",
      "activeTab",
      "scripting",
      "storage",
      "contextMenus"
    ],
    host_permissions: [
      "<all_urls>"
    ],
    background: {
      service_worker: "background.js"
    },
    side_panel: {
      default_path: "sidepanel.html"
    },
    action: {
      default_title: "Open Sofi AI Side Panel",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Ctrl+Shift+S",
          mac: "Command+Shift+S"
        },
        description: "Toggle Sofi AI Side Panel"
      }
    }
  };
  fs.writeFileSync(path.join(EXTENSION_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  // 2. background.js
  const backgroundJs = `// Sofi AI - Browser Extension Service Worker (Manifest V3)
console.log("[Sofi Extension] Service worker registered.");

// 1. Open Side Panel when clicking toolbar extension icon
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn("[Sofi Extension] setPanelBehavior:", err));
}

// 2. Register Context Menus on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "sofi-explain-selection",
      title: "Ask Sofi: Explain \\"%s\\"",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "sofi-summarize-page",
      title: "Summarize this page with Sofi",
      contexts: ["page"]
    });

    chrome.contextMenus.create({
      id: "sofi-translate-sinhala",
      title: "Translate selection to Sinhala (සිංහල)",
      contexts: ["selection"]
    });
  });
});

// 3. Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  try {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (err) {
    console.warn("[Sofi Extension] sidePanel.open notice:", err);
  }

  // Delay slightly to let sidepanel initialize listener
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: "SOFI_CONTEXT_ACTION",
      menuItemId: info.menuItemId,
      selectionText: info.selectionText || "",
      pageUrl: tab.url || "",
      pageTitle: tab.title || ""
    }).catch(() => {
      // Ignored if sidepanel isn't ready
    });
  }, 600);
});
`;
  fs.writeFileSync(path.join(EXTENSION_DIR, "background.js"), backgroundJs, "utf-8");

  // 3. content.js
  const contentJs = `// Sofi AI - Content Script
// Listens for page messages and provides helper triggers

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PAGE_INFO") {
    sendResponse({
      title: document.title || "",
      url: window.location.href || "",
      selectedText: window.getSelection() ? window.getSelection().toString().trim() : "",
      bodyText: document.body ? document.body.innerText.substring(0, 10000) : ""
    });
  }
  return true;
});
`;
  fs.writeFileSync(path.join(EXTENSION_DIR, "content.js"), contentJs, "utf-8");

  // 4. sidepanel.html
  const sidepanelHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sofi AI - Browser Sidebar</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="sidebar-container">
    <!-- Header -->
    <header class="sidebar-header">
      <div class="brand">
        <img src="icons/icon48.png" alt="Sofi" class="avatar">
        <div class="brand-text">
          <div class="brand-title">
            <span>Sofi AI</span>
            <span class="badge-tag">Sidebar</span>
          </div>
          <div class="status-indicator" id="connectionStatus">
            <span class="status-dot"></span>
            <span id="statusText">Connected to Sofi</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button id="settingsBtn" class="icon-btn" title="Server Settings">⚙️</button>
        <button id="clearChatBtn" class="icon-btn" title="Clear Chat History">🗑️</button>
      </div>
    </header>

    <!-- Settings Pane (hidden by default) -->
    <div id="settingsPanel" class="settings-panel hidden">
      <div class="settings-title">Sofi Server Configuration</div>
      <label class="setting-label" for="serverUrlInput">API Server URL:</label>
      <input type="text" id="serverUrlInput" class="text-input" value="${targetServerUrl}" placeholder="https://your-sofi-app.com">
      
      <div class="settings-actions">
        <button id="testConnectionBtn" class="action-pill">Test Ping</button>
        <button id="saveSettingsBtn" class="action-pill primary">Save URL</button>
      </div>
      <div id="pingResult" class="ping-result"></div>
    </div>

    <!-- Quick Tools Bar -->
    <div class="quick-tools">
      <button id="summarizeTabBtn" class="tool-chip highlight" title="Summarize the active webpage in this browser tab">
        <span class="chip-icon">📄</span>
        <span>Summarize Tab</span>
      </button>
      <button id="explainSelectionBtn" class="tool-chip" title="Explain currently selected text on webpage">
        <span class="chip-icon">🔍</span>
        <span>Explain Selection</span>
      </button>
      <button id="keyTakeawaysBtn" class="tool-chip" title="Extract bullet key takeaways from page">
        <span class="chip-icon">💡</span>
        <span>Key Takeaways</span>
      </button>
      <button id="translateSinhalaBtn" class="tool-chip" title="Translate active page content to Sinhala">
        <span class="chip-icon">🇱🇰</span>
        <span>සිංහල පරිවර්තනය</span>
      </button>
    </div>

    <!-- Sofi Auto-Intelligence & Free/Pro Edition Bar -->
    <div class="model-bar">
      <div class="edition-toggle-wrapper">
        <button type="button" id="freeEditionBtn" class="edition-btn active" title="Free Local SLM + Fast Reasoning">
          ⚡ Free (Local)
        </button>
        <button type="button" id="proEditionBtn" class="edition-btn" title="Pro Frontier Models (Gemini, Claude, GPT-4o)">
          ✨ Pro (Frontier)
        </button>
      </div>
      <div id="activeEditionLabel" class="ai-badge">Free Edition</div>
    </div>

    <!-- Chat Messages Stream -->
    <main id="chatMessages" class="chat-messages">
      <div class="message-bubble assistant welcome">
        <div class="bubble-header">
          <span class="model-badge">Sofi Assistant</span>
          <span class="time-stamp">Sidebar Active</span>
        </div>
        <div class="bubble-content">
          Ayubowan! I am your <strong>Sofi AI Browser Companion</strong>.
          <br><br>
          I am connected to your active tab. Click <strong>"Summarize Tab"</strong> above to digest this webpage, or ask me anything while you browse!
        </div>
      </div>
    </main>

    <!-- Active Tab Context Pill (dynamic) -->
    <div id="activeTabPill" class="active-tab-pill hidden">
      <span class="tab-icon">🌐</span>
      <span id="tabTitleText" class="tab-title">Detecting active page...</span>
      <button id="removeTabContextBtn" class="remove-pill" title="Remove page context">×</button>
    </div>

    <!-- Input Footer -->
    <footer class="sidebar-footer">
      <form id="chatForm" class="chat-form">
        <textarea 
          id="messageInput" 
          rows="1" 
          placeholder="Ask Sofi about this page or any topic..." 
          class="chat-textarea"
        ></textarea>
        
        <div class="footer-actions">
          <button type="button" id="micBtn" class="footer-icon-btn" title="Voice Dictation">
            🎙️
          </button>
          <button type="submit" id="sendBtn" class="send-btn" title="Send message">
            <span>Send</span>
          </button>
        </div>
      </form>
      <div class="footer-subtext">
        <span>Shortcut: <strong>Ctrl+Shift+S</strong></span>
        <span>•</span>
        <span>AgentRouter & Gemini Supported</span>
      </div>
    </footer>
  </div>

  <script src="sidepanel.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(EXTENSION_DIR, "sidepanel.html"), sidepanelHtml, "utf-8");

  // 5. styles.css
  const stylesCss = `/* Sofi AI Browser Sidepanel Theme */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #0F0806;
  color: #FEEBC8;
  font-size: 13px;
  line-height: 1.5;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #120705;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: #1A0C08;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  object-fit: cover;
  border: 1.5px solid #FF6A3D;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  font-size: 13px;
  color: #FFFFFF;
}

.badge-tag {
  font-size: 9px;
  font-weight: 700;
  background: rgba(255, 106, 61, 0.2);
  color: #FF8A50;
  border: 1px solid rgba(255, 106, 61, 0.35);
  padding: 1px 6px;
  border-radius: 12px;
  text-transform: uppercase;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: rgba(254, 235, 200, 0.5);
  font-family: monospace;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10B981;
  display: inline-block;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #FEEBC8;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* Settings Panel */
.settings-panel {
  background-color: #180E0B;
  border-bottom: 1px solid rgba(255, 106, 61, 0.3);
  padding: 12px 14px;
  animation: slideDown 0.2s ease;
}

.settings-panel.hidden {
  display: none;
}

.settings-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #FF8A50;
  margin-bottom: 8px;
}

.setting-label {
  display: block;
  font-size: 11px;
  color: rgba(254, 235, 200, 0.7);
  margin-bottom: 4px;
}

.text-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 10px;
  color: #FFFFFF;
  font-size: 11px;
  font-family: monospace;
  margin-bottom: 8px;
}

.settings-actions {
  display: flex;
  gap: 6px;
}

.action-pill {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #FEEBC8;
  cursor: pointer;
}

.action-pill.primary {
  background: #FF6A3D;
  border-color: #FF6A3D;
  color: #FFFFFF;
}

.ping-result {
  margin-top: 6px;
  font-size: 10px;
  font-family: monospace;
}

/* Quick Tools Bar */
.quick-tools {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  overflow-x: auto;
  white-space: nowrap;
  background: #140A07;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  scrollbar-width: none;
}

.quick-tools::-webkit-scrollbar {
  display: none;
}

.tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(254, 235, 200, 0.85);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.tool-chip:hover {
  background: rgba(255, 106, 61, 0.15);
  border-color: rgba(255, 106, 61, 0.4);
  color: #FFFFFF;
}

.tool-chip.highlight {
  background: rgba(255, 106, 61, 0.12);
  border-color: rgba(255, 106, 61, 0.35);
  color: #FF8A50;
}

.chip-icon {
  font-size: 12px;
}

/* Auto-Intelligence Bar & Edition Switcher */
.model-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
}

.edition-toggle-wrapper {
  display: flex;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.edition-btn {
  background: transparent;
  border: none;
  color: rgba(254, 235, 200, 0.7);
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.edition-btn:hover {
  color: #FFFFFF;
}

.edition-btn.active {
  background: #FF6A3D;
  color: #FFFFFF;
  box-shadow: 0 1px 4px rgba(255, 106, 61, 0.4);
}

.auto-intelligence-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #FFFFFF;
  font-weight: 700;
}

.ai-sparkle {
  font-size: 11px;
}

.ai-title {
  color: #FFFFFF;
}

.ai-badge {
  font-size: 9px;
  font-family: monospace;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 106, 61, 0.2);
  border: 1px solid rgba(255, 106, 61, 0.35);
  color: #FF8A50;
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-bubble {
  max-width: 92%;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 12.5px;
  line-height: 1.55;
  word-break: break-word;
}

.message-bubble.user {
  align-self: flex-end;
  background: linear-gradient(135deg, #FF6A3D, #D9481C);
  color: #FFFFFF;
  border-bottom-right-radius: 2px;
  box-shadow: 0 2px 10px rgba(255, 106, 61, 0.2);
}

.message-bubble.assistant {
  align-self: flex-start;
  background: #180E0B;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FEEBC8;
  border-bottom-left-radius: 2px;
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 10px;
}

.model-badge {
  font-weight: 700;
  color: #FF8A50;
  font-family: monospace;
}

.time-stamp {
  color: rgba(254, 235, 200, 0.4);
}

.bubble-content {
  font-size: 12.5px;
}

.bubble-content pre {
  background: #0D0605;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px;
  margin: 6px 0;
  overflow-x: auto;
  font-size: 11px;
  font-family: monospace;
}

.bubble-content code {
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 4px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
}

.bubble-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.mini-action-btn {
  background: transparent;
  border: none;
  color: rgba(254, 235, 200, 0.5);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
}

.mini-action-btn:hover {
  color: #FF8A50;
}

/* Active Tab Context Pill */
.active-tab-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 12px 6px 12px;
  padding: 4px 10px;
  background: rgba(255, 106, 61, 0.12);
  border: 1px solid rgba(255, 106, 61, 0.25);
  border-radius: 8px;
  font-size: 11px;
  color: #FF8A50;
}

.active-tab-pill.hidden {
  display: none;
}

.tab-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.remove-pill {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
}

/* Footer */
.sidebar-footer {
  background: #160B09;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 12px 10px 12px;
}

.chat-form {
  display: flex;
  flex-direction: column;
  background: #0F0705;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 6px 8px;
  transition: border-color 0.2s;
}

.chat-form:focus-within {
  border-color: #FF6A3D;
  box-shadow: 0 0 0 1px rgba(255, 106, 61, 0.3);
}

.chat-textarea {
  background: transparent;
  border: none;
  color: #FFFFFF;
  font-size: 12.5px;
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 100px;
  min-height: 28px;
  padding: 2px 4px;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-icon-btn {
  background: transparent;
  border: none;
  font-size: 14px;
  color: rgba(254, 235, 200, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}

.footer-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.footer-icon-btn.recording {
  color: #EF4444;
  animation: pulse 1s infinite;
}

.send-btn {
  background: #FF6A3D;
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.send-btn:hover {
  opacity: 0.9;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-subtext {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 9.5px;
  color: rgba(254, 235, 200, 0.35);
  margin-top: 6px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
  fs.writeFileSync(path.join(EXTENSION_DIR, "styles.css"), stylesCss, "utf-8");

  // 6. sidepanel.js
  const sidepanelJs = `// Sofi AI - Sidepanel Interactive Logic

const DEFAULT_SERVER_URL = "${targetServerUrl}";
let activeTabContext = null;
let isGenerating = false;
let recognition = null;
let isRecording = false;

// DOM Elements
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const modelSelect = document.getElementById("modelSelect");
const settingsBtn = document.getElementById("settingsBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const settingsPanel = document.getElementById("settingsPanel");
const serverUrlInput = document.getElementById("serverUrlInput");
const testConnectionBtn = document.getElementById("testConnectionBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const pingResult = document.getElementById("pingResult");
const connectionStatus = document.getElementById("connectionStatus");
const statusText = document.getElementById("statusText");

// Edition toggle
const freeEditionBtn = document.getElementById("freeEditionBtn");
const proEditionBtn = document.getElementById("proEditionBtn");
const activeEditionLabel = document.getElementById("activeEditionLabel");
let currentEdition = "free";

function updateEditionUI(edition) {
  currentEdition = edition;
  if (freeEditionBtn && proEditionBtn && activeEditionLabel) {
    if (edition === "pro") {
      proEditionBtn.classList.add("active");
      freeEditionBtn.classList.remove("active");
      activeEditionLabel.textContent = "✨ Pro Frontier";
      activeEditionLabel.style.color = "#FF8A50";
      activeEditionLabel.style.borderColor = "rgba(255, 106, 61, 0.5)";
    } else {
      freeEditionBtn.classList.add("active");
      proEditionBtn.classList.remove("active");
      activeEditionLabel.textContent = "⚡ Free Local";
      activeEditionLabel.style.color = "#34D399";
      activeEditionLabel.style.borderColor = "rgba(52, 211, 153, 0.4)";
    }
  }
}

// Quick tools
const summarizeTabBtn = document.getElementById("summarizeTabBtn");
const explainSelectionBtn = document.getElementById("explainSelectionBtn");
const keyTakeawaysBtn = document.getElementById("keyTakeawaysBtn");
const translateSinhalaBtn = document.getElementById("translateSinhalaBtn");

// Active Tab Pill
const activeTabPill = document.getElementById("activeTabPill");
const tabTitleText = document.getElementById("tabTitleText");
const removeTabContextBtn = document.getElementById("removeTabContextBtn");

// Initialize Settings & Edition
function initSettings() {
  chrome.storage.local.get(["sofiServerUrl", "sofiSelectedModel", "sofiEdition"], (res) => {
    if (res.sofiServerUrl) {
      serverUrlInput.value = res.sofiServerUrl;
    }
    if (res.sofiSelectedModel && modelSelect) {
      modelSelect.value = res.sofiSelectedModel;
    }
    if (res.sofiEdition) {
      updateEditionUI(res.sofiEdition);
    } else {
      updateEditionUI("free");
    }
    checkServerConnection();
  });
}

if (freeEditionBtn) {
  freeEditionBtn.addEventListener("click", () => {
    updateEditionUI("free");
    chrome.storage.local.set({ sofiEdition: "free" });
  });
}

if (proEditionBtn) {
  proEditionBtn.addEventListener("click", () => {
    updateEditionUI("pro");
    chrome.storage.local.set({ sofiEdition: "pro" });
  });
}

function getServerUrl() {
  return (serverUrlInput.value || DEFAULT_SERVER_URL).trim().replace(/\\/$/, "");
}

// Check Server Health
async function checkServerConnection() {
  const url = getServerUrl();
  statusText.textContent = "Checking...";
  try {
    const res = await fetch(\`\${url}/api/health\`, { method: "GET" });
    if (res.ok) {
      statusText.textContent = "Connected to Sofi";
      statusText.style.color = "#10B981";
    } else {
      statusText.textContent = "Server response: " + res.status;
      statusText.style.color = "#F59E0B";
    }
  } catch (e) {
    statusText.textContent = "Offline / URL unreachable";
    statusText.style.color = "#EF4444";
  }
}

// Get Active Browser Tab Information
async function getActiveTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return null;

    let pageText = "";
    let selectedText = "";

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            selected: window.getSelection() ? window.getSelection().toString().trim() : "",
            body: document.body ? document.body.innerText.substring(0, 12000) : ""
          };
        }
      });
      if (results && results[0] && results[0].result) {
        selectedText = results[0].result.selected || "";
        pageText = results[0].result.body || "";
      }
    } catch (scriptErr) {
      console.warn("[Sofi Sidepanel] Script execution restricted on this tab:", scriptErr);
    }

    return {
      title: tab.title || "Untitled Tab",
      url: tab.url || "",
      selectedText,
      pageText
    };
  } catch (err) {
    console.error("[Sofi Sidepanel] getActiveTabInfo error:", err);
    return null;
  }
}

// Update Active Tab Pill UI
function setTabContext(context) {
  activeTabContext = context;
  if (context && (context.title || context.url)) {
    tabTitleText.textContent = \`Context: \${context.title || context.url}\`;
    activeTabPill.classList.remove("hidden");
  } else {
    activeTabPill.classList.add("hidden");
  }
}

removeTabContextBtn.addEventListener("click", () => {
  setTabContext(null);
});

// Append Message to UI
function appendMessage(sender, text, meta = {}) {
  const bubble = document.createElement("div");
  bubble.className = \`message-bubble \${sender}\`;

  const header = document.createElement("div");
  header.className = "bubble-header";

  const badge = document.createElement("span");
  badge.className = "model-badge";
  badge.textContent = sender === "user" ? "You" : (meta.modelLabel || "Sofi Assistant");

  const time = document.createElement("span");
  time.className = "time-stamp";
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  header.appendChild(badge);
  header.appendChild(time);
  bubble.appendChild(header);

  const content = document.createElement("div");
  content.className = "bubble-content";
  
  // Format markdown-like code & bold
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\\*\\\*(.*?)\\\*\\\*/g, "<strong>$1</strong>")
    .replace(/\\n/g, "<br>");

  content.innerHTML = formatted;
  bubble.appendChild(content);

  if (sender === "assistant") {
    const actions = document.createElement("div");
    actions.className = "bubble-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "mini-action-btn";
    copyBtn.innerHTML = "📋 Copy";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = "✓ Copied!";
      setTimeout(() => { copyBtn.innerHTML = "📋 Copy"; }, 1500);
    };

    const speakBtn = document.createElement("button");
    speakBtn.className = "mini-action-btn";
    speakBtn.innerHTML = "🔊 Speak";
    speakBtn.onclick = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text.replace(/<[^>]*>?/gm, ''));
        utter.pitch = 1.15;
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => {
          const n = v.name.toLowerCase();
          return n.includes("female") || n.includes("zira") || n.includes("samantha") || n.includes("karen") || n.includes("jenny");
        });
        if (femaleVoice) utter.voice = femaleVoice;
        window.speechSynthesis.speak(utter);
      }
    };

    actions.appendChild(copyBtn);
    actions.appendChild(speakBtn);
    bubble.appendChild(actions);
  }

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

// Send Message to Sofi API
async function handleSend(customText = null, additionalContext = null) {
  const prompt = (customText || messageInput.value || "").trim();
  if (!prompt || isGenerating) return;

  isGenerating = true;
  sendBtn.disabled = true;
  messageInput.value = "";
  messageInput.style.height = "auto";

  appendMessage("user", prompt);

  // Loading bubble
  const loadingBubble = appendMessage("assistant", "Sofi Auto-Intelligence is reasoning...");
  const contentElem = loadingBubble.querySelector(".bubble-content");

  const serverUrl = getServerUrl();
  const selectedModel = "auto";

  // Build payload
  const payload = {
    message: prompt,
    selectedModel,
    language: prompt.match(/[\\u0D80-\\u0DFF]/) ? "si" : "en",
    mode: "general",
    edition: currentEdition
  };

  const contextToUse = additionalContext || activeTabContext;
  if (contextToUse && (contextToUse.pageText || contextToUse.selectedText)) {
    payload.attachments = [
      {
        id: "active-tab-" + Date.now(),
        name: contextToUse.title || "active_webpage.txt",
        type: "document",
        textContent: \`Active Webpage URL: \${contextToUse.url}\\nTitle: \${contextToUse.title}\\nHighlighted: \${contextToUse.selectedText || "None"}\\nPage Content:\\n\${contextToUse.pageText || ""}\`
      }
    ];
  }

  try {
    const res = await fetch(\`\${serverUrl}/api/chat\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    loadingBubble.remove();

    if (data.reply) {
      appendMessage("assistant", data.reply, {
        modelLabel: data.modelLabel || "Sofi AI"
      });
    } else if (data.error) {
      appendMessage("assistant", "⚠️ Error: " + data.error);
    } else {
      appendMessage("assistant", "⚠️ Unexpected response from Sofi server.");
    }
  } catch (err) {
    loadingBubble.remove();
    appendMessage("assistant", \`⚠️ Network Error: Unable to reach Sofi server at \${serverUrl}. Please check your server connection in settings (⚙️).\`);
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

// Quick Tool Handlers
summarizeTabBtn.addEventListener("click", async () => {
  const tabInfo = await getActiveTabInfo();
  if (!tabInfo || !tabInfo.pageText) {
    appendMessage("assistant", "⚠️ Could not read page text from active tab. (Browser internal pages like chrome:// cannot be inspected due to browser security).");
    return;
  }
  setTabContext(tabInfo);
  handleSend(\`Please provide a clear, structured summary with key bullet points of the current webpage: "\${tabInfo.title}"\`, tabInfo);
});

explainSelectionBtn.addEventListener("click", async () => {
  const tabInfo = await getActiveTabInfo();
  if (!tabInfo || !tabInfo.selectedText) {
    appendMessage("assistant", "💡 Please highlight some text on the webpage first, then click 'Explain Selection'.");
    return;
  }
  setTabContext(tabInfo);
  handleSend(\`Explain this highlighted text in simple terms: "\\n\${tabInfo.selectedText}\\n"\`, tabInfo);
});

keyTakeawaysBtn.addEventListener("click", async () => {
  const tabInfo = await getActiveTabInfo();
  if (!tabInfo || !tabInfo.pageText) {
    appendMessage("assistant", "⚠️ Could not read page text from active tab.");
    return;
  }
  setTabContext(tabInfo);
  handleSend(\`Extract the top 5 most important action items and key takeaways from this article: "\${tabInfo.title}"\`, tabInfo);
});

translateSinhalaBtn.addEventListener("click", async () => {
  const tabInfo = await getActiveTabInfo();
  const textToTranslate = (tabInfo && tabInfo.selectedText) ? tabInfo.selectedText : (tabInfo ? tabInfo.pageText.substring(0, 3000) : "");
  if (!textToTranslate) {
    appendMessage("assistant", "⚠️ No text found to translate. Please open a webpage or highlight text.");
    return;
  }
  setTabContext(tabInfo);
  handleSend(\`කරුණාකර පහත පෙළ සිංහල භාෂාවට පරිවර්තනය කර පැහැදිලි කරන්න:\\n\\n\${textToTranslate}\`, tabInfo);
});

// Settings & Ping
settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

saveSettingsBtn.addEventListener("click", () => {
  const url = serverUrlInput.value.trim();
  chrome.storage.local.set({ sofiServerUrl: url }, () => {
    pingResult.textContent = "✓ Settings saved.";
    pingResult.style.color = "#10B981";
    checkServerConnection();
    setTimeout(() => { settingsPanel.classList.add("hidden"); }, 1200);
  });
});

testConnectionBtn.addEventListener("click", async () => {
  pingResult.textContent = "Testing connection...";
  pingResult.style.color = "#FF8A50";
  try {
    const start = Date.now();
    const res = await fetch(\`\${getServerUrl()}/api/health\`);
    const elapsed = Date.now() - start;
    if (res.ok) {
      pingResult.textContent = \`✓ Online (\${elapsed}ms) - Ready for multi-model inference\`;
      pingResult.style.color = "#10B981";
    } else {
      pingResult.textContent = \`HTTP \${res.status}: Server returned error\`;
      pingResult.style.color = "#F59E0B";
    }
  } catch (e) {
    pingResult.textContent = "✗ Connection failed: " + e.message;
    pingResult.style.color = "#EF4444";
  }
});

clearChatBtn.addEventListener("click", () => {
  if (confirm("Clear sidebar chat history?")) {
    chatMessages.innerHTML = "";
    appendMessage("assistant", "Chat history cleared. How can I assist you with your browsing?");
  }
});

// Speech Recognition
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add("recording");
    messageInput.placeholder = "Listening to your voice...";
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    messageInput.value = text;
    micBtn.classList.remove("recording");
    isRecording = false;
    messageInput.placeholder = "Ask Sofi about this page or any topic...";
  };

  recognition.onerror = () => {
    micBtn.classList.remove("recording");
    isRecording = false;
    messageInput.placeholder = "Ask Sofi about this page or any topic...";
  };

  recognition.onend = () => {
    micBtn.classList.remove("recording");
    isRecording = false;
    messageInput.placeholder = "Ask Sofi about this page or any topic...";
  };

  micBtn.addEventListener("click", () => {
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
} else {
  micBtn.style.display = "none";
}

// Form Submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSend();
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Auto grow textarea
messageInput.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 100) + "px";
});

// Model select save
modelSelect.addEventListener("change", () => {
  chrome.storage.local.set({ sofiSelectedModel: modelSelect.value });
});

// Listen for Context Menu trigger messages from background.js
chrome.runtime.onMessage.addListener((req) => {
  if (req.type === "SOFI_CONTEXT_ACTION") {
    const tabInfo = {
      title: req.pageTitle || "",
      url: req.pageUrl || "",
      selectedText: req.selectionText || "",
      pageText: req.selectionText || ""
    };
    setTabContext(tabInfo);

    if (req.menuItemId === "sofi-explain-selection" && req.selectionText) {
      handleSend(\`Explain this highlighted passage clearly:\\n"\\n\${req.selectionText}\\n"\`, tabInfo);
    } else if (req.menuItemId === "sofi-summarize-page") {
      handleSend(\`Summarize this webpage: "\${req.pageTitle || req.pageUrl}"\`, tabInfo);
    } else if (req.menuItemId === "sofi-translate-sinhala" && req.selectionText) {
      handleSend(\`කරුණාකර මෙම පාඨය සිංහල භාෂාවට පරිවර්තනය කරන්න:\\n"\\n\${req.selectionText}\\n"\`, tabInfo);
    }
  }
});

// Run Init
initSettings();
`;
  fs.writeFileSync(path.join(EXTENSION_DIR, "sidepanel.js"), sidepanelJs, "utf-8");

  // 7. README.md
  const readmeMd = `# Sofi AI - Chrome & Chromium Browser Side Panel Extension (Manifest V3)

## Features
- **Browser Side Panel Companion**: Dock Sofi next to any website while browsing.
- **1-Click Webpage Summarization**: Automatically reads active tab content and generates key takeaways.
- **Context Menu Integration**: Right-click any selected text to "Ask Sofi: Explain" or "Translate to Sinhala".
- **AgentRouter Frontier Models**: Direct access to Claude Opus 4.8, Claude Opus 5, DeepSeek v4 Flash, GLM 5.3, and GPT-5.6 Sol.
- **Voice Mode**: Speech recognition and voice synthesis in English and Sinhala.
- **Keyboard Shortcut**: Press Ctrl+Shift+S (or Cmd+Shift+S on macOS) to instantly toggle the side panel.

## How to Install in Google Chrome, Brave, or Microsoft Edge:
1. Extract this ZIP archive into a local folder.
2. In your browser address bar, open: chrome://extensions (or edge://extensions / brave://extensions).
3. Toggle on "Developer mode" in the top right corner.
4. Click the "Load unpacked" button in the top left.
5. Select the extracted sofi-browser-extension folder.
6. Click the Extensions (puzzle piece) icon in your toolbar and Pin "Sofi AI".
7. Click the Sofi icon or press Ctrl+Shift+S to open the side panel!
`;
  fs.writeFileSync(path.join(EXTENSION_DIR, "README.md"), readmeMd, "utf-8");

  // 8. Bundle into ZIP file
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(EXTENSION_ZIP_PATH);
    const archive = typeof archiver === "function"
      ? archiver("zip", { zlib: { level: 9 } })
      : new archiver.ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`[Extension Builder] Generated sofi-browser-extension.zip: ${archive.pointer()} total bytes`);
      resolve(EXTENSION_ZIP_PATH);
    });

    archive.on("error", (err: any) => {
      console.error("[Extension Builder] Archive error:", err);
      reject(err);
    });

    archive.pipe(output);

    // Add all files from EXTENSION_DIR
    archive.directory(EXTENSION_DIR, false);
    archive.finalize();
  });
}
