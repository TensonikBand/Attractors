/**
 * Audio System Exports
 */

export { AudioEngine } from './AudioEngine';
export { AudioSpatialMapper } from './AudioSpatialMapper';
export { GranularVoice } from './GranularVoice';

export type {
  MusicalScale,
  GrainEnvelope,
  GrainConfig,
  GranularVoiceConfig,
  AudioEngineConfig,
  SpatialAudioParams,
  Note,
  AudioState
} from './types';

export {
  DEFAULT_VOICE_CONFIG,
  DEFAULT_AUDIO_CONFIG,
  MUSICAL_SCALES,
  A4_FREQUENCY,
  FREQUENCY_RANGE,
  FILTER_RANGE
} from './types';
