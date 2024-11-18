class Clip {
    constructor(id) {
        this.id = id;
        this.pattern = []; // 基础音乐模式
        this.modifiers = []; // modifier链
        this.state = {}; // 运行时状态
    }

    // 添加modifier
    addModifier(modifier) {
        this.modifiers.push(modifier);
        return this;
    }

    // 处理音乐数据
    process(time) {
        // 创建一个新的对象，包含所有必要的属性
        const result = {
            pattern: [...this.pattern.pattern],
            length: this.pattern.length,
            modifiers: this.modifiers,
            synthType: this.modifiers.find(m => m.type === 'synth')?.params.synthType || 'piano'
        };
        
        // 依次应用所有modifier
        for (const modifier of this.modifiers) {
            const modified = modifier.apply(result, time, this.state);
            // 保持原有的属性
            result.pattern = modified.pattern;
            result.length = modified.length;
        }
        return result;
    }
}

export default Clip; 