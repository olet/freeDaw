class AudioEngine {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.samples = new Map();
    }

    async loadSample(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.samples.set(name, audioBuffer);
    }

    playSample(name, time = 0, velocity = 1.0) {
        const buffer = this.samples.get(name);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.value = velocity;
        source.start(this.audioContext.currentTime + time);
    }
}

export default AudioEngine; 