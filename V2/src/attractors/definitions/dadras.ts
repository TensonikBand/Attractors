/**
 * Dadras Attractor
 */

import { AttractorDefinition } from '../types';

export const dadras: AttractorDefinition = {
  id: 'dadras',
  name: 'Dadras',

  params: {
    a: 3.0,
    b: 2.7,
    c: 1.7,
    d: 2.0,
    e: 9.0,
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
    start: [0.7, 0.9, 0.3],  // Lime
    end: [0.9, 0.3, 0.7]     // Violet
  },

  description: 'Five-parameter chaotic system'
};
