/**
 * Compute Shader Material
 */

import * as THREE from 'three';
import computeFragShaderRaw from '../shaders/compute.frag.glsl';

// Inline compute vertex shader to bypass caching
// Using GLSL1 attribute/varying syntax for compatibility
const computeVertShader = 'varying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}';

// Use imported shader
const computeFragShader = computeFragShaderRaw;

export interface ComputeMaterialUniforms {
  uPositions: { value: THREE.Texture | null };
  uAttractorType: { value: number };
  uDt: { value: number };

  // Thomas
  uThomas_a: { value: number };

  // Lorenz
  uLorenz_sigma: { value: number };
  uLorenz_rho: { value: number };
  uLorenz_beta: { value: number };

  // Rössler
  uRossler_a: { value: number };
  uRossler_b: { value: number };
  uRossler_c: { value: number };

  // Aizawa (5 params)
  uAizawa_a: { value: number };
  uAizawa_b: { value: number };
  uAizawa_c: { value: number };
  uAizawa_d: { value: number };
  uAizawa_e: { value: number };

  // Arneodo
  uArneodo_a: { value: number };
  uArneodo_b: { value: number };
  uArneodo_d: { value: number };

  // Chen-Lee
  uChenLee_a: { value: number };
  uChenLee_b: { value: number };
  uChenLee_c: { value: number };
  uChenLee_d: { value: number };

  // Chua
  uChua_a: { value: number };
  uChua_b: { value: number };
  uChua_m0: { value: number };
  uChua_m1: { value: number };

  // Dadras
  uDadras_a: { value: number };
  uDadras_b: { value: number };
  uDadras_c: { value: number };
  uDadras_d: { value: number };
  uDadras_e: { value: number };

  // Dequan Li
  uDequanLi_a: { value: number };
  uDequanLi_b: { value: number };
  uDequanLi_c: { value: number };
  uDequanLi_d: { value: number };
  uDequanLi_e: { value: number };
  uDequanLi_f: { value: number };

  // Halvorsen
  uHalvorsen_a: { value: number };
  uHalvorsen_b: { value: number };

  // Lorenz Mod 2
  uLorenzMod2_a: { value: number };
  uLorenzMod2_b: { value: number };
  uLorenzMod2_c: { value: number };
  uLorenzMod2_d: { value: number };

  // Simone
  uSimone_a: { value: number };
  uSimone_b: { value: number };
  uSimone_scale: { value: number };

  // Three Scroll
  uThreeScroll_a: { value: number };
  uThreeScroll_b: { value: number };
  uThreeScroll_c: { value: number };
  uThreeScroll_d: { value: number };
  uThreeScroll_e: { value: number };

  // Wang-Sun
  uWangSun_a: { value: number };
  uWangSun_b: { value: number };
  uWangSun_c: { value: number };
  uWangSun_d: { value: number };
  uWangSun_e: { value: number };
  uWangSun_f: { value: number };
}

export function createComputeMaterial(): THREE.ShaderMaterial {
  const uniforms = {
    uPositions: { value: null },
    uAttractorType: { value: 0 },
    uDt: { value: 0.01 },

    // Initialise all attractor parameters with defaults
    uThomas_a: { value: 0.19 },

    uLorenz_sigma: { value: 10.0 },
    uLorenz_rho: { value: 28.0 },
    uLorenz_beta: { value: 8.0 / 3.0 },

    uRossler_a: { value: 0.2 },
    uRossler_b: { value: 0.2 },
    uRossler_c: { value: 5.7 },

    uAizawa_a: { value: 0.95 },
    uAizawa_b: { value: 0.7 },
    uAizawa_c: { value: 0.6 },
    uAizawa_d: { value: 3.5 },
    uAizawa_e: { value: 0.25 },

    uArneodo_a: { value: -5.5 },
    uArneodo_b: { value: 3.5 },
    uArneodo_d: { value: -1.0 },

    uChenLee_a: { value: 5.0 },
    uChenLee_b: { value: -10.0 },
    uChenLee_c: { value: -0.38 },
    uChenLee_d: { value: 3.0 },

    uChua_a: { value: 15.6 },
    uChua_b: { value: 25.58 },
    uChua_m0: { value: -1.07 },
    uChua_m1: { value: -0.314 },

    uDadras_a: { value: 3.0 },
    uDadras_b: { value: 2.7 },
    uDadras_c: { value: 1.7 },
    uDadras_d: { value: 2.0 },
    uDadras_e: { value: 9.0 },

    uDequanLi_a: { value: 40.0 },
    uDequanLi_b: { value: 1.833 },
    uDequanLi_c: { value: 0.16 },
    uDequanLi_d: { value: 0.65 },
    uDequanLi_e: { value: 55.0 },
    uDequanLi_f: { value: 20.0 },

    uHalvorsen_a: { value: 1.89 },
    uHalvorsen_b: { value: 4.0 },

    uLorenzMod2_a: { value: 0.9 },
    uLorenzMod2_b: { value: 5.0 },
    uLorenzMod2_c: { value: 9.9 },
    uLorenzMod2_d: { value: 1.0 },

    uSimone_a: { value: 5.51 },
    uSimone_b: { value: 4.84 },
    uSimone_scale: { value: 2.0 },

    uThreeScroll_a: { value: 40.0 },
    uThreeScroll_b: { value: 0.833 },
    uThreeScroll_c: { value: 0.5 },
    uThreeScroll_d: { value: 0.65 },
    uThreeScroll_e: { value: 20.0 },

    uWangSun_a: { value: 0.2 },
    uWangSun_b: { value: -0.03 },
    uWangSun_c: { value: 0.3 },
    uWangSun_d: { value: -0.4 },
    uWangSun_e: { value: -1.5 },
    uWangSun_f: { value: -1.5 }
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: computeVertShader,
    fragmentShader: computeFragShader
    // Using GLSL1 (default) due to Three.js GLSL3 compatibility issues
  });
}
