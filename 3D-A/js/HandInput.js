import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js";

export class HandInput {
    constructor(physicsEngine) {
        this.physics = physicsEngine;
        this.video = document.getElementById('input_video');
        this.statusElement = document.getElementById('status');
        this.handLandmarker = undefined;
        this.lastVideoTime = -1;

        // Visual debug indicator
        this.debugDiv = document.createElement('div');
        this.debugDiv.style.cssText = "position:absolute; bottom:10px; right:10px; width:20px; height:20px; background:gray; z-index:999; border: 2px solid white;";
        document.body.appendChild(this.debugDiv);
    }

    async start() {
        console.log("HandInput: Standard Start Sequence");
        this.statusElement.innerText = "Initializing AI...";

        try {
            // 1. Load Vision Task
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );

            // 2. Create Landmarker
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU" // Try GPU again, usually better if it works. Fallback is auto.
                },
                runningMode: "VIDEO",
                numHands: 2
            });
            console.log("HandInput: Model Ready");

            // 3. Setup Camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = stream;

            this.video.addEventListener("loadeddata", () => {
                console.log("HandInput: Camera Data Loaded");
                this.statusElement.innerText = "Active. Wave Hands.";
                this.predict();
            });

        } catch (err) {
            console.error(err);
            this.statusElement.innerText = "Error: " + err.message;
        }
    }

    async predict() {
        // Recursive loop
        requestAnimationFrame(() => this.predict());

        // Reliability checks
        if (!this.handLandmarker) return;
        if (!this.video || this.video.paused || this.video.ended) return;

        // CRITICAL: MediaPipe needs explicit dimensions usually
        if (this.video.videoWidth > 0 && this.video.width !== this.video.videoWidth) {
            this.video.width = this.video.videoWidth;
            this.video.height = this.video.videoHeight;
        }

        // Only detect if frame changed
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;

            try {
                const startTimeMs = performance.now();
                const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);

                if (results.landmarks && results.landmarks.length > 0) {
                    this.debugDiv.style.background = "lime";
                    this.processGestures(results.landmarks);
                } else {
                    this.debugDiv.style.background = "red";
                    this.processGestures([]); // Clear state
                }
            } catch (e) {
                console.warn("Tracking Error:", e);
            }
        }
    }

    processGestures(landmarks) {
        // --- 1. RESET STATE IF NO HANDS ---
        if (!landmarks || landmarks.length === 0) {
            this.physics.setExtrude(false, 0, 0);
            this.physics.setSnap(false);
            this.physics.setCurve(false, 0);
            return;
        }

        // --- 2. HELPERS ---
        const getCentroid = (scale) => (h) => ({ x: h[9].x * scale, y: h[9].y * scale });

        // --- 3. LOGIC ---
        // Two Hands
        if (landmarks.length === 2) {
            const h1 = landmarks[0][9]; // Middle MCP
            const h2 = landmarks[1][9];

            // Extrude: Vertical separation
            const dy = Math.abs(h1.y - h2.y);
            const dx = Math.abs(h1.x - h2.x);

            // If hands are vertically stacked and pulled apart
            if (dy > 0.2 && dy > dx) {
                this.physics.setExtrude(true, (dy - 0.2) * 5, (h1.y + h2.y));
            } else {
                this.physics.setExtrude(false, 0, 0);
            }

            // Snap: Click together
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.1) {
                this.physics.setSnap(true);
            } else {
                this.physics.setSnap(false);
            }
        }
        // Single Hand
        else if (landmarks.length === 1) {
            const h = landmarks[0];
            const wrist = h[0];
            const index = h[8];

            // Curve: Twist wrist (index finger X relative to wrist X)
            const twist = (index.x - wrist.x);
            if (Math.abs(twist) > 0.15) {
                this.physics.setCurve(true, twist * 10);
            } else {
                this.physics.setCurve(false, 0);
            }
        }
    }
}
