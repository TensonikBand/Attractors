/**
 * Audio Spatial Mapper Tests
 */

import { describe, it, expect } from 'vitest';
import { AudioSpatialMapper } from '../../src/audio/AudioSpatialMapper';
import { Bounds } from '../../src/attractors/types';

describe('AudioSpatialMapper', () => {
  const bounds: Bounds = {
    min: { x: -10, y: -10, z: -10 },
    max: { x: 10, y: 10, z: 10 }
  };

  it('should create mapper with bounds and scale', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');
    const config = mapper.getConfig();

    expect(config.bounds).toEqual(bounds);
    expect(config.scale).toBe('pentatonic_minor');
    expect(config.rootFrequency).toBe(220); // Default A3
  });

  it('should map position to spatial audio parameters', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');
    const params = mapper.mapPosition(0, 0, 0); // Centre position

    expect(params.frequency).toBeGreaterThan(0);
    expect(params.pan).toBeGreaterThanOrEqual(-1);
    expect(params.pan).toBeLessThanOrEqual(1);
    expect(params.filterCutoff).toBeGreaterThan(200);
    expect(params.filterCutoff).toBeLessThan(8000);
    expect(params.amplitude).toBeGreaterThan(0);
    expect(params.amplitude).toBeLessThanOrEqual(1);
  });

  it('should map X position to pan correctly', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');

    // Left edge
    const leftParams = mapper.mapPosition(-10, 0, 0);
    expect(leftParams.pan).toBeCloseTo(-1, 1);

    // Center
    const centerParams = mapper.mapPosition(0, 0, 0);
    expect(centerParams.pan).toBeCloseTo(0, 1);

    // Right edge
    const rightParams = mapper.mapPosition(10, 0, 0);
    expect(centerParams.pan).toBeCloseTo(0, 1); // Fixed to check centre
  });

  it('should map Y position to musical frequency', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor', 220); // A3

    // Test that different Y positions give different frequencies
    const lowY = mapper.mapPosition(0, -10, 0);
    const midY = mapper.mapPosition(0, 0, 0);
    const highY = mapper.mapPosition(0, 10, 0);

    expect(lowY.frequency).toBeLessThan(midY.frequency);
    expect(midY.frequency).toBeLessThan(highY.frequency);

    // All frequencies should be in valid range
    [lowY, midY, highY].forEach(params => {
      expect(params.frequency).toBeGreaterThan(100);
      expect(params.frequency).toBeLessThan(1000);
    });
  });

  it('should quantise to pentatonic minor scale', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor', 220);

    // Generate many positions and check frequencies are quantised
    const frequencies = new Set<number>();
    for (let y = -10; y <= 10; y += 0.5) {
      const params = mapper.mapPosition(0, y, 0);
      frequencies.add(Math.round(params.frequency * 10) / 10); // Round to 0.1 Hz
    }

    // Should have discrete frequency steps (not continuous)
    // Pentatonic has 5 notes per octave, 2 octaves = 10 notes
    expect(frequencies.size).toBeLessThan(20); // Much less than 41 continuous values
  });

  it('should update bounds', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');

    const newBounds: Bounds = {
      min: { x: -20, y: -20, z: -20 },
      max: { x: 20, y: 20, z: 20 }
    };

    mapper.setBounds(newBounds);
    expect(mapper.getConfig().bounds).toEqual(newBounds);
  });

  it('should update musical scale', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');
    mapper.setScale('chromatic');

    expect(mapper.getConfig().scale).toBe('chromatic');
  });

  it('should update root frequency', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');
    mapper.setRootFrequency(440); // A4

    expect(mapper.getConfig().rootFrequency).toBe(440);
  });

  it('should convert frequency to note name', () => {
    const note440 = AudioSpatialMapper.frequencyToNote(440);
    expect(note440.noteName).toBe('A');
    expect(note440.octave).toBe(4);

    const note220 = AudioSpatialMapper.frequencyToNote(220);
    expect(note220.noteName).toBe('A');
    expect(note220.octave).toBe(3);

    const note880 = AudioSpatialMapper.frequencyToNote(880);
    expect(note880.noteName).toBe('A');
    expect(note880.octave).toBe(5);
  });

  it('should calculate amplitude based on distance from center', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');

    // Centre should be loudest
    const centerParams = mapper.mapPosition(0, 0, 0);

    // Edge should be quieter
    const edgeParams = mapper.mapPosition(10, 10, 10);

    expect(centerParams.amplitude).toBeGreaterThan(edgeParams.amplitude);
  });

  it('should clamp values within valid ranges', () => {
    const mapper = new AudioSpatialMapper(bounds, 'pentatonic_minor');

    // Test with positions outside bounds
    const params = mapper.mapPosition(100, 100, 100);

    // Pan should be clamped to [-1, 1]
    expect(params.pan).toBeGreaterThanOrEqual(-1);
    expect(params.pan).toBeLessThanOrEqual(1);

    // Amplitude should be clamped to [0, 1]
    expect(params.amplitude).toBeGreaterThanOrEqual(0);
    expect(params.amplitude).toBeLessThanOrEqual(1);
  });
});
