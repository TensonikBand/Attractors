/**
 * Lorenz Attractor
 *
 * Equations:
 *   dx/dt = σ*(y - x)
 *   dy/dt = x*(ρ - z) - y
 *   dz/dt = x*y - β*z
 *
 * Classic butterfly attractor modeling thermal convection
 */

import { AttractorDefinition } from '../types';

export const lorenz: AttractorDefinition = {
  id: 'lorenz',
  name: 'Lorenz',

  params: {
    sigma: 10.0,
    rho: 28.0,
    beta: 8.0 / 3.0,
    dt: 0.005
  },

  bounds: {
    min: { x: -25, y: -25, z: 0 },
    max: { x: 25, y: 25, z: 50 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    // Small sphere around origin, offset to center of attractor
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = Math.random() * 0.1;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    return [x, y, z + 25]; // Offset to center of attractor
  },

  colorScheme: {
    start: [0.3, 1.0, 0.4],  // Green
    end: [1.0, 0.9, 0.2]     // Yellow
  },

  description: 'Classic butterfly attractor discovered by Edward Lorenz in 1963'
};
