# ⚡ RollDek AI Canvas Studio

English | [简体中文](./README.md)

> **Next-Gen Infinite AI Creative Canvas System**  
> Powered by the ultra-fast **LeaferJS** Canvas 2D engine. Seamlessly integrated with the **RollDek** model ecosystem and universal 3rd-party image generation APIs. Features interactive bounding-box generation, inpainting mask brush, outpainting expansion, multi-reference image-to-image synthesis, layer tree management, and radar minimap.

<p align="center">
  <img src="https://img.shields.io/badge/Engine-LeaferJS%202.2-6366f1?style=flat-square" alt="Engine" />
  <img src="https://img.shields.io/badge/API-RollDek%20%7C%20OpenAI%20%7C%20Midjourney-8b5cf6?style=flat-square" alt="API" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-10b981?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Node-v16+-f59e0b?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/License-MIT-3b82f6?style=flat-square" alt="License" />
</p>

---

## 🌟 Key Highlights & Comparison

| Feature Dimension | Traditional AI Canvases / Web Drawing Tools | RollDek AI Canvas Studio |
| :--- | :--- | :--- |
| **Rendering Core** | DOM / SVG / Fabric.js / Konva; drops frames & lags beyond 1,000 nodes | **Powered by LeaferJS Engine**: Silky smooth 60 FPS viewport rendering across 1,000,000+ elements with minimal memory footprint |
| **Generation Frame Alignment** | Frame disconnected from canvas coordinates; panning/zooming causes misaligned generations | **Strict World-Coordinate Sync**: Generation box's physical pixels exactly match output resolution; includes 8-point interactive handles |
| **Model Ecosystem** | Hardcoded models; cannot adapt dynamically to 3rd-party proxies | **Dynamic API Discovery**: One-click fetch from `/v1/models` API endpoint + custom model name manual input |
| **RollDek Native Support** | Basic OpenAI text-to-image only | **Full RollDek Feature Support**: GPT-Image 2/2.5 series, Sunburst & Flare flagship quality & transparent backgrounds, Gemini 3 Banana native API |
| **CORS & Environment** | Browser direct requests trigger CORS blocked errors; complex setup | **Zero-Dependency Streaming Proxy**: Built-in Node.js reverse proxy eliminates CORS; includes **100% unattended installation scripts** for Windows & Linux |
| **Privacy & Security** | User keys and creations transmitted to 3rd-party servers | **Client-Side First**: Keys stored in local LocalStorage only; full creation history persisted in browser IndexedDB |

---

## 🎨 Feature Overview

### 1. 🔲 Physical Dimension AI Generation Frame
- **Comparable to Leonardo.ai Canvas & Photoshop Generative Fill**: The dashed generation frame represents the exact physical target coordinates and resolution (e.g. 1024×1024, 1280×720).
- **8-Point Interactive Handles**: Corner and edge control points allow freely dragging and stretching target generation areas directly on canvas.
- **Preset Composing Ratios**: Instant one-click presets for `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `21:9`, plus ultra-wide `8:1` & `1:8`.
- **In-Place Placement & Outpainting**: Generated artwork fills the frame pixel-perfect; drag the frame overlapping an existing image edge to seamlessly expand the scene.

### 2. 🖌️ Inpainting Mask Brush
- Select any image layer on the canvas to open the Inpainting Studio.
- Adjustable brush size, eraser tool, and one-click mask clear.
- Automatically computes and exports high-precision binary Mask PNGs conforming to RollDek `/v1/images/edits` specifications for seamless in-place editing.

### 3. 🤖 Multi-Provider & Dynamic Model Fetching
- **RollDek Official Suite**:
  - `gpt-image-2` / `gpt-image-2-high` (1K/2K/4K resolutions, medium/high quality presets)
  - `gpt-image-2.5` / `gpt-image-2.5-sunburst` / `gpt-image-2.5-flare` (supports transparent backgrounds, output format selection PNG/WebP/JPEG, input fidelity)
  - `gemini-3-pro-image-preview` (Gemini Banana quality tier) & `gemini-3.1-flash-image-preview` (Gemini Banana speed tier)
- **OpenAI Compatible Providers**: Official DALL-E 3 / DALL-E 2, or any compatible proxy (OneAPI, NewAPI, SiliconFlow, OpenRouter, Together, etc.).
- **Midjourney Proxy**: Standard Go-Proxy-Midjourney protocol support.
- **Dynamic Model Retrieval**: Click `🔄 Fetch Models` to dynamically pull the available models list from `/models`. Supports manual typing of any custom model identifier.
- **Offline Demo Mode**: Built-in procedural generative engine for testing all canvas workflows without entering an API key.

### 4. 🛠️ LeaferJS Infinite Canvas & Graphics Engine
- **Infinite Pan & Smooth Zoom**: Mouse wheel zoom (10% to 500%), Space + drag panning, 1:1 reset and Zoom-to-Fit.
- **Dynamic Dot-Grid**: Responsive dot grid background that scales and moves with the viewport; toggleable via toolbar.
- **Industrial Transform Plugin**: Powered by `@leafer-in/editor`; elements immediately display 8-point bounding boxes, scale handles, and rotation levers with aspect ratio locking.
- **Shapes & Typography**: Rectangles (`R`), Ellipses (`O`), Text (`T`), multi-selection, z-index reordering (bring to front / send to back), duplicate, and delete.
- **Desktop Image Drop**: Drag and drop images directly from your desktop onto the canvas.

### 5. 📂 Layer Tree, Minimap & History Library
- **Layer Panel (Layers Tree)**: Visual tree of all canvas nodes; toggle visibility, lock editing, rename, and select.
- **Radar Minimap**: Bottom-right bird's-eye canvas radar; click anywhere on the minimap to instantly jump the camera.
- **IndexedDB History Gallery**: Persistent generation storage; click any past artwork to place it onto the canvas, use as reference, or download.
- **Export**: Export entire canvas or selected individual elements as high-resolution PNG or JPEG.

---

## 🚀 Quick Start & Installation

The repository includes fully automated startup scripts for **Windows** and **Linux / macOS**. No manual environment configuration is required.

### 🐧 Linux / macOS Users

Open your terminal in the project directory and run:

```bash
./start.sh
```

*(or inside the `ai-canvas` directory: `cd ai-canvas && ./start.sh`)*

- **Automated Environment Check**: Detects Node.js. If missing, automatically downloads and configures official standalone Node.js LTS (**no root/sudo privileges required**), or installs via package manager.
- **Automatic Browser Launch**: Checks dependencies, launches local server, and pops open your default browser to `http://localhost:3002`.

---

### 🪟 Windows Users

Simply **double-click** the batch script in File Explorer:

```cmd
start.bat
```

*(either root `start.bat` or `ai-canvas/start.bat`)*

- **Three-Tier Silent Installation**:
  1. Automatically installs via official Windows package manager (`winget`) if available.
  2. Otherwise, downloads official MSI installer from high-speed mirror and executes silent installation.
  3. If user lacks administrative permissions (no UAC prompt), automatically downloads portable standalone Node.js and runs locally.
- **Automatic Browser Launch**: Starts the server and automatically opens `http://localhost:3002`.

---

### 💻 Manual Command (Optional)

If you prefer standard npm commands:

```bash
cd ai-canvas
npm start
# Visit in browser: http://localhost:3002
```

---

## 🗺️ Product Roadmap

We are actively developing and expanding features:

- [ ] **Node-based AI Workflow**: ComfyUI-style node canvas connecting prompt nodes ➔ model parameters ➔ generation frames ➔ detail enhancers.
- [ ] **Real-time Latent Painting**: Live sketch canvas combined with LCM / SD-Turbo for instant millisecond image rendering as you draw.
- [ ] **AI Background Removal**: One-click foreground object segmentation, automatically converting subjects into transparent PNG layers.
- [ ] **AI Upscale 4K/8K**: 2x / 4x super-resolution detail enhancement and lighting reconstruction.
- [ ] **Real-time Collaboration**: Multi-user canvas based on WebRTC / WebSocket for real-time team brainstorms and design workflows.
- [ ] **Local ComfyUI / WebUI Integration**: Direct WebSocket connection to local ComfyUI/WebUI instances.

---

## 🏷️ Key Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `V` | Select & Transform tool |
| `H` / `Space + Drag` | Hand tool (Pan canvas viewport) |
| `F` | Toggle / Center **AI Generation Frame** |
| `B` | Inpainting Mask Brush on selected image |
| `R` / `O` / `T` | Quick Rectangle / Ellipse / Text creation |
| `Cmd/Ctrl + D` | Duplicate selected element |
| `Backspace` / `Delete` | Delete selected element |
| `Cmd/Ctrl + Enter` | Trigger **Frame Generation** from prompt input |
| `Mouse Wheel` | Smooth canvas zoom in / out |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [LeaferJS](https://www.leaferjs.com/): Next-generation HTML5 Canvas 2D engine built for high-performance AI applications.
- [RollDek](https://rolldek.com/): Reliable, high-performance generative AI image platform.
