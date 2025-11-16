/**
 * Compute Fragment Shader
 *
 * Using GLSL1 syntax (varying/gl_FragColor) due to Three.js GLSL3 compatibility issues
 */

precision highp float;

varying vec2 vUv;

// Input texture (current positions)
uniform sampler2D uPositions;

// Attractor selection (0=thomas, 1=lorenz, etc.)
uniform int uAttractorType;

// Timestep
uniform float uDt;

// Attractor-specific parameters
// Thomas
uniform float uThomas_a;

// Lorenz
uniform float uLorenz_sigma;
uniform float uLorenz_rho;
uniform float uLorenz_beta;

// Rössler
uniform float uRossler_a;
uniform float uRossler_b;
uniform float uRossler_c;

// Aizawa (5 params only - NO f)
uniform float uAizawa_a;
uniform float uAizawa_b;
uniform float uAizawa_c;
uniform float uAizawa_d;
uniform float uAizawa_e;

// Arneodo
uniform float uArneodo_a;
uniform float uArneodo_b;
uniform float uArneodo_d;

// Chen-Lee
uniform float uChenLee_a;
uniform float uChenLee_b;
uniform float uChenLee_c;
uniform float uChenLee_d;

// Chua
uniform float uChua_a;
uniform float uChua_b;
uniform float uChua_m0;
uniform float uChua_m1;

// Dadras
uniform float uDadras_a;
uniform float uDadras_b;
uniform float uDadras_c;
uniform float uDadras_d;
uniform float uDadras_e;

// Dequan Li
uniform float uDequanLi_a;
uniform float uDequanLi_b;
uniform float uDequanLi_c;
uniform float uDequanLi_d;
uniform float uDequanLi_e;
uniform float uDequanLi_f;

// Halvorsen
uniform float uHalvorsen_a;
uniform float uHalvorsen_b;

// Lorenz Mod 2
uniform float uLorenzMod2_a;
uniform float uLorenzMod2_b;
uniform float uLorenzMod2_c;
uniform float uLorenzMod2_d;

// Simone
uniform float uSimone_a;
uniform float uSimone_b;
uniform float uSimone_scale;

// Three Scroll
uniform float uThreeScroll_a;
uniform float uThreeScroll_b;
uniform float uThreeScroll_c;
uniform float uThreeScroll_d;
uniform float uThreeScroll_e;

// Wang-Sun
uniform float uWangSun_a;
uniform float uWangSun_b;
uniform float uWangSun_c;
uniform float uWangSun_d;
uniform float uWangSun_e;
uniform float uWangSun_f;

// Attractor functions inlined (vite-plugin-glsl #include not working with ?raw imports)

// Thomas Attractor
vec3 thomas(vec3 pos, float a) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(-a * x + sin(y), -a * y + sin(z), -a * z + sin(x));
}

// Lorenz Attractor
vec3 lorenz(vec3 pos, float sigma, float rho, float beta) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(sigma * (y - x), x * (rho - z) - y, x * y - beta * z);
}

// Rössler Attractor
vec3 rossler(vec3 pos, float a, float b, float c) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(-(y + z), x + a * y, b + z * (x - c));
}

// Aizawa Attractor (5 params only - CRITICAL FIX)
vec3 aizawa(vec3 pos, float a, float b, float c, float d, float e) {
  float x = pos.x, y = pos.y, z = pos.z;
  float dx = (z - b) * x - d * y;
  float dy = d * x + (z - b) * y;
  float dz = c + a * z - (z * z * z) / 3.0 - (x * x) + e * z * (x * x * x);
  return vec3(dx, dy, dz);
}

// Arneodo Attractor
vec3 arneodo(vec3 pos, float a, float b, float d) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(y, z, -a * x - b * y - z + d * pow(x, 3.0));
}

// Chen-Lee Attractor
vec3 chen_lee(vec3 pos, float a, float b, float c, float d) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(a * x - y * z, b * y + x * z, c * z + (x * y) / d);
}

// Chua's Circuit Attractor (±3.0 breakpoints - CRITICAL FIX)
vec3 chua(vec3 pos, float a, float b, float m0, float m1) {
  float x = pos.x, y = pos.y, z = pos.z;
  float h = m1 * x + 0.5 * (m0 - m1) * (abs(x + 3.0) - abs(x - 3.0));
  return vec3(a * (y - x - h), x - y + z, -b * y);
}

// Dadras Attractor
vec3 dadras(vec3 pos, float a, float b, float c, float d, float e) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(y - a * x + b * y * z, c * y - x * z + z, d * x * y - e * z);
}

// Dequan Li Attractor
vec3 dequan_li(vec3 pos, float a, float b, float c, float d, float e, float f) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(a * (y - x) + c * x * z, e * x + f * y - x * z, b * z + x * y - d * x * x);
}

// Halvorsen Attractor
vec3 halvorsen(vec3 pos, float a, float b) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(-a * x - b * y - b * z - y * y, -a * y - b * z - b * x - z * z, -a * z - b * x - b * y - x * x);
}

// Lorenz Mod 2 Attractor
vec3 lorenz_mod2(vec3 pos, float a, float b, float c, float d) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(-a * x + y * y - z * z + a * c, x * (y - b * z) + d, -z + x * (b * y + z));
}

// Simone Attractor
vec3 simone(vec3 pos, float a, float b, float scale) {
  float x = pos.x, y = pos.y, z = pos.z;
  float xn = sin(a * y) + cos(b * z);
  float yn = sin(a * z) + cos(b * x);
  float zn = sin(a * x) + cos(b * y);
  vec3 next = scale * vec3(xn, yn, zn);
  return next - pos;
}

// Three Scroll Attractor
vec3 three_scroll(vec3 pos, float a, float b, float c, float d, float e) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(a * (y - x) + c * x * z, e * y - x * z, b * z + x * y - d * x * x);
}

// Wang-Sun Attractor
vec3 wang_sun(vec3 pos, float a, float b, float c, float d, float e, float f) {
  float x = pos.x, y = pos.y, z = pos.z;
  return vec3(a * x + c * y * z, b * x + d * y - x * z, e * z + f * x * y);
}

void main() {
  // Read current position from texture
  vec3 pos = texture(uPositions, vUv).xyz;

  // Compute derivative based on attractor type
  vec3 delta = vec3(0.0);

  if (uAttractorType == 0) {
    delta = thomas(pos, uThomas_a);
  } else if (uAttractorType == 1) {
    delta = lorenz(pos, uLorenz_sigma, uLorenz_rho, uLorenz_beta);
  } else if (uAttractorType == 2) {
    delta = rossler(pos, uRossler_a, uRossler_b, uRossler_c);
  } else if (uAttractorType == 3) {
    delta = aizawa(pos, uAizawa_a, uAizawa_b, uAizawa_c, uAizawa_d, uAizawa_e);
  } else if (uAttractorType == 4) {
    delta = arneodo(pos, uArneodo_a, uArneodo_b, uArneodo_d);
  } else if (uAttractorType == 5) {
    delta = chen_lee(pos, uChenLee_a, uChenLee_b, uChenLee_c, uChenLee_d);
  } else if (uAttractorType == 6) {
    delta = chua(pos, uChua_a, uChua_b, uChua_m0, uChua_m1);
  } else if (uAttractorType == 7) {
    delta = dadras(pos, uDadras_a, uDadras_b, uDadras_c, uDadras_d, uDadras_e);
  } else if (uAttractorType == 8) {
    delta = dequan_li(pos, uDequanLi_a, uDequanLi_b, uDequanLi_c, uDequanLi_d, uDequanLi_e, uDequanLi_f);
  } else if (uAttractorType == 9) {
    delta = halvorsen(pos, uHalvorsen_a, uHalvorsen_b);
  } else if (uAttractorType == 10) {
    delta = lorenz_mod2(pos, uLorenzMod2_a, uLorenzMod2_b, uLorenzMod2_c, uLorenzMod2_d);
  } else if (uAttractorType == 11) {
    delta = simone(pos, uSimone_a, uSimone_b, uSimone_scale);
  } else if (uAttractorType == 12) {
    delta = three_scroll(pos, uThreeScroll_a, uThreeScroll_b, uThreeScroll_c, uThreeScroll_d, uThreeScroll_e);
  } else if (uAttractorType == 13) {
    delta = wang_sun(pos, uWangSun_a, uWangSun_b, uWangSun_c, uWangSun_d, uWangSun_e, uWangSun_f);
  }

  vec3 newPos = pos + delta * uDt;

  // Output: new position only (using GLSL1 gl_FragColor instead of GLSL3 out variable)
  gl_FragColor = vec4(newPos, 1.0);
}
