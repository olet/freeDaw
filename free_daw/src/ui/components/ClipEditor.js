import { createElement } from '../utils/DOMUtils';
import RhythmPattern from '../../core/RhythmPattern';
import DensityModifier from '../../modifiers/DensityModifier';
import SynthModifier from '../../modifiers/SynthModifier';

class ClipEditor {
    constructor() {
        this.container = createElement('div', {
            className: 'clip-editor'
        });
        this.currentClip = null;
        this.setupStyles();
        this.createEditor();
    }

    setupStyles() {
        const style = createElement('style');
        style.textContent = `
            .clip-editor {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                color: white;
                min-width: 600px;
                backdrop-filter: blur(10px);
                display: none;
                z-index: 2000;
            }

            .clip-editor.visible {
                display: block;
            }

            .rhythm-grid {
                display: grid;
                grid-template-columns: repeat(16, 30px);
                gap: 4px;
                margin: 20px 0;
            }

            .rhythm-cell {
                width: 30px;
                height: 30px;
                background: rgba(45, 45, 55, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .rhythm-cell:hover {
                background: rgba(65, 65, 75, 0.8);
            }

            .rhythm-cell.active {
                background: rgba(125, 96, 255, 0.3);
                border-color: rgba(125, 96, 255, 0.4);
            }

            .modifiers-list {
                margin: 20px 0;
            }

            .modifier-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 10px 0;
                padding: 10px;
                background: rgba(45, 45, 55, 0.6);
                border-radius: 6px;
            }

            .modifier-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .modifier-controls input {
                width: 100px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: white;
                padding: 4px 8px;
            }

            .editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .close-button {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                font-size: 20px;
                padding: 5px;
            }
        `;
        document.head.appendChild(style);
    }

    createEditor() {
        // 编辑器头部
        const header = createElement('div', {
            className: 'editor-header',
            innerHTML: `
                <h3>编辑 Clip</h3>
                <button class="close-button">×</button>
            `
        });

        // 节奏网格
        const rhythmGrid = createElement('div', {
            className: 'rhythm-grid'
        });

        // 创建16个节奏格子
        for (let i = 0; i < 16; i++) {
            const cell = createElement('div', {
                className: 'rhythm-cell',
                dataset: { position: i }
            });
            cell.onclick = () => this.toggleBeat(i, cell);
            rhythmGrid.appendChild(cell);
        }

        // 修改器列表
        const modifiersList = createElement('div', {
            className: 'modifiers-list'
        });

        // 添加到容器
        this.container.appendChild(header);
        this.container.appendChild(rhythmGrid);
        this.container.appendChild(modifiersList);

        // 事件处理
        header.querySelector('.close-button').onclick = () => this.hide();

        document.body.appendChild(this.container);
    }

    toggleBeat(position, cell) {
        if (!this.currentClip) {
            console.warn('ClipEditor: No clip selected');
            return;
        }

        console.log('ClipEditor: Toggling beat', { position });
        const isActive = cell.classList.toggle('active');
        this.currentClip.pattern.setVelocity(position, isActive ? 1.0 : 0);
        console.log('ClipEditor: Pattern updated:', this.currentClip.pattern);
        this.updateModifiersDisplay();
    }

    updateRhythmDisplay() {
        if (!this.currentClip) return;

        const cells = this.container.querySelectorAll('.rhythm-cell');
        cells.forEach((cell, i) => {
            cell.classList.toggle('active', this.currentClip.pattern.pattern[i] > 0);
        });
    }

    updateModifiersDisplay() {
        if (!this.currentClip) return;

        const modifiersList = this.container.querySelector('.modifiers-list');
        modifiersList.innerHTML = '';

        this.currentClip.modifiers.forEach((modifier, index) => {
            const modifierItem = createElement('div', {
                className: 'modifier-item',
                innerHTML: `
                    <span>${modifier.type} Modifier</span>
                    <div class="modifier-controls">
                        ${this.createModifierControls(modifier)}
                    </div>
                `
            });
            modifiersList.appendChild(modifierItem);
        });
    }

    createModifierControls(modifier) {
        switch (modifier.type) {
            case 'density':
                return `
                    <input type="range" 
                           min="1" max="4" 
                           step="0.1" 
                           value="${modifier.params.density}"
                           onInput="this.nextElementSibling.textContent = this.value">
                    <span>${modifier.params.density}</span>
                `;
            case 'synth':
                return `
                    <select>
                        <option value="piano" ${modifier.params.synthType === 'piano' ? 'selected' : ''}>Piano</option>
                        <option value="kick" ${modifier.params.synthType === 'kick' ? 'selected' : ''}>Kick</option>
                        <option value="snare" ${modifier.params.synthType === 'snare' ? 'selected' : ''}>Snare</option>
                        <option value="hihat" ${modifier.params.synthType === 'hihat' ? 'selected' : ''}>Hihat</option>
                    </select>
                `;
            default:
                return '';
        }
    }

    show(clip) {
        console.log('ClipEditor: Showing editor for clip:', clip);
        this.currentClip = clip;
        this.container.classList.add('visible');
        this.updateRhythmDisplay();
        this.updateModifiersDisplay();
        console.log('ClipEditor: Editor state updated');
    }

    hide() {
        this.container.classList.remove('visible');
        this.currentClip = null;
    }
}

export default ClipEditor; 