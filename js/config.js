// === Phaser Game Configuration ===
// TILE is defined in sprites.js
const GAME_SCALE = 3;
const GAME_W = 800;
const GAME_H = 600;

const config = {
    type: Phaser.CANVAS,
    width: GAME_W,
    height: GAME_H,
    parent: document.body,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#050510',
    pauseOnBlur: false,
    audio: { noAudio: true },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, TitleScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);
