/**
 * Tests for attractor definitions
 * Verifies all parameters match strange-attractor-algorithms.md reference
 */

import { describe, it, expect } from 'vitest';
import * as definitions from '../../attractors/definitions';
import { AttractorDefinition } from '../../attractors/types';

describe('Attractor Definitions', () => {
  // Test that all definitions are valid
  const allDefinitions: [string, AttractorDefinition][] = [
    ['thomas', definitions.thomas],
    ['lorenz', definitions.lorenz],
    ['rossler', definitions.rossler],
    ['aizawa', definitions.aizawa],
    ['arneodo', definitions.arneodo],
    ['chen_lee', definitions.chen_lee],
    ['chua', definitions.chua],
    ['dadras', definitions.dadras],
    ['dequan_li', definitions.dequan_li],
    ['halvorsen', definitions.halvorsen],
    ['lorenz_mod2', definitions.lorenz_mod2],
    ['simone', definitions.simone],
    ['three_scroll', definitions.three_scroll],
    ['wang_sun', definitions.wang_sun]
  ];

  describe('Structure Validation', () => {
    allDefinitions.forEach(([name, def]) => {
      it(`${name} has all required fields`, () => {
        expect(def.id).toBeDefined();
        expect(def.name).toBeDefined();
        expect(def.params).toBeDefined();
        expect(def.params.dt).toBeDefined();
        expect(def.bounds).toBeDefined();
        expect(def.initialConditions).toBeDefined();
        expect(def.colorScheme).toBeDefined();
      });

      it(`${name} has valid bounds`, () => {
        expect(def.bounds.min.x).toBeLessThan(def.bounds.max.x);
        expect(def.bounds.min.y).toBeLessThan(def.bounds.max.y);
        expect(def.bounds.min.z).toBeLessThan(def.bounds.max.z);
      });

      it(`${name} has valid color scheme`, () => {
        expect(def.colorScheme.start).toHaveLength(3);
        expect(def.colorScheme.end).toHaveLength(3);
        def.colorScheme.start.forEach(c => {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(1);
        });
        def.colorScheme.end.forEach(c => {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(1);
        });
      });

      it(`${name} initialConditions function works`, () => {
        const [x, y, z] = def.initialConditions(0, 1000);
        expect(typeof x).toBe('number');
        expect(typeof y).toBe('number');
        expect(typeof z).toBe('number');
        expect(isFinite(x)).toBe(true);
        expect(isFinite(y)).toBe(true);
        expect(isFinite(z)).toBe(true);
      });
    });
  });

  describe('Critical Parameter Verification', () => {
    it('Thomas has a=0.19 (NOT 0.16)', () => {
      expect(definitions.thomas.params.a).toBe(0.19);
      expect(definitions.thomas.params.dt).toBe(0.015);
    });

    it('Aizawa has exactly 5 parameters plus dt (NO f parameter)', () => {
      const params = Object.keys(definitions.aizawa.params);
      expect(params).toContain('a');
      expect(params).toContain('b');
      expect(params).toContain('c');
      expect(params).toContain('d');
      expect(params).toContain('e');
      expect(params).toContain('dt');
      expect(params).not.toContain('f');
      expect(params).toHaveLength(6);
    });

    it('Aizawa parameters match reference', () => {
      expect(definitions.aizawa.params.a).toBe(0.95);
      expect(definitions.aizawa.params.b).toBe(0.7);
      expect(definitions.aizawa.params.c).toBe(0.6);
      expect(definitions.aizawa.params.d).toBe(3.5);
      expect(definitions.aizawa.params.e).toBe(0.25);
    });

    it('Chua parameters match reference (will verify breakpoints in shader tests)', () => {
      expect(definitions.chua.params.a).toBe(15.6);
      expect(definitions.chua.params.b).toBe(25.58);
      expect(definitions.chua.params.m0).toBe(-1.07);
      expect(definitions.chua.params.m1).toBe(-0.314);
    });

    it('Lorenz parameters match reference', () => {
      expect(definitions.lorenz.params.sigma).toBe(10.0);
      expect(definitions.lorenz.params.rho).toBe(28.0);
      expect(definitions.lorenz.params.beta).toBe(8.0 / 3.0);
    });

    it('Rössler parameters match reference', () => {
      expect(definitions.rossler.params.a).toBe(0.2);
      expect(definitions.rossler.params.b).toBe(0.2);
      expect(definitions.rossler.params.c).toBe(5.7);
    });
  });

  describe('Initial Conditions Distribution', () => {
    it('Thomas uses cube grid distribution', () => {
      const positions = Array.from({ length: 8 }, (_, i) =>
        definitions.thomas.initialConditions(i, 8)
      );

      // Should have systematic coverage, not random
      const allSame = positions.every(
        (p, i, arr) => i === 0 || JSON.stringify(p) !== JSON.stringify(arr[0])
      );
      expect(allSame).toBe(true); // Different positions
    });

    it('Lorenz uses small sphere around offset origin', () => {
      const positions = Array.from({ length: 100 }, (_, i) =>
        definitions.lorenz.initialConditions(i, 100)
      );

      // All positions should be near z=25 (offset)
      positions.forEach(([x, y, z]) => {
        expect(Math.abs(x)).toBeLessThan(1); // Small sphere
        expect(Math.abs(y)).toBeLessThan(1);
        expect(z).toBeGreaterThan(24); // Around 25
        expect(z).toBeLessThan(26);
      });
    });

    it('Aizawa uses small random perturbations', () => {
      const positions = Array.from({ length: 100 }, (_, i) =>
        definitions.aizawa.initialConditions(i, 100)
      );

      positions.forEach(([x, y, z]) => {
        expect(Math.abs(x)).toBeLessThan(0.1);
        expect(Math.abs(y)).toBeLessThan(0.1);
        expect(Math.abs(z)).toBeLessThan(0.1);
      });
    });
  });

  describe('dt Timestep Values', () => {
    it('All attractors have positive dt values', () => {
      allDefinitions.forEach(([_name, def]) => {
        expect(def.params.dt).toBeGreaterThan(0);
        expect(def.params.dt).toBeLessThan(0.1); // Reasonable upper bound
      });
    });

    it('Fast-evolving systems have smaller dt', () => {
      // Systems with larger parameter values need smaller timesteps
      expect(definitions.dequan_li.params.dt).toBe(0.001); // Has large params
      expect(definitions.three_scroll.params.dt).toBe(0.001);
      expect(definitions.lorenz.params.dt).toBe(0.005); // Moderate
      expect(definitions.thomas.params.dt).toBe(0.015); // Slower
    });
  });
});
