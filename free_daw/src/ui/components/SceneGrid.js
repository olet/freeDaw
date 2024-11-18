import { createElement } from '../utils/DOMUtils';
import { Node as SceneNode } from '../../core/Node';
import Clip from '../../core/Clip';
import RhythmPattern from '../../core/RhythmPattern';
import DensityModifier from '../../modifiers/DensityModifier';
import SynthModifier from '../../modifiers/SynthModifier';

class SceneGrid {
    constructor(scene) {
        this.scene = scene;
        this.cells = [];
        this.setupStyles();
    }

    setupStyles() {
        const style = createElement('style');
        style.textContent = `
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
                background: rgba(45, 45, 55, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }
            .grid-cell:hover {
                background: rgba(65, 65, 75, 0.8);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .grid-cell.active {
                background: rgba(125, 96, 255, 0.3);
                border-color: rgba(125, 96, 255, 0.4);
                box-shadow: 0 0 15px rgba(125, 96, 255, 0.2);
            }
            .grid-cell.playing {
                background: rgba(96, 255, 125, 0.3);
                border-color: rgba(96, 255, 125, 0.4);
                box-shadow: 0 0 15px rgba(96, 255, 125, 0.2);
            }
            .grid-cell.drag-over {
                background: rgba(125, 96, 255, 0.3);
                border-color: rgba(125, 96, 255, 0.4);
                box-shadow: 0 0 15px rgba(125, 96, 255, 0.2);
                transform: scale(1.1);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .grid-cell.selected {
                background: rgba(125, 96, 255, 0.5);
                border-color: rgba(125, 96, 255, 0.6);
                box-shadow: 0 0 20px rgba(125, 96, 255, 0.3);
                transform: scale(1.05);
            }
            .grid-wrapper {
                position: relative;
                display: flex;
                align-items: center;
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
                background: rgba(45, 45, 55, 0.6);
                border-radius: 6px;
                backdrop-filter: blur(5px);
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .track-label:hover {
                background: rgba(65, 65, 75, 0.8);
                transform: translateX(2px);
            }
        `;
        document.head.appendChild(style);
    }

    setupDropZone() {
        // 允许拖放
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                this.cells.forEach(row => {
                    row.forEach(c => c.classList.remove('drag-over'));
                });
                cell.classList.add('drag-over');
            }
        });

        this.container.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        this.container.addEventListener('dragleave', (e) => {
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                cell.classList.remove('drag-over');
            }
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                cell.classList.remove('drag-over');
                const clipId = e.dataTransfer.getData('text/plain');
                const { row, col } = cell.dataset;
                this.handleClipDrop(clipId, parseInt(row), parseInt(col));
            }
        });
    }

    createGrid() {
        // 创建容器
        this.container = createElement('div', {
            className: 'scene-grid'
        });

        // 创建网格
        for (let row = 0; row < 8; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 16; col++) {
                const cell = createElement('div', {
                    className: 'grid-cell',
                    dataset: { row, col }
                });
                cell.onclick = () => this.toggleCell(row, col, cell);
                this.container.appendChild(cell);
                this.cells[row][col] = cell;
            }
        }

        // 创建包装器
        const gridWrapper = createElement('div', {
            className: 'grid-wrapper'
        });

        // 创建轨道标签
        const trackLabels = createElement('div', {
            className: 'track-labels'
        });

        Array.from({length: 8}, (_, i) => `Track ${i + 1}`).forEach(name => {
            const label = createElement('div', {
                className: 'track-label',
                innerHTML: name
            });
            trackLabels.appendChild(label);
        });

        gridWrapper.appendChild(trackLabels);
        gridWrapper.appendChild(this.container);

        // 设置拖放区域
        this.setupDropZone();

        return gridWrapper;
    }

    mount(parent) {
        console.log('Mounting SceneGrid');
        const wrapper = this.createGrid();
        parent.appendChild(wrapper);
    }

    handleClipDrop(clipId, row, col) {
        console.log('SceneGrid: Creating node from clip:', {
            clipId,
            position: { row, col }
        });

        const clip = window.clipLibrary.getClip(clipId);
        if (clip) {
            const node = new SceneNode();
            node.setLooping(true);
            node.setAutoAdvance(false);
            node.addClip(clip);
            
            // 确保clip有SynthModifier
            if (!clip.modifiers.some(m => m.type === 'synth')) {
                clip.addModifier(new SynthModifier('piano'));
            }
            
            console.log('SceneGrid: Node created:', {
                clips: node.clips.length,
                playMode: node.playMode,
                isLooping: node.isLooping,
                firstClip: {
                    pattern: node.clips[0].pattern,
                    modifiers: node.clips[0].modifiers.map(m => ({
                        type: m.type,
                        params: m.params
                    }))
                }
            });
            
            this.scene.setNode(row, col, node);
            this.cells[row][col].classList.add('active');
        }
    }

    clearSelection() {
        this.cells.forEach(row => {
            row.forEach(cell => {
                cell.classList.remove('selected');
            });
        });
    }

    toggleCell(row, col, cell) {
        const isActive = cell.classList.toggle('active');
        if (isActive) {
            // 创建新的Node并设置默认行为
            const node = new SceneNode();
            node.setLooping(true);        // 设置循环
            node.setAutoAdvance(false);   // 不自动前进
            
            // 设置到场景中
            this.scene.setNode(row, col, node);
        } else {
            this.scene.setNode(row, col, null);
        }
    }

    updatePlayingColumn(col) {
        this.cells.forEach(row => {
            row.forEach(cell => cell.classList.remove('playing'));
        });

        if (col >= 0 && col < 16) {
            this.cells.forEach(row => {
                row[col].classList.add('playing');
            });
        }
    }

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