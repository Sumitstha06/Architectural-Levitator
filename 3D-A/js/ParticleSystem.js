import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.count = 5000;
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        this.basePositions = new Float32Array(this.count * 3); // To remember where they belong in the default lattice

        this.initParticles();
        this.initMaterial();

        this.mesh = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.mesh);

        // Simulation State
        this.isExtruding = false;
        this.extrudeFactor = 0;
    }

    initParticles() {
        // Initialize as a flat-ish cloud or cube
        const spread = 2.0;
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            // Random cloud distribution initially
            this.positions[i3] = (Math.random() - 0.5) * spread;     // x
            this.positions[i3 + 1] = (Math.random()) * spread * 0.5 + 0.5; // y (above ground)
            this.positions[i3 + 2] = (Math.random() - 0.5) * spread; // z

            // Store base
            this.basePositions[i3] = this.positions[i3];
            this.basePositions[i3 + 1] = this.positions[i3 + 1];
            this.basePositions[i3 + 2] = this.positions[i3 + 2];
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    }

    initMaterial() {
        // "Lightweight aerogel beads or silver-coated glass microspheres"
        // Using a custom shader or a shiny PointsMaterial
        const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');

        this.material = new THREE.PointsMaterial({
            color: 0xaaaaaa, // Silver/Grey
            size: 0.05,
            map: sprite,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }

    update(delta, time) {
        const positions = this.geometry.attributes.position.array;

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;

            // Basic levitation idle animation (Bobbing)
            const bob = Math.sin(time * 2 + positions[i3] * 5) * 0.002;
            positions[i3 + 1] += bob;

            // "Acoustic Anchors" - keeps them from drifting away entirely if they go too low
            if (positions[i3 + 1] < 0) positions[i3 + 1] += 0.01;
        }

        this.geometry.attributes.position.needsUpdate = true;
    }

    // -- Gesture Methods (Placeholder for now) --

    // "Two-Handed Pull (The Extrude)"
    applyExtrude(strength, centerY) {
        // Stretch particles vertically
        // strength: > 1 to stretch, < 1 to compress
        const positions = this.geometry.attributes.position.array;
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            // Simple stretch relative to a center point
            let y = positions[i3 + 1];
            let dist = y - centerY;
            positions[i3 + 1] = centerY + dist * (1 + strength * 0.1);
        }
    }

    // "Circular Sweep (The Curve)"
    applyCurve(angle, axisX) {
        // Bend columns around an axis
    }

    // "Clap (The Snap)"
    applySnap() {
        // Flatten to a plane
        const positions = this.geometry.attributes.position.array;
        const targetY = 1.0;
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            positions[i3 + 1] += (targetY - positions[i3 + 1]) * 0.1; // Ease to plane
        }
    }
}
