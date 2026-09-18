# ⚡ Leafer UI · Next-Generation AI Infinite Canvas & Graphic Agent Platform

English | [简体中文](./README.md)

> **Next-Generation Industrial AI Creative Infinite Canvas and Intelligent Agent Engine**  
> Built upon the ultra-high performance **LeaferJS** Canvas 2D engine, seamlessly integrating **Physical Dimension AI Generation Frames**, **Inpaint Brushes**, **Contextual Floating Edit Toolbars**, and the **Canvas AI Agent** co-pilot architecture.

<p align="center">
  <img src="https://img.shields.io/badge/Engine-LeaferJS%202.2.11-6366f1?style=flat-square" alt="Engine" />
  <img src="https://img.shields.io/badge/Framework-AI%20Canvas%20%2B%20Agent-8b5cf6?style=flat-square" alt="AI Agent" />
  <img src="https://img.shields.io/badge/Plugin-leafer--x--edit--toolbar-ec4899?style=flat-square" alt="Edit Toolbar" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-10b981?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Node-v16+-f59e0b?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/License-MIT-3b82f6?style=flat-square" alt="License" />
</p>

---

## 🌟 Key Highlights & Architectural Innovations

| Feature Dimension | Traditional Web Canvas / AI Frontends | Leafer AI Infinite Canvas & Agent |
| :--- | :--- | :--- |
| **Rendering Engine** | DOM / Fabric.js / Konva; drops frames when node count exceeds hundreds | **LeaferJS Industrial Core**: Maintains silky 60FPS pan/zoom across millions of nodes with minimal memory footprint |
| **AI Frame Positioning** | Dashed frames disconnected from resolution; drifts during zoom | **World Coordinate Physical Resolution Binding**: Exact 1024×1024, 1280×720 pixel anchoring with 8-point interactive resize handles |
| **Floating Edit Toolbar** | No contextual toolbar; users must hunt through complex sidebars | **Integrated `@leafer-in/edit-toolbar`**: Floats dynamically above selected nodes for instant Inpaint, Image Reference, Variations, and Z-Index ordering |
| **Canvas Agent System** | Limited to basic chatbots; incapable of understanding scene graphs | **Native Canvas AI Agent Framework**: Built-in `SceneSerializer` and Function Calling toolsets for autonomous canvas manipulation |
| **Model Ecosystem** | Hardcoded model lists requiring manual frontend code updates | **Dynamic Discovery**: Auto-fetches live models from `/v1/models` and accepts custom model names |
| **Deployment & Setup** | Complicated environments often blocked by browser CORS issues | **Built-in Zero-Config Streaming Proxy** + **Silent Auto-Installer for Windows/Linux/macOS** |

---

## 📂 Architecture & Package Organization (`packages/`)

```
leafer-ui-main/
├── package.json                 # Root manifest with dev/start/build scripts & package exports
├── src/
│   └── index.ts                 # Unified exports: Core, AI package, Agent package, Edit Toolbar
├── packages/
│   ├── ai/                      # @leafer-ui/ai Native AI Canvas Package
│   │   ├── AIGenerationFrame.ts # Native registered AI selection frame (physical bounds, handles, status)
│   │   ├── InpaintBrush.ts      # Mask drawing layer & pure binary Alpha mask generation
│   │   └── AIClient.ts          # Multi-channel adapter with dynamic model discovery
│   ├── agent/                   # @leafer-ui/agent Native Canvas AI Agent Framework
│   │   ├── CanvasAgent.ts       # Co-pilot reasoning loop and tool execution
│   │   ├── SceneSerializer.ts   # Serializes canvas scene graph into structured LLM context
│   │   ├── AgentTools.ts        # Function Calling tool schema (frames, shapes, layout, connect)
│   │   └── AgentExecutor.ts     # Safe canvas action execution engine
│   └── edit-toolbar/            # @leafer-in/edit-toolbar Floating Contextual Toolbar
│       ├── EditToolbarPlugin.ts # Deep integration based on JiyuShao/leafer-x-edit-toolbar
│       └── AIEditToolbar.ts     # Tailored quick actions for AI operations
├── index.html                   # Root Studio application interface
├── server.js                    # Static hosting & high-speed streaming reverse proxy (ESM)
├── start.sh                     # Linux / macOS one-click automated installer & launcher
└── start.bat                    # Windows one-click automated installer & launcher
```

---

## 🚀 Quick Start Guide

### Method 1: Zero-Config One-Click Launcher (Recommended)

Includes automated silent Node.js LTS setup:
- **Windows**: Double-click `start.bat`.
- **Linux / macOS**: Run in terminal:
  ```bash
  chmod +x start.sh && ./start.sh
  ```
The browser will automatically open `http://localhost:3002`.

### Method 2: Standard NPM

```bash
npm run dev
# or
npm start
```

---

## 📄 License

MIT License © [LeaferJS](https://github.com/leaferjs/leafer-ui) & Leafer AI Team.
