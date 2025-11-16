/**
 * Particle System Orchestrator
 *
 * High-level API combining all rendering modules
 * This is the main entry point for the particle visualisation system
 */

import * as THREE from 'three';
import { GPUComputeEngine } from './core/GPUComputeEngine';
import { ParticleGeometry } from './geometry/ParticleGeometry';
import { createParticleRenderMaterial } from './materials/RenderMaterial';
import { TextureHelpers } from './utils/textureHelpers';
import { AttractorID } from '../attractors/types';
import { AttractorRegistry } from '../attractors/AttractorRegistry';

export class ParticleSystem {
  private gpuCompute: GPUComputeEngine;
  private particleMesh: THREE.Points;
  private particleCount: number;
  private attractorId: AttractorID;

  constructor(
    renderer: THREE.WebGLRenderer,
    particleCount: number,
    attractorId: AttractorID
  ) {
    this.particleCount = particleCount;
    this.attractorId = attractorId;

    // Create GPU compute engine
    this.gpuCompute = new GPUComputeEngine(renderer, particleCount);

    // Initialise with attractor
    const attractor = AttractorRegistry.get(attractorId);
    this.gpuCompute.initialize(attractorId, particleCount);

    // Create particle mesh
    const textureSize = TextureHelpers.calculateTextureSize(particleCount);
    const geometry = ParticleGeometry.create(particleCount, textureSize);
    const material = createParticleRenderMaterial(attractor.colorScheme);
    this.particleMesh = new THREE.Points(geometry, material);

    // Set initial position texture
    const posTexture = this.gpuCompute.getCurrentTexture();
    (this.particleMesh.material as THREE.ShaderMaterial).uniforms.uPositions.value = posTexture;
  }

  /**
   * Update particle system (call every frame)
   * @param camera Current camera for matrix uniforms
   */
  update(camera: THREE.Camera): void {
    // Compute new positions on GPU
    this.gpuCompute.compute();

    // Update render material with new positions and camera matrices
    const material = this.particleMesh.material as THREE.ShaderMaterial;
    material.uniforms.uPositions.value = this.gpuCompute.getCurrentTexture();
    material.uniforms.projectionMatrix.value = camera.projectionMatrix;
    material.uniforms.viewMatrix.value = camera.matrixWorldInverse;
  }

  /**
   * Get the mesh for adding to scene
   */
  getMesh(): THREE.Points {
    return this.particleMesh;
  }

  /**
   * Switch to different attractor
   */
  switchAttractor(attractorId: AttractorID): void {
    this.attractorId = attractorId;
    const attractor = AttractorRegistry.get(attractorId);

    // Re-initialise GPU compute with new attractor
    this.gpuCompute.switchAttractor(attractorId);

    // Update color scheme
    const material = this.particleMesh.material as THREE.ShaderMaterial;
    material.uniforms.uColorStart.value.set(...attractor.colorScheme.start);
    material.uniforms.uColorEnd.value.set(...attractor.colorScheme.end);
  }

  /**
   * Update attractor parameters
   */
  updateParameters(params: Record<string, number>): void {
    this.gpuCompute.updateParameters(params);
  }

  /**
   * Set particle rendering size
   */
  setParticleSize(size: number): void {
    const material = this.particleMesh.material as THREE.ShaderMaterial;
    material.uniforms.uParticleSize.value = size;
  }

  /**
   * Get current attractor ID
   */
  getCurrentAttractor(): AttractorID {
    return this.attractorId;
  }

  /**
   * Get particle count
   */
  getParticleCount(): number {
    return this.particleCount;
  }

  /**
   * Read particle positions from GPU for audio integration
   * IMPORTANT: This is expensive (GPU readback) - call sparingly (e.g., 10-20 Hz)
   */
  readPositions(): Float32Array {
    return this.gpuCompute.readPositions();
  }

  /**
   * Clean up GPU resources
   */
  dispose(): void {
    this.gpuCompute.dispose();
    this.particleMesh.geometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();
  }
}
