// === Title Scene - Street Quest CV ===
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#0a0a1f');

        // City particles (streetlights)
        this.dustParticles = [];
        for (let i = 0; i < 30; i++) {
            this.dustParticles.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.2, vy: -Math.random() * 0.15 - 0.05,
                alpha: Math.random() * 0.3 + 0.05, size: Math.random() > 0.5 ? 2 : 1,
                color: [0xffeeaa, 0xff4488, 0x44ffcc, 0xffaa00][Math.floor(Math.random() * 4)]
            });
        }
        this.dustGraphics = this.add.graphics();

        // Skyline silhouette
        const skyline = this.add.graphics();
        skyline.fillStyle(0x111122, 1);
        // Buildings silhouette
        const buildings = [
            [50, 200], [90, 160], [130, 220], [180, 140], [230, 190],
            [280, 170], [340, 130], [390, 200], [440, 150], [500, 180],
            [560, 140], [620, 210], [680, 160], [730, 190], [770, 170]
        ];
        buildings.forEach(([bx, bh]) => {
            const by = h * 0.85 - (h * 0.85 - bh);
            skyline.fillRect(bx, bh, 40, h - bh);
            // Windows
            for (let wy = bh + 10; wy < h * 0.85; wy += 15) {
                for (let wx = bx + 5; wx < bx + 35; wx += 10) {
                    if (Math.random() > 0.4) {
                        skyline.fillStyle(0xffdd66, Math.random() * 0.3 + 0.1);
                        skyline.fillRect(wx, wy, 5, 7);
                    }
                    skyline.fillStyle(0x111122, 1);
                }
            }
        });

        // Ground line
        skyline.fillStyle(0x333344, 1);
        skyline.fillRect(0, h * 0.85, w, 3);

        // Title
        this.add.text(w / 2, h * 0.15, 'STREET QUEST CV', {
            fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ff4488',
            stroke: '#000', strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true }
        }).setOrigin(0.5);

        // Neon line
        const line = this.add.graphics();
        line.lineStyle(2, 0x44ffcc, 0.8);
        line.lineBetween(w * 0.2, h * 0.24, w * 0.8, h * 0.24);
        line.fillStyle(0x44ffcc, 1);
        line.fillCircle(w * 0.2, h * 0.24, 3);
        line.fillCircle(w * 0.8, h * 0.24, 3);

        this.add.text(w / 2, h * 0.28, '~ De la rue à l\'entretien ~', {
            fontSize: '16px', fontFamily: 'monospace', color: '#44ffcc',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        // Hero preview
        if (this.textures.exists('hero')) {
            const hero = this.add.sprite(w / 2, h * 0.45, 'hero', 0).setScale(4);
            this.tweens.add({
                targets: hero, y: h * 0.45 - 5, duration: 1500,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // Name
        this.add.text(w / 2, h * 0.56, CV_DATA.name, {
            fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#eeeef6', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.62, CV_DATA.title, {
            fontSize: '14px', fontFamily: 'monospace', color: '#8888aa',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        // Start prompt
        this.startText = this.add.text(w / 2, h * 0.75, '[ ESPACE ou CLIC pour commencer ]', {
            fontSize: '15px', fontFamily: 'monospace', color: '#ffaa00',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({ targets: this.startText, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });

        this.add.text(w / 2, h * 0.82, 'Déplacement: Flèches / ZQSD  |  Vomir: Espace', {
            fontSize: '11px', fontFamily: 'monospace', color: '#555577'
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.86, 'Objectif: Atteindre l\'entretien d\'embauche !', {
            fontSize: '11px', fontFamily: 'monospace', color: '#88cc22'
        }).setOrigin(0.5);

        // Input
        this.canStart = false;
        this.time.delayedCall(800, () => { this.canStart = true; });

        this.input.keyboard.on('keydown-SPACE', () => { if (this.canStart) this._startGame(); });
        this.input.keyboard.on('keydown-ENTER', () => { if (this.canStart) this._startGame(); });
        this.input.on('pointerdown', () => { if (this.canStart) this._startGame(); });
    }

    _startGame() {
        if (!this.canStart) return;
        this.canStart = false;
        this.cameras.main.fadeOut(500, 5, 5, 16);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
        this.time.delayedCall(700, () => {
            if (this.scene.isActive('TitleScene')) {
                this.scene.start('GameScene');
                this.scene.start('UIScene');
            }
        });
    }

    update() {
        const g = this.dustGraphics;
        g.clear();
        const w = this.cameras.main.width, h = this.cameras.main.height;
        for (const p of this.dustParticles) {
            p.x += p.vx; p.y += p.vy;
            if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
            if (p.x < -5) p.x = w + 5;
            if (p.x > w + 5) p.x = -5;
            g.fillStyle(p.color, p.alpha);
            g.fillRect(p.x, p.y, p.size, p.size);
        }
    }
}
