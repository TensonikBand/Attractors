/**
 * Texture Helpers for GPU Particle System
 * Utility functions for creating and managing GPU textures for particle positions
 */

import * as THREE from 'three';
import { AttractorDefinition } from '../../attractors/types';

export class TextureHelpers {
  /**
   * Calculate square texture size for particle count
   * @param particleCount Number of particles
   * @returns Texture width/height (e.g., 256 for 65536 particles)
   */
  static calculateTextureSize(particleCount: number): number {
    return Math.ceil(Math.sqrt(particleCount));
  }

  /**
   * Create Float32Array of initial positions
   * Positions are packed as RGBA: (x, y, z, 1.0)
   *
   * @param attractor Attractor definition with initialConditions function
   * @param particleCount Number of particles
   * @param textureSize Texture dimensions (from calculateTextureSize)
   * @returns Float32Array with RGBA data (4 floats per particle)
   */
  static createPositionData(
    attractor: AttractorDefinition,
    particleCount: number,
    textureSize: number
  ): Float32Array {
    const data = new Float32Array(textureSize * textureSize * 4);

    for (let i = 0; i < particleCount; i++) {
      const [x, y, z] = attractor.initialConditions(i, particleCount);

      // Pack into RGBA channels
      data[i * 4 + 0] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = z;
      data[i * 4 + 3] = 1.0; // Alpha (not used, but required for RGBA format)
    }

    // Fill remaining pixels with zeros (if texture size > particle count)
    for (let i = particleCount; i < textureSize * textureSize; i++) {
      data[i * 4 + 0] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 0;
    }

    return data;
  }

  /**
   * Create THREE.DataTexture from position data
   * Configured for GPU computation (nearest filtering, float type)
   *
   * @param data Float32Array from createPositionData
   * @param size Texture dimensions
   * @returns Configured DataTexture ready for GPU use
   */
  static createDataTexture(
    data: Float32Array,
    size: number
  ): THREE.DataTexture {
    const texture = new THREE.DataTexture(
      data as unknown as BufferSource,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );

    // CRITICAL: Use nearest filtering for exact pixel lookup
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    // No wrapping (clamp to edge)
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // Mark for upload to GPU
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Create pair of render targets for ping-pong computation
   * @param size Texture dimensions
   * @returns Tuple of [current, next] render targets
   */
  static createRenderTargetPair(
    size: number
  ): [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] {
    const options = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    };

    const target1 = new THREE.WebGLRenderTarget(size, size, options);
    const target2 = new THREE.WebGLRenderTarget(size, size, options);

    return [target1, target2];
  }
}
