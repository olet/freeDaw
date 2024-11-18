import Modifier from '../core/Modifier';

class DensityModifier extends Modifier {
    constructor(density = 1.0) {
        super('density', { density });
    }

    apply(pattern, time, state) {
        const result = {
            pattern: [...pattern.pattern],
            length: pattern.length,
            modifiers: pattern.modifiers,
            synthType: pattern.synthType
        };

        const density = this.params.density;
        if (density <= 1) return result;

        // 在现有节奏点之间插入新的节奏点
        for (let i = 0; i < result.length; i++) {
            if (result.pattern[i] > 0) {
                const nextBeat = this.findNextBeat(result.pattern, i);
                if (nextBeat > i) {
                    const midPoint = Math.floor((i + nextBeat) / 2);
                    result.pattern[midPoint] = result.pattern[i] * 0.8;
                }
            }
        }

        return result;
    }

    findNextBeat(pattern, currentPos) {
        for (let i = currentPos + 1; i < pattern.length; i++) {
            if (pattern[i] > 0) return i;
        }
        return pattern.length;
    }
}

export default DensityModifier; 