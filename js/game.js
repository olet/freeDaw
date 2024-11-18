import { DIFFICULTY_LEVELS } from './patterns.js';
import { AudioManager } from './audio.js';

export class RhythmGame {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.notes = [];
        this.isPlaying = false;
        this.gameSpeed = 1.0;
        this.currentPattern = 0;
        this.patternStep = 0;
        this.lastNoteTime = 0;
        this.difficulty = 'NORMAL';
        this.audioManager = new AudioManager();

        // 游戏配置
        this.trackHeight = window.innerHeight;
        this.baseNoteSpeed = 3;
        this.noteSpeed = this.baseNoteSpeed;
        this.hitPosition = this.trackHeight - 150;
        
        // 键位配置
        this.keys = {
            'A': 0,  // 最左轨道
            'S': 1,  // 左中轨道
            'D': 2,  // 右中轨道
            'F': 3   // 最右轨道
        };

        // 绑定事件处理器
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleSpeedChange = this.handleSpeedChange.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // 初始化事件监听
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('resize', this.handleResize);
        
        const speedControl = document.getElementById('speed');
        if (speedControl) {
            speedControl.addEventListener('input', this.handleSpeedChange);
        }
    }

    getTrackPositions() {
        const gameWidth = document.querySelector('#game').offsetWidth;
        const spacing = gameWidth / 5;
        return [
            spacing,
            spacing * 2,
            spacing * 3,
            spacing * 4
        ];
    }

    createNote(lane) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        
        const trackPositions = this.getTrackPositions();
        noteElement.style.left = trackPositions[lane] + 'px';
        noteElement.style.top = '0px';
        
        const note = {
            element: noteElement,
            lane: lane,
            position: 0,
            hit: false
        };
        
        this.notes.push(note);
        document.querySelector('#track').appendChild(noteElement);
    }

    generateRhythm() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const currentLevel = DIFFICULTY_LEVELS[this.difficulty];
        const pattern = currentLevel.patterns[this.currentPattern];
        const adjustedTiming = pattern.timing[this.patternStep] / this.gameSpeed;
        
        if (now - this.lastNoteTime >= adjustedTiming) {
            const currentNotes = pattern.notes[this.patternStep];
            if (currentNotes) {
                currentNotes.forEach(lane => this.createNote(lane));
            }
            
            this.patternStep = (this.patternStep + 1) % pattern.notes.length;
            if (this.patternStep === 0) {
                this.currentPattern = (this.currentPattern + 1) % currentLevel.patterns.length;
            }
            
            this.lastNoteTime = now;
        }
    }

    updateNotes() {
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.position += this.noteSpeed;
            note.element.style.top = note.position + 'px';
            
            // 检查是否错过了音符
            if (note.position > this.hitPosition + DIFFICULTY_LEVELS[this.difficulty].hitWindow && !note.hit) {
                note.element.remove();
                this.notes.splice(i, 1);
                this.combo = 0;
                document.querySelector('#combo').textContent = `Combo: ${this.combo}x`;
            }
        }
    }

    handleKeyDown(event) {
        if (!this.isPlaying) {
            this.startGame();
            return;
        }

        const key = event.key.toUpperCase();
        if (key in this.keys) {
            const lane = this.keys[key];
            const hitWindow = DIFFICULTY_LEVELS[this.difficulty].hitWindow;
            const trackPositions = this.getTrackPositions();
            
            // 检查是否击中音符
            for (let i = 0; i < this.notes.length; i++) {
                const note = this.notes[i];
                if (note.lane === lane && !note.hit) {
                    const hitOffset = Math.abs(note.position - this.hitPosition);
                    
                    if (hitOffset <= hitWindow) {
                        note.hit = true;
                        note.element.remove();
                        this.notes.splice(i, 1);
                        
                        // 计算得分
                        const accuracy = 1 - (hitOffset / hitWindow);
                        const baseScore = 100;
                        const comboBonus = Math.floor(this.combo / 10);
                        const score = Math.round(baseScore * accuracy * (1 + comboBonus * 0.1));
                        
                        this.score += score;
                        this.combo++;
                        
                        this.audioManager.playHitSound(lane);
                        
                        // 创建命中特效
                        this.createHitEffect(trackPositions[lane], this.hitPosition, accuracy);
                        
                        document.querySelector('#score').textContent = `Score: ${this.score} points`;
                        document.querySelector('#combo').textContent = `Combo: ${this.combo}x`;
                        return;
                    }
                }
            }
            
            // 没有击中任何音符
            this.combo = 0;
            document.querySelector('#combo').textContent = `Combo: ${this.combo}x`;
        }
    }

    createHitEffect(x, y, accuracy) {
        // 创建圆形扩散特效
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.style.left = (x - 20) + 'px';  // 居中显示
        effect.style.top = (y - 20) + 'px';
        document.querySelector('#track').appendChild(effect);
        
        // 创建文字特效
        const text = document.createElement('div');
        text.className = 'hit-perfect';
        
        // 根据准确度显示不同文字
        if (accuracy > 0.9) {
            text.textContent = 'Perfect!';
            text.style.color = '#ffeb3b';  // 金色
        } else if (accuracy > 0.7) {
            text.textContent = 'Great!';
            text.style.color = '#4caf50';  // 绿色
        } else {
            text.textContent = 'Good';
            text.style.color = '#2196f3';  // 蓝色
        }
        
        text.style.left = (x - 30) + 'px';
        text.style.top = (y - 30) + 'px';
        document.querySelector('#track').appendChild(text);
        
        // 自动移除特效元素
        setTimeout(() => {
            effect.remove();
            text.remove();
        }, 500);
    }

    handleSpeedChange(event) {
        const currentLevel = DIFFICULTY_LEVELS[this.difficulty];
        const speed = Math.max(
            currentLevel.speedRange.min,
            Math.min(currentLevel.speedRange.max, parseFloat(event.target.value))
        );
        
        this.gameSpeed = speed;
        this.noteSpeed = this.baseNoteSpeed * speed;
        document.getElementById('speedValue').textContent = speed.toFixed(1) + 'x';
    }

    handleResize() {
        // 重新计算轨道位置
        const trackPositions = this.getTrackPositions();
        this.notes.forEach((note, index) => {
            note.element.style.left = trackPositions[note.lane] + 'px';
        });
    }

    setDifficulty(difficulty) {
        if (difficulty in DIFFICULTY_LEVELS) {
            this.difficulty = difficulty;
            const level = DIFFICULTY_LEVELS[difficulty];
            
            // 更新速度范围
            const speedControl = document.getElementById('speed');
            speedControl.min = level.speedRange.min;
            speedControl.max = level.speedRange.max;
            speedControl.value = level.baseSpeed;
            
            // 更新游戏速度
            this.handleSpeedChange({ target: { value: level.baseSpeed } });
            
            // 更新界面
            document.getElementById('difficultyName').textContent = level.name;
        }
    }

    startGame() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('startScreen').style.display = 'none';
        
        // 开始播放背景音乐
        this.audioManager.playBackgroundMusic();
        
        // 清除现有的音符元素
        const existingNotes = document.querySelectorAll('.note');
        existingNotes.forEach(note => note.remove());
        
        this.score = 0;
        this.combo = 0;
        this.notes = [];
        this.currentPattern = 0;
        this.patternStep = 0;
        this.lastNoteTime = Date.now();
        
        document.querySelector('#score').textContent = `Score: ${this.score} points`;
        document.querySelector('#combo').textContent = `Combo: ${this.combo}x`;
        
        this.gameLoop();
    }

    resetGame() {
        this.isPlaying = false;
        this.score = 0;
        this.combo = 0;
        this.notes = [];
        
        // 停止背景音乐
        this.audioManager.stopBackgroundMusic();
        
        document.getElementById('startScreen').style.display = 'flex';
    }

    gameLoop() {
        if (!this.isPlaying) return;
        
        this.generateRhythm();
        this.updateNotes();
        requestAnimationFrame(() => this.gameLoop());
    }
}
