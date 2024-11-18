class RhythmGenerator {
    constructor() {
        this.noteRange = {
            left: {
                min: 36,  // C2 (中央C往下两个八度)
                max: 59   // B3 (中央C往下一个音)
            },
            right: {
                min: 60,  // C4 (中央C)
                max: 84   // C6 (中央C往上两个八度)
            }
        };
        
        this.chordProgressions = [
            ['C', 'F', 'G', 'C'],      // I-IV-V-I
            ['C', 'Am', 'F', 'G'],     // I-vi-IV-V
        ];

        this.chordNotes = {
            'C':  {
                left: [36, 48],      // C2, C3 (左手根音)
                right: [60, 64, 67]  // C4, E4, G4 (右手和弦)
            },
            'F':  {
                left: [41, 53],      // F2, F3
                right: [65, 69, 72]  // F4, A4, C5
            },
            'G':  {
                left: [43, 55],      // G2, G3
                right: [67, 71, 74]  // G4, B4, D5
            },
            'Am': {
                left: [45, 57],      // A2, A3
                right: [69, 72, 76]  // A4, C5, E5
            }
        };

        this.playingPatterns = [
            // 基本和弦型
            {
                name: 'basic',
                pattern: (chord) => [
                    { notes: [chord.left[0]], duration: 4, interval: 4, hand: 'left' },  // 左手低音
                    { notes: chord.right, duration: 2, interval: 2, hand: 'right' }      // 右手和弦
                ]
            },
            // 上行琶音型
            {
                name: 'arpeggioUp',
                pattern: (chord) => [
                    { notes: [chord.left[0]], duration: 4, interval: 4, hand: 'left' },  // 左手低音
                    { notes: [chord.right[0]], duration: 1, interval: 1, hand: 'right' }, // 右手琶音上行
                    { notes: [chord.right[1]], duration: 1, interval: 1, hand: 'right' },
                    { notes: [chord.right[2]], duration: 1, interval: 1, hand: 'right' }
                ]
            },
            // 下行琶音型
            {
                name: 'arpeggioDown',
                pattern: (chord) => [
                    { notes: [chord.left[0]], duration: 4, interval: 4, hand: 'left' },  // 左手低音
                    { notes: [chord.right[2]], duration: 1, interval: 1, hand: 'right' }, // 右手琶音下行
                    { notes: [chord.right[1]], duration: 1, interval: 1, hand: 'right' },
                    { notes: [chord.right[0]], duration: 1, interval: 1, hand: 'right' }
                ]
            },
            // 分解和弦型
            {
                name: 'brokenChord',
                pattern: (chord) => [
                    { notes: [chord.left[0]], duration: 4, interval: 4, hand: 'left' },  // 左手低音
                    { notes: [chord.right[0], chord.right[1]], duration: 2, interval: 2, hand: 'right' }, // 右手分解
                    { notes: [chord.right[1], chord.right[2]], duration: 2, interval: 2, hand: 'right' }
                ]
            },
            // 交替音型
            {
                name: 'alternate',
                pattern: (chord) => [
                    { notes: [chord.left[0]], duration: 4, interval: 4, hand: 'left' },  // 左手低音
                    { notes: [chord.right[0]], duration: 1, interval: 1, hand: 'right' }, // 右手交替
                    { notes: [chord.right[1]], duration: 1, interval: 1, hand: 'right' },
                    { notes: [chord.right[0]], duration: 1, interval: 1, hand: 'right' },
                    { notes: [chord.right[2]], duration: 1, interval: 1, hand: 'right' }
                ]
            },
            // 装饰音型
            {
                name: 'ornament',
                pattern: (chord) => [
                    { notes: [chord.left[0]], duration: 4, interval: 4, hand: 'left' },  // 左手低音
                    { notes: [chord.right[0]], duration: 0.5, interval: 0.5, hand: 'right' }, // 右手装饰音
                    { notes: [chord.right[1]], duration: 0.5, interval: 0.5, hand: 'right' },
                    { notes: chord.right, duration: 2, interval: 2, hand: 'right' }  // 和弦收尾
                ]
            },
            // 波浪型
            {
                name: 'wave',
                pattern: (chord) => [
                    { notes: [chord.left[0]], duration: 4, interval: 4, hand: 'left' },  // 左手低音
                    { notes: [chord.right[0]], duration: 1, interval: 1, hand: 'right' }, // 右手波浪
                    { notes: [chord.right[2]], duration: 1, interval: 1, hand: 'right' },
                    { notes: [chord.right[1]], duration: 1, interval: 1, hand: 'right' },
                    { notes: [chord.right[2]], duration: 1, interval: 1, hand: 'right' }
                ]
            }
        ];

        this.currentPattern = null;
        this.currentProgression = [];
        this.currentChordIndex = 0;
        this.patternIndex = 0;
        this.nextNoteTime = 0;
        this.isPlaying = false;

        console.log('[RhythmGenerator] Created');
    }

    start(tempo = 120) {
        this.isPlaying = true;
        this.tempo = tempo;
        
        this.currentProgression = [...this.chordProgressions[
            Math.floor(Math.random() * this.chordProgressions.length)
        ]];
        
        this.currentPattern = this.playingPatterns[
            Math.floor(Math.random() * this.playingPatterns.length)
        ];
        
        this.currentChordIndex = 0;
        this.patternIndex = 0;
        this.nextNoteTime = Tone.now();
        
        console.log('[RhythmGenerator] Started with tempo:', tempo);
    }

    getNextNotes() {
        if (!this.isPlaying) return null;

        const currentTime = Tone.now();
        const notes = [];

        if (currentTime < this.nextNoteTime) {
            return notes;
        }

        const currentChord = this.currentProgression[this.currentChordIndex];
        const chordNotes = this.chordNotes[currentChord];
        
        const patternNotes = this.currentPattern.pattern(chordNotes);
        if (this.patternIndex < patternNotes.length) {
            const noteGroup = patternNotes[this.patternIndex];
            noteGroup.notes.forEach(note => {
                notes.push({
                    note: note,
                    velocity: Math.floor(Math.random() * 21) + 80,
                    duration: noteGroup.duration,
                    time: this.nextNoteTime,
                    hand: noteGroup.hand
                });
            });
        }

        const beatDuration = 60 / this.tempo;
        const sixteenthNote = beatDuration / 4;
        this.nextNoteTime += sixteenthNote * 2;

        this.patternIndex++;

        if (this.patternIndex >= patternNotes.length) {
            this.patternIndex = 0;
            this.currentChordIndex++;

            if (this.currentChordIndex >= this.currentProgression.length) {
                this.currentChordIndex = 0;
                this.currentProgression = [...this.chordProgressions[
                    Math.floor(Math.random() * this.chordProgressions.length)
                ]];
                this.currentPattern = this.playingPatterns[
                    Math.floor(Math.random() * this.playingPatterns.length)
                ];
            }
        }

        return notes;
    }

    stop() {
        this.isPlaying = false;
        console.log('[RhythmGenerator] Stopped');
    }
}

export default RhythmGenerator; 