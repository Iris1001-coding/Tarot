<div align="center">

# ✦ 命运星尘 · Fate Stardust Tarot ✦

**一个融合手势识别与 AI 解读的神秘塔罗占卜 Web App**

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-7c3aed?style=for-the-badge&logo=github)](https://iris1001-coding.github.io/Tarot/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r183-000000?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-ff6f00?style=for-the-badge)](https://mediapipe.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285f4?style=for-the-badge&logo=google)](https://ai.google.dev/)

</div>

---

## ✨ 项目简介

**命运星尘** 是一款沉浸式神秘风格塔罗占卜应用，你可以通过**真实手势**拨动扇形牌堆、握拳抓取塔罗牌，再由 **Gemini AI** 根据你的问题与牌阵给出深度解读。每一次占卜都会以星图形式保存在"命运树"中，可随时导出为精美图片。

### 核心特性

| 特性 | 描述 |
|------|------|
| 🖐️ **手势控制** | 摄像头识别手掌倾斜 + 握拳，无需触摸屏幕 |
| 🃏 **扇形牌堆** | 11 张牌弧形展开，物理惯性滚动，极具质感 |
| 🔮 **3D 水晶球** | Three.js 渲染的旋转水晶球与粒子星空 |
| 🤖 **AI 占卜解读** | Gemini / DeepSeek 等大模型深度解读牌意 |
| 🌳 **命运树** | 历史占卜记录以果实节点可视化，可逐条查阅 |
| 📤 **导出图片** | 一键导出 1080×1920px 占卜结果分享卡片 |

---

## 🎮 在线体验

**👉 [https://iris1001-coding.github.io/Tarot/](https://iris1001-coding.github.io/Tarot/)**

> 需要摄像头权限以使用手势控制，也可以直接用鼠标拖拽牌堆。

---

## 🖐️ 手势操作说明

进入牌堆界面后，将手放在摄像头前：

| 手势 | 动作效果 |
|------|---------|
| **手掌向左倾斜** | 牌堆向左滚动 |
| **手掌向右倾斜** | 牌堆向右滚动 |
| **手掌竖直** | 牌堆停止（约 ±5° 死区） |
| **握拳保持 0.8 秒** | 选中当前正中间的牌 |
| **张开手掌保持 1.5 秒** | 触发 AI 占卜解读 |

> 无摄像头时，可用**鼠标拖拽**牌堆；使用**点击**中心牌选牌。

---

## 🃏 四种牌阵

| 牌阵 | 张数 | 位置含义 |
|------|------|---------|
| **每日启示** | 1 张 | 今日指引 |
| **时间之流** | 3 张 | 过去 · 现在 · 未来 |
| **圣三角** | 3 张 | 问题 · 环境 · 解决方案 |
| **塞尔特大十字** | 10 张 | 现状 / 障碍 / 目标 / 根源 / 过去 / 未来 / 自我 / 环境 / 希望与恐惧 / 最终结果 |

---

## 🛠️ 技术栈

```
前端框架    React 19 + TypeScript
构建工具    Vite 6
样式        Tailwind CSS v4
3D 渲染     Three.js r183 + @react-three/fiber + @react-three/drei
手势识别    @mediapipe/hands（WASM，CDN 加载）+ @mediapipe/camera_utils
AI 解读     @google/genai（Gemini）+ OpenAI 兼容接口（DeepSeek 等）
动画        Framer Motion v12（motion）
图片导出    html-to-image
图标        lucide-react
字体        Cinzel Decorative + Cinzel（Google Fonts）
部署        GitHub Pages（GitHub Actions 自动部署）
```

---

## 🚀 本地运行

### 前置要求

- Node.js 18+
- 现代浏览器（Chrome / Edge 推荐，摄像头权限）

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/Iris1001-coding/Tarot.git
cd Tarot

# 安装依赖
npm install

# 配置 API Key（可选，不配置则无法使用 AI 解读）
cp .env.local.example .env.local
# 编辑 .env.local，填入 VITE_GEMINI_API_KEY=你的密钥

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### API Key 配置方式

无需重启，在网页右上角点击 🔑 图标即可输入 API Key：

- **Gemini**（默认）：前往 [Google AI Studio](https://aistudio.google.com/apikey) 获取
- **OpenAI 兼容**（DeepSeek 等）：填入对应 Base URL、API Key 和模型名称

---

## 📁 项目结构

```
/
├── public/
│   ├── assets/cards/          # 78 张韦特塔罗牌（card_0.png ~ card_77.png）
│   └── mediapipe-hands/       # MediaPipe 本地备用模型（实际使用 CDN）
├── src/
│   ├── App.tsx                # 主状态机（HOME→SPREAD_SELECTION→DECK→...）
│   ├── index.css              # 全局样式（Tailwind v4 + 自定义动画）
│   ├── components/
│   │   ├── CardDeck.tsx       # 扇形牌堆（RAF 驱动，直接 DOM 操控）
│   │   ├── SpreadSelector.tsx # 牌阵选择轮播
│   │   ├── SpreadDisplay.tsx  # 已抽牌展示布局
│   │   ├── MysticOrb.tsx      # 3D 水晶球（Three.js）
│   │   ├── StarField3D.tsx    # 3D 粒子星空背景
│   │   ├── StarDustCanvas.tsx # 手势跟随粒子特效（Canvas 2D）
│   │   ├── FateTree.tsx       # 命运树（历史占卜记录）
│   │   └── ExportCard.tsx     # 占卜结果导出卡片（1080×1920px）
│   ├── services/
│   │   └── tarotService.ts    # AI 解读（Gemini + OpenAI 兼容）
│   └── utils/
│       └── HandTracking.ts    # MediaPipe 手势识别封装
├── .github/workflows/
│   └── deploy.yml             # GitHub Pages 自动部署
├── vite.config.ts
└── CLAUDE.md                  # 开发上下文（Claude Code 专用）
```

---

## 🔧 常用命令

```bash
npm run dev      # 启动开发服务器（port 3000）
npm run build    # 构建生产版本（输出至 dist/）
npm run lint     # TypeScript 类型检查
```

---

## 🌐 部署

项目通过 **GitHub Actions** 自动部署到 GitHub Pages。每次推送到 `main` 分支，工作流将自动执行：

```
代码推送 → npm ci → vite build → 上传 dist/ → 部署到 Pages
```

访问地址：[https://iris1001-coding.github.io/Tarot/](https://iris1001-coding.github.io/Tarot/)

---

## ⚠️ 已知限制

- 手势识别需要**良好光线**和**较近距离**（建议手距摄像头 30–50cm）
- MediaPipe 首次加载需从 CDN 下载约 10MB 的 WASM 模型，请耐心等待
- AI 解读功能需自行配置 API Key
- 导出图片中的中文字体依赖系统字体，不同设备渲染效果可能略有差异

---

<div align="center">

**用星尘书写你的命运 ✦**

Made with ✨ React · Three.js · MediaPipe · Gemini AI

</div>
