class SynthControls {
    constructor(synthEngine) {
        this.synthEngine = synthEngine;
        this.container = document.createElement('div');
        this.container.className = 'synth-controls';
        this.currentSynth = 'kick';
        this.setupStyles();
        this.createControls();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .synth-controls {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                color: white;
            }
            .synth-controls select, .synth-controls button {
                margin: 5px;
                padding: 5px 10px;
                background: #3a3a3a;
                color: white;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
            }
            .synth-controls select:hover, .synth-controls button:hover {
                background: #4a4a4a;
            }
        `;
        document.head.appendChild(style);
    }

    createControls() {
        // 音色选择器
        const synthSelect = document.createElement('select');
        ['kick', 'snare', 'hihat', 'piano'].forEach(name => {
            const option = document.createElement('option');
            option.value = option.textContent = name;
            synthSelect.appendChild(option);
        });
        
        synthSelect.onchange = () => {
            this.currentSynth = synthSelect.value;
            this.synthEngine.loadSynth(this.currentSynth);
        };

        // 音量控制
        const volumeLabel = document.createElement('span');
        volumeLabel.textContent = 'Volume: ';
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = -60;
        volumeSlider.max = 0;
        volumeSlider.value = -12;
        volumeSlider.oninput = () => {
            this.synthEngine.volume.volume.value = parseFloat(volumeSlider.value);
        };

        // 添加到容器
        this.container.appendChild(synthSelect);
        this.container.appendChild(document.createElement('br'));
        this.container.appendChild(volumeLabel);
        this.container.appendChild(volumeSlider);

        document.body.appendChild(this.container);
    }

    getCurrentSynth() {
        return this.currentSynth;
    }
}

export default SynthControls; 