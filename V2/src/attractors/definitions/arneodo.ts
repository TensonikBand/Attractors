/**
 * Arneodo Attractor
 */

import { AttractorDefinition } from '../types';

export const arneodo: AttractorDefinition = {
  id: 'arneodo',
  name: 'Arneodo',

  params: {
    a: -5.5,
    b: 3.5,
    d: -1.0,
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
    start: [0.9, 0.2, 0.5],  // Magenta
    end: [0.2, 0.9, 0.7]     // Turquoise
  },

  description: 'Third-order autonomous system with cubic nonlinearity'
};
