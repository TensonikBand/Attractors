/**
 * Aizawa Attractor
 *
 * Equations:
 *   dx/dt = (z-b)*x - d*y
 *   dy/dt = d*x + (z-b)*y
 *   dz/dt = c + a*z - (z³)/3 - x² + e*z*x³
 */

import { AttractorDefinition } from '../types';

export const aizawa: AttractorDefinition = {
  id: 'aizawa',
  name: 'Aizawa',

  params: {
    a: 0.95,
    b: 0.7,
    c: 0.6,
    d: 3.5,
    e: 0.25,
    dt: 0.01
  },

  bounds: {
    min: { x: -2, y: -2, z: -2 },
    max: { x: 2, y: 2, z: 2 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    // Small random perturbations near origin
    const x = (Math.random() - 0.5) * 0.2;
    const y = (Math.random() - 0.5) * 0.2;
    const z = (Math.random() - 0.5) * 0.2;
    return [x, y, z];
  },

  colorScheme: {
    start: [0.8, 0.3, 1.0],  // Purple
    end: [0.3, 1.0, 0.9]     // Aqua
  },

  description: 'Complex six-parameter system with spherical topology'
};
