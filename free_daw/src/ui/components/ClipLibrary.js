import { createElement } from '../utils/DOMUtils';
import ClipEditor from './ClipEditor';
import Clip from '../../core/Clip';
import RhythmPattern from '../../core/RhythmPattern';
import DensityModifier from '../../modifiers/DensityModifier';
import SynthModifier from '../../modifiers/SynthModifier';

class ClipLibrary {
    constructor() {
        this.container = createElement('div', {
            className: 'clip-library'
        });
        
        this.clips = new Map();
        this.clipEditor = new ClipEditor();
        this.setupStyles();
        this.createLibrary();
        window.clipLibrary = this;  // 使ClipLibrary全局可访问
    }

    setupStyles() {
        const style = createElement('style');
        style.textContent = `
            .clip-library {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: rgba(20, 20, 25, 0.95);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding: 15px;
                backdrop-filter: blur(10px);
            }

            .clip-library-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .clip-library-header h3 {
                color: white;
                margin: 0;
                font-weight: 500;
            }

            .clip-list {
                display: flex;
                gap: 10px;
                overflow-x: auto;
                padding: 10px 0;
            }

            .clip-item {
                background: rgba(45, 45, 55, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 15px;
                min-width: 150px;
                cursor: move;
                transition: all 0.2s ease;
                user-select: none;
                position: relative;
            }

            .clip-item:hover {
                background: rgba(65, 65, 75, 0.8);
                transform: translateY(-2px);
            }

            .clip-item.dragging {
                opacity: 0.5;
                transform: scale(1.05);
            }

            .clip-controls {
                display: flex;
                gap: 5px;
                margin-top: 10px;
            }

            .clip-controls button {
                flex: 1;
                padding: 4px 8px;
                font-size: 12px;
                background: rgba(125, 96, 255, 0.2);
                border: 1px solid rgba(125, 96, 255, 0.4);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .clip-controls button:hover {
                background: rgba(125, 96, 255, 0.3);
            }

            .clip-name {
                color: white;
                font-size: 14px;
                margin-bottom: 5px;
            }

            .clip-type {
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    createLibrary() {
        const header = createElement('div', {
            className: 'clip-library-header',
            innerHTML: `
                <h3>Clip Library</h3>
                <button class="add-clip-btn">+ New Clip</button>
            `
        });

        const clipList = createElement('div', {
            className: 'clip-list'
        });

        this.container.appendChild(header);
        this.container.appendChild(clipList);

        // 添加新Clip按钮事件
        header.querySelector('.add-clip-btn').onclick = () => this.createNewClip();

        // 创建一个默认的Clip
        this.createNewClip();
    }

    createNewClip() {
        console.log('ClipLibrary: Creating new clip');
        const clipId = `clip-${Date.now()}`;
        const clip = new Clip(clipId);
        
        console.log('ClipLibrary: Setting up clip pattern and modifiers');
        // 创建基础节奏模式
        const pattern = new RhythmPattern(4, 4);
        pattern.setVelocity(0, 1.0);
        clip.pattern = pattern;

        // 添加默认修改器
        clip.addModifier(new SynthModifier('piano'));
        clip.addModifier(new DensityModifier(1.0));

        console.log('ClipLibrary: New clip created:', {
            id: clipId,
            pattern: pattern,
            modifiers: clip.modifiers
        });

        // 创建UI元素
        const clipElement = createElement('div', {
            className: 'clip-item',
            draggable: true,
            dataset: { clipId },
            innerHTML: `
                <div class="clip-name">New Clip</div>
                <div class="clip-type">Basic Pattern</div>
                <div class="clip-controls">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `
        });

        // 添加拖拽事件处理
        clipElement.addEventListener('dragstart', (e) => {
            console.log('ClipLibrary: Started dragging clip:', clipId);
            e.dataTransfer.setData('text/plain', clipId);
        });

        // 添加编辑按钮事件
        clipElement.querySelector('.edit-btn').onclick = (e) => {
            e.stopPropagation();
            this.clipEditor.show(clip);
        };

        // 添加删除按钮事件
        clipElement.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            this.deleteClip(clipId);
        };

        // 保存clip数据
        this.clips.set(clipId, {
            element: clipElement,
            clip: clip
        });

        // 添加到列表
        this.container.querySelector('.clip-list').appendChild(clipElement);
    }

    deleteClip(clipId) {
        const clipData = this.clips.get(clipId);
        if (clipData) {
            clipData.element.remove();
            this.clips.delete(clipId);
        }
    }

    getClip(clipId) {
        console.log('ClipLibrary: Getting clip:', clipId);
        const clipData = this.clips.get(clipId);
        console.log('ClipLibrary: Found clip data:', clipData);
        return clipData ? clipData.clip : null;
    }

    mount(parent) {
        parent.appendChild(this.container);
    }
}

export default ClipLibrary; 