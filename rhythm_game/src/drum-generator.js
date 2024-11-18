class DrumGenerator {
    constructor() {
        // 定义6个鼓轨（从低到高的MIDI音符）
        this.drumTracks = {
            kick: 36,      // 底鼓 (C1)
            snare: 38,     // 军鼓 (D1)
            hihat1: 42,    // 闭合踩镲 (F#1)
            hihat2: 46,    // 开放踩镲 (A#1)
            tom1: 45,      // 中音鼓 (A1)
            tom2: 43       // 高音鼓 (G1)
        };

        // 修改节奏模式，添加时值信息 [触发, 时值]
        this.rhythmPatterns = {
            kick: [
                [[1,4],0,0,0, 0,0,0,0, [1,4],0,0,0, 0,0,0,0],  // 基本二拍，长音
                [[1,2],0,0,0, [1,2],0,0,0, 0,0,0,0, 0,0,0,0],  // 前重型，中等音
                [[1,8],0,0,0, 0,0,0,0, 0,0,0,0, [1,8],0,0,0]   // 首尾型，短音
            ],
            snare: [
                [0,0,0,0, [1,4],0,0,0, 0,0,0,0, [1,4],0,0,0],  // 基本后拍，长音
                [0,0,0,0, [1,2],0,0,0, 0,0,0,0, 0,0,0,0],      // 单打，中等音
                [0,0,0,0, 0,0,0,0, 0,0,0,0, [1,8],0,0,0]       // 结尾型，短音
            ],
            hihat1: [
                [[1,16],0,0,0, [1,16],0,0,0, [1,16],0,0,0, [1,16],0,0,0],  // 基本四拍，短音
                [[1,8],0,0,0, 0,0,0,0, [1,8],0,0,0, 0,0,0,0],              // 简单型，中短音
                [0,0,[1,4],0, 0,0,[1,4],0, 0,0,0,0, 0,0,0,0]               // 切分型，长音
            ],
            hihat2: [
                [0,0,0,0, 0,0,[1,2],0, 0,0,0,0, 0,0,[1,2],0],  // 点缀型，中等音
                [0,0,[1,4],0, 0,0,0,0, 0,0,[1,4],0, 0,0,0,0],  // 切分型，长音
                [0,0,0,0, 0,0,0,0, 0,0,[1,8],0, 0,0,0,0]       // 单打，短音
            ],
            tom1: [
                [0,0,0,0, 0,0,0,[1,4], 0,0,0,0, 0,0,0,0],      // 单打，长音
                [0,0,0,0, 0,0,0,0, 0,0,0,[1,2], 0,0,0,0],      // 后置型，中等音
                [0,0,0,[1,8], 0,0,0,0, 0,0,0,0, 0,0,0,[1,8]]   // 首尾型，短音
            ],
            tom2: [
                [0,0,0,0, 0,[1,4],0,0, 0,0,0,0, 0,0,0,0],      // 单打，长音
                [0,0,0,0, 0,0,0,0, 0,[1,2],0,0, 0,0,0,0],      // 中间型，中等音
                [0,[1,8],0,0, 0,0,0,0, 0,0,0,0, 0,[1,8],0,0]   // 对称型，短音
            ]
        };

        this.currentPatterns = {};
        this.currentStep = 0;
        this.isPlaying = false;
        this.nextNoteTime = 0;

        // 为每个轨道选择初始模式
        Object.keys(this.drumTracks).forEach(track => {
            this.currentPatterns[track] = this.rhythmPatterns[track][0];
        });

        console.log('[DrumGenerator] Created');
    }

    start(tempo, startTime) {
        this.isPlaying = true;
        this.tempo = tempo;
        this.nextNoteTime = startTime;

        // 随机选择新的节奏模式
        Object.keys(this.drumTracks).forEach(track => {
            const patterns = this.rhythmPatterns[track];
            this.currentPatterns[track] = patterns[Math.floor(Math.random() * patterns.length)];
        });

        console.log('[DrumGenerator] Started with tempo:', tempo);
    }

    getNextNotes(currentTime) {
        if (!this.isPlaying) return null;
        
        const notes = [];
        this.nextNoteTime = currentTime;
        
        // 生成当前步骤的所有鼓点
        Object.entries(this.drumTracks).forEach(([track, midiNote]) => {
            const pattern = this.currentPatterns[track][this.currentStep];
            if (pattern && pattern[0] === 1) {  // 如果有触发且第一个值为1
                notes.push({
                    note: midiNote,
                    velocity: Math.floor(Math.random() * 21) + 80, // 80-100
                    duration: pattern[1],  // 使用模式中定义的时值
                    time: this.nextNoteTime,
                    track: track,
                    noteValue: pattern[1]  // 添加时值信息
                });
            }
        });

        // 更新步骤
        this.currentStep = (this.currentStep + 1) % 16;
        if (this.currentStep === 0) {
            // 在每个小节结束时有机会更换部分轨道的模式
            Object.keys(this.drumTracks).forEach(track => {
                if (Math.random() < 0.3) { // 30%的概率更换模式
                    const patterns = this.rhythmPatterns[track];
                    this.currentPatterns[track] = patterns[Math.floor(Math.random() * patterns.length)];
                }
            });
        }

        return notes;
    }

    stop() {
        this.isPlaying = false;
        console.log('[DrumGenerator] Stopped');
    }

    // 获取指定轨道的MIDI音符
    getDrumNote(track) {
        return this.drumTracks[track];
    }

    // 获取所有鼓轨的信息
    getDrumTracks() {
        return this.drumTracks;
    }
}

export default DrumGenerator; 