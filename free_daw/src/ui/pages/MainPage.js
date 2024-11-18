import { createElement } from '../utils/DOMUtils';
import ClipLibrary from '../components/ClipLibrary';
import SceneGrid from '../components/SceneGrid';
import SynthEngine from '../../audio/SynthEngine';

class MainPage {
    constructor(options) {
        console.log('MainPage: Initializing with options:', options);
        this.scene = options.scene;
        this.sceneManager = options.sceneManager;
        this.synthEngine = this.sceneManager.synthEngine;
        
        this.container = createElement('div', {
            className: 'main-page'
        });
        
        this.clipLibrary = new ClipLibrary();
        this.sceneGrid = new SceneGrid(this.scene);
        
        this.setupStyles();
        this.initializeLayout();
    }
    
    setupStyles() {
        const style = createElement('style');
        style.textContent = `
            .main-page {
                width: 100vw;
                height: 100vh;
                display: flex;
                flex-direction: column;
            }
            
            .main-content {
                flex: 1;
                padding-top: 100px;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .transport-controls {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 12px;
                padding: 16px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                z-index: 1000;
            }

            .transport-controls button {
                min-width: 100px;
            }

            .tempo-control {
                display: flex;
                align-items: center;
                gap: 8px;
                color: white;
            }

            .tempo-control input {
                width: 60px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: white;
                padding: 4px 8px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }
    
    initializeLayout() {
        console.log('MainPage: Initializing layout');
        const mainContent = createElement('div', {
            className: 'main-content'
        });
        
        this.clipLibrary.mount(this.container);
        this.sceneGrid.mount(mainContent);
        this.container.appendChild(mainContent);

        const controls = this.createTransportControls();
        this.container.appendChild(controls);

        console.log('MainPage: Layout initialized with controls');
    }

    createTransportControls() {
        console.log('MainPage: Creating transport controls');
        const controls = createElement('div', {
            className: 'transport-controls'
        });

        // 播放按钮
        const playButton = createElement('button', {
            innerHTML: '播放',
            onclick: async () => {
                console.log('MainPage: Play button clicked - TEST');
                try {
                    if (this.sceneManager.isPlaying) {
                        console.log('MainPage: Stopping playback');
                        this.sceneManager.stop();
                        this.synthEngine.stop();
                    } else {
                        console.log('MainPage: Starting playback');
                        await this.synthEngine.start();
                        console.log('MainPage: Audio engine started');
                        await this.sceneManager.play();
                        console.log('MainPage: Scene manager started playing');
                    }
                } catch (error) {
                    console.error('MainPage: Error during playback:', error);
                }
            }
        });

        // 停止按钮
        const stopButton = createElement('button', {
            innerHTML: '停止',
            onclick: () => {
                console.log('MainPage: Stop button clicked');
                this.sceneManager.stop();
                this.synthEngine.stop();
            }
        });

        // 速度控制
        const tempoControl = createElement('div', {
            className: 'tempo-control',
            innerHTML: `
                <span>BPM:</span>
                <input type="number" value="120" min="40" max="240" step="1">
            `
        });

        const tempoInput = tempoControl.querySelector('input');
        tempoInput.onchange = () => {
            const bpm = parseInt(tempoInput.value);
            if (bpm >= 40 && bpm <= 240) {
                this.sceneManager.setTempo(bpm);
            }
        };

        controls.appendChild(playButton);
        controls.appendChild(stopButton);
        controls.appendChild(tempoControl);

        console.log('MainPage: Transport controls created');
        return controls;
    }
    
    mount(parent) {
        console.log('MainPage: Mounting with scene:', this.scene);
        console.log('MainPage: SceneManager:', this.sceneManager);
        parent.appendChild(this.container);
    }
}

export default MainPage; 