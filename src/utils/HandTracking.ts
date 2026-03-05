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
  private readonly FIST_HOLD_DURATION = 300; // ms to hold fist before triggering
  private readonly MOVEMENT_THRESHOLD = 0.01; // Speed threshold to disable fist

  private onSwipe: (direction: 'left' | 'right' | 'down') => void;
  private lastCoords: HandCoordinates | null = null;
  private swipeThreshold = 0.08; // Slightly more sensitive
  private lastSwipeTime = 0;
  private lastSwipeDirection: 'left' | 'right' | 'down' | null = null;

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
        minDetectionConfidence: 0.6, // Increased confidence
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
      // Use the index finger tip (landmark 8)
      const indexTip = landmarks[8];
      
      // Coordinates are normalized [0, 1]. We flip X because camera is mirrored.
      const currentCoords = { x: 1 - indexTip.x, y: indexTip.y };
      this.onCoordinatesUpdate(currentCoords);

      // Calculate movement speed
      let speed = 0;
      if (this.lastCoords) {
        const dx = currentCoords.x - this.lastCoords.x;
        const dy = currentCoords.y - this.lastCoords.y;
        speed = Math.sqrt(dx * dx + dy * dy);
      }

      // Detect swipe
      this.detectSwipe(currentCoords);

      // Detect Fist (Only if hand is relatively still)
      if (speed < this.MOVEMENT_THRESHOLD) {
        this.detectFist(landmarks);
      } else {
        // If moving fast, reset fist state immediately to prevent accidental triggering
        if (this.isFistState) {
          this.isFistState = false;
          this.onFist(false);
        }
        this.fistHoldStart = 0;
      }
    }
  }

  private detectFist(landmarks: any[]) {
    // Landmark 9 is the middle finger MCP (palm center approximation)
    const palmCenter = landmarks[9];
    const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips

    let totalDist = 0;
    for (const tipIdx of tips) {
      const tip = landmarks[tipIdx];
      const dx = tip.x - palmCenter.x;
      const dy = tip.y - palmCenter.y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }
    
    const avgDist = totalDist / 4;
    
    // Threshold needs tuning, but 0.1 is a reasonable start for normalized coords
    // If average distance of tips to palm center is small, it's a fist
    const isFistFrame = avgDist < 0.1;

    if (isFistFrame) {
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

  private detectSwipe(currentCoords: HandCoordinates) {
    const now = Date.now();
    
    // Global cooldown check
    if (now - this.lastSwipeTime < 400) { 
      this.lastCoords = currentCoords;
      return;
    }

    if (this.lastCoords) {
      const dx = currentCoords.x - this.lastCoords.x;
      const dy = currentCoords.y - this.lastCoords.y;

      let direction: 'left' | 'right' | 'down' | null = null;

      if (Math.abs(dx) > this.swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else if (dy > this.swipeThreshold && Math.abs(dy) > Math.abs(dx)) {
        direction = 'down';
      }

      if (direction) {
        // Anti-rebound logic: Ignore if opposite to last swipe within short time
        const isOpposite = 
          (direction === 'left' && this.lastSwipeDirection === 'right') ||
          (direction === 'right' && this.lastSwipeDirection === 'left');
        
        // If it's an opposite swipe within 1000ms, ignore it (likely a recovery movement)
        if (isOpposite && (now - this.lastSwipeTime < 1000)) {
           // Do nothing, just update time to prevent spamming
           // this.lastSwipeTime = now; 
        } else {
          this.onSwipe(direction);
          this.lastSwipeTime = now;
          this.lastSwipeDirection = direction;
        }
      }
    }

    this.lastCoords = currentCoords;
  }
}
