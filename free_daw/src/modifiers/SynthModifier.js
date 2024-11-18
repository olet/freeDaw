import Modifier from '../core/Modifier';

class SynthModifier extends Modifier {
    constructor(synthType = 'piano') {
        super('synth', { synthType });
    }

    apply(pattern, time, state) {
        // 音色修改器不改变pattern，只是标记音色信息
        pattern.synthType = this.params.synthType;
        return pattern;
    }
}

export default SynthModifier; 