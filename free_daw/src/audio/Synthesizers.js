import * as Tone from 'tone';

// 导入所有预设
import kickPreset from '../presets/drums/kick.js';
import snarePreset from '../presets/drums/snare.js';
import hihatPreset from '../presets/drums/hihat.js';
import pianoPreset from '../presets/piano/basic.js';

class Synthesizer {
    constructor(type, options = {}) {
        this.type = type;
        
        switch (type) {
            case 'membrane':
                this.synth = new Tone.MembraneSynth(options);
                break;
            case 'noise':
                this.synth = new Tone.NoiseSynth(options);
                break;
            case 'metal':
                this.synth = new Tone.MetalSynth(options);
                break;
            case 'piano':
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    maxPolyphony: 32,  
                    voice: Tone.Synth,
                    options: {
                        ...options,
                        oscillator: {
                            type: 'triangle'
                        },
                        envelope: {
                            attack: 0.005,
                            decay: 0.1,
                            sustain: 0.3,
                            release: 1
                        }
                    }
                });
                break;
            default:
                throw new Error(`Unknown synthesizer type: ${type}`);
        }
    }

    trigger(time, velocity = 1.0, note = 'C4') {
        try {
            let duration = '16n';
            const triggerTime = Math.max(time, Tone.now());
            
            switch (this.type) {
                case 'noise':
                    this.synth.triggerAttackRelease(duration, triggerTime, velocity);
                    break;
                case 'membrane':
                    this.synth.triggerAttackRelease('C1', duration, triggerTime, velocity);
                    break;
                case 'metal':
                    this.synth.triggerAttackRelease(duration, triggerTime, velocity);
                    break;
                case 'piano':
                    this.synth.triggerAttackRelease(note, '4n', triggerTime, velocity);
                    break;
            }
        } catch (error) {
            console.error('Trigger error:', error);
        }
    }

    dispose() {
        if (this.synth) {
            this.synth.dispose();
            this.synth = null;
        }
    }

    setParameter(param, value) {
        if (this.synth && this.synth[param]) {
            if (typeof this.synth[param] === 'object') {
                this.synth[param].value = value;
            } else {
                this.synth[param] = value;
            }
        }
    }

    getParameter(param) {
        if (this.synth && this.synth[param]) {
            return typeof this.synth[param] === 'object' 
                ? this.synth[param].value 
                : this.synth[param];
        }
        return null;
    }
}

// 导出预设映射
export const SYNTH_PRESETS = {
    kick: kickPreset,
    snare: snarePreset,
    hihat: hihatPreset,
    piano: pianoPreset
};

export { Synthesizer }; 