export class Node {
    constructor() {
        this.clips = [];              // 节点包含的clips
        this.playMode = 'sequence';   // 播放模式：'all', 'random', 'sequence'
        this.currentClipIndex = 0;    // 当前播放的clip索引
        this.isLooping = true;        // 默认循环播放
        this.autoAdvance = false;     // 默认不自动前进
        this.clipDuration = 4;        // 默认clip长度（秒）
        this.lastProcessTime = 0;     // 上次处理时间
        this.completed = false;       // 当前node是否播放完成
    }

    // 添加clip
    addClip(clip) {
        this.clips.push(clip);
    }

    // 移除clip
    removeClip(clip) {
        const index = this.clips.indexOf(clip);
        if (index !== -1) {
            this.clips.splice(index, 1);
        }
    }

    // 处理节点，返回 {clip: processedClip, completed: boolean}
    process(time = Tone.now()) {
        console.log('Node: Processing node', {
            clips: this.clips.length,
            playMode: this.playMode,
            currentClipIndex: this.currentClipIndex,
            isLooping: this.isLooping,
            lastProcessTime: this.lastProcessTime
        });

        if (this.clips.length === 0) {
            console.log('Node: No clips available');
            return { clip: null, completed: true };
        }

        // 检查是否需要切换到下一个clip
        if (time - this.lastProcessTime >= this.clipDuration) {
            if (this.playMode === 'sequence') {
                this.currentClipIndex++;
                
                // 检查是否完成所有clips的播放
                if (this.currentClipIndex >= this.clips.length) {
                    if (this.isLooping) {
                        // 循环模式：重置到第一个clip
                        this.currentClipIndex = 0;
                        this.completed = false;
                    } else if (this.autoAdvance) {
                        // 自动前进模式：标记为完成
                        this.completed = true;
                        return { clip: null, completed: true };
                    } else {
                        // 停留在最后一个clip
                        this.currentClipIndex = this.clips.length - 1;
                    }
                }
            }
            this.lastProcessTime = time;
        }

        let processedClip;
        switch (this.playMode) {
            case 'all':
                console.log('Node: Processing all clips');
                processedClip = this.processAllClips();
                break;
            case 'random':
                console.log('Node: Processing random clip');
                processedClip = this.processRandomClip();
                break;
            case 'sequence':
                console.log('Node: Processing sequence clip');
                processedClip = this.processSequenceClip();
                break;
            default:
                processedClip = null;
        }

        console.log('Node: Process result', {
            hasProcessedClip: !!processedClip,
            completed: this.completed
        });

        return {
            clip: processedClip,
            completed: this.completed
        };
    }

    // 处理所有clips（混合模式）
    processAllClips() {
        if (this.clips.length === 0) return null;
        
        const result = this.clips[0].process();
        for (let i = 1; i < this.clips.length; i++) {
            const clipResult = this.clips[i].process();
            for (let j = 0; j < clipResult.pattern.length; j++) {
                result.pattern[j] = Math.max(result.pattern[j], clipResult.pattern[j]);
            }
        }
        return result;
    }

    // 随机处理一个clip
    processRandomClip() {
        if (this.clips.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.clips.length);
        return this.clips[randomIndex].process();
    }

    // 顺序处理clip
    processSequenceClip() {
        if (this.clips.length === 0 || this.currentClipIndex >= this.clips.length) {
            return null;
        }
        return this.clips[this.currentClipIndex].process();
    }

    // 设置播放模式
    setPlayMode(mode) {
        if (['all', 'random', 'sequence'].includes(mode)) {
            this.playMode = mode;
            this.currentClipIndex = 0;
            this.completed = false;
        }
    }

    // 设置循环模式
    setLooping(loop) {
        this.isLooping = loop;
        if (loop) {
            this.completed = false;
        }
    }

    // 设置自动前进
    setAutoAdvance(auto) {
        this.autoAdvance = auto;
    }

    // 重置节点状态
    reset() {
        this.currentClipIndex = 0;
        this.lastProcessTime = 0;
        this.completed = false;
    }
}

export default Node; 