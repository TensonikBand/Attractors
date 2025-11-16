/**
 * Three Scroll Attractor
 */

import { AttractorDefinition } from '../types';

export const three_scroll: AttractorDefinition = {
  id: 'three_scroll',
  name: 'Three Scroll',

  params: {
    a: 40.0,
    b: 0.833,
    c: 0.5,
    d: 0.65,
    e: 20.0,
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
    start: [0.6, 0.3, 0.9],  // Purple
    end: [0.3, 0.9, 0.6]     // Green
  },

  description: 'Multi-scroll attractor with three distinct lobes'
};
