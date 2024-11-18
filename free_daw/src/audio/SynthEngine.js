import * as Tone from 'tone';
import { SYNTH_PRESETS, Synthesizer } from './Synthesizers';

class SynthEngine {
    constructor() {
        this.isPlaying = false;
        this.events = [];
        this.synths = new Map();
        this.activeNotes = new Set();  // 跟踪活跃的音符
        
        // 主音量控制
        this.volume = new Tone.Volume(-12).toDestination();
        
        // 自动清理计时器
        setInterval(() => this.cleanupNotes(), 1000);
    }

    // 加载合成器
    loadSynth(name) {
        console.log(`SynthEngine: Loading synth ${name}`);
        const preset = SYNTH_PRESETS[name];
        if (!preset) {
            console.error(`SynthEngine: Unknown synth preset: ${name}`);
            throw new Error(`Unknown synth preset: ${name}`);
        }
        
        if (this.synths.has(name)) {
            console.log(`SynthEngine: Disposing old synth ${name}`);
            this.synths.get(name).dispose();
        }
        
        const synth = new Synthesizer(preset.type, preset.options);
        synth.synth.disconnect();
        synth.synth.connect(this.volume);
        this.synths.set(name, synth);
        return synth;
    }

    // 启动音频上下文
    async start() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        // 确保在音频上下文启动后再创建合成器
        if (!this.synths.has('kick')) {
            this.loadSynth('kick');
        }
    }

    // 清理长时间未释放的音符
    cleanupNotes() {
        const now = Tone.now();
        for (const note of this.activeNotes) {
            if (now - note.startTime > 2) {  // 如果音符播放超过2秒
                this.releaseNote(note);
            }
        }
    }

    // 释放音符
    releaseNote(note) {
        const synth = this.synths.get(note.synthName);
        if (synth) {
            synth.synth.triggerRelease(note.pitch, Tone.now());
        }
        this.activeNotes.delete(note);
    }

    triggerSound(time, velocity = 1.0, synthName = 'kick', note = 'C4') {
        console.log(`SynthEngine: Triggering ${synthName} at ${time} with velocity ${velocity}`);
        let synth = this.synths.get(synthName);
        if (!synth) {
            console.log(`SynthEngine: Loading synth ${synthName}`);
            synth = this.loadSynth(synthName);
        }

        // 记录活跃音符
        const noteInfo = { startTime: time, synthName, pitch: note };
        this.activeNotes.add(noteInfo);

        // 触发音符
        synth.trigger(time, velocity, note);

        // 设置自动释放
        Tone.Transport.schedule(() => {
            this.releaseNote(noteInfo);
        }, time + 0.5);  // 0.5秒后释放
    }

    scheduleEvents(pattern, synthName = 'kick', notes = ['C4']) {
        this.clearEvents();
        
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        
        const startDelay = 0.1;
        
        for (let i = 0; i < pattern.length; i++) {
            if (pattern.pattern[i] > 0) {
                const event = Tone.Transport.schedule((time) => {
                    const offset = i * 0.001;
                    // 如果是钢琴，则使用旋律音符
                    const note = synthName === 'piano' ? 
                        notes[Math.floor(i / 4) % notes.length] : 'C4';
                    this.triggerSound(time + offset, pattern.pattern[i], synthName, note);
                }, `${i}*0.25 + ${startDelay}`);
                this.events.push(event);
            }
        }
        
        this.play();
    }

    clearEvents() {
        this.events.forEach(id => {
            Tone.Transport.clear(id);
        });
        this.events = [];
    }

    play() {
        if (!this.isPlaying) {
            console.log('Starting transport...');
            // 添加一个小的延迟后启动
            setTimeout(() => {
                Tone.Transport.start();
                this.isPlaying = true;
            }, 100);
        }
    }

    stop() {
        if (this.isPlaying) {
            console.log('Stopping transport...');
            Tone.Transport.stop();
            this.synths.forEach(synth => synth.dispose());
            this.synths.clear();
            this.clearEvents();
            this.isPlaying = false;
        }
    }

    setTempo(bpm) {
        Tone.Transport.bpm.value = bpm;
    }

    resetTransport() {
        Tone.Transport.position = 0;
    }
}

export default SynthEngine; 