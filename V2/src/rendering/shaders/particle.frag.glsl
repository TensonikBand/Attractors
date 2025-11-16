/**
 * Particle Fragment Shader
 *
 * Renders circular particles with soft edges
 * Using GLSL1 syntax (varying/gl_FragColor) due to Three.js GLSL3 compatibility issues
 */

precision highp float;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Create circular particle shape
  // gl_PointCoord gives us UV coordinates [0,1] for the point sprite
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Discard fragments outside circle
  if (dist > 0.5) {
    discard;
  }

  // Soft edge using smoothstep
  // Creates a smooth falloff from center to edge
  float alpha = smoothstep(0.5, 0.3, dist);
  alpha *= vAlpha;

  gl_FragColor = vec4(vColor, alpha);
}
