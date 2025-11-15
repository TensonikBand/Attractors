// Audio Synthesis System for Strange Attractors

class AudioSystem {
    constructor(numVoices = 8) {
        this.numVoices = numVoices;
        this.audioContext = null;
        this.masterGain = null;
        this.compressor = null;
        this.reverb = null;
        this.voices = [];
        this.isInitialized = false;
        this.isPlaying = false;
        
        // Musical scale for quantization (Pentatonic minor)
        this.scale = [
            261.63, // C4
            293.66, // D4
            311.13, // Eb4
            392.00, // G4
            440.00, // A4
            523.25, // C5
            587.33, // D5
            622.25, // Eb5
            783.99, // G5
            880.00  // A5
        ];
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5;

            // Create compressor to prevent clipping
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // Create reverb
            await this.createReverb();

            // Connect audio chain
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.reverb);
            this.reverb.connect(this.audioContext.destination);

            // Create voices
            this.createVoices();

            this.isInitialized = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            throw error;
        }
    }

    async createReverb() {
        // Create convolver for reverb
        this.reverb = this.audioContext.createConvolver();
        
        // Generate impulse response (simple reverb)
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2; // 2 second reverb
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        const leftChannel = impulse.getChannelData(0);
        const rightChannel = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - i / length, 3);
            leftChannel[i] = (Math.random() * 2 - 1) * decay;
            rightChannel[i] = (Math.random() * 2 - 1) * decay;
        }
        
        this.reverb.buffer = impulse;
        
        // Create dry/wet mix
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0.2; // 20% wet
        
        this.dryGain = this.audioContext.createGain();
        this.dryGain.gain.value = 0.8; // 80% dry
        
        // Reconnect with dry/wet
        this.masterGain.disconnect();
        this.masterGain.connect(this.dryGain);
        this.masterGain.connect(this.reverbGain);
        
        this.dryGain.connect(this.compressor);
        this.reverbGain.connect(this.reverb);
        this.reverb.connect(this.compressor);
    }

    createVoices() {
        for (let i = 0; i < this.numVoices; i++) {
            const voice = this.createVoice();
            this.voices.push(voice);
        }
    }

    createVoice() {
        // Oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;

        // Filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;

        // Gain
        const gain = this.audioContext.createGain();
        gain.gain.value = 0;

        // Panner for stereo positioning
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = 0;

        // Connect: oscillator -> filter -> gain -> panner -> master
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);

        // Start oscillator
        oscillator.start();

        return {
            oscillator,
            filter,
            gain,
            panner,
            active: false,
            currentFreq: 440,
            currentGain: 0
        };
    }

    async start() {
        if (!this.isInitialized) {
            await this.init();
        }

        // Resume audio context (required by browser autoplay policies)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;
        console.log('Audio playback started');
    }

    stop() {
        this.isPlaying = false;
        
        // Fade out all voices
        const now = this.audioContext.currentTime;
        this.voices.forEach(voice => {
            voice.gain.gain.cancelScheduledValues(now);
            voice.gain.gain.linearRampToValueAtTime(0, now + 0.1);
        });
        
        console.log('Audio playback stopped');
    }

    update(particles) {
        if (!this.isPlaying || !particles || particles.length === 0) return;

        const now = this.audioContext.currentTime;
        const rampTime = 0.02; // 20ms ramp for smooth transitions

        // Select DIVERSE particles instead of just nearest ones
        const diverseParticles = this.selectDiverseParticles(particles, this.voices.length);

        diverseParticles.forEach((particle, i) => {
            if (i >= this.voices.length) return;

            const voice = this.voices[i];

            // Map Y position to frequency (height -> pitch)
            let targetFreq = this.mapYToFrequency(particle.y, i); // Pass voice index for variation
            
            // Add subtle per-voice vibrato for organic feel (±5 cents)
            const vibratoRate = 4 + i * 0.3; // Different vibrato rate per voice
            const vibratoDepth = 0.003; // About 5 cents
            const vibrato = 1 + Math.sin(now * vibratoRate + i) * vibratoDepth;
            targetFreq *= vibrato;
            
            // Only update if frequency changed significantly
            if (Math.abs(targetFreq - voice.currentFreq) > 1) {
                voice.oscillator.frequency.exponentialRampToValueAtTime(
                    targetFreq,
                    now + rampTime
                );
                voice.currentFreq = targetFreq;
            }

            // Map velocity to amplitude (speed -> volume)
            const velocity = Math.sqrt(
                particle.vx * particle.vx +
                particle.vy * particle.vy +
                particle.vz * particle.vz
            );
            
            // Vary gain per voice for more dynamics
            const targetGain = this.mapVelocityToGain(velocity, i);
            
            // Smooth gain transitions (more sensitive now)
            if (Math.abs(targetGain - voice.currentGain) > 0.005) {
                voice.gain.gain.cancelScheduledValues(now);
                voice.gain.gain.linearRampToValueAtTime(
                    targetGain,
                    now + rampTime
                );
                voice.currentGain = targetGain;
            }

            // Map X position to stereo pan (left/right)
            const pan = this.mapXToPan(particle.x);
            voice.panner.pan.linearRampToValueAtTime(
                pan,
                now + rampTime
            );

            // Map Z position to filter cutoff (depth -> brightness)
            const filterFreq = this.mapZToFilter(particle.z);
            voice.filter.frequency.exponentialRampToValueAtTime(
                Math.max(200, filterFreq),
                now + rampTime
            );

            // Map velocity to filter resonance (movement -> resonance)
            const resonance = this.mapVelocityToResonance(velocity);
            voice.filter.Q.linearRampToValueAtTime(
                resonance,
                now + rampTime
            );
        });
    }

    selectDiverseParticles(particles, count) {
        // Instead of just nearest particles, select particles that are SPREAD OUT
        // This creates polyphonic variety
        
        if (particles.length <= count) return particles;

        const selected = [];
        
        // Strategy: Divide particles into spatial regions and pick one from each
        
        // Sort particles by Y position (height) for pitch diversity
        const sortedByY = [...particles].sort((a, b) => a.y - b.y);
        
        // Divide into sections and pick from each
        const sectionSize = Math.floor(sortedByY.length / count);
        
        for (let i = 0; i < count; i++) {
            const sectionStart = i * sectionSize;
            const sectionEnd = (i + 1) * sectionSize;
            const section = sortedByY.slice(sectionStart, sectionEnd);
            
            if (section.length > 0) {
                // Pick a random one from this section
                const randomIndex = Math.floor(Math.random() * section.length);
                selected.push(section[randomIndex]);
            }
        }
        
        return selected;
    }

    mapYToFrequency(y, voiceIndex = 0) {
        // Map Y position to musical scale
        // Thomas attractor typically ranges from -3 to 3 (not -10 to 10)
        // Let's handle both ranges gracefully
        
        let normalized;
        if (Math.abs(y) < 5) {
            // Smaller range attractor (Thomas, Aizawa)
            normalized = (y + 3) / 6; // -3 to 3 → 0 to 1
        } else {
            // Larger range attractor (Lorenz, Rössler)
            normalized = (y + 10) / 20; // -10 to 10 → 0 to 1
        }
        
        const clamped = Math.max(0, Math.min(1, normalized));
        
        // Map to scale index
        const baseScaleIndex = Math.floor(clamped * (this.scale.length - 1));
        
        // Add harmonic intervals based on voice index to create chords
        // This makes each voice play a different note in a chord
        const harmonicOffsets = [
            0,   // Root
            2,   // Third (2 scale degrees up)
            4,   // Fifth (4 scale degrees up)
            1,   // Second
            3,   // Fourth
            5,   // Sixth
            6,   // Seventh
            0,   // Octave root
            2,   // Octave third
            4    // Octave fifth
        ];
        
        const offset = harmonicOffsets[voiceIndex % harmonicOffsets.length];
        const finalIndex = Math.min(baseScaleIndex + offset, this.scale.length - 1);
        
        let frequency = this.scale[finalIndex];
        
        // Add octave spreading for more richness
        const octaveMultipliers = [
            1.0,    // Voice 0: Original octave
            2.0,    // Voice 1: One octave up
            1.0,    // Voice 2: Original
            0.5,    // Voice 3: One octave down
            1.5,    // Voice 4: Perfect fifth up (not full octave)
            1.0,    // Voice 5: Original
            2.0,    // Voice 6: One octave up
            0.75,   // Voice 7: Perfect fourth up from octave below
            1.0,    // Voice 8: Original
            2.5,    // Voice 9: Two octaves + major third
            1.25,   // Voice 10: Major third up
            0.667,  // Voice 11: Perfect fifth below
            1.5,    // Voice 12: Perfect fifth up
            0.5,    // Voice 13: Octave down
            2.0,    // Voice 14: Octave up
            1.33    // Voice 15: Major sixth up
        ];
        
        frequency *= octaveMultipliers[voiceIndex % octaveMultipliers.length];
        
        return frequency;
    }

    mapVelocityToGain(velocity, voiceIndex = 0) {
        // Velocity typically ranges from 0 to ~5
        // For Thomas attractor, velocities can be very small (0.01-0.5)
        // So we need better scaling
        
        const normalized = Math.min(velocity / 2, 1); // Divide by 2 instead of 3
        
        // Exponential scaling with minimum base volume
        const baseGain = 0.03; // Minimum audible volume
        const velocityGain = Math.pow(normalized, 1.5) * 0.12; // Gentler curve
        
        let totalGain = baseGain + velocityGain; // 0.03 to 0.15
        
        // Vary gain by voice for more texture (foreground vs background)
        const voiceGainMultipliers = [
            1.0,   // Voice 0: Full volume
            0.7,   // Voice 1: Background
            0.9,   // Voice 2: Mid
            0.6,   // Voice 3: Background
            0.85,  // Voice 4: Mid-front
            0.5,   // Voice 5: Deep background
            0.75,  // Voice 6: Mid-back
            0.55,  // Voice 7: Background
            0.8,   // Voice 8: Mid
            0.65,  // Voice 9: Mid-back
            0.9,   // Voice 10: Mid-front
            0.6,   // Voice 11: Background
            0.7,   // Voice 12: Mid-back
            0.8,   // Voice 13: Mid
            0.65,  // Voice 14: Mid-back
            0.75   // Voice 15: Mid-back
        ];
        
        totalGain *= voiceGainMultipliers[voiceIndex % voiceGainMultipliers.length];
        
        return totalGain;
    }

    mapXToPan(x) {
        // Map X position to stereo pan (-1 to 1)
        // Handle both small range (Thomas: -3 to 3) and large range (Lorenz: -10 to 10)
        let pan;
        if (Math.abs(x) < 5) {
            pan = x / 3; // Small range
        } else {
            pan = x / 10; // Large range
        }
        return Math.max(-1, Math.min(1, pan));
    }

    mapZToFilter(z) {
        // Map Z position to filter cutoff
        // Handle both small and large range attractors
        let normalized;
        if (Math.abs(z) < 5) {
            normalized = (z + 3) / 6; // -3 to 3 → 0 to 1
        } else {
            normalized = (z + 10) / 20; // -10 to 10 → 0 to 1
        }
        const clamped = Math.max(0, Math.min(1, normalized));
        
        // Logarithmic mapping for perceptually even brightness
        const minFreq = 300;
        const maxFreq = 8000;
        return minFreq * Math.pow(maxFreq / minFreq, clamped);
    }

    mapVelocityToResonance(velocity) {
        // More movement = more resonance (but not too much)
        const normalized = Math.min(velocity / 3, 1);
        return 1 + normalized * 4; // Range: 1 to 5
    }

    setMasterVolume(volume) {
        // Volume is 0-100
        const gain = volume / 100;
        
        if (this.masterGain) {
            const now = this.audioContext.currentTime;
            this.masterGain.gain.linearRampToValueAtTime(gain, now + 0.1);
        }
    }

    setNumVoices(count) {
        // Dispose old voices
        this.voices.forEach(voice => {
            voice.oscillator.stop();
            voice.oscillator.disconnect();
            voice.filter.disconnect();
            voice.gain.disconnect();
            voice.panner.disconnect();
        });
        
        // Create new voices
        this.voices = [];
        this.numVoices = count;
        this.createVoices();
    }

    setTimbre(type) {
        // Change oscillator type for all voices
        const validTypes = ['sine', 'square', 'sawtooth', 'triangle'];
        if (!validTypes.includes(type)) return;
        
        this.voices.forEach(voice => {
            voice.oscillator.type = type;
        });
    }

    updateAttractorType(type) {
        // Different attractors might benefit from different timbres
        switch(type) {
            case 'thomas':
                this.setTimbre('sine');
                break;
            case 'lorenz':
                this.setTimbre('triangle');
                break;
            case 'rossler':
                this.setTimbre('sawtooth');
                break;
            case 'aizawa':
                this.setTimbre('sine');
                break;
            default:
                this.setTimbre('sine');
        }
    }

    dispose() {
        this.stop();
        
        // Stop and disconnect all voices
        this.voices.forEach(voice => {
            voice.oscillator.stop();
            voice.oscillator.disconnect();
            voice.filter.disconnect();
            voice.gain.disconnect();
            voice.panner.disconnect();
        });
        
        // Disconnect audio chain
        if (this.masterGain) this.masterGain.disconnect();
        if (this.compressor) this.compressor.disconnect();
        if (this.reverb) this.reverb.disconnect();
        if (this.reverbGain) this.reverbGain.disconnect();
        if (this.dryGain) this.dryGain.disconnect();
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSystem;
}
