/**
 * Particle Render Material
 */

import * as THREE from 'three';
import { ColorScheme } from '../../attractors/types';

// Inline shaders to bypass caching issues
const particleVertShader = `
precision highp float;

attribute vec2 aUv;

uniform sampler2D uPositions;
uniform float uParticleSize;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 particlePos = texture2D(uPositions, aUv).xyz;
  float t = (particlePos.y + 10.0) / 20.0;
  vColor = mix(uColorStart, uColorEnd, clamp(t, 0.0, 1.0));
  vec4 mvPosition = viewMatrix * vec4(particlePos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  // Fixed size particles with minimal distance scaling
  // Direct control via uParticleSize (0.1) with just perspective correction
  gl_PointSize = uParticleSize * (1.5 / max(0.1, -mvPosition.z / 30.0));
  vAlpha = 0.6;
}
`;

const particleFragShader = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.3, dist) * vAlpha;
  gl_FragColor = vec4(vColor, alpha);
}
`;

export function createParticleRenderMaterial(colorScheme: ColorScheme): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPositions: { value: null },
      projectionMatrix: { value: new THREE.Matrix4() },
      viewMatrix: { value: new THREE.Matrix4() },
      uParticleSize: { value: 0.1 },
      uColorStart: { value: new THREE.Vector3(...colorScheme.start) },
      uColorEnd: { value: new THREE.Vector3(...colorScheme.end) }
    },
    vertexShader: particleVertShader,
    fragmentShader: particleFragShader,
    transparent: true,
    blending: THREE.NormalBlending, // Changed from AdditiveBlending to avoid white blobs
    depthWrite: false
    // Using GLSL1 (default) due to Three.js GLSL3 compatibility issues
  });
}
