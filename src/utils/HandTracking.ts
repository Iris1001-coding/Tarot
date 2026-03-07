import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export type HandCoordinates = { x: number; y: number };

// --- 调试开关（上线后可改为 false）---
const DEBUG = true;
let _dbgFrameCount = 0;  // 全局帧计数，用于降频打印

// --- 阈值 ---
const FIST_THRESHOLD = 0.28;    // 2D 指尖-手腕归一化距离（原0.23，放宽至0.28）
const PALM_THRESHOLD = 0.40;
const FIST_HOLD_TIME  = 800;    // ms（原1000ms，缩短响应时间）
const PALM_HOLD_TIME  = 1500;   // ms

// --- 物理参数 ---
const MAX_SCROLL_SPEED = 0.18;  // 最大速度
const FRICTION         = 0.88;  // 每物理帧衰减
const LERP             = 0.35;  // 插值权重

// --- 平滑参数 ---
const SMOOTH_ALPHA = 0.6;       // EMA 权重（手掌位置显示）

// --- 手掌倾斜检测参数 ---
// 用 sin(rollAngle) = tiltX / |tiltVec| 代替 atan2，避免 tiltY→0 时的角度跳变
const TILT_DEAD_ZONE = 0.08;    // sin 单位，≈5°（原0.12，更灵敏）
const TILT_MAX_SIN   = 0.50;    // sin 单位，≈30°，此处达到最大速度
const TILT_SMOOTH    = 0.50;    // 向量 EMA 平滑权重

// --- 手势迟滞：连续帧数才开始计时 ---
const FIST_FRAMES_REQUIRED = 2;
const PALM_FRAMES_REQUIRED = 2;

export class HandTracker {
  private hands: Hands | null = null;
  private camera: Camera | null = null;

  // 回调
  private onCoordinatesUpdate: (coords: HandCoordinates) => void;
  private onSwipe: (direction: 'left' | 'right' | 'down') => void;
  private onFist: (isFist: boolean) => void;
  private onScrollVelocity?: (velocity: number) => void;
  private onFistProgress?: (progress: number) => void;
  private onPalmProgress?: (progress: number) => void;

  // 物理
  private velocity = 0;
  private animFrameId: number | null = null;

  // EMA 平滑后的坐标（用于显示光标）
  private smoothedX = 0.5;
  private smoothedY = 0.5;

  // 手掌倾斜向量（EMA）
  // smoothedTiltY 初始为 0.3：前置摄像头下手腕 y > 中指根节 y，rawVy 约 0.2~0.4
  private smoothedTiltX = 0;
  private smoothedTiltY = 0.3;

  // 握拳迟滞 + 状态
  private fistFrameCount = 0;
  private isFistHeld = false;
  private fistHoldStart = 0;
  private fistTriggered = false;

  // 张掌迟滞 + 状态
  private palmFrameCount = 0;
  private isPalmHeld = false;
  private palmHoldStart = 0;
  private palmTriggered = false;

  // 滑动检测
  private lastCoordsForSwipe: HandCoordinates | null = null;
  private lastSwipeTime = 0;
  private lastSwipeDirection: 'left' | 'right' | 'down' | null = null;
  private readonly swipeThreshold = 0.06;   // was 0.08，更灵敏
  private readonly swipeCooldown   = 300;   // was 400ms

  constructor(
    onCoordinatesUpdate: (coords: HandCoordinates) => void,
    onSwipe: (direction: 'left' | 'right' | 'down') => void,
    onFist: (isFist: boolean) => void,
    onScrollVelocity?: (velocity: number) => void,
    onFistProgress?: (progress: number) => void,
    onPalmProgress?: (progress: number) => void,
  ) {
    this.onCoordinatesUpdate = onCoordinatesUpdate;
    this.onSwipe = onSwipe;
    this.onFist = onFist;
    this.onScrollVelocity = onScrollVelocity;
    this.onFistProgress = onFistProgress;
    this.onPalmProgress = onPalmProgress;
  }

  public async start(videoElement: HTMLVideoElement) {
    try {
      this.hands = new Hands({
        locateFile: (file) => `${import.meta.env.BASE_URL}mediapipe-hands/${file}`,
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,            // was 1 — lite 模型快 2x+，精度够用
        minDetectionConfidence: 0.6,   // was 0.65
        minTrackingConfidence: 0.5,    // was 0.65 — 更低阈值更不容易丢手
      });

      this.hands.onResults(this.onResults.bind(this));

      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.hands) await this.hands.send({ image: videoElement });
        },
        width:  320,   // was 640 — 数据量降为 1/4，处理速度大幅提升
        height: 240,   // was 480
      });

      await this.camera.start();
      if (DEBUG) console.log('[HandTracker] Camera started OK ✅');
      this.startPhysicsLoop();
      return true;
    } catch (error) {
      console.error('[HandTracker] ❌ Failed to start camera/MediaPipe:', error);
      return false;
    }
  }

  public stop() {
    this.camera?.stop();
    this.hands?.close();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // ─── 物理循环（每 RAF 帧执行，独立于 MediaPipe 帧率）────────────────────

  private startPhysicsLoop() {
    const loop = () => {
      this.velocity *= FRICTION;
      if (Math.abs(this.velocity) < 0.0001) this.velocity = 0;
      this.onScrollVelocity?.(this.velocity);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  // ─── MediaPipe 结果处理 ───────────────────────────────────────────────────

  private onResults(results: Results) {
    _dbgFrameCount++;

    if (!results.multiHandLandmarks?.length) {
      // 降频打印：每60帧打印一次"未检测到手"
      if (DEBUG && _dbgFrameCount % 60 === 0) {
        console.log('[HandTracker] onResults: hands=0（未检测到手）');
      }
      // 手丢失 — 重置连续帧计数和手势
      this.fistFrameCount = 0;
      this.palmFrameCount = 0;
      this.resetFist();
      this.resetPalm();
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const palm = landmarks[9];

    // 首次检测到手时打印一次
    if (DEBUG && _dbgFrameCount <= 2) {
      console.log('[HandTracker] onResults: hands=1 ✅ 首次检测到手！');
    }

    // EMA 平滑：消除 MediaPipe 输出的帧间抖动
    this.smoothedX = SMOOTH_ALPHA * (1 - palm.x) + (1 - SMOOTH_ALPHA) * this.smoothedX;
    this.smoothedY = SMOOTH_ALPHA * palm.y       + (1 - SMOOTH_ALPHA) * this.smoothedY;
    const coords: HandCoordinates = { x: this.smoothedX, y: this.smoothedY };

    this.onCoordinatesUpdate(coords);

    this.updateTiltVelocity(landmarks);

    const avgDist = this.avgFingertipToWristDist(landmarks);
    this.detectFist(avgDist);
    this.detectPalm(avgDist);

    this.detectSwipe(coords);
    this.lastCoordsForSwipe = coords;
  }

  // ─── 手掌倾斜速度 ────────────────────────────────────────────────────────
  // 使用 sinRoll = tiltX / |tiltVec| 代替 atan2
  // 前置摄像头（未镜像）：右倾 → tiltX < 0 → sinRoll < 0 → targetV < 0 → 牌向右移
  // 若实测方向相反，将 sinRoll 取反即可

  private updateTiltVelocity(landmarks: any[]) {
    const wrist = landmarks[0];
    const m     = landmarks[9];
    const rawVx = m.x - wrist.x;       // 右倾时为负（unmirrorred）
    const rawVy = wrist.y - m.y;       // 手指朝上时为正

    this.smoothedTiltX = TILT_SMOOTH * rawVx + (1 - TILT_SMOOTH) * this.smoothedTiltX;
    this.smoothedTiltY = TILT_SMOOTH * rawVy + (1 - TILT_SMOOTH) * this.smoothedTiltY;

    const mag = Math.sqrt(this.smoothedTiltX ** 2 + this.smoothedTiltY ** 2);
    if (mag < 0.05) return;  // 手太近或遮挡，跳过

    // sinRoll ∈ [-1, 1]：负 = 右倾，正 = 左倾（前置摄像头）
    const sinRoll = this.smoothedTiltX / mag;
    let targetV = 0;
    if (Math.abs(sinRoll) > TILT_DEAD_ZONE) {
      const intensity = (Math.abs(sinRoll) - TILT_DEAD_ZONE) / (TILT_MAX_SIN - TILT_DEAD_ZONE);
      targetV = Math.sign(sinRoll) * Math.min(1, intensity) * MAX_SCROLL_SPEED;
    }
    this.velocity = this.velocity * (1 - LERP) + targetV * LERP;

    // 降频调试：每60帧打印一次倾斜数值
    if (DEBUG && _dbgFrameCount % 60 === 0) {
      console.log(`[HandTracker] sinRoll=${sinRoll.toFixed(3)}  velocity=${this.velocity.toFixed(4)}  (dead=${TILT_DEAD_ZONE})`);
    }
  }

  // ─── 辅助：指尖-手腕距离 ─────────────────────────────────────────────────

  private avgFingertipToWristDist(landmarks: any[]): number {
    const wrist = landmarks[0];
    const tipIndices = [8, 12, 16, 20];
    let total = 0;
    for (const idx of tipIndices) {
      const t = landmarks[idx];
      const dx = t.x - wrist.x;
      const dy = t.y - wrist.y;
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return total / tipIndices.length;
  }

  // ─── 握拳检测（迟滞：连续 N 帧后才开始计时）───────────────────────────────

  private detectFist(avgDist: number) {
    // 降频打印 avgDist，帮助标定 FIST_THRESHOLD
    if (DEBUG && _dbgFrameCount % 60 === 0) {
      console.log(`[HandTracker] avgDist=${avgDist.toFixed(3)}  (fistThreshold=${FIST_THRESHOLD}，握拳需 < ${FIST_THRESHOLD})`);
    }
    const isFistFrame = avgDist < FIST_THRESHOLD;

    if (isFistFrame) {
      this.fistFrameCount = Math.min(this.fistFrameCount + 1, FIST_FRAMES_REQUIRED);
    } else {
      this.fistFrameCount = 0;
      this.resetFist();
      return;
    }

    // 连续帧数不够时不启动计时（防止单帧误触发）
    if (this.fistFrameCount < FIST_FRAMES_REQUIRED) return;

    if (!this.isFistHeld) {
      this.isFistHeld    = true;
      this.fistHoldStart = Date.now();
      this.fistTriggered = false;
    }

    const elapsed  = Date.now() - this.fistHoldStart;
    const progress = Math.min(elapsed / FIST_HOLD_TIME, 1.0);
    this.onFistProgress?.(progress);

    if (elapsed >= FIST_HOLD_TIME && !this.fistTriggered) {
      this.fistTriggered = true;
      if (DEBUG) console.log('[HandTracker] 🤜 握拳触发！选牌');
      this.onFist(true);
      setTimeout(() => this.onFist(false), 150);
    }
  }

  private resetFist() {
    if (this.isFistHeld) {
      this.onFistProgress?.(0);
    }
    this.isFistHeld    = false;
    this.fistHoldStart = 0;
    this.fistTriggered = false;
  }

  // ─── 张掌检测（迟滞：连续 N 帧后才开始计时）───────────────────────────────

  private detectPalm(avgDist: number) {
    const isPalmFrame = avgDist > PALM_THRESHOLD;

    if (isPalmFrame) {
      this.palmFrameCount = Math.min(this.palmFrameCount + 1, PALM_FRAMES_REQUIRED);
    } else {
      this.palmFrameCount = 0;
      this.resetPalm();
      return;
    }

    if (this.palmFrameCount < PALM_FRAMES_REQUIRED) return;

    if (!this.isPalmHeld) {
      this.isPalmHeld    = true;
      this.palmHoldStart = Date.now();
      this.palmTriggered = false;
    }

    const elapsed  = Date.now() - this.palmHoldStart;
    const progress = Math.min(elapsed / PALM_HOLD_TIME, 1.0);
    this.onPalmProgress?.(progress);

    if (elapsed >= PALM_HOLD_TIME && !this.palmTriggered) {
      this.palmTriggered = true;
    }
  }

  private resetPalm() {
    if (this.isPalmHeld) {
      this.onPalmProgress?.(0);
    }
    this.isPalmHeld    = false;
    this.palmHoldStart = 0;
    this.palmTriggered = false;
  }

  // ─── 离散滑动检测（SpreadSelector 导航）──────────────────────────────────

  private detectSwipe(currentCoords: HandCoordinates) {
    const now = Date.now();
    if (!this.lastCoordsForSwipe || now - this.lastSwipeTime < this.swipeCooldown) return;

    const dx = currentCoords.x - this.lastCoordsForSwipe.x;
    const dy = currentCoords.y - this.lastCoordsForSwipe.y;

    let direction: 'left' | 'right' | 'down' | null = null;
    if (Math.abs(dx) > this.swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else if (dy > this.swipeThreshold && Math.abs(dy) > Math.abs(dx)) {
      direction = 'down';
    }

    if (direction) {
      const isOpposite =
        (direction === 'left'  && this.lastSwipeDirection === 'right') ||
        (direction === 'right' && this.lastSwipeDirection === 'left');
      if (!isOpposite || now - this.lastSwipeTime >= 1000) {
        this.onSwipe(direction);
        this.lastSwipeTime      = now;
        this.lastSwipeDirection = direction;
      }
    }
  }
}
