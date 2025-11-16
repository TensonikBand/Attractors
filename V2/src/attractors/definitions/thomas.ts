/**
 * Thomas Attractor
 *
 * Equations:
 *   dx/dt = -a*x + sin(y)
 *   dy/dt = -a*y + sin(z)
 *   dz/dt = -a*z + sin(x)
 */

import { AttractorDefinition } from '../types';

export const thomas: AttractorDefinition = {
  id: 'thomas',
  name: 'Thomas',

  params: {
    a: 0.19,  // ✓ CORRECT value from reference
    dt: 0.015
  },

  bounds: {
    min: { x: -5, y: -5, z: -5 },
    max: { x: 5, y: 5, z: 5 }
  },

  initialConditions: (i: number, total: number): [number, number, number] => {
    // Cube grid distribution for systematic coverage
    const size = Math.cbrt(total);
    const x = (i % size) / size * 2 - 1;
    const y = (Math.floor(i / size) % size) / size * 2 - 1;
    const z = Math.floor(i / (size * size)) / size * 2 - 1;
    return [x * 0.5, y * 0.5, z * 0.5];
  },

  colorScheme: {
    start: [0.2, 0.4, 1.0],  // Blue
    end: [1.0, 0.3, 0.8]     // Pink
  },

  description: 'Cyclically symmetric attractor with sinusoidal nonlinearity'
};
