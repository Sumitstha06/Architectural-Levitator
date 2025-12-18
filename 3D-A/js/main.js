import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem } from './ParticleSystem.js';
import { HandInput } from './HandInput.js';
import { AcousticPhysics } from './AcousticPhysics.js';
import { Visuals } from './Visuals.js';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.initScene();
        this.initLighting();

        this.visuals = new Visuals(this.scene); // Add Visuals

        this.particleSystem = new ParticleSystem(this.scene);
        this.physics = new AcousticPhysics(this.particleSystem);
        this.handInput = new HandInput(this.physics); // Pass physics to HandInput

        this.clock = new THREE.Clock();

        this.animate = this.animate.bind(this);
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.animate();

        // Wait for user to click Start to comply with browser policies
        document.getElementById('start-btn').addEventListener('click', async () => {
            document.getElementById('start-overlay').style.display = 'none';
            await this.handInput.start();
        });
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050505, 0.02);

        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 2, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // Restrict controls so user feels more like an operator than a flyer
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2; // Don't go below ground
    }

    initLighting() {
        // "Projection-mapped laser lattice" feel - sharp lights
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xa0a0ff, 3);
        dirLight.position.set(2, 5, 2);
        this.scene.add(dirLight);

        const spotLight = new THREE.SpotLight(0xffffff, 5);
        spotLight.position.set(0, 10, 0);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 1;
        this.scene.add(spotLight);
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.controls.update();

        if (this.physics) {
            this.physics.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new App();
