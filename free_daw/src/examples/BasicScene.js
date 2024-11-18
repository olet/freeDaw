import Scene from '../core/Scene';
import Node from '../core/Node';
import Clip from '../core/Clip';
import RhythmPattern from '../core/RhythmPattern';
import DensityModifier from '../modifiers/DensityModifier';
import SceneManager from '../core/SceneManager';
import SynthEngine from '../audio/SynthEngine';
import * as Tone from 'tone';
import SceneGrid from '../ui/SceneGrid';

class BasicScene {
    constructor() {
        this.synthEngine = new SynthEngine();
        this.sceneManager = new SceneManager();
        this.setupScene();
        this.grid = new SceneGrid(this.sceneManager.currentScene);
    }

    setupScene() {
        // 创建8x16的场景
        const scene = this.sceneManager.createScene('basic', 8, 16);
        this.sceneManager.setCurrentScene('basic');

        // 创建不同的节奏模式
        const patterns = {
            kick: this.createKickPattern(),
            snare: this.createSnarePattern(),
            hihat: this.createHihatPattern(),
            piano: this.createPianoPattern()
        };

        // 设置每个轨道
        this.setupTrack(0, 'kick', patterns.kick);     // Kick轨道
        this.setupTrack(1, 'snare', patterns.snare);   // Snare轨道
        this.setupTrack(2, 'hihat', patterns.hihat);   // Hihat轨道
        this.setupTrack(3, 'piano', patterns.piano);   // Piano轨道
    }

    // 创建基本的Kick模式
    createKickPattern() {
        const pattern = new RhythmPattern(4, 4);
        pattern.setVelocity(0, 1.0);   // 1拍
        pattern.setVelocity(8, 0.8);   // 3拍
        return pattern;
    }

    // 创建Snare模式
    createSnarePattern() {
        const pattern = new RhythmPattern(4, 4);
        pattern.setVelocity(4, 0.9);   // 2拍
        pattern.setVelocity(12, 0.8);  // 4拍
        return pattern;
    }

    // 创建Hihat模式
    createHihatPattern() {
        const pattern = new RhythmPattern(4, 4);
        for (let i = 0; i < 16; i += 2) {  // 每个8分音符
            pattern.setVelocity(i, 0.7);
        }
        return pattern;
    }

    // 创建Piano模式
    createPianoPattern() {
        const pattern = new RhythmPattern(4, 4);
        pattern.setVelocity(0, 1.0);
        pattern.setVelocity(4, 0.8);
        pattern.setVelocity(8, 0.9);
        pattern.setVelocity(12, 0.7);
        return pattern;
    }

    // 设置单个轨道
    setupTrack(row, synthName, pattern) {
        // 为每个轨道创建一个基础clip
        const clip = new Clip(`${synthName}-base`);
        clip.pattern = pattern;

        // 创建四个不同的变体
        for (let col = 0; col < 16; col += 4) {
            const node = new Node();
            const variantClip = this.createVariant(clip, synthName, col / 4);
            node.addClip(variantClip);
            this.sceneManager.currentScene.setNode(row, col, node);
        }
    }

    // 创建clip的变体
    createVariant(baseClip, synthName, variant) {
        const clip = new Clip(`${synthName}-variant-${variant}`);
        clip.pattern = baseClip.pattern.clone();

        // 根据变体添加不同的modifier
        switch (variant) {
            case 1:
                clip.addModifier(new DensityModifier(2.0));
                break;
            case 2:
                clip.addModifier(new DensityModifier(1.5));
                break;
            case 3:
                clip.addModifier(new DensityModifier(3.0));
                break;
        }

        return clip;
    }

    // 播放控制
    async play() {
        await this.synthEngine.start();
        this.synthEngine.setTempo(120);
        await this.sceneManager.play();
    }

    stop() {
        this.sceneManager.stop();
        this.synthEngine.stop();
    }

    // 创建UI控件
    createControls() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = '1000';

        const playButton = document.createElement('button');
        playButton.textContent = '播放场景';
        playButton.onclick = () => this.play();
        container.appendChild(playButton);

        const stopButton = document.createElement('button');
        stopButton.textContent = '停止';
        stopButton.onclick = () => this.stop();
        container.appendChild(stopButton);

        document.body.appendChild(container);
    }
}

export default BasicScene; 