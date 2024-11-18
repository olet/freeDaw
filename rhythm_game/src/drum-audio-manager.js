class DrumAudioManager {
    constructor() {
        this.drums = {};
        this.isInitialized = false;
        this.lastTriggerTime = 0;
        this.activeNotes = new Map();  // 跟踪所有激活的音符
        console.log('[DrumAudioManager] Created');
    }

    async init() {
        console.log('[DrumAudioManager] Initializing...');
        try {
            // 底鼓 - 支持长音
            this.drums.kick = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 8,
                oscillator: { 
                    type: 'sine',
                    phase: 140,
                    volume: 6
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.4,
                    sustain: 0.2,     // 添加持续音
                    release: 0.4,
                    attackCurve: 'exponential'
                }
            }).connect(new Tone.Filter({
                frequency: 200,
                type: 'lowpass',
                rolloff: -48
            })).toDestination();

            // 军鼓 - 支持长音
            this.drums.snare = new Tone.NoiseSynth({
                noise: { 
                    type: 'white',
                    playbackRate: 3
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.2,
                    sustain: 0.2,     // 添加持续音
                    release: 0.2
                }
            }).toDestination();

            // 中音鼓和高音鼓 - 支持长音
            ['tom1', 'tom2'].forEach((tom, i) => {
                this.drums[tom] = new Tone.MembraneSynth({
                    pitchDecay: 0.02,
                    octaves: 2.5 - i * 0.5,
                    oscillator: { 
                        type: 'sine',
                        phase: 80
                    },
                    envelope: {
                        attack: 0.001,
                        decay: 0.2,
                        sustain: 0.2,     // 添加持续音
                        release: 0.2
                    }
                }).toDestination();
            });

            // 闭合踩镲 - 支持长音
            this.drums.hihat1 = new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0.2,     // 添加持续音
                    release: 0.1
                }
            }).connect(new Tone.Filter({
                frequency: 6000,
                type: 'highpass'
            })).toDestination();

            // 开放踩镲 - 支持长音
            this.drums.hihat2 = new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: {
                    attack: 0.001,
                    decay: 0.3,
                    sustain: 0.2,     // 添加持续音
                    release: 0.3
                }
            }).connect(new Tone.Filter({
                frequency: 5000,
                type: 'highpass'
            })).toDestination();

            // 设置音量
            this.drums.kick.volume.value = 2;
            this.drums.snare.volume.value = 0;
            this.drums.tom1.volume.value = -2;
            this.drums.tom2.volume.value = -3;
            this.drums.hihat1.volume.value = -8;
            this.drums.hihat2.volume.value = -8;

            this.isInitialized = true;
            console.log('[DrumAudioManager] Initialized successfully');
            return true;
        } catch (err) {
            console.error('[DrumAudioManager] Initialization error:', err);
            this.isInitialized = false;
            throw err;
        }
    }

    playDrum(midiNote, velocity = 1) {
        if (!this.isInitialized) {
            console.warn('[DrumAudioManager] Cannot play drum - not ready');
            return false;
        }

        try {
            const drumMap = {
                36: { drum: 'kick', note: 'C1', useAttackRelease: true },    // 底鼓使用 AttackRelease
                38: { drum: 'snare' },
                42: { drum: 'hihat1' },
                46: { drum: 'hihat2' },
                45: { drum: 'tom1', note: 'A2', useAttackRelease: true },    // tom1 使用 AttackRelease
                43: { drum: 'tom2', note: 'C3', useAttackRelease: true }     // tom2 使用 AttackRelease
            };

            const drumInfo = drumMap[midiNote];
            if (drumInfo) {
                const drum = this.drums[drumInfo.drum];
                if (drum) {
                    const now = Tone.now();
                    const triggerTime = Math.max(now, this.lastTriggerTime + 0.001);
                    this.lastTriggerTime = triggerTime;

                    if (drumInfo.useAttackRelease) {
                        // 对于 kick 和 tom，使用 triggerAttackRelease
                        if (drumInfo.note) {
                            drum.triggerAttackRelease(drumInfo.note, '8n', triggerTime, velocity);
                        } else {
                            drum.triggerAttackRelease('8n', triggerTime, velocity);
                        }
                    } else {
                        // 对于其他鼓点，使用 Attack/Release
                        if (this.activeNotes.has(midiNote)) {
                            this.releaseDrum(midiNote);
                        }
                        if (drumInfo.note) {
                            drum.triggerAttack(drumInfo.note, triggerTime, velocity);
                        } else {
                            drum.triggerAttack(triggerTime, velocity);
                        }
                        this.activeNotes.set(midiNote, { drum, info: drumInfo });
                    }
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error('[DrumAudioManager] Error playing drum:', err);
            return false;
        }
    }

    releaseDrum(midiNote) {
        try {
            const activeNote = this.activeNotes.get(midiNote);
            if (activeNote) {
                const { drum, info } = activeNote;
                const now = Tone.now();

                if (!info.useAttackRelease) {  // 只对非 AttackRelease 的鼓点执行 release
                    if (info.note) {
                        drum.triggerRelease(info.note, now);
                    } else {
                        drum.triggerRelease(now);
                    }
                }

                this.activeNotes.delete(midiNote);
                return true;
            }
            return false;
        } catch (err) {
            console.error('[DrumAudioManager] Error releasing drum:', err);
            return false;
        }
    }

    cleanup() {
        console.log('[DrumAudioManager] Cleaning up...');
        try {
            Object.values(this.drums).forEach(drum => {
                if (drum && !drum.disposed) {
                    drum.dispose();
                }
            });
            this.drums = {};
            this.isInitialized = false;
            console.log('[DrumAudioManager] Cleanup completed');
        } catch (err) {
            console.error('[DrumAudioManager] Cleanup error:', err);
        }
    }

    pauseAll() {
        console.log('[DrumAudioManager] Pausing all audio');
        if (this.isInitialized) {
            // 停止所有当前播放的音符
            this.activeNotes.forEach((_, midiNote) => {
                this.releaseDrum(midiNote);
            });
        }
    }

    resumeAll() {
        console.log('[DrumAudioManager] Resuming audio');
        // 不需要恢复音频上下文，因为我们没有暂停它
    }
}

export default DrumAudioManager; 