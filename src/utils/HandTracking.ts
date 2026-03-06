import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export type HandCoordinates = { x: number; y: number };

export class HandTracker {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private onCoordinatesUpdate: (coords: HandCoordinates) => void;
  private onFist: (isFist: boolean) => void;
  private isFistState = false;
  private fistHoldStart = 0;
  private readonly FIST_HOLD_DURATION = 300; // ms to hold pinch before triggering

  private onSwipe: (direction: 'left' | 'right' | 'down') => void;
  private lastCoords: HandCoordinates | null = null;
  private lastSwipeTime = 0;
  private lastSwipeDirection: 'left' | 'right' | 'down' | null = null;

  // Velocity-window swipe: accumulate frames instead of relying on single-frame speed
  private positionHistory: HandCoordinates[] = [];
  private readonly SWIPE_WINDOW = 4;
  private readonly SWIPE_CUMULATIVE_THRESHOLD = 0.04;

  constructor(
    onCoordinatesUpdate: (coords: HandCoordinates) => void,
    onSwipe: (direction: 'left' | 'right' | 'down') => void,
    onFist: (isFist: boolean) => void
  ) {
    this.onCoordinatesUpdate = onCoordinatesUpdate;
    this.onSwipe = onSwipe;
    this.onFist = onFist;
  }

  public async start(videoElement: HTMLVideoElement) {
    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      this.hands.onResults(this.onResults.bind(this));

      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.hands) {
            await this.hands.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480,
      });

      await this.camera.start();
      return true;
    } catch (error) {
      console.error("Failed to start camera/MediaPipe:", error);
      return false;
    }
  }

  public stop() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.hands) {
      this.hands.close();
    }
  }

  private onResults(results: Results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const indexTip = landmarks[8];

      // Coordinates are normalized [0, 1]. Flip X because camera is mirrored.
      const currentCoords = { x: 1 - indexTip.x, y: indexTip.y };
      this.onCoordinatesUpdate(currentCoords);

      this.detectSwipe(currentCoords);
      this.detectPinch(landmarks);
    }
  }

  // ── Pinch: thumb tip (4) ↔ index tip (8) distance ───────────────────────
  // More reliable than fist — no movement gate needed
  private detectPinch(landmarks: any[]) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const isPinchFrame = dist < 0.06;

    if (isPinchFrame) {
      if (this.fistHoldStart === 0) {
        this.fistHoldStart = Date.now();
      } else if (Date.now() - this.fistHoldStart > this.FIST_HOLD_DURATION) {
        if (!this.isFistState) {
          this.isFistState = true;
          this.onFist(true);
        }
      }
    } else {
      this.fistHoldStart = 0;
      if (this.isFistState) {
        this.isFistState = false;
        this.onFist(false);
      }
    }
  }

  // ── Swipe: accumulate 5-frame trajectory, check cumulative displacement ──
  private detectSwipe(currentCoords: HandCoordinates) {
    const now = Date.now();

    // Global cooldown — reset history after each successful swipe
    if (now - this.lastSwipeTime < 200) {
      this.positionHistory = [];
      this.lastCoords = currentCoords;
      return;
    }

    this.positionHistory.push(currentCoords);
    if (this.positionHistory.length > this.SWIPE_WINDOW) {
      this.positionHistory.shift();
    }

    // Need at least 3 frames for a meaningful direction
    if (this.positionHistory.length < 3) {
      this.lastCoords = currentCoords;
      return;
    }

    const first = this.positionHistory[0];
    const last = this.positionHistory[this.positionHistory.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;

    let direction: 'left' | 'right' | 'down' | null = null;

    if (Math.abs(dx) > this.SWIPE_CUMULATIVE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else if (dy > this.SWIPE_CUMULATIVE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      direction = 'down';
    }

    if (direction) {
      const isOpposite =
        (direction === 'left' && this.lastSwipeDirection === 'right') ||
        (direction === 'right' && this.lastSwipeDirection === 'left');

      if (!(isOpposite && now - this.lastSwipeTime < 1000)) {
        this.onSwipe(direction);
        this.lastSwipeTime = now;
        this.lastSwipeDirection = direction;
        this.positionHistory = [];
      }
    }

    this.lastCoords = currentCoords;
  }
}
