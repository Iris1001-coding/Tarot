# 命运星尘 · Tarot —— 反推生成 Prompt

> 本文件记录了可以从零生成本项目的完整提示词，供复现、二次开发或参考。

---

## 一句话版本（最简）

```
请用 React + TypeScript + Vite 构建一个神秘风格的塔罗占卜 Web App，
支持摄像头手势识别（手掌倾斜滚动扇形牌堆、握拳抓牌），
集成 Gemini AI 解读牌意，包含 3D 星空背景和水晶球，
四种牌阵（每日启示/时间之流/圣三角/塞尔特大十字），
历史记录以"命运树"可视化，支持导出为 1080×1920 分享图片。
```

---

## 完整版 Prompt（可直接粘贴给 AI）

```
请帮我构建一个完整的神秘风格塔罗占卜 Web App，名为「命运星尘（Fate Stardust）」。

## 技术栈要求

- 框架：React 19 + TypeScript，使用 Vite 6 构建
- 样式：Tailwind CSS v4（使用 @tailwindcss/vite 插件）
- 3D：Three.js + @react-three/fiber + @react-three/drei
- 手势：@mediapipe/hands + @mediapipe/camera_utils
- AI：@google/genai（Gemini API）+ 支持 OpenAI 兼容接口（DeepSeek 等）
- 动画：Framer Motion（motion 包）
- 图片导出：html-to-image
- 图标：lucide-react
- 字体：Cinzel Decorative（装饰标题）+ Cinzel（UI 文字），通过 index.html <link> 加载 Google Fonts

## 视觉风格

- 整体为深邃神秘的宇宙风，背景用深紫色（#0a0015）到午夜蓝（#080020）的径向渐变
- 主色调：金色（#fbbf24 / amber-400）+ 紫色（#7c3aed）+ 玫瑰色（#f9a8d4）
- 所有文字有金色发光效果（text-shadow）
- 组件使用毛玻璃效果（backdrop-blur）和半透明背景
- 全程无白色背景，保持沉浸感

## 应用状态机

App 有以下状态，依次流转：
HOME → SPREAD_SELECTION → ASK_QUESTION → DECK → SPREAD_DISPLAY → INTERPRETATION → TREE

### HOME 页
- 3D 旋转水晶球（MysticOrb，用 Three.js 实现，球体+轨道环+粒子）
- 3D 粒子星空背景（StarField3D，5000 颗星，随时间缓慢旋转）
- 居中显示「命运星尘」标题（Cinzel Decorative 字体，金色渐变）
- 一行副标题（中文）和一个「开始占卜」按钮
- 右上角：摄像头状态图标、API Key 设置按钮（🔑）、历史记录按钮（🌳）

### SPREAD_SELECTION 页（牌阵选择）
- 四种牌阵的轮播选择器（SpreadSelector）
- 每种牌阵有名称、张数、位置说明
- 支持手势左右滑动切换（也可点击）
- 四种牌阵：
  1. 每日启示（1张）：今日指引
  2. 时间之流（3张）：过去 / 现在 / 未来
  3. 圣三角（3张）：问题 / 环境 / 解决方案
  4. 塞尔特大十字（10张）：现状/障碍/目标/根源/过去/未来/自我/环境/希望与恐惧/最终结果

### ASK_QUESTION 页
- 居中输入框，提示用户输入占卜问题
- 金色边框 + 神秘背景的文本区域
- 「开始抽牌」按钮

### DECK 页（核心页面：抽牌）
- 扇形牌堆（CardDeck 组件）：11 张牌弧形展开，从屏幕下方 62% 高度处为圆心，向上展开
  - 每张牌宽 150px 高 236px，相邻牌角度差 9°，弧形半径 520px
  - 牌以底部中心为旋转轴（transformOrigin: 50% 100%）
  - 边缘牌逐渐缩小（min 0.48）并变透明（min 0.22）
  - 中心牌有金色高亮边框
  - 所有位置通过 requestAnimationFrame 直接写入 DOM（不经过 React re-render），流畅60fps
  - 牌背设计：深紫色背景 + 金色几何花纹 + 星座符号（纯 SVG）
- 手势交互：
  - 手掌向左倾斜 → 牌堆向左滚动（物理惯性，FRICTION=0.88）
  - 手掌向右倾斜 → 牌堆向右滚动
  - 手掌竖直（±5°死区）→ 停止
  - 握拳保持 0.8 秒 → 选中当前中心牌（有蓄力进度环动画）
- 鼠标备用：拖拽滚动，点击中心牌选牌
- 选牌后：出现翻牌浮层动画（3D flip），翻转后显示牌面图片
  - 随机正/逆位，逆位牌显示旋转 180° 并略降亮度
  - 点击继续，牌加入已抽列表
- 78 张韦特塔罗牌图片存放在 public/assets/cards/card_0.png ~ card_77.png

### SPREAD_DISPLAY 页
- 展示所有已抽牌，按牌阵布局排列
  - 每日启示：居中单张
  - 时间之流：三张横排
  - 圣三角：三角形排列
  - 塞尔特大十字：传统十字+纵列布局
- 每张牌显示位置名称、正逆位标识
- 「获取解读」按钮

### INTERPRETATION 页
- 流式显示 AI 解读文字（Markdown 渲染）
- 左侧展示本次占卜的牌阵缩略
- 右上角：保存记录按钮、导出图片按钮
- 导出为 1080×1920 PNG（ExportCard 离屏渲染，html-to-image 截图）

### TREE 页（命运树）
- 历史占卜记录用树状结构可视化（FateTree）
- 每条记录显示为一个发光果实节点
- 点击节点展开详情弹窗，显示问题、牌阵、牌面、解读全文
- 详情中有导出图片按钮

## 手势识别（HandTracking.ts）

使用 @mediapipe/hands（WASM 通过 CDN 加载，版本 0.4.1675469240）：

```typescript
locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
```

手掌倾斜检测：
- 取 wrist（关键点0）→ 中指根节 MCP（关键点9）的向量
- sinRoll = smoothedTiltX / magnitude（EMA平滑，权重0.5）
- 死区 |sinRoll| < 0.08，超出则映射为[-0.18, 0.18]的速度
- 物理循环：velocity *= 0.88（摩擦），每RAF帧通过 onScrollVelocity 回调传出

握拳检测：
- 计算食指/中指/无名指/小指指尖（8/12/16/20）到手腕的 2D 归一化平均距离
- avgDist < 0.28 时为握拳帧，连续 2 帧后开始计时
- 保持 800ms 触发 onFist(true)

张掌检测：
- avgDist > 0.40 时为张掌帧，保持 1500ms 触发（预留 AI 解读触发）

摄像头分辨率：320×240（降低运算量）

## AI 解读服务（tarotService.ts）

- 默认使用 Gemini（@google/genai）
- 支持切换为 OpenAI 兼容接口（配置 baseURL + model）
- API Key 从 localStorage（key: tarot_api_key）读取，备用 import.meta.env.VITE_GEMINI_API_KEY
- GoogleGenAI 实例必须在函数内部创建（不能在模块顶层），否则浏览器报错
- Prompt 包含：占卜问题、牌阵名称、每张牌的名称/正逆位/位置含义
- 返回中文 Markdown 格式的解读，约 400-600 字

## 粒子特效（StarDustCanvas.tsx）

- Canvas 2D 全屏覆盖（z-index 最高，pointer-events: none）
- 追踪手部坐标，在手部位置释放金色粒子
- 粒子有随机速度、大小（1-3px）、生命周期、透明度衰减

## 数据持久化

- localStorage 存储历史占卜记录（key: fate_sessions）
- 每条记录（FateSession）：id、日期、问题、牌阵名、牌列表（含正逆位）、AI 解读文字

## 路径规范（重要）

- 图片路径：`${import.meta.env.BASE_URL}assets/cards/card_${i}.png`（GitHub Pages 部署在子路径）
- vite.config.ts 中设置 `base: '/Tarot/'`
- 不可用 /assets/... 的绝对路径

## GitHub Pages 部署

- .github/workflows/deploy.yml：push to main → npm ci → vite build → upload-pages-artifact → deploy-pages
- public/.nojekyll 文件（防止 Jekyll 覆盖 Actions 部署）

## 组件接口摘要

CardDeck props:
- onCardSelect(cardIndex, isReversed): void
- swipeDirection: 'left'|'right'|'down'|null
- drawnCardIndices: number[]
- isFist: boolean
- scrollVelocityRef?: RefObject<number>
- fistProgressRef?: RefObject<number>

HandTracker constructor:
- onCoordinatesUpdate(coords)
- onSwipe(direction)
- onFist(isFist)
- onScrollVelocity?(v)
- onFistProgress?(p)
- onPalmProgress?(p)
```

---

## 关键设计决策说明

| 决策 | 原因 |
|------|------|
| MediaPipe WASM 用 CDN 而非本地文件 | 本地文件与 npm 包版本不一致会导致 abort() 崩溃 |
| CardDeck 用 RAF 直接操控 DOM | 60fps 流畅动画，React 状态更新太慢（每4帧才更新牌面内容）|
| sinRoll 代替 atan2 | atan2 在 tiltY→0 时跳变，sinRoll 数值稳定 |
| smoothedTiltY 初始值 0.3 | 前置摄像头手腕在下，rawVy 为正，避免冷启动时方向跳变 |
| BASE_URL 前缀所有资源路径 | GitHub Pages 部署在 /Tarot/ 子路径，绝对路径会 404 |
| public/.nojekyll | 防止 GitHub 同时运行 Jekyll 构建覆盖 Actions 产物 |
| GoogleGenAI 在函数内创建 | 模块顶层创建时 apiKey 为 undefined，浏览器报错 |

---

## 扩展方向（供下一版参考）

- [ ] 语音播报 AI 解读（Web Speech API）
- [ ] 移动端适配（竖屏布局优化）
- [ ] 更多牌阵（马蹄形、恋人牌阵）
- [ ] 牌义数据库（悬停显示简要牌义）
- [ ] 多语言支持（英文/繁中）
- [ ] PWA 支持（离线使用）
- [ ] 自定义牌背图案
