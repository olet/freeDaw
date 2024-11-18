export class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0.3;  // 设置整体音量

        // 创建背景音乐节点
        this.bgmGainNode = this.audioContext.createGain();
        this.bgmGainNode.connect(this.audioContext.destination);
        this.bgmGainNode.gain.value = 0.08;  // 背景音乐音量

        // 初始化打击音效
        this.hitSounds = new Array(4).fill(null);
        this.initHitSounds();
        
        // 初始化背景音乐
        this.initBackgroundMusic();
    }

    async initBackgroundMusic() {
        const bpm = 120;  // 每分钟120拍
        const beatLength = 60 / bpm;  // 一拍的长度（秒）
        
        // 只保留柔和的旋律，移除鼓点
        this.melodyPattern = [
            // 主旋律
            { time: 0, duration: beatLength, frequency: 440, gain: 0.06 },         // A4
            { time: beatLength, duration: beatLength, frequency: 494, gain: 0.06 }, // B4
            { time: beatLength * 2, duration: beatLength, frequency: 523, gain: 0.06 }, // C5
            { time: beatLength * 3, duration: beatLength, frequency: 494, gain: 0.06 }, // B4
            
            // 和弦衬托
            { time: 0, duration: beatLength * 2, frequency: 330, gain: 0.04 },         // E4
            { time: beatLength * 2, duration: beatLength * 2, frequency: 349, gain: 0.04 } // F4
        ];
    }

    createDrumSound(type) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.bgmGainNode);

        switch(type) {
            case 'kick':  // 大鼓
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(3000, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.type = 'triangle';
                break;
                
            case 'snare':  // 军鼓
                oscillator.frequency.setValueAtTime(250, this.audioContext.currentTime);
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.type = 'square';
                
                // 添加白噪音来模拟军鼓的特征声音
                const noiseBuffer = this.createNoiseBuffer();
                const noiseSource = this.audioContext.createBufferSource();
                const noiseGain = this.audioContext.createGain();
                noiseSource.buffer = noiseBuffer;
                noiseSource.connect(noiseGain);
                noiseGain.connect(this.bgmGainNode);
                noiseGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                noiseSource.start();
                noiseSource.stop(this.audioContext.currentTime + 0.2);
                break;
                
            case 'hihat':  // 踩镲
                oscillator.frequency.setValueAtTime(8000, this.audioContext.currentTime);
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(7000, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.type = 'square';
                
                // 添加白噪音来增强踩镲的特征
                const hihatNoise = this.createNoiseBuffer();
                const hihatSource = this.audioContext.createBufferSource();
                const hihatGain = this.audioContext.createGain();
                hihatSource.buffer = hihatNoise;
                hihatSource.connect(hihatGain);
                hihatGain.connect(this.bgmGainNode);
                hihatGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                hihatGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                hihatSource.start();
                hihatSource.stop(this.audioContext.currentTime + 0.1);
                break;
        }

        return { oscillator, gainNode };
    }

    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    playBackgroundMusic() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.playLoop();
        }
    }

    stopBackgroundMusic() {
        this.isPlaying = false;
    }

    playLoop() {
        if (!this.isPlaying) return;

        const startTime = this.audioContext.currentTime;
        
        // 只播放旋律
        this.melodyPattern.forEach(note => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.bgmGainNode);
            
            oscillator.frequency.value = note.frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, startTime + note.time);
            gainNode.gain.linearRampToValueAtTime(note.gain, startTime + note.time + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + note.time + note.duration);
            
            oscillator.start(startTime + note.time);
            oscillator.stop(startTime + note.time + note.duration);
        });

        // 4拍后循环
        setTimeout(() => {
            if (this.isPlaying) {
                this.playLoop();
            }
        }, 2000);
    }

    async initHitSounds() {
        // 定义四个轨道的打击乐器类型
        this.hitSounds = [
            { type: 'kick', gain: 1.0 },      // A键 - 大鼓（低沉有力）
            { type: 'snare', gain: 0.7 },     // S键 - 军鼓（清脆响亮）
            { type: 'rimshot', gain: 0.6 },   // D键 - 边鼓（金属声）
            { type: 'hihat', gain: 0.4 }      // F键 - 踩镲（明快短促）
        ];
    }

    playHitSound(lane) {
        if (lane >= 0 && lane < this.hitSounds.length) {
            const sound = this.hitSounds[lane];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.gainNode);

            switch(sound.type) {
                case 'kick':
                    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    filterNode.type = 'lowpass';
                    filterNode.frequency.setValueAtTime(3000, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(sound.gain, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    oscillator.type = 'triangle';
                    break;
                    
                case 'snare':
                    oscillator.frequency.setValueAtTime(250, this.audioContext.currentTime);
                    filterNode.type = 'highpass';
                    filterNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(sound.gain, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    oscillator.type = 'square';
                    
                    // 添加白噪音
                    const snareNoise = this.createNoiseBuffer();
                    const snareSource = this.audioContext.createBufferSource();
                    const snareNoiseGain = this.audioContext.createGain();
                    snareSource.buffer = snareNoise;
                    snareSource.connect(snareNoiseGain);
                    snareNoiseGain.connect(this.gainNode);
                    snareNoiseGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    snareNoiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    snareSource.start();
                    snareSource.stop(this.audioContext.currentTime + 0.2);
                    break;
                    
                case 'rimshot':
                    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                    filterNode.type = 'bandpass';
                    filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
                    filterNode.Q.value = 10;
                    gainNode.gain.setValueAtTime(sound.gain, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                    oscillator.type = 'square';
                    
                    // 添加金属声
                    const metalNoise = this.createNoiseBuffer();
                    const metalSource = this.audioContext.createBufferSource();
                    const metalNoiseGain = this.audioContext.createGain();
                    const metalFilter = this.audioContext.createBiquadFilter();
                    metalFilter.type = 'bandpass';
                    metalFilter.frequency.value = 3000;
                    metalFilter.Q.value = 20;
                    metalSource.buffer = metalNoise;
                    metalSource.connect(metalFilter);
                    metalFilter.connect(metalNoiseGain);
                    metalNoiseGain.connect(this.gainNode);
                    metalNoiseGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    metalNoiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                    metalSource.start();
                    metalSource.stop(this.audioContext.currentTime + 0.15);
                    break;
                    
                case 'hihat':
                    oscillator.frequency.setValueAtTime(8000, this.audioContext.currentTime);
                    filterNode.type = 'highpass';
                    filterNode.frequency.setValueAtTime(7000, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(sound.gain, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                    oscillator.type = 'square';
                    
                    // 添加白噪音
                    const hihatNoise = this.createNoiseBuffer();
                    const hihatSource = this.audioContext.createBufferSource();
                    const hihatNoiseGain = this.audioContext.createGain();
                    hihatSource.buffer = hihatNoise;
                    hihatSource.connect(hihatNoiseGain);
                    hihatNoiseGain.connect(this.gainNode);
                    hihatNoiseGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    hihatNoiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                    hihatSource.start();
                    hihatSource.stop(this.audioContext.currentTime + 0.1);
                    break;
            }

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        }
    }
}
