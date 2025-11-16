/**
 * GPU Compute Engine
 *
 * Orchestrates ping-pong computation for particle positions
 */

import * as THREE from 'three';
import { PingPongTargets } from './PingPongTargets';
import { createComputeMaterial } from '../materials/ComputeMaterial';
import { TextureHelpers } from '../utils/textureHelpers';
import { AttractorDefinition, AttractorID } from '../../attractors/types';
import { AttractorRegistry } from '../../attractors/AttractorRegistry';

export class GPUComputeEngine {
  private renderer: THREE.WebGLRenderer;
  private targets: PingPongTargets;
  private computeScene: THREE.Scene;
  private computeCamera: THREE.OrthographicCamera;
  private computeMesh: THREE.Mesh;
  private computeMaterial: THREE.ShaderMaterial;
  private particleCount: number;
  private currentAttractorId: AttractorID | null = null;

  constructor(renderer: THREE.WebGLRenderer, particleCount: number) {
    this.renderer = renderer;
    this.particleCount = particleCount;

    // Create ping-pong targets
    const size = TextureHelpers.calculateTextureSize(particleCount);
    this.targets = new PingPongTargets(size);

    // Create full-screen quad for compute pass
    this.computeScene = new THREE.Scene();
    this.computeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create compute material and mesh
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.computeMaterial = createComputeMaterial();
    this.computeMesh = new THREE.Mesh(geometry, this.computeMaterial);
    this.computeScene.add(this.computeMesh);
  }

  /**
   * Initialise with attractor definition
   */
  initialize(attractorId: AttractorID, particleCount: number): void {
    const attractor = AttractorRegistry.get(attractorId);
    this.currentAttractorId = attractorId;

    const size = this.targets.getSize();
    const data = TextureHelpers.createPositionData(attractor, particleCount, size);
    const texture = TextureHelpers.createDataTexture(data, size);

    // Initialise both targets with same data
    // Copy texture data to both ping-pong buffers
    const tempScene = new THREE.Scene();
    const tempCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tempGeometry = new THREE.PlaneGeometry(2, 2);
    const tempMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tSource: { value: texture }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tSource;
        void main() {
          gl_FragColor = texture2D(tSource, vUv);
        }
      `
      // Using GLSL1 (default) - no glslVersion specified
    });
    const tempMesh = new THREE.Mesh(tempGeometry, tempMaterial);
    tempScene.add(tempMesh);

    // Copy to both targets
    [this.targets.getCurrent(), this.targets.getNext()].forEach(target => {
      this.renderer.setRenderTarget(target);
      this.renderer.render(tempScene, tempCamera);
    });

    this.renderer.setRenderTarget(null);

    // Cleanup
    tempGeometry.dispose();
    tempMaterial.dispose();
    texture.dispose();

    // Set attractor type index for shader
    this.setAttractorUniforms(attractor);
  }

  /**
   * Set attractor-specific uniforms
   */
  private setAttractorUniforms(attractor: AttractorDefinition): void {
    const uniforms = this.computeMaterial.uniforms;

    // Map attractor ID to index
    const attractorIndex = this.getAttractorTypeIndex(attractor.id);
    uniforms.uAttractorType.value = attractorIndex;
    uniforms.uDt.value = attractor.params.dt;

    // Set attractor-specific parameters
    Object.entries(attractor.params).forEach(([key, value]) => {
      if (key === 'dt') return; // Already set

      // Build uniform name: thomas.a -> uThomas_a
      const attractorName = attractor.id.charAt(0).toUpperCase() + attractor.id.slice(1);
      const uniformName = attractorName.includes('_')
        ? `u${attractorName.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}_${key}`
        : `u${attractorName}_${key}`;

      if (uniforms[uniformName]) {
        uniforms[uniformName].value = value;
      }
    });
  }

  /**
   * Map attractor ID to shader index
   */
  private getAttractorTypeIndex(id: AttractorID): number {
    const indexMap: Record<AttractorID, number> = {
      thomas: 0,
      lorenz: 1,
      rossler: 2,
      aizawa: 3,
      arneodo: 4,
      chen_lee: 5,
      chua: 6,
      dadras: 7,
      dequan_li: 8,
      halvorsen: 9,
      lorenz_mod2: 10,
      simone: 11,
      three_scroll: 12,
      wang_sun: 13
    };
    return indexMap[id] ?? 0;
  }

  /**
   * Perform one compute step
   */
  compute(): void {
    const current = this.targets.getCurrent();
    const next = this.targets.getNext();

    // Set input texture
    this.computeMaterial.uniforms.uPositions.value = current.texture;

    // Render to next target
    this.renderer.setRenderTarget(next);
    this.renderer.render(this.computeScene, this.computeCamera);
    this.renderer.setRenderTarget(null);

    // Swap
    this.targets.swap();
  }

  /**
   * Get current position texture for rendering
   */
  getCurrentTexture(): THREE.Texture {
    return this.targets.getCurrent().texture;
  }

  /**
   * Read particle positions from GPU to CPU
   * Used for audio system integration
   * IMPORTANT: This is a synchronous GPU readback and can cause performance issues
   * Call sparingly (e.g., 10-20 Hz for audio updates)
   */
  readPositions(): Float32Array {
    const size = this.targets.getSize();
    const buffer = new Float32Array(size * size * 4);

    // Read from current render target
    this.renderer.readRenderTargetPixels(
      this.targets.getCurrent(),
      0, 0,
      size, size,
      buffer
    );

    return buffer;
  }

  /**
   * Update parameters (e.g., when user changes settings)
   */
  updateParameters(params: Record<string, number>): void {
    if (!this.currentAttractorId) return;

    const attractor = AttractorRegistry.get(this.currentAttractorId);
    const updatedAttractor: AttractorDefinition = {
      ...attractor,
      params: {
        ...attractor.params,
        ...params
      }
    };

    this.setAttractorUniforms(updatedAttractor);
  }

  /**
   * Switch to different attractor
   */
  switchAttractor(attractorId: AttractorID): void {
    this.initialize(attractorId, this.particleCount);
  }

  /**
   * Clean up GPU resources
   */
  dispose(): void {
    this.targets.dispose();
    this.computeMesh.geometry.dispose();
    this.computeMaterial.dispose();
  }
}
