/**
 * Dequan Li Attractor
 */

import { AttractorDefinition } from '../types';

export const dequan_li: AttractorDefinition = {
  id: 'dequan_li',
  name: 'Dequan Li',

  params: {
    a: 40.0,
    b: 1.833,
    c: 0.16,
    d: 0.65,
    e: 55.0,
    f: 20.0,
    dt: 0.001
  },

  bounds: {
    min: { x: -20, y: -20, z: -20 },
    max: { x: 20, y: 20, z: 20 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    const x = (Math.random() - 0.5) * 0.4;
    const y = (Math.random() - 0.5) * 0.4;
    const z = (Math.random() - 0.5) * 0.4;
    return [x, y, z];
  },

  colorScheme: {
    start: [1.0, 0.8, 0.2],  // Gold
    end: [0.4, 0.2, 0.9]     // Indigo
  },

  description: 'Six-parameter attractor with complex dynamics'
};
