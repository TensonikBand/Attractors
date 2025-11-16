/**
 * Chua's Circuit Attractor
 *
 * Equations:
 *   g(x) = m1*x + (m0-m1)/2 * (|x+3| - |x-3|)
 *   dx/dt = a*(y - x - g(x))
 *   dy/dt = x - y + z
 *   dz/dt = -b*y
 */

import { AttractorDefinition } from '../types';

export const chua: AttractorDefinition = {
  id: 'chua',
  name: "Chua's Circuit",

  params: {
    a: 15.6,
    b: 25.58,
    m0: -1.07,
    m1: -0.314,
    dt: 0.01
  },

  bounds: {
    min: { x: -5, y: -5, z: -5 },
    max: { x: 5, y: 5, z: 5 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    // Small random perturbations
    const x = (Math.random() - 0.5) * 0.4;
    const y = (Math.random() - 0.5) * 0.4;
    const z = (Math.random() - 0.5) * 0.4;
    return [x, y, z];
  },

  colorScheme: {
    start: [1.0, 0.5, 0.1],  // Orange
    end: [0.2, 0.6, 1.0]     // Blue
  },

  description: 'Electronic circuit attractor with piecewise-linear characteristic'
};
