import DensityModifier from '../modifiers/DensityModifier';
import SynthModifier from '../modifiers/SynthModifier';
import Clip from '../core/Clip';
import RhythmPattern from '../core/RhythmPattern';

class NodeSettings {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'node-settings';
        this.setupStyles();
        this.createPanel();
        this.currentNode = null;
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .node-settings {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 12px;
                color: white;
                backdrop-filter: blur(10px);
                min-width: 250px;
                display: none;
                z-index: 1000;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
            .node-settings.visible {
                display: block;
            }
            .node-settings h3 {
                margin: 0 0 15px 0;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
            }
            .settings-group {
                margin-bottom: 15px;
                background: rgba(255, 255, 255, 0.05);
                padding: 15px;
                border-radius: 8px;
            }
            .settings-group label {
                display: block;
                margin-bottom: 8px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9em;
            }
            .node-settings select, .node-settings input {
                width: 100%;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: white;
                margin-bottom: 10px;
                transition: all 0.2s ease;
            }
            .node-settings select:hover, .node-settings input:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
            .node-settings select:focus, .node-settings input:focus {
                outline: none;
                border-color: rgba(125, 96, 255, 0.5);
                box-shadow: 0 0 0 2px rgba(125, 96, 255, 0.2);
            }
            .density-value {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9em;
                text-align: right;
                margin-top: 5px;
            }
            .close-button {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                font-size: 18px;
                padding: 5px;
                transition: all 0.2s ease;
            }
            .close-button:hover {
                color: rgba(255, 255, 255, 0.8);
                transform: scale(1.1);
            }
            .clip-list {
                max-height: 150px;
                overflow-y: auto;
            }
            
            .clip-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            
            .remove-clip {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
            }
            
            .remove-clip:hover {
                background: rgba(255, 0, 0, 0.2);
                color: rgba(255, 255, 255, 0.8);
            }
            
            #addClip {
                width: 100%;
                margin-top: 8px;
                padding: 6px;
                background: rgba(125, 96, 255, 0.2);
                border: 1px solid rgba(125, 96, 255, 0.4);
                color: white;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            #addClip:hover {
                background: rgba(125, 96, 255, 0.3);
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }

    createPanel() {
        this.container.innerHTML = `
            <button class="close-button">×</button>
            <h3>节点设置</h3>
            <div class="settings-group">
                <label>Clip选择</label>
                <select id="clipSelect">
                    <option value="basic">基础节奏</option>
                    <option value="offbeat">切分节奏</option>
                    <option value="triplet">三连音</option>
                    <option value="sixteenth">十六分音符</option>
                </select>
                <button id="addClip">添加Clip</button>
            </div>
            <div class="settings-group">
                <label>播放模式</label>
                <select id="playMode">
                    <option value="all">全部播放</option>
                    <option value="sequence">顺序播放</option>
                    <option value="random">随机播放</option>
                </select>
            </div>
            <div class="settings-group">
                <label>密度修改器</label>
                <input type="range" id="density" min="1" max="4" step="0.1" value="1">
                <div class="density-value">1.0</div>
            </div>
            <div class="settings-group">
                <label>当前Clips</label>
                <div id="clipList" class="clip-list"></div>
            </div>
        `;

        const clipSelect = this.container.querySelector('#clipSelect');
        const addClipButton = this.container.querySelector('#addClip');
        const playModeSelect = this.container.querySelector('#playMode');
        const densityInput = this.container.querySelector('#density');
        const densityValue = this.container.querySelector('.density-value');
        const closeButton = this.container.querySelector('.close-button');

        addClipButton.addEventListener('click', () => {
            if (this.currentNode) {
                const clipType = clipSelect.value;
                const clip = this.createClip(clipType);
                this.currentNode.addClip(clip);
                this.updateClipList();
            }
        });

        playModeSelect.addEventListener('change', () => {
            if (this.currentNode) {
                this.currentNode.setPlayMode(playModeSelect.value);
            }
        });

        densityInput.addEventListener('input', () => {
            const value = parseFloat(densityInput.value);
            densityValue.textContent = value.toFixed(1);
            if (this.currentNode) {
                this.updateNodeDensity(value);
            }
        });

        closeButton.addEventListener('click', () => {
            this.hide();
        });

        document.body.appendChild(this.container);
    }

    createClip(type) {
        const clip = new Clip(`clip-${Date.now()}`);
        const pattern = new RhythmPattern(4, 4);

        // 根据类型创建不同的节奏模式
        switch (type) {
            case 'basic':
                pattern.setVelocity(0, 1.0);
                pattern.setVelocity(8, 0.8);
                break;
            case 'offbeat':
                pattern.setVelocity(4, 0.9);
                pattern.setVelocity(12, 0.8);
                break;
            case 'triplet':
                for (let i = 0; i < 12; i += 3) {
                    pattern.setVelocity(i, 0.8);
                }
                break;
            case 'sixteenth':
                for (let i = 0; i < 16; i += 4) {
                    pattern.setVelocity(i, 0.7);
                }
                break;
        }

        clip.pattern = pattern;
        clip.addModifier(new SynthModifier('piano'));
        clip.addModifier(new DensityModifier(1.0));
        return clip;
    }

    updateClipList() {
        if (!this.currentNode) return;

        const clipList = this.container.querySelector('#clipList');
        clipList.innerHTML = '';

        this.currentNode.clips.forEach((clip, index) => {
            const clipElement = document.createElement('div');
            clipElement.className = 'clip-item';
            clipElement.innerHTML = `
                <span>Clip ${index + 1}</span>
                <button class="remove-clip" data-index="${index}">×</button>
            `;
            
            clipElement.querySelector('.remove-clip').onclick = () => {
                this.currentNode.removeClip(clip);
                this.updateClipList();
            };

            clipList.appendChild(clipElement);
        });
    }

    show(node, position) {
        this.currentNode = node;
        this.container.classList.add('visible');
        
        // 更新控件状态
        const playModeSelect = this.container.querySelector('#playMode');
        const densityInput = this.container.querySelector('#density');
        
        playModeSelect.value = node.playMode;
        
        // 获取当前密度值
        const currentDensity = this.getNodeDensity(node);
        densityInput.value = currentDensity;
        this.container.querySelector('.density-value').textContent = currentDensity.toFixed(1);

        // 更新clip列表
        this.updateClipList();

        // 设置面板位置
        if (position) {
            const rect = this.container.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 确保面板不会超出视口
            let x = Math.min(position.x, viewportWidth - rect.width - 20);
            let y = Math.min(position.y, viewportHeight - rect.height - 20);
            x = Math.max(20, x);
            y = Math.max(20, y);

            this.container.style.transform = `translate(0, 0)`;
            this.container.style.top = `${y}px`;
            this.container.style.left = `${x}px`;
        }
    }

    hide() {
        this.container.classList.remove('visible');
        this.currentNode = null;
    }

    getNodeDensity(node) {
        if (node.clips[0] && node.clips[0].modifiers[0]) {
            return node.clips[0].modifiers[0].params.density || 1.0;
        }
        return 1.0;
    }

    updateNodeDensity(value) {
        if (this.currentNode && this.currentNode.clips[0]) {
            const clip = this.currentNode.clips[0];
            if (clip.modifiers[0]) {
                clip.modifiers[0].params.density = value;
            } else {
                clip.addModifier(new DensityModifier(value));
            }
        }
    }
}

export default NodeSettings; 