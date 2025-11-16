/**
 * Particle Geometry
 *
 * Creates geometry for GPU particle system
 * Each particle reads its position from texture via UV coordinates
 */

import * as THREE from 'three';

export class ParticleGeometry {
  /**
   * Create particle geometry with UV coordinates for texture lookup
   *
   * @param particleCount Number of particles
   * @param textureSize Texture dimensions (from TextureHelpers.calculateTextureSize)
   * @returns BufferGeometry ready for particle rendering
   */
  static create(particleCount: number, textureSize: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // Create UV coordinates for texture lookup
    // Each particle gets a UV coordinate that maps to its position in the texture
    const uvs = new Float32Array(particleCount * 2);

    // Create dummy positions (required by Three.js for vertex count)
    // The actual positions will come from the texture in the vertex shader
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Calculate UV coordinates based on particle index and texture size
      const x = (i % textureSize) / textureSize;
      const y = Math.floor(i / textureSize) / textureSize;

      uvs[i * 2 + 0] = x;
      uvs[i * 2 + 1] = y;

      // Dummy positions (shader will override with texture data)
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));

    // Infinite bounding sphere to prevent frustum culling
    // Particles can move anywhere in space, so we disable culling
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      Infinity
    );

    return geometry;
  }
}
