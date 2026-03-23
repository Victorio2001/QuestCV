// === Boot Scene - Generate all textures ===
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        try {
            SpriteGen.generateTileset(this);
            SpriteGen.generateHero(this);
            SpriteGen.generateNPC(this, 'npc_gray', PAL.gray, PAL.grayDark);
            SpriteGen.generateEnemies(this);
            SpriteGen.generateObjects(this);
            SpriteGen.generateDecorations(this);
            SpriteGen.generateLightMask(this);
            SpriteGen.generateSmallLight(this);
        } catch (e) {
            console.error('Asset generation error:', e);
        }
    }

    create() {
        this.scene.start('TitleScene');
    }
}
