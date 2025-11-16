/**
 * Chen-Lee Attractor
 */

import { AttractorDefinition } from '../types';

export const chen_lee: AttractorDefinition = {
  id: 'chen_lee',
  name: 'Chen-Lee',

  params: {
    a: 5.0,
    b: -10.0,
    c: -0.38,
    d: 3.0,
    dt: 0.002
  },

  bounds: {
    min: { x: -50, y: -50, z: -50 },
    max: { x: 50, y: 50, z: 50 }
  },

  initialConditions: (_i: number, _total: number): [number, number, number] => {
    const x = (Math.random() - 0.5) * 0.01;
    const y = (Math.random() - 0.5) * 0.01;
    const z = (Math.random() - 0.5) * 0.01;
    return [x, y, z];
  },

  colorScheme: {
    start: [0.3, 0.7, 1.0],  // Sky blue
    end: [1.0, 0.4, 0.6]     // Pink
  },

  description: 'Chaotic system with quadratic nonlinearities'
};
