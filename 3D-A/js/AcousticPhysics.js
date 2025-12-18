import * as THREE from 'three';

export class AcousticPhysics {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.baseForce = 0.05; // Strength of the "trap" returning particles to base
        this.drag = 0.95; // Air resistance

        // State
        this.isExtruding = false;
        this.extrudeStrength = 0;
        this.extrudeCenter = 0;

        this.isCurving = false;
        this.curveAngle = 0;

        this.isSnapping = false;

        this.safetyBufferActive = false; // High amplitude mode

        this.autoSymmetry = true;
    }

    update() {
        // Here we manipulate the velocity / position of particles based on active states
        const count = this.particleSystem.count;
        const positions = this.particleSystem.positions; // Float32Array
        const velocities = this.particleSystem.velocities; // Float32Array
        const basePositions = this.particleSystem.basePositions; // Float32Array

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            let px = positions[i3];
            let py = positions[i3 + 1];
            let pz = positions[i3 + 2];

            let vx = velocities[i3];
            let vy = velocities[i3 + 1];
            let vz = velocities[i3 + 2];

            // 1. Acoustic Trap Forces (Return to "Formation" if no gesture)
            // If Extruding, "Formation" changes.

            let targetX = basePositions[i3];
            let targetY = basePositions[i3 + 1];
            let targetZ = basePositions[i3 + 2];

            // -- Apply Gestures to Target Logic --

            // EXTRUDE: stretch targetY based on proximity to center extrusion axis
            if (this.isExtruding) {
                // If particles are within a radius of the hand center, they get pulled up
                // For global extrude (as per prompt "vertical columns"):
                const factor = 1.0 + (this.extrudeStrength * 2.0); // 0 to 1 mapping -> 1x to 3x height

                // Scale Y relative to ground (0) or center? 
                // "Stretch the particle density upward to create pillars"
                targetY = basePositions[i3 + 1] * factor;
            }

            // CURVE: rotate (x, z) around an axis based on Y height
            if (this.isCurving) {
                // simple twist
                const theta = this.curveAngle * py; // Twist increases with height
                const cosT = Math.cos(theta);
                const sinT = Math.sin(theta);

                // Rotation matrix around Y
                const tx = targetX * cosT - targetZ * sinT;
                const tz = targetX * sinT + targetZ * cosT;
                targetX = tx;
                targetZ = tz;
            }

            // SNAP: Flatten to planes
            if (this.isSnapping) {
                // Quantize Y to nearest 0.5m levels
                targetY = Math.round(targetY * 2) / 2;
            }

            // -- Physics Integration --

            // Spring force towards target
            let k = 0.05; // Default Spring constant

            // SAFETY BUFFER: "increase the ultrasonic amplitude" -> Stiffer spring
            if (this.safetyBufferActive) {
                k = 0.2; // Much tighter trap
                // Also maybe add some random jitter to simulate high energy?
                targetX += (Math.random() - 0.5) * 0.01;
                targetY += (Math.random() - 0.5) * 0.01;
                targetZ += (Math.random() - 0.5) * 0.01;
            }

            const ax = (targetX - px) * k;
            const ay = (targetY - py) * k;
            const az = (targetZ - pz) * k;

            vx += ax;
            vy += ay;
            vz += az;

            // Drag
            vx *= this.drag;
            vy *= this.drag;
            vz *= this.drag;

            // Update Position
            px += vx;
            py += vy;
            pz += vz;

            // Floor constraint (Acoustic Anchors)
            if (py < 0) {
                py = 0;
                vy = -vy * 0.5; // Bounce
            }

            // Write back
            positions[i3] = px;
            positions[i3 + 1] = py;
            positions[i3 + 2] = pz;

            velocities[i3] = vx;
            velocities[i3 + 1] = vy;
            velocities[i3 + 2] = vz;
        }

        // Notify system to upload to GPU
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Input handlers
    setExtrude(active, strength, center) {
        this.isExtruding = active;
        this.extrudeStrength = strength;
        this.extrudeCenter = center;
    }

    setCurve(active, angle) {
        this.isCurving = active;
        this.curveAngle = angle;
    }

    setSnap(active) {
        this.isSnapping = active;
    }
}
