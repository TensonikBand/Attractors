/**
 * Audio System Types
 * Granular Synthesis for Strange Attractors
 */

/**
 * Musical scales for pitch mapping
 */
export type MusicalScale =
  | 'pentatonic_minor'
  | 'pentatonic_major'
  | 'chromatic'
  | 'harmonic_minor'
  | 'whole_tone';

/**
 * Grain envelope shape
 */
export type GrainEnvelope = 'hann' | 'gaussian' | 'triangle' | 'trapezoid';

/**
 * Configuration for a single grain
 */
export interface GrainConfig {
  frequency: number;        // Hz
  duration: number;         // seconds
  amplitude: number;        // 0-1
  pan: number;              // -1 to 1
  envelope: GrainEnvelope;
  startTime: number;        // AudioContext time
}

/**
 * Granular voice configuration
 */
export interface GranularVoiceConfig {
  grainDuration: number;    // Duration of each grain (ms)
  grainSpacing: number;     // Time between grain onsets (ms)
  grainsPerVoice: number;   // Number of overlapping grains
  pitchVariation: number;   // Random pitch variation (cents)
  envelopeType: GrainEnvelope;
}

/**
 * Audio engine configuration
 */
export interface AudioEngineConfig {
  numVoices: number;        // Number of granular voices
  masterVolume: number;     // 0-1
  reverbMix: number;        // 0-1 (dry/wet)
  updateInterval: number;   // ms between spatial updates
  voiceConfig: GranularVoiceConfig;
}

/**
 * Spatial audio parameters derived from particle position
 */
export interface SpatialAudioParams {
  frequency: number;        // Base frequency (Hz)
  pan: number;              // Stereo position (-1 to 1)
  filterCutoff: number;     // Filter frequency (Hz)
  amplitude: number;        // Volume (0-1)
}

/**
 * Musical note information
 */
export interface Note {
  frequency: number;
  noteName: string;
  octave: number;
}

/**
 * Audio context state
 */
export interface AudioState {
  isPlaying: boolean;
  isMuted: boolean;
  masterVolume: number;
  activeVoices: number;
}

/**
 * Default configurations
 */
export const DEFAULT_VOICE_CONFIG: GranularVoiceConfig = {
  grainDuration: 400,       // Longer grains for smoother, more sustained sound
  grainSpacing: 150,        // Moderate overlap for continuity
  grainsPerVoice: 6,        // More overlapping grains for richer texture
  pitchVariation: 2,        // Minimal pitch variation for stability
  envelopeType: 'hann'      // Smooth hann window
};

export const DEFAULT_AUDIO_CONFIG: AudioEngineConfig = {
  numVoices: 1,             // Single voice for clarity
  masterVolume: 0.5,
  reverbMix: 0.3,
  updateInterval: 200,      // Update audio params 5x per second (slower)
  voiceConfig: DEFAULT_VOICE_CONFIG
};

/**
 * Musical scale definitions (frequency ratios from root)
 */
export const MUSICAL_SCALES: Record<MusicalScale, number[]> = {
  pentatonic_minor: [1, 6/5, 4/3, 3/2, 9/5],           // 1-♭3-4-5-♭7
  pentatonic_major: [1, 9/8, 5/4, 3/2, 5/3],           // 1-2-3-5-6
  chromatic: [1, 16/15, 9/8, 6/5, 5/4, 4/3, 7/5, 3/2, 8/5, 5/3, 9/5, 15/8], // All 12 semitones
  harmonic_minor: [1, 9/8, 6/5, 4/3, 3/2, 8/5, 15/8],  // 1-2-♭3-4-5-♭6-7
  whole_tone: [1, 9/8, 5/4, 45/32, 3/2, 27/16]         // 1-2-3-#4-#5-#6
};

/**
 * Base frequency for A4 (440 Hz)
 */
export const A4_FREQUENCY = 440;

/**
 * Frequency range for spatial mapping
 */
export const FREQUENCY_RANGE = {
  min: 110,   // A2
  max: 880    // A5
};

/**
 * Filter cutoff range
 */
export const FILTER_RANGE = {
  min: 200,   // Hz
  max: 8000   // Hz
};
