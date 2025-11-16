/**
 * Compute Vertex Shader
 * Full-screen quad for GPU computation pass
 *
 * Note: Three.js provides position and uv automatically
 */

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
