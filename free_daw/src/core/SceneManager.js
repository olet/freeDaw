import * as Tone from 'tone';
import Scene from './Scene';
import SynthEngine from '../audio/SynthEngine';

class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.isPlaying = false;
        this.synthEngine = new SynthEngine();
    }

    // 创建新场景
    createScene(id, rows = 4, cols = 16) {
        const scene = new Scene(rows, cols);
        scene.setSynthEngine(this.synthEngine);
        this.scenes.set(id, scene);
        return scene;
    }

    // 设置当前场景
    setCurrentScene(id) {
        if (this.scenes.has(id)) {
            this.currentScene = this.scenes.get(id);
        }
    }

    // 开始播放
    async play() {
        console.log('SceneManager: Play called');
        
        if (!this.currentScene) {
            console.error('SceneManager: No current scene!');
            return;
        }

        if (this.isPlaying) {
            console.log('SceneManager: Already playing');
            return;
        }

        try {
            console.log('SceneManager: Starting Tone.js...');
            await Tone.start();
            this.isPlaying = true;

            console.log('SceneManager: Setting up transport...');
            Tone.Transport.scheduleRepeat((time) => {
                console.log(`SceneManager: Transport callback at time ${time}, column ${this.currentScene.currentCol}`);
                this.processCurrentColumn(time);
            }, '16n');

            console.log('SceneManager: Starting transport...');
            Tone.Transport.start();
            console.log('SceneManager: Transport started');
        } catch (error) {
            console.error('SceneManager: Error during play:', error);
            this.isPlaying = false;
            throw error;
        }
    }

    // 停止播放
    stop() {
        this.isPlaying = false;
        Tone.Transport.stop();
        if (this.currentScene) {
            this.currentScene.reset();
        }
    }

    // 处理当前列
    processCurrentColumn(time) {
        if (!this.currentScene || !this.isPlaying) {
            console.log('SceneManager: Process column skipped - inactive');
            return;
        }

        console.log(`SceneManager: Processing column ${this.currentScene.currentCol} at time ${time}`);
        this.currentScene.processColumn(this.currentScene.currentCol, time);
        this.currentScene.currentCol = (this.currentScene.currentCol + 1) % this.currentScene.cols;
    }

    // 设置速度
    setTempo(bpm) {
        Tone.Transport.bpm.value = bpm;
    }
}

export default SceneManager; 