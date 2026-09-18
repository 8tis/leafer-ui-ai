# ⚡ RollDek AI Canvas Studio

[English](./README_EN.md) | 简体中文

> **面向未来的高性能 AI 创意无限画布系统**  
> 基于 **LeaferJS** 超高性能 Canvas 2D 渲染引擎构建，深度接入 **RollDek** 全生态模型及任意第三方 AI 画图 API。支持自由移动选框生图、涂抹局部重绘 (Inpainting)、外绘扩图 (Outpainting)、多图融合参考 (Image-to-Image)、图层树管理与雷达小地图。

<p align="center">
  <img src="https://img.shields.io/badge/Engine-LeaferJS%202.2-6366f1?style=flat-square" alt="Engine" />
  <img src="https://img.shields.io/badge/API-RollDek%20%7C%20OpenAI%20%7C%20Midjourney-8b5cf6?style=flat-square" alt="API" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-10b981?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Node-v16+-f59e0b?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/License-MIT-3b82f6?style=flat-square" alt="License" />
</p>

---

## 🌟 核心亮点（相比市面其他 AI 画布）

| 特性维度 | 市面常见 AI 画布 / Web 绘图工具 | RollDek AI Canvas Studio |
| :--- | :--- | :--- |
| **底层渲染引擎** | 传统 DOM、Fabric.js 或 Konva，节点超千后缩放掉帧卡顿 | **基于 LeaferJS 工业级引擎**：百万级图形仍然保持 60FPS 丝滑响应，极低内存占用 |
| **生成选框定位** | 选框与画布坐标系脱节，缩放画布后图片生成位置错位漂移 | **世界坐标系绝对同步**：选框物理像素与模型分辨率 100% 严格一致，精准落位，支持 8 点交互拖拽手柄自由缩放 |
| **模型生态接入** | 模型往往写死在前端，三方中转平台无法灵活更换 | **API 动态感知**：支持从 `/v1/models` **一键自动拉取最新模型**，并支持任意自定义模型名手动输入 |
| **RollDek 官方深度支持** | 仅支持标准 OpenAI 格式文生图 | **完整支持 RollDek 全特性**：GPT-Image 2/2.5 全系列、Sunburst/Flare 旗舰全档画质与透明背景、Gemini 3 香蕉原生接口 |
| **跨域与运行环境** | 浏览器直接请求三方 API 经常触发 CORS 跨域错误，环境难配 | **零依赖高速反代中继**：内置 Node.js 代理服务，彻底解决 CORS；自带 Windows/Linux **全自动环境静默安装脚本** |
| **隐私安全与离线** | 数据上传云端服务器，密钥易泄露 | **纯本地安全隐私**：API Key 仅安全保存在本地 LocalStorage，历史生成记录保存在本地 IndexedDB |

---

## 🎨 功能全景

### 1. 🔲 AI 真实物理尺寸生成选框 (Generation Frame)
- **对标 Leonardo.ai 与 Photoshop 创意填充**：虚线选框所在的位置与物理尺寸（如 1024×1024、1280×720）就是实际出图范围。
- **8 点交互拉伸手柄**：四角与四边自带拖拽控制点，支持像专业设计工具一样在画布上自由调整生成选区与长宽比。
- **预设主流比例**：一键切换 `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`21:9` 以及超宽画幅 `8:1`、`1:8`。
- **原位生成与外绘扩图 (Outpainting)**：成图精准填充在选框内；将选框拖动至已有图片边缘，即可向外延伸画面。

### 2. 🖌️ 局部重绘涂抹 (Inpainting Mask)
- 选中画布中的任意图片，一键开启局部重绘工作台。
- 支持自由笔刷尺寸调节、橡皮擦与一键清空遮罩。
- 自动生成符合 RollDek `/v1/images/edits` 规格的高精度二值化 Mask PNG 蒙版，实现原位精修替换。

### 3. 🤖 多服务商与模型动态获取
- **RollDek 官方全系列**：
  - `gpt-image-2` / `gpt-image-2-high`（1K/2K/4K 分辨率、medium/high 质量档位）
  - `gpt-image-2.5` / `gpt-image-2.5-sunburst` / `gpt-image-2.5-flare`（支持透明背景、输出格式 png/webp/jpeg、输入保真度控制）
  - `gemini-3-pro-image-preview`（香蕉 Pro 画质档）与 `gemini-3.1-flash-image-preview`（香蕉 2 极速档）
- **通用 OpenAI 兼容平台**：支持官方 DALL-E 3 / DALL-E 2，或任意兼容中转（OneAPI、NewAPI、SiliconFlow、OpenRouter、Together 等）。
- **Midjourney Proxy**：对接 Go-Proxy-Midjourney 等标准代理服务。
- **动态拉取模型**：点击 `🔄 获取模型`，实时调用服务商 `/models` 接口更新模型菜单；支持手动输入未收录的自定义模型。
- **内置演示模式**：未输入 Key 时自动开启高质感离线演示出图，开箱即可体验全部画布功能。

### 4. 🛠️ LeaferJS 原生无限画布与图形系统
- **无限平移与平滑缩放**：滚轮平滑缩放（10% - 500%）、空格 + 鼠标拖拽漫游、一键重置 100% 与缩放到内容适配。
- **点阵动态网格**：自适应缩放与位移的 Dot-grid 背景，支持快捷键随时开启/隐藏。
- **工业级变换插件**：集成 `@leafer-in/editor`，图形选中即出 8 点控制框与旋转手柄，支持保持比例拉伸。
- **图形与排版**：矩形 (`R`)、圆形 (`O`)、文字 (`T`)、多选移动、层级调序（置顶/置底）、删除与复制。
- **本地图片直入**：支持直接从电脑桌面将图片拖放 (`Drag & Drop`) 进画布。

### 5. 📂 图层树管理、小地图与历史资产库
- **图层面板 (Layers Tree)**：直观查看画布图形层级，支持图层显隐切换、锁定、重命名与快速定位。
- **雷达小地图 (Minimap)**：右下角俯瞰视口雷达，点击小地图任意区域即可实现画布跨区域瞬时导航。
- **本地生成历史库 (IndexedDB)**：完整保留历史生成作品，支持随时一键放回画布、设为参考图或导出。
- **作品导出**：支持导出整个画布或选中的单独图层为高清 PNG / JPEG。

---

## 🚀 极速安装与启动

项目内置了针对 **Windows** 和 **Linux/macOS** 的全自动环境配置脚本，**无需预先配置环境**，双击或一条命令即可启动。

### 🐧 Linux / macOS 用户

打开终端进入项目根目录，运行：

```bash
./start.sh
```

*(或者进入 `ai-canvas` 目录运行 `cd ai-canvas && ./start.sh`)*

- **环境自检与自动安装**：检测系统 Node.js 环境；若未安装，脚本会自动静默下载官方独立免配置绿色版 Node.js LTS（**无需 root/sudo 权限**），或通过包管理器安装。
- **自动开页**：自动执行依赖检查，拉起服务并在 1 秒后自动唤起系统浏览器打开 `http://localhost:3002`。

---

### 🪟 Windows 用户

在文件夹中直接**双击运行**：

```cmd
start.bat
```

*(根目录下的 `start.bat` 或 `ai-canvas/start.bat` 均可)*

- **全自动静默安装三重保障**：
  1. 优先通过 Windows 官方包管理器 `winget` 静默安装。
  2. 若无 winget，自动从国内高速镜像源（阿里云 CDN）下载官方安装包并执行静默安装。
  3. 若无系统管理员 UAC 权限，自动降级为免安装绿色版模式，解压至本地目录直接启动。
- **自动开页**：启动本地服务器，自动弹出浏览器打开 `http://localhost:3002`。

---

### 💻 纯手工运行方式（任选）

如果你习惯使用标准 Node.js 命令：

```bash
cd ai-canvas
npm start
# 浏览器访问: http://localhost:3002
```

---

## 🗺️ 后续功能规划 (Roadmap)

我们将持续迭代与扩展 AI 画布的能力，后续规划包括：

- [ ] **AI 节点流编排 (Node-based AI Workflow)**：参考 ComfyUI，支持在画布上使用连线连接“提示词节点 ➔ 风格微调节点 ➔ 生成选框 ➔ 局部精修”。
- [ ] **实时涂鸦即时成图 (Real-time Latent Painting)**：手绘涂鸦笔刷结合 LCM / SD-Turbo，画笔落下的同时在旁边选框毫秒级实时呈现画面。
- [ ] **智能抠图与主体提取 (AI Background Removal)**：一键分离前景人物或物体，自动转化为透明 PNG 图层便于拼贴排版。
- [ ] **超分辨率高清放大 (AI Upscale 4K/8K)**：对画布中的任意生成结果进行 2x / 4x 细节超分与光影重构。
- [ ] **多人实时协同画布 (Real-time Collaboration)**：基于 WebRTC / WebSocket，支持跨设备、多人同时在线共同排版与共同激发 AI 创意。
- [ ] **本地 ComfyUI / WebUI 直连插件**：支持配置本地 ComfyUI 服务地址，一键调用本地算力生图。

---

## 🏷️ 常用快捷键

| 快捷键 | 功能 |
| :--- | :--- |
| `V` | 切换为 **选择与变换工具** |
| `H` / `空格键 + 拖拽` | 切换为 **抓手工具 (漫游平移画布)** |
| `F` | 切换 / 显示 **AI 生成选框** |
| `B` | 针对选中的图片开启 **局部重绘涂抹** |
| `R` / `O` / `T` | 快捷绘制 **矩形 / 圆形 / 文本** |
| `Cmd/Ctrl + D` | 复制选中的图层 |
| `Backspace` / `Delete` | 删除选中的图层 |
| `Cmd/Ctrl + Enter` | 在提示词输入框中快速触发 **选框生成** |
| `鼠标滚轮` | 画布平滑缩放 |

---

## 📄 开源协议

本项目采用 [MIT 许可证](LICENSE) 开源。

## 🙏 致谢

- [LeaferJS](https://www.leaferjs.com/)：好用、极致性能、专为 AI 时代打造的 Canvas 2D 渲染引擎。
- [RollDek](https://rolldek.com/)：稳定可靠的高性能 AI 画图 API 服务。
