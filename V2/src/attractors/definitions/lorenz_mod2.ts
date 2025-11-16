/**
 * Lorenz Mod 2 Attractor
 */

import { AttractorDefinition } from '../types';

export const lorenz_mod2: AttractorDefinition = {
  id: 'lorenz_mod2',
  name: 'Lorenz Mod 2',

  params: {
    a: 0.9,
    b: 5.0,
    c: 9.9,
    d: 1.0,
    dt: 0.01
  },

  bounds: {
    min: { x: -10, y: -10, z: -10 },
    max: { x: 10, y: 10, z: 10 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    const x = (Math.random() - 0.5) * 0.4;
    const y = (Math.random() - 0.5) * 0.4;
    const z = (Math.random() - 0.5) * 0.4;
    return [x, y, z];
  },

  colorScheme: {
    start: [0.2, 0.8, 0.9],  // Cyan
    end: [0.9, 0.8, 0.2]     // Yellow
  },

  description: 'Modified version of the Lorenz system'
};
