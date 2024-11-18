class RhythmPattern {
    constructor(beats = 4, division = 4) {
        this.beats = beats;          // 小节拍数
        this.division = division;    // 每拍细分数
        this.pattern = new Array(beats * division).fill(0);
    }

    // 设置某个位置的力度值(0-1)
    setVelocity(position, velocity) {
        if (position >= 0 && position < this.pattern.length) {
            this.pattern[position] = velocity;
        }
    }

    // 获取总步数
    get length() {
        return this.pattern.length;
    }

    // 克隆当前模式
    clone() {
        const newPattern = new RhythmPattern(this.beats, this.division);
        newPattern.pattern = [...this.pattern];
        return newPattern;
    }
}

export default RhythmPattern; 