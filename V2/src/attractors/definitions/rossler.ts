/**
 * Rössler Attractor
 *
 * Equations:
 *   dx/dt = -(y + z)
 *   dy/dt = x + a*y
 *   dz/dt = b + z*(x - c)
 */

import { AttractorDefinition } from '../types';

export const rossler: AttractorDefinition = {
  id: 'rossler',
  name: 'Rössler',

  params: {
    a: 0.2,
    b: 0.2,
    c: 5.7,
    dt: 0.02
  },

  bounds: {
    min: { x: -15, y: -15, z: -5 },
    max: { x: 15, y: 15, z: 25 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    // Random points in small region
    const x = (Math.random() - 0.5) * 2;
    const y = (Math.random() - 0.5) * 2;
    const z = (Math.random() - 0.5) * 2;
    return [x, y, z];
  },

  colorScheme: {
    start: [1.0, 0.3, 0.2],  // Red
    end: [0.3, 0.8, 1.0]     // Cyan
  },

  description: 'Single-banded spiral attractor with minimal nonlinearity'
};
