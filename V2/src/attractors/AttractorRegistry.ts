/**
 * Central registry for all attractor definitions
 * Provides type-safe access to attractor configurations
 */

import { AttractorDefinition, AttractorID } from './types';
import * as definitions from './definitions';

/**
 * Registry mapping attractor IDs to their definitions
 */
const registry: Record<AttractorID, AttractorDefinition> = {
  thomas: definitions.thomas,
  lorenz: definitions.lorenz,
  rossler: definitions.rossler,
  aizawa: definitions.aizawa,
  arneodo: definitions.arneodo,
  chen_lee: definitions.chen_lee,
  chua: definitions.chua,
  dadras: definitions.dadras,
  dequan_li: definitions.dequan_li,
  halvorsen: definitions.halvorsen,
  lorenz_mod2: definitions.lorenz_mod2,
  simone: definitions.simone,
  three_scroll: definitions.three_scroll,
  wang_sun: definitions.wang_sun
};

/**
 * Get attractor definition by ID
 * @throws Error if attractor ID is not found
 */
export function get(id: AttractorID): AttractorDefinition {
  const def = registry[id];
  if (!def) {
    throw new Error(`Attractor "${id}" not found in registry`);
  }
  return def;
}

/**
 * Get all available attractor IDs
 */
export function getAllIDs(): AttractorID[] {
  return Object.keys(registry) as AttractorID[];
}

/**
 * Get all attractor definitions
 */
export function getAll(): AttractorDefinition[] {
  return Object.values(registry);
}

/**
 * Check if attractor ID exists
 */
export function has(id: string): id is AttractorID {
  return id in registry;
}

/**
 * AttractorRegistry namespace export
 */
export const AttractorRegistry = {
  get,
  getAllIDs,
  getAll,
  has
};
