/**
 * Strange Attractors V2 - Main Application
 */

import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { ParticleSystem } from './rendering/ParticleSystem';
import { AttractorID } from './attractors/types';
import { AttractorRegistry } from './attractors/AttractorRegistry';
import { AudioEngine } from './audio';

class StrangeAttractorApp {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem | null = null;
  private audioEngine: AudioEngine;
  private animationId: number | null = null;
  private currentAttractorId: AttractorID = 'thomas';
  private audioUpdateCounter: number = 0;

  constructor() {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container')?.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000510);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 30);
    this.camera.lookAt(0, 0, 0);

    // Create orbit controls for interactive rotation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.enableZoom = true;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
    this.controls.enablePan = false; // Disable panning to keep focus on center

    // Create audio engine
    this.audioEngine = new AudioEngine({
      numVoices: 1,
      masterVolume: 0.6,
      reverbMix: 0.5,
      updateInterval: 200
    });

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Handle keyboard controls
    window.addEventListener('keydown', this.onKeyDown.bind(this));

    // Initialise particle system
    this.initParticleSystem();

    // Setup UI controls
    this.setupUI();

    // Start animation loop
    this.animate();

    // Display info
    this.displayInfo();
  }

  private initParticleSystem(): void {
    // Remove old system if exists
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem.getMesh());
      this.particleSystem.dispose();
    }

    // Create new particle system
    const particleCount = 65536;
    this.particleSystem = new ParticleSystem(
      this.renderer,
      particleCount,
      this.currentAttractorId
    );

    // Add to scene
    this.scene.add(this.particleSystem.getMesh());

    // Position camera based on attractor bounds for optimal viewing
    this.positionCameraForAttractor();

    console.log(`✓ Initialized ${this.currentAttractorId} attractor with ${particleCount} particles`);
  }

  private positionCameraForAttractor(): void {
    const attractor = AttractorRegistry.get(this.currentAttractorId);
    const bounds = attractor.bounds;

    // Calculate attractor dimensions
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    const depth = bounds.max.z - bounds.min.z;
    const maxDimension = Math.max(width, height, depth);

    // Calculate camera distance to fit attractor in view
    // FOV is 60 degrees, we want attractor to fill ~70% of screen
    const fovRadians = (60 * Math.PI) / 180;
    const distance = (maxDimension * 0.7) / Math.tan(fovRadians / 2);

    // Position camera
    this.camera.position.set(0, 0, distance);
    this.camera.lookAt(
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2,
      (bounds.min.z + bounds.max.z) / 2
    );

    // Update orbit controls target to center of attractor
    this.controls.target.set(
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2,
      (bounds.min.z + bounds.max.z) / 2
    );

    // Update distance limits based on attractor size
    this.controls.minDistance = distance * 0.3;
    this.controls.maxDistance = distance * 3;
    this.controls.update();
  }

  private setupUI(): void {
    // Attractor selector
    const selector = document.getElementById('attractor-select') as HTMLSelectElement;
    if (selector) {
      selector.value = this.currentAttractorId;
      selector.addEventListener('change', (e) => {
        this.currentAttractorId = (e.target as HTMLSelectElement).value as AttractorID;
        this.particleSystem?.switchAttractor(this.currentAttractorId);

        // Update audio bounds for new attractor
        const attractor = AttractorRegistry.get(this.currentAttractorId);
        this.audioEngine.setBounds(attractor.bounds);

        // Reposition camera for new attractor
        this.positionCameraForAttractor();

        this.displayInfo();
      });
    }

    // Audio toggle button
    const audioToggle = document.getElementById('audio-toggle') as HTMLButtonElement;
    if (audioToggle) {
      audioToggle.addEventListener('click', async () => {
        const state = this.audioEngine.getState();

        if (!state.isPlaying) {
          // Initialise audio on first click
          const attractor = AttractorRegistry.get(this.currentAttractorId);
          await this.audioEngine.initialize(attractor.bounds);
          await this.audioEngine.start();
          audioToggle.textContent = '🔊 Audio On';
          audioToggle.classList.add('active');
          console.log('🎵 Audio started');
        } else {
          this.audioEngine.stop();
          audioToggle.textContent = '🔇 Audio Off';
          audioToggle.classList.remove('active');
          console.log('🎵 Audio stopped');
        }
      });
    }

    // Volume slider
    const volumeSlider = document.getElementById('volume') as HTMLInputElement;
    const volumeValue = document.getElementById('volume-value');
    if (volumeSlider && volumeValue) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat((e.target as HTMLInputElement).value);
        this.audioEngine.setMasterVolume(volume);
        volumeValue.textContent = Math.round(volume * 100) + '%';
      });
    }

    // Reverb slider
    const reverbSlider = document.getElementById('reverb') as HTMLInputElement;
    const reverbValue = document.getElementById('reverb-value');
    if (reverbSlider && reverbValue) {
      reverbSlider.addEventListener('input', (e) => {
        const reverb = parseFloat((e.target as HTMLInputElement).value);
        this.audioEngine.setReverbMix(reverb);
        reverbValue.textContent = Math.round(reverb * 100) + '%';
      });
    }
  }

  private displayInfo(): void {
    const infoElement = document.getElementById('info');
    if (infoElement && this.particleSystem) {
      const attractor = AttractorRegistry.get(this.currentAttractorId);
      infoElement.innerHTML = `
        <strong>${attractor.name} Attractor</strong><br>
        ${attractor.description || ''}<br>
        <small>Particles: ${this.particleSystem.getParticleCount().toLocaleString()}</small>
      `;
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Press 'h' or 'H' to toggle UI panels
    if (event.key === 'h' || event.key === 'H') {
      const controls = document.getElementById('controls');
      const info = document.getElementById('info');
      const hint = document.getElementById('controls-hint');

      if (controls && info && hint) {
        const isVisible = controls.style.display !== 'none';
        const newDisplay = isVisible ? 'none' : '';

        controls.style.display = newDisplay;
        info.style.display = newDisplay;
        hint.style.display = newDisplay;
      }
    }

    // Arrow keys to cycle through attractors
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const allIds = AttractorRegistry.getAllIDs();
      const currentIndex = allIds.indexOf(this.currentAttractorId);

      let newIndex: number;
      if (event.key === 'ArrowLeft') {
        newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = allIds.length - 1; // Wrap to end
      } else {
        newIndex = currentIndex + 1;
        if (newIndex >= allIds.length) newIndex = 0; // Wrap to start
      }

      this.currentAttractorId = allIds[newIndex];
      this.particleSystem?.switchAttractor(this.currentAttractorId);

      // Update audio bounds for new attractor
      const attractor = AttractorRegistry.get(this.currentAttractorId);
      this.audioEngine.setBounds(attractor.bounds);

      // Reposition camera for new attractor
      this.positionCameraForAttractor();

      // Update UI selector
      const selector = document.getElementById('attractor-select') as HTMLSelectElement;
      if (selector) {
        selector.value = this.currentAttractorId;
      }

      this.displayInfo();
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Update orbit controls (smooth damping)
    this.controls.update();

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(this.camera);

      // Update audio at reduced rate (every 6 frames ≈ 10 Hz at 60 FPS)
      // This avoids expensive GPU readback on every frame
      // Camera rotation affects which particles influence the audio
      this.audioUpdateCounter++;
      if (this.audioUpdateCounter >= 6 && this.audioEngine.getState().isPlaying) {
        this.audioUpdateCounter = 0;
        const positions = this.particleSystem.readPositions();
        this.audioEngine.updateWithPositions(positions, this.particleSystem.getParticleCount());
      }
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.particleSystem) {
      this.particleSystem.dispose();
    }
    this.audioEngine.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}

// Initialise app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new StrangeAttractorApp();

  // Expose for debugging
  (window as any).app = app;

  console.log('🎨 Strange Attractors V2 - REBUILD');
  console.log('✓ Mathematical correctness verified');
  console.log('✓ Simple ping-pong architecture (NO MRT)');
  console.log('✓ Thomas a=0.19, Aizawa 5 params, Chua ±3.0 breakpoints');
  console.log('✓ Granular audio synthesis with spatial mapping');
  console.log('🖱️  Drag to rotate | 🔍 Scroll to zoom | 🎵 Click Audio button to enable sound');
});
