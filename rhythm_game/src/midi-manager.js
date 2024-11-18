class MidiManager {
    constructor(onMidiMessage) {
        this.midiAccess = null;
        this.midiInputs = new Map();
        this.onMidiMessage = onMidiMessage;
        this.isInitialized = false;
        this.keyUpListeners = new Set();
        console.log('[MidiManager] Created');
    }

    async init() {
        console.log('[MidiManager] Initializing...');
        try {
            if (!navigator.requestMIDIAccess) {
                throw new Error('Web MIDI API not supported');
            }

            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            const inputs = Array.from(this.midiAccess.inputs.values());
            console.log('[MidiManager] Available MIDI inputs:', inputs);

            if (inputs.length === 0) {
                throw new Error('No MIDI devices found');
            }

            // 选择主输入设备
            const primaryInput = inputs.find(input => !input.name.includes('MIDIIN2')) || inputs[0];
            console.log('[MidiManager] Selected primary input:', primaryInput.name);

            primaryInput.onmidimessage = this.handleMidiMessage.bind(this);
            this.midiInputs.set(primaryInput.id, primaryInput);

            this.midiAccess.onstatechange = this.handleStateChange.bind(this);
            this.isInitialized = true;
            console.log('[MidiManager] Initialized successfully');
            return primaryInput.name;
        } catch (err) {
            console.error('[MidiManager] Initialization error:', err);
            this.isInitialized = false;
            throw err;
        }
    }

    handleMidiMessage(event) {
        const [status] = event.data;
        
        if (status === 144 || status === 128) {
            if (status === 128) {
                // 触发所有键释放监听器
                this.keyUpListeners.forEach(listener => listener(event));
            }
            
            if (this.onMidiMessage) {
                this.onMidiMessage(event);
            }
        }
    }

    handleStateChange(e) {
        const device = e.port;
        console.log(`[MidiManager] State change: ${device.name} - ${device.state}`);
        
        if (device.state === 'disconnected') {
            this.midiInputs.delete(device.id);
        }
    }

    addKeyUpListener(listener) {
        this.keyUpListeners.add(listener);
    }

    removeKeyUpListener(listener) {
        this.keyUpListeners.delete(listener);
    }

    cleanup() {
        console.log('[MidiManager] Cleaning up...');
        try {
            if (this.midiInputs.size > 0) {
                this.midiInputs.forEach(input => {
                    input.onmidimessage = null;
                    input.close().catch(console.error);
                });
                this.midiInputs.clear();
            }

            if (this.midiAccess) {
                this.midiAccess.onstatechange = null;
            }

            this.isInitialized = false;
            console.log('[MidiManager] Cleanup completed');
        } catch (err) {
            console.error('[MidiManager] Cleanup error:', err);
        }
        this.keyUpListeners.clear();
    }
}

export default MidiManager; 