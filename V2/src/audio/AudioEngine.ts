/**
 * Audio Engine
 * Manages voice pool and spatial audio
 */

import { GranularVoice } from './GranularVoice';
import { AudioSpatialMapper } from './AudioSpatialMapper';
import {
  AudioEngineConfig,
  AudioState,
  DEFAULT_AUDIO_CONFIG,
  MusicalScale
} from './types';
import { Bounds } from '../attractors/types';

export class AudioEngine {
  private context: AudioContext | null = null;
  private config: AudioEngineConfig;
  private voices: GranularVoice[] = [];
  private spatialMapper: AudioSpatialMapper | null = null;

  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private convolver: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  private updateTimer: number | null = null;
  private state: AudioState = {
    isPlaying: false,
    isMuted: false,
    masterVolume: DEFAULT_AUDIO_CONFIG.masterVolume,
    activeVoices: 0
  };

  constructor(config: Partial<AudioEngineConfig> = {}) {
    this.config = { ...DEFAULT_AUDIO_CONFIG, ...config };
  }

  /**
   * Initialise audio context and voice pool
   * Must be called after user gesture (browser autoplay policy)
   */
  async initialize(bounds: Bounds, scale: MusicalScale = 'pentatonic_minor'): Promise<void> {
    if (this.context) return; // Already initialised

    // Create audio context
    this.context = new AudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    // Create spatial mapper
    this.spatialMapper = new AudioSpatialMapper(bounds, scale);

    // Create master audio chain
    this.masterGain = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();

    // Configure compressor (prevents clipping with multiple voices)
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Create convolution reverb
    this.convolver = this.context.createConvolver();
    await this.createReverbImpulse();

    // Set up audio routing:
    // voices → masterGain → [dry → compressor, wet → convolver → compressor] → destination
    this.masterGain.connect(this.dryGain);
    this.masterGain.connect(this.wetGain);
    this.dryGain.connect(this.compressor);
    this.wetGain.connect(this.convolver);
    this.convolver.connect(this.compressor);
    this.compressor.connect(this.context.destination);

    // Set initial levels
    this.masterGain.gain.value = this.config.masterVolume;
    this.updateReverbMix(this.config.reverbMix);

    // Create voice pool
    this.voices = [];
    for (let i = 0; i < this.config.numVoices; i++) {
      const voice = new GranularVoice(this.context, this.config.voiceConfig);
      voice.connect(this.masterGain);
      this.voices.push(voice);
    }
  }

  /**
   * Start audio engine
   */
  async start(): Promise<void> {
    if (!this.context || !this.spatialMapper) {
      throw new Error('AudioEngine not initialized. Call initialize() first.');
    }

    if (this.state.isPlaying) return;

    // Resume context if needed
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.state.isPlaying = true;

    // Start periodic update timer
    this.updateTimer = window.setInterval(
      () => this.updateVoices(),
      this.config.updateInterval
    );
  }

  /**
   * Stop audio engine
   */
  stop(): void {
    if (!this.state.isPlaying) return;

    this.state.isPlaying = false;

    // Stop update timer
    if (this.updateTimer !== null) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    // Stop all voices
    this.voices.forEach(voice => voice.stop());
    this.state.activeVoices = 0;
  }

  /**
   * Update voices with particle positions
   * Called periodically to sample particles and update audio
   */
  updateWithPositions(positions: Float32Array, particleCount: number): void {
    if (!this.state.isPlaying || !this.spatialMapper) return;

    // Sample N random particles (where N = numVoices)
    const sampledPositions: Array<{ x: number; y: number; z: number }> = [];

    for (let i = 0; i < this.config.numVoices; i++) {
      // Random particle index
      const particleIndex = Math.floor(Math.random() * particleCount);
      const offset = particleIndex * 4; // RGBA (x, y, z, w)

      sampledPositions.push({
        x: positions[offset + 0],
        y: positions[offset + 1],
        z: positions[offset + 2]
      });
    }

    // Map positions to audio parameters and update voices
    sampledPositions.forEach((pos, index) => {
      const params = this.spatialMapper!.mapPosition(pos.x, pos.y, pos.z);

      const voice = this.voices[index];
      if (voice.getIsActive()) {
        voice.updateParams(params);
      } else {
        voice.start(params);
        this.state.activeVoices++;
      }
    });
  }

  /**
   * Internal update loop (delegates to particle system integration)
   */
  private updateVoices(): void {
    // This is called by the timer but actual updates happen via updateWithPositions()
    // Just track active voice count
    this.state.activeVoices = this.voices.filter(v => v.getIsActive()).length;
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume));

    if (this.masterGain) {
      const now = this.context!.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(
        this.state.isMuted ? 0 : this.state.masterVolume,
        now + 0.05
      );
    }
  }

  /**
   * Mute/unmute
   */
  setMuted(muted: boolean): void {
    this.state.isMuted = muted;

    if (this.masterGain) {
      const now = this.context!.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(
        muted ? 0 : this.state.masterVolume,
        now + 0.05
      );
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.setMuted(!this.state.isMuted);
  }

  /**
   * Set reverb mix (0 = dry, 1 = wet)
   */
  setReverbMix(mix: number): void {
    this.config.reverbMix = Math.max(0, Math.min(1, mix));
    this.updateReverbMix(this.config.reverbMix);
  }

  /**
   * Update dry/wet gain values
   */
  private updateReverbMix(mix: number): void {
    if (!this.dryGain || !this.wetGain || !this.context) return;

    const now = this.context.currentTime;

    // Equal power crossfade
    const dryGain = Math.cos(mix * Math.PI / 2);
    const wetGain = Math.sin(mix * Math.PI / 2);

    this.dryGain.gain.cancelScheduledValues(now);
    this.dryGain.gain.setValueAtTime(this.dryGain.gain.value, now);
    this.dryGain.gain.linearRampToValueAtTime(dryGain, now + 0.05);

    this.wetGain.gain.cancelScheduledValues(now);
    this.wetGain.gain.setValueAtTime(this.wetGain.gain.value, now);
    this.wetGain.gain.linearRampToValueAtTime(wetGain, now + 0.05);
  }

  /**
   * Change musical scale
   */
  setScale(scale: MusicalScale): void {
    if (this.spatialMapper) {
      this.spatialMapper.setScale(scale);
    }
  }

  /**
   * Update bounds (e.g., when switching attractors)
   */
  setBounds(bounds: Bounds): void {
    if (this.spatialMapper) {
      this.spatialMapper.setBounds(bounds);
    }
  }

  /**
   * Get current state
   */
  getState(): AudioState {
    return { ...this.state };
  }

  /**
   * Get audio context (for advanced usage)
   */
  getContext(): AudioContext | null {
    return this.context;
  }

  /**
   * Create reverb impulse response
   * Generates a simple algorithmic reverb
   */
  private async createReverbImpulse(): Promise<void> {
    if (!this.context || !this.convolver) return;

    const sampleRate = this.context.sampleRate;
    const length = sampleRate * 2; // 2 second reverb
    const impulse = this.context.createBuffer(2, length, sampleRate);

    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);

    // Generate exponentially decaying noise
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.5)); // 0.5s decay time
      leftChannel[i] = (Math.random() * 2 - 1) * decay;
      rightChannel[i] = (Math.random() * 2 - 1) * decay;
    }

    this.convolver.buffer = impulse;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();

    this.voices.forEach(voice => voice.dispose());
    this.voices = [];

    if (this.masterGain) this.masterGain.disconnect();
    if (this.compressor) this.compressor.disconnect();
    if (this.convolver) this.convolver.disconnect();
    if (this.dryGain) this.dryGain.disconnect();
    if (this.wetGain) this.wetGain.disconnect();

    if (this.context) {
      this.context.close();
      this.context = null;
    }

    this.spatialMapper = null;
  }
}
