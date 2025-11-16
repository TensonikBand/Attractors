/**
 * Granular Voice
 * Generates overlapping audio grains
 */

import {
  GranularVoiceConfig,
  GrainEnvelope,
  SpatialAudioParams
} from './types';

export class GranularVoice {
  private context: AudioContext;
  private config: GranularVoiceConfig;
  private masterGain: GainNode;
  private filter: BiquadFilterNode;
  private panner: StereoPannerNode;

  private grainScheduler: number | null = null;
  private lastGrainTime: number = 0;
  private currentParams: SpatialAudioParams | null = null;

  private isActive: boolean = false;

  constructor(context: AudioContext, config: GranularVoiceConfig) {
    this.context = context;
    this.config = config;

    // Create audio graph
    this.masterGain = context.createGain();
    this.filter = context.createBiquadFilter();
    this.panner = context.createStereoPanner();

    // Configure filter
    this.filter.type = 'lowpass';
    this.filter.Q.value = 1.0;

    // Connect audio graph: grain → filter → panner → masterGain → destination
    this.filter.connect(this.panner);
    this.panner.connect(this.masterGain);

    this.masterGain.gain.value = 0;
  }

  /**
   * Connect this voice to an audio destination
   */
  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  /**
   * Start generating grains
   */
  start(params: SpatialAudioParams): void {
    if (this.isActive) {
      this.updateParams(params);
      return;
    }

    this.isActive = true;
    this.currentParams = params;
    this.lastGrainTime = this.context.currentTime;

    // Fade in master gain
    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.setValueAtTime(0, this.context.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(
      params.amplitude,
      this.context.currentTime + 0.05
    );

    // Start grain scheduler
    this.scheduleNextGrains();
  }

  /**
   * Stop generating grains
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // Fade out
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);

    // Clear scheduler
    if (this.grainScheduler !== null) {
      clearTimeout(this.grainScheduler);
      this.grainScheduler = null;
    }
  }

  /**
   * Update spatial parameters
   */
  updateParams(params: SpatialAudioParams): void {
    if (!this.isActive) return;

    const now = this.context.currentTime;
    const rampTime = 0.05; // 50ms smooth transitions

    // Update filter cutoff
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    this.filter.frequency.linearRampToValueAtTime(params.filterCutoff, now + rampTime);

    // Update pan
    this.panner.pan.cancelScheduledValues(now);
    this.panner.pan.setValueAtTime(this.panner.pan.value, now);
    this.panner.pan.linearRampToValueAtTime(params.pan, now + rampTime);

    // Update amplitude
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(params.amplitude, now + rampTime);

    this.currentParams = params;
  }

  /**
   * Schedule next batch of grains
   */
  private scheduleNextGrains(): void {
    if (!this.isActive || !this.currentParams) return;

    const now = this.context.currentTime;
    const spacingSeconds = this.config.grainSpacing / 1000;

    // Schedule grain if enough time has passed
    if (now >= this.lastGrainTime + spacingSeconds) {
      this.generateGrain(this.currentParams);
      this.lastGrainTime = now;
    }

    // Schedule next check
    this.grainScheduler = window.setTimeout(
      () => this.scheduleNextGrains(),
      this.config.grainSpacing / 2 // Check at 2x grain rate for precision
    );
  }

  /**
   * Generate a single grain
   */
  private generateGrain(params: SpatialAudioParams): void {
    const now = this.context.currentTime;
    const durationSeconds = this.config.grainDuration / 1000;

    // Add pitch variation
    const pitchVariationCents = (Math.random() - 0.5) * 2 * this.config.pitchVariation;
    const pitchMultiplier = Math.pow(2, pitchVariationCents / 1200);
    const frequency = params.frequency * pitchMultiplier;

    // Create oscillator for this grain
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    // Create grain envelope
    const grainGain = this.context.createGain();
    this.applyEnvelope(grainGain.gain, now, durationSeconds, this.config.envelopeType);

    // Connect grain: osc → grainGain → filter (which connects to rest of chain)
    osc.connect(grainGain);
    grainGain.connect(this.filter);

    // Start and stop grain
    osc.start(now);
    osc.stop(now + durationSeconds);

    // Clean up after grain finishes
    osc.onended = () => {
      grainGain.disconnect();
      osc.disconnect();
    };
  }

  /**
   * Apply envelope to grain gain parameter
   */
  private applyEnvelope(
    gainParam: AudioParam,
    startTime: number,
    duration: number,
    envelope: GrainEnvelope
  ): void {
    const peakAmplitude = 0.08; // Lower amplitude for smoother, less harsh sound

    gainParam.cancelScheduledValues(startTime);

    switch (envelope) {
      case 'hann':
        // Hann window (cosine taper)
        this.applyHannEnvelope(gainParam, startTime, duration, peakAmplitude);
        break;

      case 'gaussian':
        // Gaussian approximation
        this.applyGaussianEnvelope(gainParam, startTime, duration, peakAmplitude);
        break;

      case 'triangle':
        // Linear attack and release
        gainParam.setValueAtTime(0, startTime);
        gainParam.linearRampToValueAtTime(peakAmplitude, startTime + duration / 2);
        gainParam.linearRampToValueAtTime(0, startTime + duration);
        break;

      case 'trapezoid':
        // Attack, sustain, release
        const attackTime = duration * 0.2;
        const releaseTime = duration * 0.2;
        gainParam.setValueAtTime(0, startTime);
        gainParam.linearRampToValueAtTime(peakAmplitude, startTime + attackTime);
        gainParam.setValueAtTime(peakAmplitude, startTime + duration - releaseTime);
        gainParam.linearRampToValueAtTime(0, startTime + duration);
        break;
    }
  }

  /**
   * Apply Hann window envelope (smooth, bell-shaped)
   */
  private applyHannEnvelope(
    gainParam: AudioParam,
    startTime: number,
    duration: number,
    amplitude: number
  ): void {
    // Approximate Hann window with exponential curves
    gainParam.setValueAtTime(0.001, startTime);
    gainParam.exponentialRampToValueAtTime(amplitude, startTime + duration / 2);
    gainParam.exponentialRampToValueAtTime(0.001, startTime + duration);
  }

  /**
   * Apply Gaussian envelope approximation
   */
  private applyGaussianEnvelope(
    gainParam: AudioParam,
    startTime: number,
    duration: number,
    amplitude: number
  ): void {
    // Use exponential ramps to approximate Gaussian
    const segments = 10;
    const segmentDuration = duration / segments;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const time = startTime + i * segmentDuration;

      // Gaussian curve: e^(-(x-0.5)^2 / (2*sigma^2))
      const sigma = 0.2;
      const x = t - 0.5;
      const value = Math.max(0.001, amplitude * Math.exp(-(x * x) / (2 * sigma * sigma)));

      if (i === 0) {
        gainParam.setValueAtTime(value, time);
      } else {
        gainParam.exponentialRampToValueAtTime(value, time);
      }
    }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<GranularVoiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if voice is currently active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Dispose of audio resources
   */
  dispose(): void {
    this.stop();
    this.masterGain.disconnect();
    this.filter.disconnect();
    this.panner.disconnect();
  }
}
