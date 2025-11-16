/**
 * Core type definitions for strange attractor system
 */

/**
 * Unique identifier for each attractor type
 */
export type AttractorID =
  | 'thomas'
  | 'lorenz'
  | 'rossler'
  | 'aizawa'
  | 'arneodo'
  | 'chen_lee'
  | 'chua'
  | 'dadras'
  | 'dequan_li'
  | 'halvorsen'
  | 'lorenz_mod2'
  | 'simone'
  | 'three_scroll'
  | 'wang_sun';

/**
 * 3D bounding box for attractor phase space
 */
export interface Bounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

/**
 * Color scheme for particle rendering (RGB values 0-1)
 */
export interface ColorScheme {
  start: [number, number, number];
  end: [number, number, number];
}

/**
 * Function that generates initial particle positions
 * @param index - Particle index (0 to particleCount-1)
 * @param particleCount - Total number of particles
 * @returns [x, y, z] position in phase space
 */
export type InitialConditionFunction = (
  index: number,
  particleCount: number
) => [number, number, number];

/**
 * Complete definition of a strange attractor
 */
export interface AttractorDefinition {
  /** Unique identifier */
  id: AttractorID;

  /** Human-readable name */
  name: string;

  /** Mathematical parameters (dt always included for timestep) */
  params: Record<string, number>;

  /** Spatial bounds for visualisation */
  bounds: Bounds;

  /** Initial particle distribution function */
  initialConditions: InitialConditionFunction;

  /** Color scheme for rendering */
  colorScheme: ColorScheme;

  /** Brief description */
  description?: string;
}
