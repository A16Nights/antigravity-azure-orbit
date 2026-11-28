<div align="center">

<p>🌐 &nbsp; <a href="README.md">简体中文</a> &nbsp;·&nbsp; <strong>English</strong></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/hero-en-dark.svg">
  <img src="assets/readme/hero-en-light.svg" alt="Azure Orbit — Native Custom Model Mount" width="100%">
</picture>

<p>
  <a href="https://github.com/A16Nights/antigravity-azure-orbit/releases"><img src="https://img.shields.io/github/v/release/A16Nights/antigravity-azure-orbit?style=flat-square&label=Release&color=0ea5e9&labelColor=1e293b" alt="Release"></a>
  <a href="https://github.com/A16Nights/antigravity-azure-orbit/stargazers"><img src="https://img.shields.io/github/stars/A16Nights/antigravity-azure-orbit?style=flat-square&label=Stars&color=f59e0b&labelColor=1e293b" alt="Stars"></a>
  <img src="https://img.shields.io/badge/Google_Antigravity-Native_Plugin-0ea5e9?style=flat-square&labelColor=1e293b" alt="Antigravity">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.0.0-10b981?style=flat-square&labelColor=1e293b" alt="Node.js">
  <img src="https://img.shields.io/badge/Dependencies-Zero-06b6d4?style=flat-square&labelColor=1e293b" alt="Zero Deps">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache-2.0-6366f1?style=flat-square&labelColor=1e293b" alt="License"></a>
</p>

<p>
  <strong>Azure Orbit — Native Custom Model Mount · Mount DeepSeek, OpenAI, Anthropic, Kimi, OpenRouter, or Ollama directly into Antigravity's native bottom-left model selector as your primary brain</strong>
</p>

<p>
  <a href="#preview">🖼️ Preview</a> &nbsp;·&nbsp; <a href="#features">✨ Features</a> &nbsp;·&nbsp; <a href="#architecture">🧩 Architecture</a> &nbsp;·&nbsp; <a href="#installation">🚀 Quick Start</a> &nbsp;·&nbsp; <a href="#mcp-tools">🧰 MCP Tools</a> &nbsp;·&nbsp; <a href="#storage">📂 Storage</a> &nbsp;·&nbsp; <a href="#azure-suite">🌌 Azure Suite</a>
</p>

</div>

Native primary-model injection and visual provider management for **Google Antigravity**. Pairs with **[External Orchestrator](https://github.com/A16Nights/antigravity-external-orchestrator)** as the *Azure Twins*: Azure Orbit mounts external models directly into the native selector, while External Orchestrator delegates heavy tasks to external workers.

<table>
<tr>
<td width="50%" valign="top">
<h4>🪐 Native Model Selector Mounting</h4>
One-click <strong>★ Mount / Unmount</strong> any external model into Antigravity's native bottom-left dropdown, with custom aliases and sample cleanup.
</td>
<td width="50%" valign="top">
<h4>🔥 Hot Reload, Zero Restarts</h4>
The local proxy hot-reads <code>~/.gemini/antigravity/custom_models.json</code> on every request—no app restart required (press <code>Ctrl+R</code> if the UI list needs a refresh).
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h4>⚡ One-Click Orchestrator Sync</h4>
Already configured External Orchestrator? Sync all enabled providers, keys, and model lists with a single click—zero duplicate setup.
</td>
<td width="50%" valign="top">
<h4>🛠️ Antigravity 2.32+ ~ 2.35+ Engine</h4>
Fully adapted to the new <code>...spread</code> (<code>baseLsArgs</code>) layout with a built-in search box inside the native dropdown and non-destructive coexisting patches.
</td>
</tr>
</table>

<h2 id="preview">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-preview-en-dark.svg">
  <img src="assets/readme/sec-preview-en-light.svg" alt="Interface Preview" width="100%">
</picture>
</h2>

<table>
<tr>
<td width="50%" align="center" valign="top">
  <a href="assets/readme/preview-models.png"><img src="assets/readme/preview-models.png" alt="Native Primary Models Management" width="100%"></a>
  <br><strong>Native Primary Models</strong>
  <br><sub>One-click sync from External Orchestrator, thinking tiers, Vision badges &amp; live search</sub>
</td>
<td width="50%" align="center" valign="top">
  <a href="assets/readme/preview-providers.png"><img src="assets/readme/preview-providers.png" alt="Multi-Provider &amp; One-Click Mounting" width="100%"></a>
  <br><strong>Multi-Provider Management</strong>
  <br><sub>7 quick-add provider presets with single-model or batch mounting to the native dropdown</sub>
</td>
</tr>
</table>

<h2 id="features">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-features-en-dark.svg">
  <img src="assets/readme/sec-features-en-light.svg" alt="Feature Overview" width="100%">
</picture>
</h2>

### 1. Seamless Native Model Selector Mounting
- **Mount Straight into the Native Selector**: Select any external provider model and click **★ Mount / Remove** to expose it directly in Antigravity's bottom-left model dropdown.
- **Hot-Read with Zero Restarts**: The underlying proxy reads `~/.gemini/antigravity/custom_models.json` live on every request; press `Ctrl+R` to refresh the frontend dropdown whenever needed.
- **Custom Aliases & Cleanup**: Assign clear display aliases for mounted models and clear default placeholder entries in one click.

### 2. Multi-Provider Management & Multi-Keyword Model Discovery
- **7 Built-in Provider Presets**: DeepSeek, Local Aggregator Gateway, OpenAI-Compatible, Kimi / Moonshot, OpenRouter, Anthropic-Compatible, and Local Ollama, with custom headers and timeout controls.
- **One-Click `/v1/models` Fetching**: Fetch all available remote models directly in the modal, filter with space-separated multi-keyword queries, and batch-add selected models.
- **Local Key Isolation & Masking**: API keys stay strictly on your machine and are automatically masked in both the UI and MCP responses.

### 3. One-Click Sync with External Orchestrator
- Users of **[External Orchestrator](https://github.com/A16Nights/antigravity-external-orchestrator)** can click **⚡ Sync & Mount from Orchestrator** (or **⇄ Import Providers Only**) to pull all enabled providers, keys, and models automatically.

### 4. Antigravity 2.32+ ~ 2.35+ Runtime Patch Engine (`runtime/`)
- **Modern Argument Layout**: Fully supports `dist/languageServer.js` `...spread` (`baseLsArgs`) injection in Antigravity 2.32+ / 2.33.0+ / 2.35+, plus a live search filter inside both Chinese and English native model dropdowns.
- **Non-Destructive Coexistence**: Uses incremental marker injection to coexist cleanly with other extensions; inspect patch status in the panel and generate one-click Desktop install/update or restore scripts.

### 5. Unified Azure Suite UI
- **Sidecar + Standalone Web UI**: Built on Antigravity's official Sidecar + MCP Server architecture; click `Web UI` in the header to manage providers fullscreen in your browser.
- **Neko Glass UI & Azure Theme Center**: Dark/light themes, custom glass dropdowns & modals, 6 official presets + custom dual color pickers + 4 cross-plugin custom slots, sidebar toggle, and GitHub Release update checks.


### First-Run Interactive Onboarding (`? Guide`)
- **3-Step Walkthrough & Live UI Spotlighting**: Opens automatically on first launch to walk through key features, with one-click spotlight buttons that pulse-highlight the real controls on screen plus a floating return bar.
- **Persisted Across Restarts**: Completion state is stored in `~/.gemini/azure-onboarding.json` (survives sidecar port changes), and can be reopened anytime from the topbar **`? Guide`** button.

<h2 id="architecture">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-arch-en-dark.svg">
  <img src="assets/readme/sec-arch-en-light.svg" alt="How It Works" width="100%">
</picture>
</h2>

```mermaid
flowchart LR
  A["Azure Orbit Sidecar / MCP"] -->|"Hot Write"| B["~/.gemini/antigravity/<br/>custom_models.json"]
  O["External Orchestrator"] -.->|"One-Click Sync"| A
  B -->|"Live Hot-Read"| C["Orbit Local Proxy<br/>runtime/ Patch Engine"]
  C -->|"Inject Models + Search Box"| D["Antigravity Native<br/>Bottom-Left Model Selector"]
  C -->|"Forward API Calls"| E["External LLM APIs<br/>DeepSeek / OpenAI / Anthropic / Ollama"]
```

<h2 id="installation">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-install-en-dark.svg">
  <img src="assets/readme/sec-install-en-light.svg" alt="Installation & Setup" width="100%">
</picture>
</h2>

> **Prerequisite**: **Node.js >= 22.0.0** (zero third-party npm dependencies, pure native ESM).

### Option 1 · Let Antigravity Install It for You (Recommended)

Copy and send the following prompt directly to Antigravity:

> Please clone `https://github.com/A16Nights/antigravity-azure-orbit.git` into my Antigravity global plugins directory as `azure-orbit`, verify the directory structure, and tell me once it is ready so I can press `Ctrl+R` to reload.

### Option 2 · Manual Git Clone

```powershell
# Windows (PowerShell)
git clone https://github.com/A16Nights/antigravity-azure-orbit.git "$env:USERPROFILE\.gemini\config\plugins\azure-orbit"

# macOS / Linux
git clone https://github.com/A16Nights/antigravity-azure-orbit.git ~/.gemini/config/plugins/azure-orbit
```

1. **Restart or reload Antigravity (`Ctrl+R`)**, then open **Azure Orbit** from the sidebar or right-hand panel.
2. **First-time runtime patch**: Open the **Orbit Engine (Runtime Patch)** tab, click **Generate Desktop Install/Update Patch Script**, close Antigravity, and double-click the generated script once.
3. **Mount models**: Add providers (or sync from External Orchestrator), mount desired models to **Native Primary Models**, press `Ctrl+R`, and pick them straight from the bottom-left dropdown.

<h2 id="mcp-tools">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-tools-en-dark.svg">
  <img src="assets/readme/sec-tools-en-light.svg" alt="MCP Tools Reference" width="100%">
</picture>
</h2>

| Tool | Description |
| --- | --- |
| `orbit_list_models` | List mounted native models, configured providers (masked), and runtime patch status |
| `orbit_mount_models` | Mount one or more models from a provider directly into Antigravity's native bottom-left dropdown |
| `orbit_unmount_model` | Remove a mounted model from the native dropdown or clear default sample entries |
| `orbit_sync_from_orchestrator` | Sync providers and models from External Orchestrator with optional immediate mounting |
| `orbit_patch_status` | Inspect Antigravity `app.asar` Orbit patch status and version compatibility |

<h2 id="storage">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-storage-en-dark.svg">
  <img src="assets/readme/sec-storage-en-light.svg" alt="Data & Configuration" width="100%">
</picture>
</h2>

<details open>
<summary><strong>Click to inspect local data paths & shared Azure Suite configs</strong></summary>

<br>

- **Native Mounted Models**: `~/.gemini/antigravity/custom_models.json`
- **Orbit Providers & Settings**: `~/.gemini/azure-orbit/config.json`
- **Shared Azure Suite Theme & Sidebar Config**: `~/.gemini/azure-theme.json`, `~/.gemini/azure-sidebar-nav.json`

</details>

<h2 id="azure-suite">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-suite-en-dark.svg">
  <img src="assets/readme/sec-suite-en-light.svg" alt="Azure Suite Ecosystem" width="100%">
</picture>
</h2>

All **11 Azure Suite plugins** share a unified **Neko Glass UI**, synchronized **Azure Theme Center** (`~/.gemini/azure-theme.json`), and customizable **Sidebar Navigation Hub** (`~/.gemini/azure-sidebar-nav.json`):

| Plugin | Repository | Core Capability |
| --- | --- | --- |
| ✦ **External Orchestrator — Multi-Model Worker Router** | [antigravity-external-orchestrator](https://github.com/A16Nights/antigravity-external-orchestrator) | Multi-provider external worker routing, custom profiles, circuit breaker, live monitor & onboarding guide |
| 🪐 **Azure Orbit — Native Custom Model Mount** &nbsp;`✦ This Repo` | [antigravity-azure-orbit](https://github.com/A16Nights/antigravity-azure-orbit) | Mount external LLM APIs directly into Antigravity's native bottom-left model selector |
| 🧭 **Azure Compass — Agent Presets & Context Monitor** | [antigravity-azure-compass](https://github.com/A16Nights/antigravity-azure-compass) | Agent mode presets, live context telemetry with auto /compact & Azure Suite sidebar hub |
| 🏛️ **Azure Corridor — Conversation & Workspace Manager** | [antigravity-azure-corridor](https://github.com/A16Nights/antigravity-azure-corridor) | Pure-native conversation & workspace sync, FTS5 search, custom quick tags, cross-workspace transfer & onboarding |
| 🌌 **Lanxi Memory — Cognitive Graph Memory** | [antigravity-lanxi-memory](https://github.com/A16Nights/antigravity-lanxi-memory) | 5-layer Markdown cognitive graph, CJK FTS5, tidal forgetting curves & starfield UI |
| 💎 **Soul.md Studio — Persona Cards & Memory** | [antigravity-soul-md](https://github.com/A16Nights/antigravity-soul-md) | Hot-swappable persona cards, workspace binding, external-model anchor & layered memory |
| 💭 **Think-ZH — Chinese Reasoning Switcher** | [antigravity-think-zh](https://github.com/A16Nights/antigravity-think-zh) | Simplified Chinese / English reasoning switcher with dual-channel anti-drift hooks |
| 🔮 **Azure Prism — Chain-of-Thought Translator** | [antigravity-azure-prism](https://github.com/A16Nights/antigravity-azure-prism) | Native MCP App Chain-of-Thought viewer with keyless zero-token MT & LLM translation |
| 🪄 **Azure Wand — Windows Desktop & Web Automation** | [antigravity-azure-wand](https://github.com/A16Nights/antigravity-azure-wand) | Low-intrusion Windows desktop & web automation with 15-state independent AI cursor, pack gallery & importer |
| 🍃 **Azure Drop — Drag-Drop Files & Screenshot Helper** | [antigravity-azure-drop](https://github.com/A16Nights/antigravity-azure-drop) | Zero-`app.asar` drag/paste native mention pills, lossless PNG capture, image thumbnails/lightbox & breadcrumb context menu |
| 🔭 **Azure Lens — Multi-Account Gemini Sidekick** &nbsp;`Beta` | [antigravity-azure-lens](https://github.com/A16Nights/antigravity-azure-lens) | 1:1 native dual-state Gemini sidebar, dual-tab isolation, multi-account auto-detect, in-app modals & MCP research/review |

---

<div align="center">

📄 Released under the <a href="./LICENSE"><strong>Apache-2.0 License</strong></a> · Crafted for <strong>Google Antigravity</strong>

</div>
