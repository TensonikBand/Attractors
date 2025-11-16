/**
 * Halvorsen Attractor
 */

import { AttractorDefinition } from '../types';

export const halvorsen: AttractorDefinition = {
  id: 'halvorsen',
  name: 'Halvorsen',

  params: {
    a: 1.89,
    b: 4.0,
    dt: 0.01
  },

  bounds: {
    min: { x: -10, y: -10, z: -10 },
    max: { x: 10, y: 10, z: 10 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    const x = (Math.random() - 0.5) * 2;
    const y = (Math.random() - 0.5) * 2;
    const z = (Math.random() - 0.5) * 2;
    return [x, y, z];
  },

  colorScheme: {
    start: [0.5, 1.0, 0.5],  // Bright green
    end: [1.0, 0.5, 0.5]     // Coral
  },

  description: 'Symmetric attractor with quadratic nonlinearities'
};
