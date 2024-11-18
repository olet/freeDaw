import { Node as SceneNode } from '../core/Node';
import NodeSettings from './NodeSettings';
import DensityModifier from '../modifiers/DensityModifier';
import Clip from '../core/Clip';
import RhythmPattern from '../core/RhythmPattern';

class SceneGrid {
    constructor(scene) {
        this.scene = scene;
        this.container = document.createElement('div');
        this.container.className = 'scene-grid';
        this.cells = [];
        this.nodeSettings = new NodeSettings();
        this.setupStyles();
        this.createGrid();
        
        // 添加全局点击事件监听器来关闭设置面板
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && 
                !this.nodeSettings.container.contains(e.target)) {
                this.nodeSettings.hide();
            }
        });
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .scene-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 30px;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                width: fit-content;
            }
            .grid-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }
            .scene-grid {
                display: grid;
                grid-template-columns: repeat(16, 45px);
                grid-template-rows: repeat(8, 45px);
                gap: 4px;
                padding: 25px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                margin-left: 80px;
            }
            .grid-cell {
                width: 45px;
                height: 45px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }
            .grid-cell:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .grid-cell.active {
                background: rgba(255, 27, 107, 0.3);
                border-color: rgba(255, 27, 107, 0.4);
                box-shadow: 0 0 15px rgba(255, 27, 107, 0.2);
            }
            .grid-cell.active[data-row="0"] {
                background: rgba(255, 82, 82, 0.3);
                border-color: rgba(255, 82, 82, 0.4);
                box-shadow: 0 0 15px rgba(255, 82, 82, 0.2);
            }
            .grid-cell.active[data-row="1"] {
                background: rgba(255, 193, 7, 0.3);
                border-color: rgba(255, 193, 7, 0.4);
                box-shadow: 0 0 15px rgba(255, 193, 7, 0.2);
            }
            .grid-cell.active[data-row="2"] {
                background: rgba(0, 230, 118, 0.3);
                border-color: rgba(0, 230, 118, 0.4);
                box-shadow: 0 0 15px rgba(0, 230, 118, 0.2);
            }
            .grid-cell.active[data-row="3"] {
                background: rgba(41, 121, 255, 0.3);
                border-color: rgba(41, 121, 255, 0.4);
                box-shadow: 0 0 15px rgba(41, 121, 255, 0.2);
            }
            .grid-cell.playing {
                position: relative;
                overflow: hidden;
            }
            .grid-cell.playing::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, 
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0) 100%
                );
                animation: playingHighlight 0.5s ease;
            }
            @keyframes playingHighlight {
                from {
                    transform: translateX(-100%);
                }
                to {
                    transform: translateX(100%);
                }
            }
            .grid-cell:active {
                transform: scale(0.95);
            }
            .track-labels {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                justify-content: space-around;
                height: calc(8 * 49px);
                padding: 25px 15px;
            }
            .track-label {
                color: rgba(255, 255, 255, 0.9);
                font-size: 14px;
                font-weight: 500;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                backdrop-filter: blur(5px);
                transition: all 0.2s ease;
                white-space: nowrap;
                position: relative;
                overflow: hidden;
            }
            .track-label::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.2),
                    transparent
                );
                transition: 0.5s;
            }
            .track-label:hover::after {
                left: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    createGrid() {
        const sceneContainer = document.createElement('div');
        sceneContainer.className = 'scene-container';

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'grid-wrapper';

        // 创建轨道标签
        const trackLabels = document.createElement('div');
        trackLabels.className = 'track-labels';
        const trackNames = Array.from({length: 8}, (_, i) => `Track ${i + 1}`);
        trackNames.forEach(name => {
            const label = document.createElement('div');
            label.className = 'track-label';
            label.textContent = name;
            trackLabels.appendChild(label);
        });
        gridWrapper.appendChild(trackLabels);

        // 创建网格
        for (let row = 0; row < 8; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 16; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // 添加点击事件
                cell.onclick = () => this.toggleCell(row, col, cell);

                this.container.appendChild(cell);
                this.cells[row][col] = cell;
            }
        }

        gridWrapper.appendChild(this.container);
        sceneContainer.appendChild(gridWrapper);
        document.body.appendChild(sceneContainer);
    }

    toggleCell(row, col, cell) {
        const isActive = cell.classList.toggle('active');
        if (isActive) {
            // 创建新的Node和基础Clip
            const node = new SceneNode();
            const clip = new Clip(`clip-${row}-${col}`);
            const pattern = new RhythmPattern(4, 4);
            pattern.setVelocity(0, 1.0);
            clip.pattern = pattern;
            clip.synthType = 'kick';  // 设置默认音色
            clip.addModifier(new DensityModifier(1.0));
            node.addClip(clip);
            
            this.scene.setNode(row, col, node);

            // 显示设置面板
            const rect = cell.getBoundingClientRect();
            this.nodeSettings.show(node, {
                x: rect.right + 10,
                y: rect.top
            });
        } else {
            this.scene.setNode(row, col, null);
            this.nodeSettings.hide();
        }
    }

    // 更新播放状态显示
    updatePlayingColumn(col) {
        // 清除之前的播放状态
        this.cells.forEach(row => {
            row.forEach(cell => {
                cell.classList.remove('playing');
            });
        });

        // 显示当前播放列
        if (col >= 0 && col < 16) {
            this.cells.forEach(row => {
                row[col].classList.add('playing');
            });
        }
    }

    // 根据Scene状态更新网格显示
    updateFromScene() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 16; col++) {
                const node = this.scene.getNode(row, col);
                this.cells[row][col].classList.toggle('active', !!node);
            }
        }
    }
}

export default SceneGrid; 