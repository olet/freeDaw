export default {
    type: 'membrane',
    options: {
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: {
            attack: 0.001,
            decay: 0.2,
            sustain: 0,
            release: 0.2
        }
    }
} 