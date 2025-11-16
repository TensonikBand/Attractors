/**
 * Wang-Sun Attractor
 */

import { AttractorDefinition } from '../types';

export const wang_sun: AttractorDefinition = {
  id: 'wang_sun',
  name: 'Wang-Sun',

  params: {
    a: 0.2,
    b: -0.03,
    c: 0.3,
    d: -0.4,
    e: -1.5,
    f: -1.5,
    dt: 0.01
  },

  bounds: {
    min: { x: -5, y: -5, z: -5 },
    max: { x: 5, y: 5, z: 5 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    const x = (Math.random() - 0.5) * 0.4;
    const y = (Math.random() - 0.5) * 0.4;
    const z = (Math.random() - 0.5) * 0.4;
    return [x, y, z];
  },

  colorScheme: {
    start: [0.8, 0.7, 0.3],  // Tan
    end: [0.3, 0.7, 0.8]     // Teal
  },

  description: 'Six-parameter chaotic system'
};
