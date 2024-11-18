class AudioManager {
    constructor() {
        this.synth = null;
        this.isInitialized = false;
        this.activeNotes = new Set();
        console.log('[AudioManager] Created');
    }

    async init() {
        console.log('[AudioManager] Initializing...');
        try {
            await this.cleanup();

            const synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: {
                    type: "custom",
                    partials: [
                        1,
                        0.8,
                        0.5,
                        0.4,
                        0.3,
                        0.2,
                        0.1,
                        0.05
                    ],
                },
                envelope: {
                    attack: 0.002,
                    decay: 2.5,
                    sustain: 0.3,
                    release: 3,
                    attackCurve: 'exponential',
                    releaseCurve: 'exponential'
                },
                volume: -12
            });

            const effects = {
                stereoWidener: new Tone.StereoWidener({
                    width: 0.5
                }),
                chorus: new Tone.Chorus({
                    frequency: 1.5,
                    delayTime: 3.5,
                    depth: 0.3,
                    wet: 0.2
                }).start(),
                reverb: new Tone.Reverb({
                    decay: 3,
                    preDelay: 0.01,
                    wet: 0.2
                }),
                compressor: new Tone.Compressor({
                    threshold: -20,
                    ratio: 3,
                    attack: 0.003,
                    release: 0.25
                }),
                eq: new Tone.EQ3({
                    low: -3,
                    mid: 2,
                    high: 1,
                    lowFrequency: 250,
                    highFrequency: 2500
                })
            };

            synth.chain(
                effects.stereoWidener,
                effects.chorus,
                effects.eq,
                effects.reverb,
                effects.compressor,
                Tone.Destination
            );

            this.synth = synth;
            await Tone.loaded();
            this.isInitialized = true;
            console.log('[AudioManager] Initialized successfully', this.synth);
            return true;
        } catch (err) {
            console.error('[AudioManager] Initialization error:', err);
            this.isInitialized = false;
            throw err;
        }
    }

    playNote(note, velocity) {
        if (!this.isInitialized || !this.synth || this.synth.disposed) {
            console.warn('[AudioManager] Cannot play note - synth not ready');
            return false;
        }

        try {
            const note_freq = Tone.Frequency(note, "midi");
            this.synth.triggerAttack(note_freq, Tone.now(), velocity);
            this.activeNotes.add(note);
            console.log('[AudioManager] Note played:', note, 'velocity:', velocity);
            return true;
        } catch (err) {
            console.error('[AudioManager] Error playing note:', err);
            return false;
        }
    }

    releaseNote(note) {
        if (!this.isInitialized || !this.synth || this.synth.disposed) {
            console.warn('[AudioManager] Cannot release note - synth not ready');
            return false;
        }

        try {
            const note_freq = Tone.Frequency(note, "midi");
            this.synth.triggerRelease(note_freq);
            this.activeNotes.delete(note);
            console.log('[AudioManager] Note released:', note);
            return true;
        } catch (err) {
            console.error('[AudioManager] Error releasing note:', err);
            return false;
        }
    }

    pauseAll() {
        console.log('[AudioManager] Pausing all audio');
        if (this.synth && !this.synth.disposed) {
            this.activeNotes.forEach(note => {
                const note_freq = Tone.Frequency(note, "midi");
                this.synth.triggerRelease(note_freq, '+0');
            });
            this.activeNotes.clear();
            Tone.getContext().rawContext.suspend();
        }
    }

    resumeAll() {
        console.log('[AudioManager] Resuming audio');
        if (this.synth && !this.synth.disposed) {
            Tone.getContext().rawContext.resume();
        }
    }

    async cleanup() {
        console.log('[AudioManager] Cleaning up...');
        try {
            if (this.synth) {
                if (!this.synth.disposed) {
                    this.activeNotes.forEach(note => {
                        const note_freq = Tone.Frequency(note, "midi");
                        this.synth.triggerRelease(note_freq);
                    });
                    await new Promise(resolve => setTimeout(resolve, 100));
                    this.synth.dispose();
                }
                this.synth = null;
            }
            this.activeNotes.clear();
            this.isInitialized = false;
            console.log('[AudioManager] Cleanup completed');
        } catch (err) {
            console.error('[AudioManager] Cleanup error:', err);
            throw err;
        }
    }

    releaseAll() {
        if (this.synth && !this.synth.disposed) {
            this.synth.releaseAll();
            this.activeNotes.clear();
        }
    }
}

export default AudioManager; 