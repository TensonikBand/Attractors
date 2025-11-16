/**
 * Tests for AttractorRegistry
 */

import { describe, it, expect } from 'vitest';
import { AttractorRegistry } from '../../attractors/AttractorRegistry';
import { AttractorID } from '../../attractors/types';

describe('AttractorRegistry', () => {
  describe('get()', () => {
    it('returns definition for valid ID', () => {
      const thomas = AttractorRegistry.get('thomas');
      expect(thomas).toBeDefined();
      expect(thomas.id).toBe('thomas');
      expect(thomas.name).toBe('Thomas');
    });

    it('throws error for invalid ID', () => {
      expect(() => AttractorRegistry.get('invalid' as AttractorID)).toThrow();
    });

    it('returns all 14 attractors', () => {
      const ids: AttractorID[] = [
        'thomas',
        'lorenz',
        'rossler',
        'aizawa',
        'arneodo',
        'chen_lee',
        'chua',
        'dadras',
        'dequan_li',
        'halvorsen',
        'lorenz_mod2',
        'simone',
        'three_scroll',
        'wang_sun'
      ];

      ids.forEach(id => {
        const def = AttractorRegistry.get(id);
        expect(def.id).toBe(id);
      });
    });
  });

  describe('getAllIDs()', () => {
    it('returns all attractor IDs', () => {
      const ids = AttractorRegistry.getAllIDs();
      expect(ids).toHaveLength(14);
      expect(ids).toContain('thomas');
      expect(ids).toContain('aizawa');
      expect(ids).toContain('chua');
    });
  });

  describe('getAll()', () => {
    it('returns all attractor definitions', () => {
      const all = AttractorRegistry.getAll();
      expect(all).toHaveLength(14);
      all.forEach(def => {
        expect(def.id).toBeDefined();
        expect(def.name).toBeDefined();
        expect(def.params).toBeDefined();
      });
    });
  });

  describe('has()', () => {
    it('returns true for valid IDs', () => {
      expect(AttractorRegistry.has('thomas')).toBe(true);
      expect(AttractorRegistry.has('aizawa')).toBe(true);
      expect(AttractorRegistry.has('wang_sun')).toBe(true);
    });

    it('returns false for invalid IDs', () => {
      expect(AttractorRegistry.has('invalid')).toBe(false);
      expect(AttractorRegistry.has('')).toBe(false);
      expect(AttractorRegistry.has('Thomas')).toBe(false); // Case sensitive
    });
  });
});
