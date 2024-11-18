import AudioManager from './audio-manager.js';
import MidiManager from './midi-manager.js';
import GameRenderer from './game-renderer.js';
import RhythmGenerator from './rhythm-generator.js';
import DrumGenerator from './drum-generator.js';
import DrumAudioManager from './drum-audio-manager.js';

class RhythmGame {
    constructor() {
        console.log('[RhythmGame] Initializing...');
        this.score = 0;
        this.gameStarted = false;

        // 获取DOM元素
        this.canvas = document.getElementById('game-canvas');
        this.midiStatus = document.getElementById('midi-status');
        this.scoreElement = document.getElementById('score');
        this.startButton = document.getElementById('start-button');
        this.midiInfo = document.getElementById('midi-info');
        this.currentNote = document.getElementById('current-note');
        this.currentVelocity = document.getElementById('current-velocity');
        
        // 初始化管理器
        this.audioManager = new AudioManager();
        this.midiManager = new MidiManager(this.handleMIDIMessage.bind(this));
        this.renderer = new GameRenderer(this.canvas);
        
        // MIDI音符到音名的映射
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // 绑定事件
        this.startButton.addEventListener('click', () => this.start());
        window.addEventListener('beforeunload', () => this.cleanup());
        
        // 添加节奏生成器
        this.rhythmGenerator = new RhythmGenerator();
        
        // 添加游戏循环
        this.gameLoop = null;
        
        // 设置音符触发回调
        this.renderer.onNoteHit = this.handleNoteHit.bind(this);
        this.renderer.onNoteEnd = this.handleNoteEnd.bind(this);
        
        this.isPaused = false;
        
        // 添加暂停按钮
        this.pauseButton = document.createElement('button');
        this.pauseButton.id = 'pause-button';
        this.pauseButton.textContent = '暂停';
        this.pauseButton.classList.add('hidden');
        document.querySelector('.container').insertBefore(
            this.pauseButton, 
            this.scoreElement
        );
        
        // 绑定暂停事件
        this.pauseButton.addEventListener('click', () => this.togglePause());
        
        // 添加键盘事件监听
        window.addEventListener('keydown', (e) => {
            if (this.gameStarted && e.code === 'Space') {
                e.preventDefault(); // 防止空格键滚动页面
                this.togglePause();
            }
        });
        
        // 添加鼓点生成器
        this.drumGenerator = new DrumGenerator();
        
        // 设置鼓点回调
        this.renderer.onDrumNoteHit = this.handleDrumNoteHit.bind(this);
        
        // 添加鼓点音频管理器
        this.drumAudioManager = new DrumAudioManager();
        
        // 添加共享的时间基准
        this.nextNoteTime = 0;
        this.tempo = 120;
        this.sixteenthNoteDuration = 0;  // 将在start时计算

        // 添加页面可见性状态跟踪
        this.wasPlayingBeforeHidden = false;
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (this.gameStarted) {
                if (document.hidden) {
                    // 页面隐藏时，记录当前状态并暂停
                    this.wasPlayingBeforeHidden = !this.isPaused;
                    if (!this.isPaused) {
                        this.togglePause();
                    }
                } else {
                    // 页面可见时，如果之前是播放状态，则恢复
                    if (this.wasPlayingBeforeHidden) {
                        if (this.isPaused) {
                            this.togglePause();
                        }
                        this.wasPlayingBeforeHidden = false;
                    }
                }
            }
        });

        // 添加速率控制
        this.tempoSlider = document.getElementById('tempo-slider');
        this.tempoValue = document.getElementById('tempo-value');
        this.baseSpeed = 2;  // 基础速度
        
        // 绑定速率变化事件
        this.tempoSlider.addEventListener('input', () => this.updateTempo());
        
        // 初始化时隐藏速率控制
        this.tempoSlider.parentElement.classList.add('hidden');

        console.log('[RhythmGame] Initialization completed');
    }

    getMidiNoteName(midiNote) {
        const octave = Math.floor(midiNote / 12) - 1;
        const noteName = this.noteNames[midiNote % 12];
        return `${noteName}${octave}`;
    }

    async start() {
        console.log('[RhythmGame] Starting game...');
        try {
            // 先清理之前的状态
            this.cleanup();
            
            // 禁用开始按钮
            this.startButton.disabled = true;

            // 确保音频上下文是活跃的
            await Tone.start();
            await Tone.getContext().resume();
            console.log('[RhythmGame] Audio context started');

            // 初始化音频
            await this.audioManager.init();
            console.log('[RhythmGame] Audio initialized');

            // 初始化MIDI
            const deviceName = await this.midiManager.init();
            this.midiStatus.textContent = `MIDI Status: ${deviceName} connected`;
            console.log('[RhythmGame] MIDI initialized');

            // 初始化鼓点音频
            await this.drumAudioManager.init();
            console.log('[RhythmGame] Drum audio initialized');
            
            // 开始游戏
            this.canvas.style.display = 'block';
            this.renderer.animate();
            this.gameStarted = true;
            
            // 隐藏开始按钮，显示MIDI信息和暂停按钮
            this.startButton.classList.add('hidden');
            this.midiInfo.classList.remove('hidden');
            this.pauseButton.classList.remove('hidden');
            
            // 启动 Tone.js Transport
            Tone.Transport.start();
            
            // 设置基本时间参数
            this.nextNoteTime = Tone.now();
            this.tempo = 120;
            this.sixteenthNoteDuration = (60 / this.tempo) / 4;
            
            // 同时启动两个生成器
            this.rhythmGenerator.start(this.tempo, this.nextNoteTime);
            this.drumGenerator.start(this.tempo, this.nextNoteTime);
            
            // 启动游戏循环
            this.startGameLoop();
            
            // 显示暂停按钮
            this.pauseButton.classList.remove('hidden');
            
            // 显示速率控制
            this.tempoSlider.parentElement.classList.remove('hidden');
            
            console.log('[RhythmGame] Game started successfully');

        } catch (error) {
            console.error('[RhythmGame] Error starting game:', error);
            this.cleanup();
            this.startButton.disabled = false;
            this.startButton.textContent = 'Start Game';
            this.midiStatus.textContent = 'Error starting game: ' + error.message;
        }
    }

    startGameLoop() {
        console.log('[RhythmGame] Starting game loop');
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        const processNotes = () => {
            if (!this.isPaused) {
                const currentTime = Tone.now();
                
                if (currentTime >= this.nextNoteTime) {
                    const pianoNotes = this.rhythmGenerator.getNextNotes(this.nextNoteTime);
                    const drumNotes = this.drumGenerator.getNextNotes(this.nextNoteTime);
                    
                    // 添加钢琴音符
                    if (pianoNotes && pianoNotes.length > 0) {
                        pianoNotes.forEach(note => {
                            console.log('[RhythmGame] Adding piano note:', note);
                            // 确保传递时值参数
                            this.renderer.addFallingNote(note.note, note.velocity, note.duration || 2);
                        });
                    }

                    // 只添加鼓点视觉效果，不播放声音
                    if (drumNotes && drumNotes.length > 0) {
                        drumNotes.forEach(note => {
                            console.log('[RhythmGame] Adding drum note:', note);
                            this.renderer.addFallingDrumNote(note.track, note.velocity, note.noteValue);
                        });
                    }

                    this.nextNoteTime += this.sixteenthNoteDuration;
                }
            }
            this.gameLoop = requestAnimationFrame(processNotes);
        };
        
        processNotes();
    }

    handleMIDIMessage(event) {
        if (!this.gameStarted) return;

        const [status, note, velocity] = event.data;
        if (status !== 144 && status !== 128) return;

        try {
            const noteInOctave = note % 12;
            let drumTrack = null;
            
            // 将音符映射到鼓轨（C=0, D=2, E=4, F=5, G=7, A=9）
            switch (noteInOctave) {
                case 0:  // C
                    drumTrack = 'kick';
                    break;
                case 2:  // D
                    drumTrack = 'snare';
                    break;
                case 4:  // E
                    drumTrack = 'tom2';
                    break;
                case 5:  // F
                    drumTrack = 'tom1';
                    break;
                case 7:  // G
                    drumTrack = 'hihat1';
                    break;
                case 9:  // A
                    drumTrack = 'hihat2';
                    break;
            }

            if (drumTrack) {
                const midiNote = this.drumGenerator.getDrumNote(drumTrack);
                if (status === 144 && velocity > 0) {
                    // 按下时播放声音
                    this.drumAudioManager.playDrum(midiNote, velocity / 127);
                    this.renderer.addActiveDrumNote(drumTrack);
                    
                    if (!this.isPaused) {
                        this.checkDrumNoteHit(drumTrack);
                    }
                } else {
                    // 释放时停止声音
                    this.drumAudioManager.releaseDrum(midiNote);
                    this.renderer.removeActiveDrumNote(drumTrack);
                }
            } else if (!this.isPaused) {
                // 只在非暂停状态下处理钢琴音符
                if (status === 144 && velocity > 0) {
                    this.currentNote.textContent = this.getMidiNoteName(note);
                    this.currentVelocity.textContent = velocity;

                    if (this.audioManager.playNote(note, velocity / 127)) {
                        this.renderer.addNote(note, velocity);
                        this.score += 10;
                        this.scoreElement.textContent = `分数: ${this.score}`;
                    }
                } else {
                    this.audioManager.releaseNote(note);
                    this.currentNote.textContent = '-';
                    this.currentVelocity.textContent = '-';
                    this.renderer.removeNote(note);
                }
            }
        } catch (err) {
            console.error('[RhythmGame] Error handling MIDI message:', err);
        }
    }

    // 添加方法来检查鼓点击中
    checkDrumNoteHit(track) {
        // 检查是否有音符在判定范围内
        const hitNotes = this.renderer.fallingDrumNotes.filter(note => {
            // 扩大判定范围，并增加向上的缓冲
            const noteCenter = note.y + (note.height / 2);
            const distance = Math.abs(this.renderer.drumSection.hitLineY - noteCenter);
            const hitWindow = 100;  // 总判定窗口
            const perfectWindow = 30;  // Perfect判定窗口
            const goodWindow = 60;   // Good判定窗口

            // 只处理未触发的音符
            if (!note.triggered && note.track === track) {
                if (distance <= perfectWindow) {
                    // Perfect 判定范围内
                    note.hitAccuracy = distance / perfectWindow;  // 0-1 范围
                    return true;
                } else if (distance <= goodWindow) {
                    // Good 判定范围内
                    note.hitAccuracy = 0.4 + ((distance - perfectWindow) / (goodWindow - perfectWindow)) * 0.4;  // 0.4-0.8 范围
                    return true;
                } else if (distance <= hitWindow) {
                    // OK 判定范围内
                    note.hitAccuracy = 0.8 + ((distance - goodWindow) / (hitWindow - goodWindow)) * 0.2;  // 0.8-1.0 范围
                    return true;
                }
            }
            return false;
        });

        if (hitNotes.length > 0) {
            // 找出最近的音符
            const bestHit = hitNotes.reduce((best, current) => 
                current.hitAccuracy < best.hitAccuracy ? current : best
            );

            bestHit.triggered = true;
            
            // 根据命中精度给出不同的分数和效果
            if (bestHit.hitAccuracy < 0.3) {
                // Perfect 命中
                this.score += 20;
                this.renderer.showPerfectHit(track);
                console.log('[RhythmGame] Perfect hit!', track);
            } else if (bestHit.hitAccuracy < 0.7) {
                // Good 命中
                this.score += 10;
                this.renderer.showGoodHit(track);
                console.log('[RhythmGame] Good hit!', track);
            } else {
                // OK 命中
                this.score += 5;
                this.renderer.showBadHit(track);
                console.log('[RhythmGame] Bad hit!', track);
            }
            
            this.scoreElement.textContent = `分数: ${this.score}`;
        } else {
            // 没有命中任何音符
            this.renderer.showMiss(track);
            console.log('[RhythmGame] Miss!', track);
        }
    }

    handleNoteHit(note, velocity, duration) {
        // 播放音符
        this.audioManager.playNote(note, velocity / 127);
        
        // 添加视觉反馈
        this.renderer.addNote(note);
        
        // 更新分数
        this.score += 10;
        this.scoreElement.textContent = `分数: ${this.score}`;

        // 设置定时器来释放音符
        if (duration) {
            setTimeout(() => {
                this.handleNoteEnd(note);
            }, duration * 250); // 将时值转换为毫秒
        }
    }

    handleNoteEnd(note) {
        // 停止音符播放
        this.audioManager.releaseNote(note);
        
        // 移除视觉反馈
        this.renderer.removeNote(note);
    }

    handleDrumNoteHit(track, velocity) {
        // 移除这个方法，因为我们不想在音符生成时播放声音
        // 只在玩家实际敲击时播放声音
    }

    cleanup() {
        console.log('[RhythmGame] Cleaning up...');
        this.audioManager.cleanup();
        this.midiManager.cleanup();
        this.renderer.cleanup();
        this.gameStarted = false;
        this.score = 0;
        this.scoreElement.textContent = `分数: ${this.score}`;
        this.currentNote.textContent = '-';
        this.currentVelocity.textContent = '-';
        this.midiInfo.classList.add('hidden');
        this.startButton.classList.remove('hidden');
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.rhythmGenerator) {
            this.rhythmGenerator.stop();
        }
        if (this.drumGenerator) {
            this.drumGenerator.stop();
        }
        if (this.drumAudioManager) {
            this.drumAudioManager.cleanup();
        }
        // 隐藏暂停按钮
        this.pauseButton.classList.add('hidden');
        // 隐藏速率控制
        this.tempoSlider.parentElement.classList.add('hidden');
        // 重置速率
        this.tempoSlider.value = 100;
        this.tempoValue.textContent = '100%';
        console.log('[RhythmGame] Cleanup completed');
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // 暂停游戏
            this.pauseButton.textContent = '继续';
            // 先停止生成器
            this.rhythmGenerator.stop();
            this.drumGenerator.stop();
            // 停止渲染动画
            this.renderer.pause();
            // 立即停止所有声音
            this.audioManager.pauseAll();
            // 暂停钢琴的音频上下文，但保持鼓点音频上下文活跃
            Tone.Transport.pause();
            
            // 确保钢琴的所有音符都被释放
            this.audioManager.releaseAll();
            
            // 暂停时禁用速率滑块
            this.tempoSlider.disabled = true;
            
            console.log('[RhythmGame] Game paused');
        } else {
            // 继续游戏
            this.pauseButton.textContent = '暂停';
            // 确保音频上下文是活跃的
            Tone.getContext().resume();
            Tone.Transport.start();
            // 恢复音频管理器
            this.audioManager.resumeAll();
            // 恢复渲染
            this.renderer.resume();
            // 启动生成器
            this.rhythmGenerator.start(this.tempo);
            this.drumGenerator.start(this.tempo);
            
            // 继续时启用速率滑块
            this.tempoSlider.disabled = false;
            
            console.log('[RhythmGame] Game resumed');
        }
    }

    updateTempo() {
        const tempoPercent = this.tempoSlider.value;
        this.tempoValue.textContent = `${tempoPercent}%`;
        
        // 计算新的速度和节奏
        const speedMultiplier = tempoPercent / 100;
        const newSpeed = this.baseSpeed * speedMultiplier;
        const newTempo = 120 * speedMultiplier;
        
        // 更新渲染器的速度
        this.renderer.noteSpeed = newSpeed;
        
        // 如果游戏正在运行且没有暂停，更新生成器的速度
        if (this.gameStarted && !this.isPaused) {
            this.rhythmGenerator.stop();
            this.drumGenerator.stop();
            this.rhythmGenerator.start(newTempo);
            this.drumGenerator.start(newTempo);
        }
        
        console.log('[RhythmGame] Tempo updated:', tempoPercent + '%');
    }
}

// 创建游戏实例
window.addEventListener('load', () => {
    console.log('[Main] Page loaded, creating game instance');
    window.gameInstance = new RhythmGame();
});
