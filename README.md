# ⚡ Leafer UI · Next-Generation AI Infinite Canvas & Graphic Agent Platform

[English](./README-EN.md) | 简体中文

> **面向未来的工业级 AI 创意无限画布与智能 Agent 引擎**  
> 基于 **LeaferJS** 超高性能 Canvas 2D 渲染引擎构建，深度融合 **AI 物理尺寸选区生成**、**局部重绘 (Inpaint)**、**上下文悬浮编辑工具栏 (Edit Toolbar)** 与 **Canvas AI Agent (智能画布副驾驶)** 体系。

<p align="center">
  <img src="https://img.shields.io/badge/Engine-LeaferJS%202.2.11-6366f1?style=flat-square" alt="Engine" />
  <img src="https://img.shields.io/badge/Framework-AI%20Canvas%20%2B%20Agent-8b5cf6?style=flat-square" alt="AI Agent" />
  <img src="https://img.shields.io/badge/Plugin-leafer--x--edit--toolbar-ec4899?style=flat-square" alt="Edit Toolbar" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-10b981?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Node-v16+-f59e0b?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/License-MIT-3b82f6?style=flat-square" alt="License" />
</p>

---

## 🌟 核心亮点与创新架构

| 特性维度 | 传统 Web 画布 / AI 绘图前端 | Leafer AI Infinite Canvas & Agent |
| :--- | :--- | :--- |
| **底层性能** | DOM / Fabric.js / Konva，图元过多时卡顿严重 | **LeaferJS 工业级渲染核心**：百万级图形保持 60FPS 丝滑缩放平移 |
| **AI 生成框定位** | 虚线框与出图分辨率脱节，缩放时像素偏移漂移 | **世界坐标真实物理分辨率绑定**：1024×1024、1280×720 物理像素锚定，带 8 点交互拉伸手柄与原位填充 |
| **浮动快捷编辑** | 无上下文工具栏，需在复杂侧边栏反复查找 | **集成 `@leafer-in/edit-toolbar` 悬浮工具栏**：选中图形/图片实时跟随浮现，一键局部重绘、垫图参考、生成变体、图层层级调整 |
| **Canvas Agent 架构** | 仅支持简单对话，无法感知与操控复杂图形节点 | **原生 Canvas AI Agent 体系**：内置 `SceneSerializer` 全景场景感知与 Function Calling 工具集，实现自然语言指挥画板 |
| **模型生态接入** | 模型往往写死在前端代码中，无法灵活扩展 | **全动态感知**：支持 `/v1/models` 自动发现最新模型，并支持任意自定义模型名手动输入 |
| **部署与运行** | 依赖复杂环境，常遇跨域 (CORS) 阻拦 | **内置零配置流式代理中继** + **Linux/macOS/Windows 一键静默全自动部署脚本** |

---

## 📂 项目包架构设计 (`packages/`)

```
leafer-ui-main/
├── package.json                 # 统一工程清单，包含 dev/start/build 脚本
├── src/
│   └── index.ts                 # 统一对外导出核心渲染库、AI套件、Agent套件与工具栏
├── packages/
│   ├── ai/                      # @leafer-ui/ai 原生 AI 画布元件包
│   │   ├── AIGenerationFrame.ts # 原生注册的 AI 选区框元件 (世界物理尺寸绑定、8点交互手柄、状态指示)
│   │   ├── InpaintBrush.ts      # 局部重绘涂抹遮罩层与纯净 Alpha 蒙版提取
│   │   └── AIClient.ts          # 多通道模型适配与动态模型发现服务
│   ├── agent/                   # @leafer-ui/agent 原生 Canvas AI Agent 架构体系
│   │   ├── CanvasAgent.ts       # 画布副驾驶推理与操作调度中心
│   │   ├── SceneSerializer.ts   # 画布全景图层、坐标、文本、图片结构化转 LLM 上下文
│   │   ├── AgentTools.ts        # Function Calling 工具集规范 (建框/画图/自动排版/连线)
│   │   └── AgentExecutor.ts     # 画布指令安全执行器
│   └── edit-toolbar/            # @leafer-in/edit-toolbar 上下文浮动编辑工具栏
│       ├── EditToolbarPlugin.ts # 基于 JiyuShao/leafer-x-edit-toolbar 深度定制
│       └── AIEditToolbar.ts     # AI 专属快捷操作扩展 (重绘/变体/垫图/图层)
├── index.html                   # 根工作台应用界面
├── server.js                    # 静态托管与高速反向代理服务 (原生 ESM)
├── start.sh                     # Linux / macOS 一键自动化环境安装与启动
└── start.bat                    # Windows 一键自动化环境安装与启动
```

---

## 🚀 极速启动指南

### 方式一：一键脚本免配置全自动启动（推荐）

本套件内置了**全自动环境安装脚本**，未安装 Node.js 时会自动静默下载官方独立 LTS 运行环境并启动：

- **Windows 用户**：双击根目录下的 `start.bat`。
- **Linux / macOS 用户**：在终端运行：
  ```bash
  chmod +x start.sh && ./start.sh
  ```

脚本启动后将自动检测端口并启动浏览器打开 `http://localhost:3002`。

### 方式二：标准 NPM 启动

```bash
# 启动开发服务器与工作台
npm run dev

# 或
npm start
```

---

## 🛠️ 核心功能全景说明

### 1. 🔲 AI 真实物理尺寸生成选区 (AIGenerationFrame)
- 虚线框精确对应出图物理尺寸（如 1024×1024、1280×720），并随画布平移缩放无缝贴合。
- 支持 8 点拖拽手柄拉伸缩放，或在左侧面板选择 `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`21:9` 等比例。
- 图像生成完成后原地精准锚定，支持拖动选框至已有图像边缘实现无缝**外绘扩图 (Outpainting)**。

### 2. 🪄 上下文悬浮工具栏 (`leafer-x-edit-toolbar`)
- 选中画布中的任意元素，上方立即浮现深色玻璃拟态工具栏：
  - 🖌️ **局部重绘**：一键进入涂抹重绘模式；
  - 🔗 **设为参考**：将图片加入提示词参考图 Pills；
  - 🪄 **画面变体**：自动以当前图为底本布置生成框并生成多张变体；
  - ✨ **转为生成框**：以选中元素的物理尺寸就地创建 AI 选区框；
  - 🔝 **置顶 / 🔽 置底 / 🗑️ 删除 / 💾 导出**。

### 3. 🤖 Canvas AI Agent 画布副驾驶
- 点击右下角 **🤖 AI Agent** 呼出智能抽屉。
- 支持自然语言交互与自动操作画布：
  - *"帮我把这几个图形横向自动排列"*（调用 `auto_layout`）；
  - *"在画布中央放一个 16:9 的赛博朋克猫咪生成框"*（调用 `create_ai_frame`）；
  - *"帮我画一个深色卡片"*（调用 `create_shape`）。

### 4. 🌐 模型动态拉取与多通道支持
- 支持 RollDek 全生态模型（GPT-Image 全系列、Sunburst/Flare 高清模式、Gemini 3 系列）；
- 支持任何标准 OpenAI 兼容中转接口与 Midjourney Proxy；
- 支持在设置面板中点击 **🔄 自动拉取**，直接从 `/v1/models` 端点读取在线模型清单，无需硬编码。

---

## 📄 开源许可证

本项目遵循 [MIT License](./LICENSE)。
