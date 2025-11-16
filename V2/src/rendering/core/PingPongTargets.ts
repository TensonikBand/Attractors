/**
 * Simple Ping-Pong Render Targets
 *
 * SIMPLE 2-target system - NO MRT (Multiple Render Targets)
 */

import * as THREE from 'three';

export class PingPongTargets {
  private targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private currentIndex: 0 | 1 = 0;

  constructor(size: number) {
    this.targets = [
      this.createTarget(size),
      this.createTarget(size)
    ];
  }

  /**
   * Create a single render target for position data
   * NO MRT - one texture per target
   */
  private createTarget(size: number): THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget(size, size, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    });
  }

  /**
   * Get current render target (read from this)
   */
  getCurrent(): THREE.WebGLRenderTarget {
    return this.targets[this.currentIndex];
  }

  /**
   * Get next render target (write to this)
   */
  getNext(): THREE.WebGLRenderTarget {
    return this.targets[1 - this.currentIndex as 0 | 1];
  }

  /**
   * Swap current/next (call after rendering)
   * Simple index flip - V1 pattern
   */
  swap(): void {
    this.currentIndex = (1 - this.currentIndex) as 0 | 1;
  }

  /**
   * Get texture size
   */
  getSize(): number {
    return this.targets[0].width;
  }

  /**
   * Clean up GPU resources
   */
  dispose(): void {
    this.targets.forEach(t => t.dispose());
  }
}
