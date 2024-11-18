import * as Tone from 'tone';

class Scene {
    constructor(rows = 4, cols = 16) {
        this.rows = rows;
        this.cols = cols;
        this.nodes = Array(rows).fill().map(() => Array(cols).fill(null));
        this.isPlaying = false;
        this.currentCol = 0;
        this.synthEngine = null;  // 将由SceneManager设置
    }

    // 设置节点
    setNode(row, col, node) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.nodes[row][col] = node;
        }
    }

    // 获取节点
    getNode(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.nodes[row][col];
        }
        return null;
    }

    // 处理当前列
    processColumn(col, time) {
        console.log(`Scene: Processing column ${col}`);
        for (let row = 0; row < this.rows; row++) {
            const node = this.nodes[row][col];
            if (node) {
                console.log(`Scene: Found node at row ${row}, col ${col}`, {
                    clips: node.clips.length,
                    playMode: node.playMode,
                    isLooping: node.isLooping
                });

                const result = node.process(time);
                console.log(`Scene: Node process result:`, {
                    hasClip: !!result.clip,
                    completed: result.completed,
                    pattern: result.clip ? result.clip.pattern : null
                });

                if (result.clip) {
                    const synthType = this.getSynthType(result.clip);
                    console.log(`Scene: Processing clip with synthType ${synthType}`);
                    this.scheduleSound(result.clip, time, synthType);
                }
            }
        }
    }

    // 从clip中获取音色类型
    getSynthType(clip) {
        if (!clip || !clip.modifiers) {
            console.warn('Scene: Invalid clip or missing modifiers', { clip });
            return 'piano';  // 默认使用钢琴音色
        }

        // 首先尝试从 synthType 属性获取
        if (clip.synthType) {
            return clip.synthType;
        }

        // 然后从修改器中查找
        const synthModifier = clip.modifiers.find(m => m.type === 'synth');
        if (!synthModifier) {
            console.warn('Scene: No synth modifier found in clip');
            return 'piano';  // 默认使用钢琴音色
        }
        return synthModifier.params.synthType || 'piano';
    }

    // 调度声音
    scheduleSound(clip, time, synthType) {
        if (!clip || !this.synthEngine) {
            console.warn('Scene: Missing clip or synthEngine', {
                hasClip: !!clip,
                hasSynthEngine: !!this.synthEngine
            });
            return;
        }
        
        console.log(`Scene: Scheduling sound with synthType ${synthType} at time ${time}`, {
            clip: clip
        });

        // 遍历节奏模式中的每个步骤
        for (let i = 0; i < clip.length; i++) {
            if (clip.pattern[i] > 0) {
                console.log(`Scene: Triggering sound at step ${i} with velocity ${clip.pattern[i]}`);
                this.synthEngine.triggerSound(
                    time + (i * 0.25),
                    clip.pattern[i],
                    synthType
                );
            }
        }
    }

    // 重置场景状态
    reset() {
        this.currentCol = 0;
        this.isPlaying = false;
    }

    // 设置合成器引擎
    setSynthEngine(engine) {
        this.synthEngine = engine;
    }
}

export default Scene;