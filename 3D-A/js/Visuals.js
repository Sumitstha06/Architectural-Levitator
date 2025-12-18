import * as THREE from 'three';

export class Visuals {
    constructor(scene) {
        this.scene = scene;
        this.initLattice();
    }

    initLattice() {
        // "Projection-mapped laser lattice"
        // Create a 3D grid that encompasses the particle cloud
        const size = 4;
        const divisions = 10;

        // Floor Grid
        const gridHelper = new THREE.GridHelper(size, divisions, 0x00ffff, 0x003344);
        gridHelper.position.y = 0;
        gridHelper.material.opacity = 0.5;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // Vertical "Laser" Beams (Pillars at corners)
        const geometry = new THREE.CylinderGeometry(0.01, 0.01, size, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });

        const corners = [
            [-size / 2, size / 2], [size / 2, size / 2],
            [size / 2, -size / 2], [-size / 2, -size / 2]
        ];

        corners.forEach(([x, z]) => {
            const beam = new THREE.Mesh(geometry, material);
            beam.position.set(x, size / 2, z);
            this.scene.add(beam);
        });

        // "Digital Volume" box hint
        const boxGeo = new THREE.BoxGeometry(size, size / 2, size);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const boxMat = new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.1, transparent: true });
        const box = new THREE.LineSegments(edges, boxMat);
        box.position.y = size / 4;
        this.scene.add(box);
    }
}
