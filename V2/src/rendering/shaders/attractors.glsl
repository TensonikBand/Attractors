/**
 * Strange Attractor GLSL Functions
 * Pure mathematical implementations following strange-attractor-algorithms.md
 */

// Thomas Attractor
vec3 thomas(vec3 pos, float a) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = -a * x + sin(y);
  float dy = -a * y + sin(z);
  float dz = -a * z + sin(x);

  return vec3(dx, dy, dz);
}

// Lorenz Attractor
vec3 lorenz(vec3 pos, float sigma, float rho, float beta) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = sigma * (y - x);
  float dy = x * (rho - z) - y;
  float dz = x * y - beta * z;

  return vec3(dx, dy, dz);
}

// Rössler Attractor
vec3 rossler(vec3 pos, float a, float b, float c) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = -(y + z);
  float dy = x + a * y;
  float dz = b + z * (x - c);

  return vec3(dx, dy, dz);
}

// Aizawa Attractor
vec3 aizawa(vec3 pos, float a, float b, float c, float d, float e) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = (z - b) * x - d * y;
  float dy = d * x + (z - b) * y;
  float dz = c + a * z - (z * z * z) / 3.0 - (x * x) + e * z * (x * x * x);

  return vec3(dx, dy, dz);
}

// Arneodo Attractor
vec3 arneodo(vec3 pos, float a, float b, float d) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = y;
  float dy = z;
  float dz = -a * x - b * y - z + d * pow(x, 3.0);

  return vec3(dx, dy, dz);
}

// Chen-Lee Attractor
vec3 chen_lee(vec3 pos, float a, float b, float c, float d) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = a * x - y * z;
  float dy = b * y + x * z;
  float dz = c * z + (x * y) / d;

  return vec3(dx, dy, dz);
}

// Chua's Circuit Attractor
vec3 chua(vec3 pos, float a, float b, float m0, float m1) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;
  float h = m1 * x + 0.5 * (m0 - m1) * (abs(x + 3.0) - abs(x - 3.0));

  float dx = a * (y - x - h);
  float dy = x - y + z;
  float dz = -b * y;

  return vec3(dx, dy, dz);
}

// Dadras Attractor
vec3 dadras(vec3 pos, float a, float b, float c, float d, float e) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = y - a * x + b * y * z;
  float dy = c * y - x * z + z;
  float dz = d * x * y - e * z;

  return vec3(dx, dy, dz);
}

// Dequan Li Attractor
vec3 dequan_li(vec3 pos, float a, float b, float c, float d, float e, float f) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = a * (y - x) + c * x * z;
  float dy = e * x + f * y - x * z;
  float dz = b * z + x * y - d * x * x;

  return vec3(dx, dy, dz);
}

// Halvorsen Attractor
vec3 halvorsen(vec3 pos, float a, float b) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = -a * x - b * y - b * z - y * y;
  float dy = -a * y - b * z - b * x - z * z;
  float dz = -a * z - b * x - b * y - x * x;

  return vec3(dx, dy, dz);
}

// Lorenz Mod 2 Attractor
vec3 lorenz_mod2(vec3 pos, float a, float b, float c, float d) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = -a * x + y * y - z * z + a * c;
  float dy = x * (y - b * z) + d;
  float dz = -z + x * (b * y + z);

  return vec3(dx, dy, dz);
}

// Simone Attractor
vec3 simone(vec3 pos, float a, float b, float scale) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float xn = sin(a * y) + cos(b * z);
  float yn = sin(a * z) + cos(b * x);
  float zn = sin(a * x) + cos(b * y);

  vec3 next = scale * vec3(xn, yn, zn);

  float dx = next.x - x;
  float dy = next.y - y;
  float dz = next.z - z;

  return vec3(dx, dy, dz);
}

// Three Scroll Attractor
vec3 three_scroll(vec3 pos, float a, float b, float c, float d, float e) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = a * (y - x) + c * x * z;
  float dy = e * y - x * z;
  float dz = b * z + x * y - d * x * x;

  return vec3(dx, dy, dz);
}

// Wang-Sun Attractor
vec3 wang_sun(vec3 pos, float a, float b, float c, float d, float e, float f) {
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;

  float dx = a * x + c * y * z;
  float dy = b * x + d * y - x * z;
  float dz = e * z + f * x * y;

  return vec3(dx, dy, dz);
}
