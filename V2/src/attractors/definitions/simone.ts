/**
 * Simone Attractor
 */

import { AttractorDefinition } from '../types';

export const simone: AttractorDefinition = {
  id: 'simone',
  name: 'Simone',

  params: {
    a: 5.51,
    b: 4.84,
    scale: 2.0,
    dt: 0.005
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
    start: [0.9, 0.5, 0.2],  // Orange
    end: [0.2, 0.5, 0.9]     // Blue
  },

  description: 'Trigonometric attractor with sinusoidal coupling'
};
