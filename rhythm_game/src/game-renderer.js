class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.notes = [];
        this.animationFrame = null;
        this.activeNotes = new Set();
        this.fallingNotes = [];
        
        // 设置画布尺寸
        this.canvas.width = 1200;
        this.canvas.height = 800;
        
        // 添加间隔配置
        this.spacing = {
            height: 40  // 中间间隔的高度
        };
        
        // 修改分区高度计算，考虑间隔
        this.pianoSection = {
            y: 0,
            height: (this.canvas.height - this.spacing.height) * 0.5,  // 减去间隔后平分
            keyWidth: 30,
            keyHeight: 150,
            noteHeight: 20,
            totalKeys: 49,
            startNote: 36,
            hitLineY: ((this.canvas.height - this.spacing.height) * 0.5) - 170
        };

        // 先定义鼓轨配置
        this.drumTracks = {
            kick:   { color: '#FF4444', label: 'KICK' },    // 底鼓
            snare:  { color: '#44FF44', label: 'SNARE' },   // 鼓
            tom2:   { color: '#4444FF', label: 'TOM2' },    // 高音鼓
            tom1:   { color: '#FFFF44', label: 'TOM1' },    // 中音鼓
            hihat1: { color: '#FF44FF', label: 'HIHAT1' },  // 闭合踩镲
            hihat2: { color: '#44FFFF', label: 'HIHAT2' }   // 开放踩镲
        };
        
        // 修改鼓点部分配置
        this.drumSection = {
            y: this.pianoSection.height + this.spacing.height,  // 钢琴区域高度 + 间隔
            height: (this.canvas.height - this.spacing.height) * 0.5,  // 减去间隔后平分
            trackWidth: 80,
            hitLineY: this.pianoSection.height + this.spacing.height + 
                     ((this.canvas.height - this.spacing.height) * 0.25) + 100,  // 调整判定线位置
            noteWidth: 30,
            noteHeight: 20
        };

        // 计算鼓轨的总宽度
        const totalDrumWidth = Object.keys(this.drumTracks).length * this.drumSection.trackWidth;
        // 计算鼓轨的起始X坐标，使其居中
        this.drumSection.startX = (this.canvas.width - totalDrumWidth) / 2;

        // 计算每个鼓轨的X坐标（从中间开始）
        let trackX = this.drumSection.startX;
        Object.keys(this.drumTracks).forEach(track => {
            this.drumTracks[track].x = trackX;
            trackX += this.drumSection.trackWidth;
        });

        this.fallingDrumNotes = [];
        this.activeDrumNotes = new Set();
        
        this.noteSpeed = 2;
        this.hitRange = 10;
        this.durationToPixels = 50;

        // 添加命中效果的颜色配置
        this.hitEffectColors = {
            perfect: '#FFD700',  // 金色
            good: '#7CFF00',     // 亮绿色
            ok: '#00BFFF',       // 亮蓝色
            miss: '#FF4444'      // 红色
        };

        // 修改消失线位置
        this.vanishLineY = this.drumSection.hitLineY + 50;  // 判定线下方50像素

        // 添加音符名称映射
        this.noteNames = {
            'kick': 'C',    // 底鼓
            'snare': 'D',   // 军鼓
            'tom2': 'E',    // 高音鼓
            'tom1': 'F',    // 中音鼓
            'hihat1': 'G',  // 闭合踩镲
            'hihat2': 'A'   // 开放踩镲
        };

        // 添加视觉效果配置
        this.visualEffects = {
            // 渐变色
            gradients: {
                piano: this.ctx.createLinearGradient(0, 0, 0, this.pianoSection.height),
                drums: this.ctx.createLinearGradient(0, this.drumSection.y, 0, this.canvas.height)
            },
            // 命中效果颜色
            hitEffectColors: {
                perfect: {
                    primary: '#FFD700',    // 金色
                    glow: '#FFF3B0'        // 淡金色光晕
                },
                good: {
                    primary: '#7CFF00',    // 亮绿色
                    glow: '#B8FF99'        // 淡绿色光晕
                },
                ok: {
                    primary: '#00BFFF',    // 亮蓝色
                    glow: '#99E6FF'        // 淡蓝色光晕
                },
                miss: {
                    primary: '#FF4444',    // 红色
                    glow: '#FF9999'        // 淡红色光晕
                }
            },
            // 轨道光晕效果
            trackGlow: {
                blur: 15,
                alpha: 0.3
            }
        };

        // 设置渐变色
        this.visualEffects.gradients.piano.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        this.visualEffects.gradients.piano.addColorStop(1, 'rgba(240, 240, 240, 0.95)');
        this.visualEffects.gradients.drums.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        this.visualEffects.gradients.drums.addColorStop(1, 'rgba(20, 20, 20, 0.95)');

        // 修改钢琴音符的颜色配置
        this.pianoNoteColors = {
            normal: {
                white: '#44FF44',    // 使用类似 snare 的绿色
                black: '#33DD33'     // 稍深一点的绿色
            },
            active: {
                white: '#90CAF9',    // 保持淡蓝色按键高亮
                black: '#64B5F6'     // 保持稍深的淡蓝色按键高亮
            },
            glow: {
                white: '#B3E5FC',    // 保持淡蓝色光晕
                black: '#81D4FA'     // 保持稍深的淡蓝色光晕
            }
        };

        console.log('[GameRenderer] Created');
    }

    isBlackKey(note) {
        const noteInOctave = note % 12;
        return [1, 3, 6, 8, 10].includes(noteInOctave);
    }

    getNoteX(note) {
        return (note - this.pianoSection.startNote) * this.pianoSection.keyWidth;
    }

    drawPianoKeyboard() {
        const keyboardY = this.pianoSection.hitLineY + 20;

        // 绘制白键
        for (let i = 0; i < this.pianoSection.totalKeys; i++) {
            const note = this.pianoSection.startNote + i;
            const x = i * this.pianoSection.keyWidth;
            const isBlack = this.isBlackKey(note);
            
            if (!isBlack) {
                this.ctx.fillStyle = this.activeNotes.has(note) ? 
                    this.pianoNoteColors.active.white : 
                    '#ffffff';
                // 添加键盘阴影效果
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                this.ctx.shadowBlur = 4;
                this.ctx.shadowOffsetY = 2;
                this.ctx.fillRect(x, keyboardY, this.pianoSection.keyWidth, this.pianoSection.keyHeight);
                this.ctx.shadowColor = 'transparent';
            }
        }

        // 绘制黑键
        for (let i = 0; i < this.pianoSection.totalKeys; i++) {
            const note = this.pianoSection.startNote + i;
            const x = i * this.pianoSection.keyWidth;
            const isBlack = this.isBlackKey(note);
            
            if (isBlack) {
                this.ctx.fillStyle = this.activeNotes.has(note) ? 
                    this.pianoNoteColors.active.black : 
                    '#000000';
                // 黑键的阴影效果
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                this.ctx.shadowBlur = 6;
                this.ctx.shadowOffsetY = 3;
                this.ctx.fillRect(x - this.pianoSection.keyWidth * 0.3, keyboardY, 
                                this.pianoSection.keyWidth * 0.6, this.pianoSection.keyHeight * 0.6);
                this.ctx.shadowColor = 'transparent';
            }
        }
    }

    addFallingNote(note, velocity, duration) {
        const noteHeight = duration ? this.durationToPixels * duration : this.pianoSection.noteHeight;
        
        console.log('[GameRenderer] Adding falling note:', {
            note, velocity, duration, 
            height: noteHeight,
            x: this.getNoteX(note)
        });

        this.fallingNotes.push({
            note,
            velocity,
            x: this.getNoteX(note),
            y: -noteHeight,
            width: this.pianoSection.keyWidth,
            height: noteHeight,
            duration,
            startTime: null,
            triggered: false,
            active: false
        });
    }

    drawFallingNotes() {
        // 绘制判定线
        this.ctx.save();
        // 判定线渐变效果
        const lineGradient = this.ctx.createLinearGradient(0, this.pianoSection.hitLineY - 2, 0, this.pianoSection.hitLineY + 2);
        lineGradient.addColorStop(0, 'rgba(255, 87, 34, 0)');
        lineGradient.addColorStop(0.5, 'rgba(255, 87, 34, 0.8)');
        lineGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        
        this.ctx.fillStyle = lineGradient;
        this.ctx.fillRect(0, this.pianoSection.hitLineY - 2, this.canvas.width, 4);
        
        // 判定线发光效果
        this.ctx.shadowColor = '#FF5722';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeStyle = '#FF5722';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.pianoSection.hitLineY);
        this.ctx.lineTo(this.canvas.width, this.pianoSection.hitLineY);
        this.ctx.stroke();
        this.ctx.restore();

        const currentTime = performance.now();
        
        this.fallingNotes = this.fallingNotes.filter(note => {
            // 只绘制判定线以上的音符
            if (note.y < this.pianoSection.hitLineY) {
                // 绘制音符
                this.ctx.save();
                const isBlack = this.isBlackKey(note.note);
                
                if (note.triggered && note.active) {
                    // 命中音符的发光效果
                    this.ctx.shadowColor = isBlack ? 
                        this.pianoNoteColors.glow.black : 
                        this.pianoNoteColors.glow.white;
                    this.ctx.shadowBlur = 15;
                }

                // 绘制音符主体
                this.ctx.fillStyle = isBlack ? 
                    this.pianoNoteColors.normal.black : 
                    this.pianoNoteColors.normal.white;
                
                // 圆角音符
                this.roundRect(
                    note.x, 
                    note.y, 
                    note.width, 
                    note.height,
                    4  // 圆角半径
                );
                this.ctx.fill();

                // 添加高光效果
                const gradient = this.ctx.createLinearGradient(note.x, note.y, note.x, note.y + note.height);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                this.ctx.restore();
            }
            
            if (!this.isPaused) {
                note.y += this.noteSpeed;
            }
            
            const noteBottom = note.y + note.height;
            if (Math.abs(noteBottom - this.pianoSection.hitLineY) < this.hitRange && !note.triggered) {
                note.triggered = true;
                note.active = true;
                note.startTime = currentTime;
                if (this.onNoteHit) {
                    this.onNoteHit(note.note, note.velocity, note.duration);
                }
            }
            
            // 当音符完全通过判定线时结束并释放
            if (note.active && note.y > this.pianoSection.hitLineY && !note.ended) {
                note.ended = true;
                if (this.onNoteEnd) {
                    this.onNoteEnd(note.note);
                }
                return false; // 立即移除音符
            }
            
            // 只保留判定线以上的音符
            return note.y < this.pianoSection.hitLineY;
        });
    }

    addFallingDrumNote(track, velocity, noteValue) {
        const trackInfo = this.drumTracks[track];
        if (!trackInfo) return;

        // 根据时值调整音符高度
        const height = noteValue ? this.drumSection.noteHeight * noteValue / 4 : this.drumSection.noteHeight;

        this.fallingDrumNotes.push({
            track,
            velocity,
            x: trackInfo.x + (this.drumSection.trackWidth - this.drumSection.noteWidth) / 2,
            y: this.drumSection.y,
            width: this.drumSection.noteWidth,
            height: height,  // 使用计算出的高度
            triggered: false,
            noteValue: noteValue  // 保存时值信息
        });
    }

    drawDrumTracks() {
        // 先绘制轨道背景
        Object.entries(this.drumTracks).forEach(([track, info]) => {
            // 绘制轨道底色
            this.ctx.save();
            this.ctx.fillStyle = this.activeDrumNotes.has(track) 
                ? `${info.color}22` 
                : `${info.color}11`;
            
            // 添加轨道光晕效果
            if (this.activeDrumNotes.has(track)) {
                this.ctx.shadowColor = info.color;
                this.ctx.shadowBlur = this.visualEffects.trackGlow.blur;
            }
            
            // 绘制圆角轨道
            this.roundRect(
                info.x, 
                this.drumSection.y, 
                this.drumSection.trackWidth, 
                this.drumSection.height - this.drumSection.y,
                5  // 圆角半径
            );
            this.ctx.fill();
            this.ctx.restore();

            // 绘制轨道标签
            this.drawTrackLabel(track, info);
        });

        // 绘制判定线
        this.drawJudgementLine();

        // 绘制判定窗口
        this.drawJudgementWindow();
    }

    drawTrackLabel(track, info) {
        const x = info.x + this.drumSection.trackWidth / 2;
        
        // 绘制轨道名称
        this.ctx.save();
        this.ctx.fillStyle = info.color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(info.label, x, this.drumSection.y + 20);

        // 绘制键位提示
        const keyY = this.drumSection.y + 45;
        
        // 绘制发光的圆形背景
        this.ctx.beginPath();
        this.ctx.arc(x, keyY, 18, 0, Math.PI * 2);
        this.ctx.fillStyle = `${info.color}33`;
        
        // 添加光晕效果
        this.ctx.shadowColor = info.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();

        // 绘制内圈
        this.ctx.beginPath();
        this.ctx.arc(x, keyY, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = `${info.color}66`;
        this.ctx.fill();

        // 绘制键位文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(this.noteNames[track], x, keyY + 4);
        this.ctx.restore();
    }

    drawJudgementLine() {
        // 绘制判定线光晕效果
        this.ctx.save();
        const gradient = this.ctx.createLinearGradient(0, this.drumSection.hitLineY - 2, 0, this.drumSection.hitLineY + 2);
        gradient.addColorStop(0, 'rgba(255, 87, 34, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 87, 34, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.drumSection.hitLineY - 2, this.canvas.width, 4);
        
        // 添加发光效果
        this.ctx.shadowColor = '#FF5722';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeStyle = '#FF5722';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.drumSection.hitLineY);
        this.ctx.lineTo(this.canvas.width, this.drumSection.hitLineY);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawJudgementWindow() {
        // 绘制判定窗口范围
        const hitWindow = 100;  // 总判定窗口
        const upwardBuffer = 60;  // 向上的缓冲
        const perfectRange = hitWindow * 0.4;  // Perfect 判定范围
        const goodRange = hitWindow * 0.8;     // Good 判定范围

        // 在每个轨道上绘制判定范围
        Object.entries(this.drumTracks).forEach(([track, info]) => {
            const x = info.x;
            const width = this.drumSection.trackWidth;
            const centerY = this.drumSection.hitLineY;

            // 绘制总判定范围
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(
                x, 
                centerY - upwardBuffer, 
                width, 
                hitWindow
            );

            // 绘制 Good 判定范围
            this.ctx.fillStyle = 'rgba(124, 255, 0, 0.1)';
            this.ctx.fillRect(
                x,
                centerY - (goodRange/2),
                width,
                goodRange
            );

            // 绘制 Perfect 判定范围
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
            this.ctx.fillRect(
                x,
                centerY - (perfectRange/2),
                width,
                perfectRange
            );

            // 添加范围标记线
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            
            // 上边界线
            this.ctx.moveTo(x, centerY - upwardBuffer);
            this.ctx.lineTo(x + width, centerY - upwardBuffer);
            
            // 下边界线
            this.ctx.moveTo(x, centerY + (hitWindow - upwardBuffer));
            this.ctx.lineTo(x + width, centerY + (hitWindow - upwardBuffer));
            
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        });
    }

    getMidiNoteForTrack(track) {
        const midiNotes = {
            'kick': 36,
            'snare': 38,
            'hihat1': 42,
            'hihat2': 46,
            'tom1': 45,
            'tom2': 43
        };
        return midiNotes[track];
    }

    drawHitEffect(x, y, color) {
        // 制击中效
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.6;
        
        // 绘制一个圆形光晕
        const radius = 20;
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.drumSection.trackWidth / 2, 
            y, 
            radius, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawFallingDrumNotes() {
        this.fallingDrumNotes = this.fallingDrumNotes.filter(note => {
            if (note.y < this.vanishLineY && 
                !(note.triggered && note.hitAccuracy !== undefined && note.y > this.drumSection.hitLineY)) {
                const trackInfo = this.drumTracks[note.track];
                
                this.ctx.save();
                if (note.triggered && note.hitAccuracy !== undefined) {
                    // 命中音符的效果
                    let effectColor;
                    if (note.hitAccuracy < 0.3) {
                        effectColor = this.visualEffects.hitEffectColors.perfect;
                    } else if (note.hitAccuracy < 0.7) {
                        effectColor = this.visualEffects.hitEffectColors.good;
                    } else {
                        effectColor = this.visualEffects.hitEffectColors.ok;
                    }

                    // 绘制光晕效果
                    this.ctx.shadowColor = effectColor.glow;
                    this.ctx.shadowBlur = 15;
                }

                // 绘制音符主体
                this.ctx.fillStyle = trackInfo.color;
                // 圆角音符
                this.roundRect(
                    note.x, 
                    note.y, 
                    note.width, 
                    note.height,
                    4  // 圆角半径
                );
                this.ctx.fill();

                // 添加高光效果
                const gradient = this.ctx.createLinearGradient(note.x, note.y, note.x, note.y + note.height);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                this.ctx.restore();
            }

            if (!this.isPaused) {
                note.y += this.noteSpeed;
            }

            // 检查判定
            if (Math.abs(note.y - this.drumSection.hitLineY) < this.hitRange && !note.triggered) {
                note.triggered = true;
                if (this.onDrumNoteHit) {
                    this.onDrumNoteHit(note.track, note.velocity);
                }
            }

            // 当音符到达消失线时移除，或者已命中的音符过了判定线也移除
            return note.y < this.vanishLineY && 
                   !(note.triggered && note.hitAccuracy !== undefined && note.y > this.drumSection.hitLineY);
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制钢琴部分背景（带渐变）
        const pianoGradient = this.ctx.createLinearGradient(0, 0, 0, this.pianoSection.height);
        pianoGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        pianoGradient.addColorStop(1, 'rgba(240, 240, 240, 0.95)');
        this.ctx.fillStyle = pianoGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.pianoSection.height);

        // 绘制钢琴音符（只调用一次）
        this.drawFallingNotes();
        
        // 绘制钢琴遮罩层（从判定线开始渐变）
        const pianoMaskGradient = this.ctx.createLinearGradient(
            0, 
            this.pianoSection.hitLineY - 20, 
            0, 
            this.pianoSection.hitLineY + 20
        );
        pianoMaskGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        pianoMaskGradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
        this.ctx.fillStyle = pianoMaskGradient;
        this.ctx.fillRect(
            0, 
            this.pianoSection.hitLineY - 20, 
            this.canvas.width, 
            this.pianoSection.height - this.pianoSection.hitLineY + 20
        );

        // 绘制钢琴键盘
        this.drawPianoKeyboard();

        // 绘制鼓点部分背景
        this.ctx.fillStyle = this.visualEffects.gradients.drums;
        this.ctx.fillRect(0, this.drumSection.y, this.canvas.width, this.drumSection.height);
        
        // 绘制鼓点内容
        this.drawDrumTracks();
        this.drawFallingDrumNotes();
        this.drawHitEffects();
        
        // 绘制鼓点遮罩层
        const drumMaskGradient = this.ctx.createLinearGradient(0, this.vanishLineY - 20, 0, this.vanishLineY + 20);
        drumMaskGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        drumMaskGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        this.ctx.fillStyle = drumMaskGradient;
        this.ctx.fillRect(0, this.vanishLineY - 20, this.canvas.width, this.drumSection.height);
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.notes = [];
        this.activeNotes.clear();
        this.fallingNotes = [];
        this.fallingDrumNotes = [];
        this.activeDrumNotes.clear();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    addNote(note) {
        this.activeNotes.add(note);
    }

    removeNote(note) {
        this.activeNotes.delete(note);
    }

    pause() {
        this.isPaused = true;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('已暂停', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('按空格键或点击暂停按钮继续', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    resume() {
        this.isPaused = false;
    }

    // 添加方法来处理鼓点击中
    addActiveDrumNote(track) {
        this.activeDrumNotes.add(track);
        // 设置一个定时器来移除高亮效果
        setTimeout(() => {
            this.activeDrumNotes.delete(track);
        }, 100);
    }

    removeActiveDrumNote(track) {
        this.activeDrumNotes.delete(track);
    }

    showPerfectHit(track) {
        this.showHitEffect(track, 'PERFECT!', this.hitEffectColors.perfect, 30);
        this.showHitLineFlash(track, 1);
    }

    showGoodHit(track) {
        this.showHitEffect(track, 'GOOD!', this.hitEffectColors.good, 24);
        this.showHitLineFlash(track, 0.7);
    }

    showBadHit(track) {
        this.showHitEffect(track, 'OK', this.hitEffectColors.ok, 20);
        this.showHitLineFlash(track, 0.4);
    }

    showMiss(track) {
        this.showHitEffect(track, 'MISS', this.hitEffectColors.miss, 20);
    }

    showHitEffect(track, text, color, fontSize) {
        const trackInfo = this.drumTracks[track];
        const x = trackInfo.x + this.drumSection.trackWidth / 2;
        const y = this.drumSection.hitLineY;

        const effect = {
            x,
            y,
            text,
            color,
            fontSize,
            alpha: 1,
            startTime: performance.now(),
            radius: 20,
            maxRadius: 50,  // 增大最大半径
            particles: Array.from({length: 8}, (_, i) => ({  // 添加粒子效果
                angle: (i * Math.PI * 2) / 8,
                speed: Math.random() * 2 + 1,
                size: Math.random() * 4 + 2
            }))
        };

        if (!this.hitEffects) this.hitEffects = [];
        this.hitEffects.push(effect);
    }

    drawHitEffects() {
        if (!this.hitEffects) return;

        const currentTime = performance.now();
        this.hitEffects = this.hitEffects.filter(effect => {
            const age = currentTime - effect.startTime;
            if (age > 500) return false;

            const progress = age / 500;
            effect.alpha = 1 - progress;
            effect.y -= 1;
            effect.radius = effect.maxRadius * progress;

            this.ctx.save();
            
            // 绘制扩散环
            this.ctx.globalAlpha = effect.alpha * 0.3;
            this.ctx.fillStyle = effect.color;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 绘制粒子效果
            effect.particles.forEach(particle => {
                const distance = particle.speed * age / 20;
                const x = effect.x + Math.cos(particle.angle) * distance;
                const y = effect.y + Math.sin(particle.angle) * distance;
                
                this.ctx.globalAlpha = effect.alpha;
                this.ctx.beginPath();
                this.ctx.arc(x, y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });

            // 绘制文本
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.font = `bold ${effect.fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(effect.text, effect.x, effect.y);
            this.ctx.fillStyle = effect.color;
            this.ctx.fillText(effect.text, effect.x, effect.y);

            this.ctx.restore();
            return true;
        });
    }

    // 添加判定线闪光效果
    showHitLineFlash(track, accuracy) {
        const trackInfo = this.drumTracks[track];
        const flash = {
            x: trackInfo.x,
            width: this.drumSection.trackWidth,
            y: this.drumSection.hitLineY - 2,
            height: 4,
            color: trackInfo.color,
            alpha: 1,
            startTime: performance.now()
        };

        if (!this.hitLineFlashes) this.hitLineFlashes = [];
        this.hitLineFlashes.push(flash);
    }

    drawHitLineFlashes() {
        if (!this.hitLineFlashes) return;

        const currentTime = performance.now();
        this.hitLineFlashes = this.hitLineFlashes.filter(flash => {
            const age = currentTime - flash.startTime;
            if (age > 200) return false; // 闪光持续200ms

            flash.alpha = 1 - (age / 200);

            this.ctx.save();
            this.ctx.globalAlpha = flash.alpha;
            this.ctx.fillStyle = flash.color;
            this.ctx.fillRect(flash.x, flash.y, flash.width, flash.height);
            this.ctx.restore();

            return true;
        });
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + radius);
        this.ctx.lineTo(x, y + height - radius);
        this.ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
        this.ctx.lineTo(x + width - radius, y + height);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        this.ctx.lineTo(x + width, y + radius);
        this.ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
        this.ctx.lineTo(x + radius, y);
        this.ctx.quadraticCurveTo(x, y, x, y + radius);
        this.ctx.closePath();
    }
}

export default GameRenderer; 