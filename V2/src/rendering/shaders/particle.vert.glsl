/**
 * Particle Vertex Shader
 *
 * Reads actual particle positions from texture
 * Computes color gradients based on Y-coordinate
 *
 * Using GLSL1 syntax (attribute/varying) due to Three.js GLSL3 compatibility issues
 * Three.js provides: position, uv, projectionMatrix, viewMatrix automatically
 */

precision highp float;

// Custom UV attribute for texture lookup
attribute vec2 aUv;

uniform sampler2D uPositions;
uniform float uParticleSize;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Read actual position from texture
  vec3 particlePos = texture(uPositions, aUv).xyz;

  // Color gradient based on Y-coordinate
  // Normalise Y to [0,1] range (assuming bounds approximately -10 to +10)
  float t = (particlePos.y + 10.0) / 20.0;
  vColor = mix(uColorStart, uColorEnd, clamp(t, 0.0, 1.0));

  // Transform to screen space
  vec4 mvPosition = viewMatrix * vec4(particlePos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation based on distance (perspective effect)
  float distanceScale = 300.0 / -mvPosition.z;
  gl_PointSize = uParticleSize * distanceScale;

  // Constant alpha for now (can add velocity-based variation later)
  vAlpha = 0.8;
}
