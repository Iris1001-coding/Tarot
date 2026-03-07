# 命运星尘 · Tarot — CLAUDE.md

> 此文件会在每次 Claude Code session 启动时自动读取，用于保持项目上下文。

---

## 项目简介

**命运星尘（Fate Stardust）** 是一个神秘风格的塔罗占卜 Web App，具备手势识别功能和 AI 解读能力。

- AI Studio 链接：https://ai.studio/apps/0e20c1d3-5916-4d00-9bfc-7ae0250b5a9e

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS v4（@tailwindcss/vite 插件） |
| 3D 渲染 | Three.js r183 + @react-three/fiber + @react-three/drei |
| 手势识别 | @mediapipe/hands + @mediapipe/camera_utils |
| AI 解读 | @google/genai（Gemini）+ OpenAI 兼容接口（DeepSeek 等） |
| 动画 | motion（Framer Motion v12） |
| 图片导出 | html-to-image |
| 图标 | lucide-react |
| 字体 | Cinzel Decorative + Cinzel（Google Fonts） |

---

## 项目结构

```
/
├── public/
│   ├── assets/cards/card_0.png ~ card_77.png   # 78 张韦特塔罗牌图片
│   └── mediapipe-hands/                         # MediaPipe 本地模型文件
├── src/
│   ├── main.tsx                  # 入口
│   ├── App.tsx                   # 主应用逻辑与状态管理
│   ├── index.css                 # 全局样式（Tailwind + 自定义 utilities）
│   ├── components/
│   │   ├── CardDeck.tsx          # 抽牌动画与牌堆交互
│   │   ├── SpreadSelector.tsx    # 牌阵选择轮播（4 种牌阵）
│   │   ├── SpreadDisplay.tsx     # 已抽牌的展示布局
│   │   ├── MysticOrb.tsx         # 3D 神秘水晶球（Three.js）
│   │   ├── StarField3D.tsx       # 3D 星空背景（Three.js）
│   │   ├── StarDustCanvas.tsx    # 手势粒子特效（Canvas 2D）
│   │   ├── FateTree.tsx          # 命运树（历史占卜记录）
│   │   └── ExportCard.tsx        # 占卜结果导出图片卡片
│   └── services/
│       ├── tarotService.ts       # AI 解读服务（Gemini / OpenAI 兼容）
│       └── HandTracking.ts       # MediaPipe 手势追踪封装
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── CLAUDE.md                     # 本文件
└── .env.local                    # 存放 GEMINI_API_KEY（勿提交）
```

---

## 四种牌阵

| 名称 | 张数 | 位置 |
|------|------|------|
| 每日启示 | 1 张 | 每日指引 |
| 时间之流 | 3 张 | 过去 / 现在 / 未来 |
| 圣三角 | 3 张 | 问题 / 环境 / 解决方案 |
| 塞尔特大十字 | 10 张 | 现状 / 障碍 / 目标 / 根源 / 过去 / 未来 / 自我 / 环境 / 希望与恐惧 / 最终结果 |

---

## 手势控制逻辑

- **手掌向左倾斜**：牌堆向左旋转（sinRoll 检测，wrist→middleMCP 向量）
- **手掌向右倾斜**：牌堆向右旋转
- **手掌竖直（死区 ±7°）**：停止旋转
- **握拳（任意位置，保持 1 秒）**：选中当前前方牌
- **展开手掌（保持 1.5 秒）**：触发 AI 占卜解读

> 若实测倾斜方向相反，在 `HandTracking.ts` `updateTiltVelocity()` 中对 `sinRoll` 取反即可。

---

## API 配置

- 支持 **Gemini**（默认）和 **OpenAI 兼容接口**（DeepSeek 等）
- API Key 优先从 `localStorage` 读取（key: `tarot_api_key`）
- 备用从 `import.meta.env.VITE_GEMINI_API_KEY` 读取
- 可通过 UI 右上角钥匙图标输入，无需写死在代码里

---

## 数据持久化

- 历史占卜记录（`FateSession`）存储在 `localStorage`
- 支持导出为 **1080×1920px PNG** 图片（html-to-image）

---

## 开发规范

- 注释和交流使用**中文**
- 组件使用 functional component + hooks
- 图片路径格式：`${import.meta.env.BASE_URL}assets/cards/card_{index}.png`（index: 0–77）
  - **⚠️ 注意**：必须用 `import.meta.env.BASE_URL` 前缀，不能用 `/assets/...`（GitHub Pages 部署在 `/Tarot/` 子路径下）
- MediaPipe 模型文件：`${import.meta.env.BASE_URL}mediapipe-hands/${file}`
- 路径别名 `@/` 指向项目根目录
- 环境变量存放于 `.env.local`，不提交到 git

---

## 常用命令

```bash
npm run dev      # 启动开发服务器（port 3000）
npm run build    # 构建生产版本
npm run lint     # TypeScript 类型检查
```

---

## 当前进度与待办

> ⚠️ 每次对话快到 token 上限时，请让 Claude 更新这个区块。

### 已完成
- [x] 项目基础架构搭建
- [x] 78 张塔罗牌图片资源
- [x] 四种牌阵（每日启示 / 时间之流 / 圣三角 / 塞尔特大十字）
- [x] SpreadSelector 轮播选择界面
- [x] SpreadDisplay 牌阵布局展示
- [x] MysticOrb 3D 水晶球
- [x] StarField3D 3D 星空背景
- [x] StarDustCanvas 手势粒子特效
- [x] HandTracking 手势识别重构：区域滚动 → 手掌倾斜（sinRoll）控制，握拳任意位置触发
- [x] CardDeck 重构：线性滚动 → 扇形牌堆（11张弧形展开，直接 DOM 操控，RAF 驱动）
- [x] tarotService AI 解读（Gemini + OpenAI 兼容）
- [x] FateTree 历史记录（命运树可视化）
- [x] ExportCard 占卜结果导出为 PNG
- [x] 清理 git worktrees / 冗余分支，整理 `.gitignore`
- [x] 上传至 GitHub（`https://github.com/Iris1001-coding/Tarot.git`）
- [x] 配置 GitHub Pages 自动部署（`.github/workflows/deploy.yml`，`base: '/Tarot/'`）
- [x] 修复 GitHub Pages 资源路径：所有 `/assets/...` 改为 `${import.meta.env.BASE_URL}assets/...`

### 待办 / 进行中
- [ ] 真机测试手势倾斜方向：若左右相反，将 `HandTracking.ts` `updateTiltVelocity` 中 `sinRoll` 取反
- [ ] 手势灵敏度微调（`TILT_DEAD_ZONE`、`TILT_MAX_SIN`、`FIST_THRESHOLD`）
- [ ] 检查 GitHub Pages 是否已在仓库 Settings → Pages → Source 设置为 "GitHub Actions"
