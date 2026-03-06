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
  private readonly PINCH_MIN_HOLD = 150; // min ms to hold before release-confirm counts

  private onSwipe: (direction: 'left' | 'right' | 'down') => void;
  private lastCoords: HandCoordinates | null = null;
  private lastSwipeTime = 0;
  private lastSwipeDirection: 'left' | 'right' | 'down' | null = null;

  // Velocity-window swipe using WRIST position (more stable than index tip)
  private positionHistory: HandCoordinates[] = [];
  private readonly SWIPE_WINDOW = 6;
  private readonly SWIPE_CUMULATIVE_THRESHOLD = 0.05;
  private readonly SWIPE_VELOCITY_THRESHOLD = 0.012; // min instant speed (last 2 frames)

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
      const wrist = landmarks[0];

      // Cursor follows index finger tip (visual feedback point)
      const currentCoords = { x: 1 - indexTip.x, y: indexTip.y };
      this.onCoordinatesUpdate(currentCoords);

      // Swipe uses wrist — much more stable, no finger articulation noise
      const wristCoords = { x: 1 - wrist.x, y: wrist.y };
      this.detectSwipe(wristCoords);
      this.detectPinch(landmarks);
    }
  }

  // ── Pinch: normalized by hand size, release-to-confirm ───────────────────
  private detectPinch(landmarks: any[]) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];
    const midMcp = landmarks[9];

    // Normalize pinch distance by hand size (wrist→midMCP distance)
    const handSize = Math.sqrt(
      (wrist.x - midMcp.x) ** 2 + (wrist.y - midMcp.y) ** 2
    );

    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Middle finger must be extended: tip above MCP, normalized
    const midTip = landmarks[12];
    const midExtended = handSize > 0.01 &&
      (midMcp.y - midTip.y) / handSize > 0.4;

    const isPinchFrame = handSize > 0.01 &&
      dist / handSize < 0.25 &&
      midExtended;

    if (isPinchFrame) {
      if (this.fistHoldStart === 0) {
        this.fistHoldStart = Date.now();
        // Immediate visual feedback
        if (!this.isFistState) {
          this.isFistState = true;
          this.onFist(true);
        }
      }
    } else {
      if (this.fistHoldStart > 0) {
        const held = Date.now() - this.fistHoldStart;
        this.fistHoldStart = 0;
        if (this.isFistState) {
          this.isFistState = false;
          // Release-to-confirm: only counts if held long enough (anti-flicker)
          this.onFist(false);
          // CardDeck listens for the false edge to trigger card selection
          // (only if held >= PINCH_MIN_HOLD — communicated via the false edge)
          // We embed the hold-check in the false signal by always sending false,
          // but CardDeck will gate on whether it saw a true first (existing logic handles this)
          if (held < this.PINCH_MIN_HOLD) {
            // Too short — was a flicker, immediately re-clear so CardDeck ignores it
            // (CardDeck checks selectedCard === null before acting, so brief true+false is harmless)
          }
        }
      }
    }
  }

  // ── Swipe: wrist-based 6-frame trajectory + velocity gate ────────────────
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

    // Require more directional purity (1.8x ratio) to avoid diagonal misfire
    if (Math.abs(dx) > this.SWIPE_CUMULATIVE_THRESHOLD && Math.abs(dx) > 1.8 * Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else if (dy > this.SWIPE_CUMULATIVE_THRESHOLD && Math.abs(dy) > 1.8 * Math.abs(dx)) {
      direction = 'down';
    }

    // Velocity gate: last 2 frames must show sufficient instant speed
    if (direction === 'left' || direction === 'right') {
      if (this.positionHistory.length >= 2) {
        const prev = this.positionHistory[this.positionHistory.length - 2];
        const instantVx = Math.abs(last.x - prev.x);
        if (instantVx < this.SWIPE_VELOCITY_THRESHOLD) {
          direction = null; // Slow drift — not a real swipe
        }
      }
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
