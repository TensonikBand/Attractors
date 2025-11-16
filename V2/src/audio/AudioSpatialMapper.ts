/**
 * Audio Spatial Mapper
 * Maps 3D particle positions to audio parameters
 */

import { Bounds } from '../attractors/types';
import {
  SpatialAudioParams,
  MusicalScale,
  Note,
  MUSICAL_SCALES,
  A4_FREQUENCY,
  FILTER_RANGE
} from './types';

export class AudioSpatialMapper {
  private bounds: Bounds;
  private scale: MusicalScale;
  private rootFrequency: number;

  constructor(bounds: Bounds, scale: MusicalScale = 'pentatonic_minor', rootFrequency: number = 220) {
    this.bounds = bounds;
    this.scale = scale;
    this.rootFrequency = rootFrequency; // Default A3
  }

  /**
   * Map 3D position to complete audio parameters
   */
  mapPosition(x: number, y: number, z: number): SpatialAudioParams {
    return {
      frequency: this.positionToFrequency(y),
      pan: this.positionToPan(x),
      filterCutoff: this.positionToFilter(z),
      amplitude: this.calculateAmplitude(x, y, z)
    };
  }

  /**
   * Map Y position to musical frequency
   * Quantises to selected musical scale
   */
  private positionToFrequency(y: number): number {
    // Normalise Y to 0-1 range
    const normalized = this.normalize(y, this.bounds.min.y, this.bounds.max.y);

    // Map to 2-octave range
    const octaveRange = 2;
    const scaleDegree = normalized * octaveRange;

    // Get scale intervals
    const intervals = MUSICAL_SCALES[this.scale];
    const notesPerOctave = intervals.length;

    // Calculate which note in the scale
    const octave = Math.floor(scaleDegree);
    const noteIndex = Math.floor((scaleDegree % 1) * notesPerOctave);

    // Calculate frequency
    const scaleInterval = intervals[noteIndex];
    const octaveMultiplier = Math.pow(2, octave);

    return this.rootFrequency * scaleInterval * octaveMultiplier;
  }

  /**
   * Map X position to stereo pan (-1 to 1)
   */
  private positionToPan(x: number): number {
    const normalized = this.normalize(x, this.bounds.min.x, this.bounds.max.x);
    return normalized * 2 - 1; // Map 0-1 to -1-1
  }

  /**
   * Map Z position to filter cutoff frequency
   */
  private positionToFilter(z: number): number {
    const normalized = this.normalize(z, this.bounds.min.z, this.bounds.max.z);

    // Exponential mapping for more natural filter sweep
    const minLog = Math.log(FILTER_RANGE.min);
    const maxLog = Math.log(FILTER_RANGE.max);
    const logValue = minLog + normalized * (maxLog - minLog);

    return Math.exp(logValue);
  }

  /**
   * Calculate amplitude based on distance from center
   * Particles near center are louder
   */
  private calculateAmplitude(x: number, y: number, z: number): number {
    // Calculate normalised distance from center of bounds
    const centerX = (this.bounds.min.x + this.bounds.max.x) / 2;
    const centerY = (this.bounds.min.y + this.bounds.max.y) / 2;
    const centerZ = (this.bounds.min.z + this.bounds.max.z) / 2;

    const dx = (x - centerX) / (this.bounds.max.x - this.bounds.min.x);
    const dy = (y - centerY) / (this.bounds.max.y - this.bounds.min.y);
    const dz = (z - centerZ) / (this.bounds.max.z - this.bounds.min.z);

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Inverse distance falloff (closer = louder)
    // Clamp to reasonable range
    const amplitude = 1 / (1 + distance * 2);
    return Math.max(0.1, Math.min(1.0, amplitude));
  }

  /**
   * Normalise value to 0-1 range with clamping
   */
  private normalize(value: number, min: number, max: number): number {
    const normalized = (value - min) / (max - min);
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Get note name from frequency
   */
  static frequencyToNote(frequency: number): Note {
    // Calculate semitones from A4 (440 Hz)
    const semitones = 12 * Math.log2(frequency / A4_FREQUENCY);
    const noteNumber = Math.round(semitones);

    // Calculate octave and note within octave
    const octaveOffset = Math.floor((noteNumber + 9) / 12);
    const octave = 4 + octaveOffset;
    const noteIndex = ((noteNumber % 12) + 12) % 12;

    const noteNames = ['A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯'];

    return {
      frequency,
      noteName: noteNames[noteIndex],
      octave
    };
  }

  /**
   * Update bounds (e.g., when switching attractors)
   */
  setBounds(bounds: Bounds): void {
    this.bounds = bounds;
  }

  /**
   * Update musical scale
   */
  setScale(scale: MusicalScale): void {
    this.scale = scale;
  }

  /**
   * Update root frequency
   */
  setRootFrequency(frequency: number): void {
    this.rootFrequency = frequency;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      bounds: this.bounds,
      scale: this.scale,
      rootFrequency: this.rootFrequency
    };
  }
}
