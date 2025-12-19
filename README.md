Architectural Levitator - Implementation Plan
Goal Description
Create a real-time web-based "Architectural Levitator" that uses hand gestures to sculpt a 3D "Vapor-Skyscraper" made of 5,000 levitating micro-particles. 
The system will simulate an acoustic field manipulation interface using Computer Vision.

Proposed Changes
Core Structure
index.html: Entry point, load dependencies (Three.js, MediaPipe).
style.css: Fullscreen immersive styling, HUD elements.
main.js: Main loop, scene management.
Component Architecture
[NEW] 
ParticleSystem.js
Manages 5000 THREE.Points.
ShaderMaterial for "Aerogel/Silver" look (translucent + specular).
Store physical state (velocity, target position, anchor status).
Methods: extrude(), curve(), flatten().
[NEW] 
HandInput.js
Wrapper for @mediapipe/hands.
logic to detect:
Distance between hands (Extrude).
Index finger rotation (Curve).
Palm distance/speed (Clap/Snap).
Velocity calculation for Safety Buffer.
[NEW] 
AcousticPhysics.js
Simulation loop.
Applies "forces" based on gesture state.
Enforces "Acoustic Anchors" (y=0 constraint for base particles).
Handles "Auto-Symmetry" (copy right-hand influence to left side).
[NEW] 
Visuals.js
"Laser Lattice": A grid of THREE.LineSegments that distorts with the particles or projects through them.
Verification Plan
Manual Verification
Pull Test: Move hands apart vertically -> Particles should stretch up.
Curve Test: Rotate index finger -> Column should bend.
Clap Test: Clap hands -> Particles snap to a plane.
Speed Test: Move hands fast -> Particles should "jitter" or lock in place (Safety Buffer).
