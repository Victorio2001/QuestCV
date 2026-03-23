// === UI Scene - Dialogue, HUD, Skills Panel ===
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.dialogueActive = false;
        this.skillsActive = false;
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // === HUD ===
        // Room name background
        this.hudBg = this.add.rectangle(0, 0, w, 32, 0x0a0a1a, 0.7).setOrigin(0, 0).setDepth(100);
        this.roomText = this.add.text(15, 8, '', {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000', strokeThickness: 3
        }).setDepth(101);

        // Minimap
        this.minimapBg = this.add.rectangle(w - 115, 6, 105, 20, 0x0a0a1a, 0.8).setOrigin(0, 0).setDepth(100);
        this.minimapBg.setStrokeStyle(1, 0x555577);
        this.minimapDots = [];
        for (let i = 0; i < 5; i++) {
            const dot = this.add.rectangle(w - 110 + i * 20, 16, 16, 12, 0x2d2d48)
                .setDepth(101);
            this.minimapDots.push(dot);
        }

        // HP Hearts
        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const heart = this.add.text(w / 2 - 60 + i * 25, 8, '♥', {
                fontSize: '18px', fontFamily: 'monospace', color: '#e94560',
                stroke: '#000', strokeThickness: 3
            }).setDepth(101);
            this.hearts.push(heart);
        }

        // Attack hint
        this.controlsText = this.add.text(15, h - 22, 'ESPACE: Vomir  |  ENTRÉE: Lire affiches  |  Évitez les voitures !', {
            fontSize: '10px', fontFamily: 'monospace', color: '#555577'
        }).setDepth(100);

        // === DIALOGUE BOX ===
        this.dialogueContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

        // Dimmer
        this.dialogueDim = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.3);
        this.dialogueContainer.add(this.dialogueDim);

        // Box
        const boxW = w - 40;
        const boxH = 140;
        const boxX = 20;
        const boxY = h - boxH - 20;

        this.dialogueBox = this.add.rectangle(boxX + boxW / 2, boxY + boxH / 2, boxW, boxH, 0x0a0a1a, 0.95);
        this.dialogueBox.setStrokeStyle(2, 0xffd700);
        this.dialogueContainer.add(this.dialogueBox);

        // Inner border
        this.dialogueInner = this.add.rectangle(boxX + boxW / 2, boxY + boxH / 2, boxW - 8, boxH - 8, 0x000000, 0);
        this.dialogueInner.setStrokeStyle(1, 0x533483);
        this.dialogueContainer.add(this.dialogueInner);

        // Title label
        this.dialogueTitleBg = this.add.rectangle(boxX + 15, boxY - 2, 200, 24, 0x0a0a1a, 1).setOrigin(0, 0.5);
        this.dialogueTitleBg.setStrokeStyle(1, 0xffd700);
        this.dialogueContainer.add(this.dialogueTitleBg);

        this.dialogueTitle = this.add.text(boxX + 25, boxY - 2, '', {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000', strokeThickness: 2
        }).setOrigin(0, 0.5);
        this.dialogueContainer.add(this.dialogueTitle);

        // Dialogue text
        this.dialogueText = this.add.text(boxX + 25, boxY + 25, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#eeeef6',
            stroke: '#000', strokeThickness: 2,
            wordWrap: { width: boxW - 60 },
            lineSpacing: 6
        });
        this.dialogueContainer.add(this.dialogueText);

        // Page indicator
        this.dialoguePage = this.add.text(boxX + boxW - 60, boxY + boxH - 25, '', {
            fontSize: '11px', fontFamily: 'monospace', color: '#555577'
        });
        this.dialogueContainer.add(this.dialoguePage);

        // Continue indicator
        this.dialogueContinue = this.add.text(boxX + boxW - 100, boxY + boxH - 25, '', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffd700'
        });
        this.dialogueContainer.add(this.dialogueContinue);
        this.tweens.add({
            targets: this.dialogueContinue, alpha: 0.3, duration: 500,
            yoyo: true, repeat: -1
        });

        // === SKILLS PANEL ===
        this.skillsContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

        const panelW = Math.min(550, w - 40);
        const panelH = Math.min(450, h - 40);
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2;

        this.skillsDim = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5);
        this.skillsContainer.add(this.skillsDim);

        const skillsBg = this.add.rectangle(panelX + panelW / 2, panelY + panelH / 2, panelW, panelH, 0x0a0a1a, 0.95);
        skillsBg.setStrokeStyle(2, 0xffd700);
        this.skillsContainer.add(skillsBg);

        const skillsInner = this.add.rectangle(panelX + panelW / 2, panelY + panelH / 2, panelW - 8, panelH - 8, 0x000000, 0);
        skillsInner.setStrokeStyle(1, 0x533483);
        this.skillsContainer.add(skillsInner);

        // Title
        const skillsTitle = this.add.text(w / 2, panelY + 20, 'COMPÉTENCES', {
            fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5, 0);
        this.skillsContainer.add(skillsTitle);

        // Skill bars
        const catColors = {
            frontend: 0xe94560,
            backend: 0x533483,
            database: 0x0f3460,
            desktop: 0x8b6914,
            tools: 0x2d8b46
        };

        this.skillBars = [];
        const startY = panelY + 55;
        const barW = panelW - 100;
        const gap = 35;

        CV_DATA.skills.forEach((skill, i) => {
            const sy = startY + i * gap;
            if (sy + 30 > panelY + panelH - 30) return;

            const label = this.add.text(panelX + 20, sy, skill.name, {
                fontSize: '12px', fontFamily: 'monospace', color: '#eeeef6',
                stroke: '#000', strokeThickness: 2
            });
            this.skillsContainer.add(label);

            const barBg = this.add.rectangle(panelX + 20, sy + 18, barW, 14, 0x1a1a2e).setOrigin(0, 0);
            this.skillsContainer.add(barBg);

            const barFill = this.add.rectangle(panelX + 20, sy + 18, 0, 14, catColors[skill.category] || 0xe94560).setOrigin(0, 0);
            this.skillsContainer.add(barFill);

            const pctText = this.add.text(panelX + 25 + barW, sy + 18, '', {
                fontSize: '11px', fontFamily: 'monospace', color: '#8888aa'
            });
            this.skillsContainer.add(pctText);

            this.skillBars.push({ fill: barFill, target: (barW * skill.level) / 100, pctText, level: skill.level });
        });

        // Close hint
        const closeHint = this.add.text(w / 2, panelY + panelH - 18, '[ ESPACE pour fermer ]', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffd700'
        }).setOrigin(0.5);
        this.skillsContainer.add(closeHint);
        this.tweens.add({ targets: closeHint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

        // === LISTEN TO GAME EVENTS ===
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('roomChanged', (name, index, total) => {
            this.roomText.setText('⌂ ' + name);
            this.minimapDots.forEach((d, i) => {
                d.setFillStyle(i === index ? 0xffd700 : 0x2d2d48);
            });
        });

        gameScene.events.on('showDialogue', (dialogue, key) => {
            this._openDialogue(dialogue, key);
        });

        gameScene.events.on('hpChanged', (hp, maxHp) => {
            this.hearts.forEach((heart, i) => {
                if (i < hp) {
                    heart.setText('♥');
                    heart.setColor('#e94560');
                } else {
                    heart.setText('♡');
                    heart.setColor('#333355');
                }
            });
        });

        // === ENEMY HP BAR (bottom of screen) ===
        const ebY = h - 50;
        this.enemyBarContainer = this.add.container(0, 0).setDepth(150).setVisible(false);

        this.enemyBarBg = this.add.rectangle(w / 2, ebY, 300, 32, 0x0a0a1a, 0.85);
        this.enemyBarBg.setStrokeStyle(1, 0xff4488);
        this.enemyBarContainer.add(this.enemyBarBg);

        this.enemyNameText = this.add.text(w / 2, ebY - 8, '', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ff4488', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        this.enemyBarContainer.add(this.enemyNameText);

        this.enemyHpBg = this.add.rectangle(w / 2 - 100, ebY + 7, 200, 8, 0x222233).setOrigin(0, 0.5);
        this.enemyBarContainer.add(this.enemyHpBg);

        this.enemyHpFill = this.add.rectangle(w / 2 - 100, ebY + 7, 200, 8, 0xe94560).setOrigin(0, 0.5);
        this.enemyBarContainer.add(this.enemyHpFill);

        this.enemyHpText = this.add.text(w / 2 + 110, ebY + 7, '', {
            fontSize: '10px', fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0, 0.5);
        this.enemyBarContainer.add(this.enemyHpText);

        gameScene.events.on('enemyNearby', (name, hp, maxHp) => {
            if (name && maxHp > 0) {
                this.enemyBarContainer.setVisible(true);
                this.enemyNameText.setText(name);
                this.enemyHpFill.width = (hp / maxHp) * 200;
                this.enemyHpText.setText(hp + '/' + maxHp);
                // Color based on HP ratio
                const ratio = hp / maxHp;
                if (ratio > 0.5) this.enemyHpFill.setFillStyle(0xe94560);
                else if (ratio > 0.25) this.enemyHpFill.setFillStyle(0xffaa00);
                else this.enemyHpFill.setFillStyle(0xff3333);
            } else {
                this.enemyBarContainer.setVisible(false);
            }
        });

        gameScene.events.on('enemyHpChanged', (name, hp, maxHp) => {
            if (hp > 0) {
                this.enemyBarContainer.setVisible(true);
                this.enemyNameText.setText(name);
                this.enemyHpFill.width = (hp / maxHp) * 200;
                this.enemyHpText.setText(hp + '/' + maxHp);
            }
        });

        // Dialogue state
        this.currentDialogue = null;
        this.currentDialogueKey = null;
        this.pageIndex = 0;
        this.charIndex = 0;
        this.fullText = '';
        this.typewriterTimer = null;
    }

    _openDialogue(dialogue, key) {
        this.dialogueActive = true;
        this.currentDialogue = dialogue;
        this.currentDialogueKey = key;
        this.pageIndex = 0;
        this.dialogueContainer.setVisible(true);

        this.dialogueTitle.setText(dialogue.title);
        this.dialogueTitle.setColor(dialogue.color || '#ffd700');

        // Resize title bg
        this.dialogueTitleBg.width = this.dialogueTitle.width + 20;

        this._showPage(0);
    }

    _showPage(index) {
        this.pageIndex = index;
        this.fullText = this.currentDialogue.pages[index];
        this.charIndex = 0;
        this.dialogueText.setText('');
        this.dialoguePage.setText(`${index + 1}/${this.currentDialogue.pages.length}`);
        this.dialogueContinue.setText('');

        // Typewriter effect
        if (this.typewriterTimer) this.typewriterTimer.remove();
        this.typewriterTimer = this.time.addEvent({
            delay: 30,
            repeat: this.fullText.length - 1,
            callback: () => {
                this.charIndex++;
                this.dialogueText.setText(this.fullText.substring(0, this.charIndex));
                if (this.charIndex >= this.fullText.length) {
                    this._showContinue();
                }
            }
        });
    }

    _showContinue() {
        const isLast = this.pageIndex >= this.currentDialogue.pages.length - 1;
        this.dialogueContinue.setText(isLast ? '▼ Fermer' : '▼ Suite');
    }

    advanceDialogue() {
        if (!this.currentDialogue) return;

        // If text is still typing, show it all
        if (this.charIndex < this.fullText.length) {
            this.charIndex = this.fullText.length;
            this.dialogueText.setText(this.fullText);
            if (this.typewriterTimer) this.typewriterTimer.remove();
            this._showContinue();
            return;
        }

        // Next page or close
        if (this.pageIndex < this.currentDialogue.pages.length - 1) {
            this._showPage(this.pageIndex + 1);
        } else {
            // Check onClose action
            const onClose = this.currentDialogue.onClose;
            const key = this.currentDialogueKey;
            this._closeDialogue();
            if (onClose === 'showSkills') {
                this.showSkills();
            }
            // If victory final dialogue just closed, redirect to title
            if (key === 'victory_final') {
                this.scene.get('GameScene').cameras.main.fadeOut(1500, 0, 0, 0);
                this.time.delayedCall(2000, () => {
                    if (typeof Music !== 'undefined') Music.stop();
                    this.scene.stop('GameScene');
                    this.scene.stop('UIScene');
                    this.scene.start('TitleScene');
                });
            }
        }
    }

    _closeDialogue() {
        this.dialogueActive = false;
        this.dialogueContainer.setVisible(false);
        this.currentDialogue = null;
        if (this.typewriterTimer) this.typewriterTimer.remove();
    }

    showSkills() {
        this.skillsActive = true;
        this.skillsContainer.setVisible(true);

        // Animate bars
        this.skillBars.forEach((bar, i) => {
            bar.fill.width = 0;
            this.tweens.add({
                targets: bar.fill,
                width: bar.target,
                duration: 800,
                delay: i * 80,
                ease: 'Power2',
                onUpdate: () => {
                    const pct = Math.round((bar.fill.width / bar.target) * bar.level);
                    bar.pctText.setText(pct + '%');
                }
            });
        });
    }

    closeSkills() {
        this.skillsActive = false;
        this.skillsContainer.setVisible(false);
    }

    update() {
        // Nothing needed, events handle everything
    }
}
