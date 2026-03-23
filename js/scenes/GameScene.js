// === Game Scene - Street Quest CV ===
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentRoom = 0;
        this.rooms = [];
        this.player = null;
        this.cursors = null;
        this.interactables = null;
        this.enemies = null;
        this.cars = null;
        this.decoSprites = [];
        this.torchLights = [];
        this.torchTimer = null;
        this.transitioning = false;
        this.nearestEntity = null;
        this.bubble = null;
        this.isAttacking = false;
        this.playerHP = 5;
        this.maxHP = 5;
        this.invincible = false;
        this.lastDir = 'right';
        this.defeatedEnemies = new Set();
        this.vomitCooldown = false;
    }

    create() {
        this.cameras.main.fadeIn(600, 5, 5, 16);
        this.cameras.main.setBackgroundColor('#0a0a1f');

        this._createAnimations();
        this._buildRooms();

        // Player
        this.player = this.physics.add.sprite(0, 0, 'hero', 0);
        this.player.setScale(GAME_SCALE);
        this.player.body.setSize(10, 10);
        this.player.body.setOffset(3, 14);
        this.player.setDepth(10);

        // Interaction bubble
        this.bubble = this.add.sprite(0, 0, 'bubble', 0).setScale(GAME_SCALE).setVisible(false).setDepth(20);
        this.anims.create({ key: 'bubble_anim', frames: this.anims.generateFrameNumbers('bubble', { start: 0, end: 1 }), frameRate: 3, repeat: -1 });

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ = this.input.keyboard.addKey('Z');
        this.keyQ = this.input.keyboard.addKey('Q');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyD = this.input.keyboard.addKey('D');
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        // Lighting
        this._createLighting();

        // Load first room
        this._loadRoom(0);

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Input: SPACE = vomit, ENTER = interact with posters
        this.spaceKey.on('down', () => this._vomitAttack());
        this.enterKey.on('down', () => this._interact());
        // Track which enemies already showed their intro dialogue
        this.enemyIntroShown = new Set();
    }

    _createAnimations() {
        // Hero
        ['down', 'left', 'right', 'up'].forEach((dir, i) => {
            const start = i * 4;
            this.anims.create({ key: 'hero_' + dir, frames: this.anims.generateFrameNumbers('hero', { start, end: start + 3 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'hero_' + dir + '_idle', frames: [{ key: 'hero', frame: start }], frameRate: 1 });
        });

        // Enemies
        ['enemy_magalie', 'enemy_victoria', 'enemy_philippe', 'enemy_billy'].forEach(key => {
            if (!this.textures.exists(key)) return;
            this.anims.create({ key: key + '_idle', frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
            this.anims.create({ key: key + '_hurt', frames: [{ key, frame: 2 }], frameRate: 1 });
            this.anims.create({ key: key + '_attack', frames: [{ key, frame: 3 }], frameRate: 1 });
        });

        // Effects
        if (this.textures.exists('vomit'))
            this.anims.create({ key: 'vomit_anim', frames: this.anims.generateFrameNumbers('vomit', { start: 0, end: 3 }), frameRate: 12, repeat: -1 });
        if (this.textures.exists('vomitsplash'))
            this.anims.create({ key: 'vomitsplash_anim', frames: this.anims.generateFrameNumbers('vomitsplash', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
        if (this.textures.exists('starsKO'))
            this.anims.create({ key: 'starsKO_anim', frames: this.anims.generateFrameNumbers('starsKO', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        if (this.textures.exists('deathpoof'))
            this.anims.create({ key: 'deathpoof_anim', frames: this.anims.generateFrameNumbers('deathpoof', { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
        if (this.textures.exists('bubble'))
            this.anims.create({ key: 'bubble_anim', frames: this.anims.generateFrameNumbers('bubble', { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
        if (this.textures.exists('poster'))
            this.anims.create({ key: 'poster_anim', frames: this.anims.generateFrameNumbers('poster', { start: 0, end: 3 }), frameRate: 2, repeat: -1 });
        if (this.textures.exists('firebarrel'))
            this.anims.create({ key: 'firebarrel_anim', frames: this.anims.generateFrameNumbers('firebarrel', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    }

    _buildRooms() {
        this.rooms = [
            this._zoneStart(),
            this._zoneDirty(),
            this._zoneAvenue(),
            this._zoneAlley(),
            this._zoneFinish()
        ];
    }

    // Street layout: top = buildings, middle-top = sidewalk, middle = road, middle-bottom = sidewalk, bottom = buildings
    _makeStreet(w, h, hasLeftDoor, hasRightDoor) {
        const map = [];
        for (let y = 0; y < h; y++) {
            const row = [];
            for (let x = 0; x < w; x++) {
                if (y <= 1) {
                    // Top buildings
                    const r = (x * 7 + y * 3) % 5;
                    if (y === 0) row.push(14); // roof
                    else if (r < 2) row.push(11); // lit window
                    else if (r < 3) row.push(12); // dark window
                    else row.push(10); // brick
                } else if (y === 2) {
                    row.push(31); // building base
                } else if (y === 3) {
                    // Top sidewalk
                    const r = (x * 13 + y) % 7;
                    if (r === 0) row.push(2); // cracked
                    else if (r === 1) row.push(6); // gum
                    else if (r < 4) row.push(0); // sidewalk A
                    else row.push(1); // sidewalk B
                } else if (y === 4) {
                    row.push(5); // curb
                } else if (y >= 5 && y <= 7) {
                    // Road
                    if (y === 6) row.push(4); // center line
                    else row.push(3); // road
                } else if (y === 8) {
                    row.push(5); // curb bottom
                } else if (y === 9) {
                    // Bottom sidewalk
                    const r = (x * 11 + y * 7) % 6;
                    if (r === 0) row.push(2);
                    else if (r < 3) row.push(0);
                    else row.push(1);
                } else {
                    // Bottom buildings
                    if (y === 10) row.push(31); // base
                    else {
                        const r = (x * 3 + y * 11) % 5;
                        if (r < 2) row.push(11);
                        else if (r < 3) row.push(12);
                        else row.push(10);
                    }
                }
            }
            map.push(row);
        }

        // Doors
        const midY = 6; // middle of road
        if (hasRightDoor) {
            map[3][w-1] = 3; // open path on sidewalk
            map[9][w-1] = 3;
        }
        if (hasLeftDoor) {
            map[3][0] = 3;
            map[9][0] = 3;
        }

        return map;
    }

    _zoneStart() {
        const w = 24, h = 12;
        const map = this._makeStreet(w, h, false, true);
        return {
            name: 'Le Pont - Départ',
            map, width: w, height: h,
            spawnX: 3 * TILE, spawnY: 3 * TILE,
            entities: [],
            introDialogue: {
                title: 'Victorio (pensées)',
                color: '#44ffcc',
                pages: [
                    `Encore une nuit sous ce pont...\nJe m'appelle ${CV_DATA.name}.\n${CV_DATA.title}... enfin, un jour.`,
                    `Aujourd'hui c'est le grand jour.\nJ'ai un entretien d'embauche\nau bout de cette avenue.`,
                    `Faut que je traverse la ville.\nÉviter les voitures, les embrouilles...\nEt surtout, ne pas lâcher.`,
                    `ESPACE pour vomir sur les obstacles.\nAllons-y... direction : l'avenir.`
                ]
            },
            decorations: [
                { x: 4, y: 9, sprite: 'trashcan' },
                { x: 10, y: 9, sprite: 'trashcan' },
                { x: 18, y: 3, sprite: 'trashcan' },
                { x: 8, y: 3, sprite: 'firebarrel', anim: 'firebarrel_anim' },
                { x: 20, y: 9, sprite: 'firebarrel', anim: 'firebarrel_anim' },
                { x: 6, y: 1.5, sprite: 'missing', frame: 0 },
            ],
            entities: [
                { x: 6, y: 1.5, key: 'missing_virgile', spriteKey: 'missing', type: 'missing', frame: 0 }
            ],
            enemies: [
                { id: 'magalie_1', x: 16, y: 3.5, key: 'enemy_magalie', name: 'Magalie Goudet', hp: 3, speed: 40, dialogue: 'enemy_magalie', bullet: 'bullet_java' }
            ],
            cars: [
                { y: 5.5, speed: 120, dir: 1, delay: 3000, variant: 0 },
                { y: 7, speed: -100, dir: -1, delay: 5000, variant: 1 },
            ],
            lamps: [3, 8, 14, 20]
        };
    }

    _zoneDirty() {
        const w = 26, h = 12;
        const map = this._makeStreet(w, h, true, true);
        return {
            name: 'Quartier Sale - Formation',
            map, width: w, height: h,
            spawnX: 2 * TILE, spawnY: 3 * TILE,
            entities: [],
            introDialogue: {
                title: 'Victorio (souvenirs)',
                color: '#ff4488',
                pages: [
                    `Ce quartier me rappelle mes débuts...\nQuand j'ai décidé de tout changer.`,
                    `J'ai commencé par un Bachelor\nà ${CV_DATA.education[1].school}.\n"${CV_DATA.education[1].degree}"`,
                    `${CV_DATA.education[1].period}.\nJ'y ai appris ${CV_DATA.education[1].skills.slice(0, 4).join(', ')}...\nLes bases du métier.`,
                    `Puis le Mastère.\n"${CV_DATA.education[0].degree}"\nà ${CV_DATA.education[0].school}.`,
                    `${CV_DATA.education[0].period}.\n${CV_DATA.education[0].skills.join(', ')}...\nDe quoi conquérir le monde.`,
                    `Bon, d'abord faut conquérir\ncette rue... Avançons !`
                ]
            },
            decorations: [
                { x: 3, y: 3, sprite: 'trashcan' },
                { x: 12, y: 9, sprite: 'trashcan' },
                { x: 22, y: 9, sprite: 'trashcan' },
                { x: 5, y: 9, sprite: 'trashcan' },
                { x: 15, y: 3, sprite: 'firebarrel', anim: 'firebarrel_anim' },
                { x: 8, y: 9, sprite: 'firebarrel', anim: 'firebarrel_anim' },
            ],
            entities: [
                { x: 10, y: 1.5, key: 'missing_luca', spriteKey: 'missing', type: 'missing', frame: 1 }
            ],
            enemies: [
                { id: 'victoria_2', x: 20, y: 9, key: 'enemy_victoria', name: 'Victoria Codfert', hp: 3, speed: 45, dialogue: 'enemy_victoria', bullet: 'bullet_mail' }
            ],
            cars: [
                { y: 5.5, speed: 140, dir: 1, delay: 2500, variant: 2 },
                { y: 7, speed: -110, dir: -1, delay: 4000, variant: 0 },
            ],
            lamps: [4, 10, 16, 22]
        };
    }

    _zoneAvenue() {
        const w = 28, h = 12;
        const map = this._makeStreet(w, h, true, true);
        return {
            name: 'Avenue Principale - Expériences',
            map, width: w, height: h,
            spawnX: 2 * TILE, spawnY: 9 * TILE,
            entities: [],
            introDialogue: {
                title: 'Victorio (flashbacks)',
                color: '#ffaa00',
                pages: [
                    `Cette grande avenue... Elle me rappelle\nmon parcours professionnel.`,
                    `Mon premier stage chez ${CV_DATA.experiences[2].company}.\n${CV_DATA.experiences[2].role}.\n${CV_DATA.experiences[2].period}.`,
                    `${CV_DATA.experiences[2].description}\nC'était le début de tout.`,
                    `Puis ${CV_DATA.experiences[1].company}.\n${CV_DATA.experiences[1].role}, ${CV_DATA.experiences[1].type}.\n${CV_DATA.experiences[1].period}.`,
                    `${CV_DATA.experiences[1].description}\nJ'ai touché à ${CV_DATA.experiences[1].techs.join(', ')}...`,
                    `Et maintenant ${CV_DATA.experiences[0].company}.\n${CV_DATA.experiences[0].role}, ${CV_DATA.experiences[0].type}.\n${CV_DATA.experiences[0].period}.`,
                    `${CV_DATA.experiences[0].description}\nChaque job m'a rapproché de mon rêve.\nAvançons !`
                ]
            },
            decorations: [
                { x: 8, y: 3, sprite: 'trashcan' },
                { x: 15, y: 9, sprite: 'trashcan' },
                { x: 24, y: 3, sprite: 'trashcan' },
                { x: 5, y: 9, sprite: 'firebarrel', anim: 'firebarrel_anim' },
                { x: 18, y: 3, sprite: 'firebarrel', anim: 'firebarrel_anim' },
                { x: 25, y: 9, sprite: 'firebarrel', anim: 'firebarrel_anim' },
            ],
            entities: [
                { x: 12, y: 1.5, key: 'missing_ayoub', spriteKey: 'missing', type: 'missing', frame: 2 }
            ],
            enemies: [
                { id: 'philippe_3', x: 22, y: 3.5, key: 'enemy_philippe', name: 'Philippe Malinge', hp: 4, speed: 50, dialogue: 'enemy_philippe', bullet: 'bullet_linux' }
            ],
            cars: [
                { y: 5.5, speed: 160, dir: 1, delay: 2000, variant: 1 },
                { y: 7, speed: -130, dir: -1, delay: 3000, variant: 2 },
                { y: 6, speed: 100, dir: 1, delay: 6000, variant: 0 },
            ],
            lamps: [3, 9, 15, 21, 26]
        };
    }

    _zoneAlley() {
        const w = 24, h = 12;
        const map = this._makeStreet(w, h, true, true);
        return {
            name: 'Ruelle Sombre - Compétences',
            map, width: w, height: h,
            spawnX: 2 * TILE, spawnY: 3 * TILE,
            entities: [],
            introDialogue: {
                title: 'Victorio (détermination)',
                color: '#4488ff',
                pages: [
                    `Cette ruelle sombre... Comme la nuit\navant l'aube. J'y suis presque.`,
                    `Mes armes techniques ?\nC# / .NET MVC, WPF...\nLe backend, c'est ma forteresse.`,
                    `Vue.js, React, React Native...\nLe frontend, je maîtrise aussi.\nFull Stack, c'est pas juste un titre.`,
                    `MongoDB, MySQL, SQL...\nLes données n'ont pas de secret pour moi.`,
                    `JavaScript, PHP, Symfony, HTML/CSS,\nGit... J'ai forgé chaque compétence\ndans la sueur et le code.`,
                    `Plus qu'un obstacle et c'est\nl'entretien. Je peux le faire !`
                ]
            },
            decorations: [
                { x: 4, y: 3, sprite: 'trashcan' },
                { x: 7, y: 9, sprite: 'trashcan' },
                { x: 18, y: 3, sprite: 'trashcan' },
                { x: 20, y: 9, sprite: 'trashcan' },
                { x: 10, y: 9, sprite: 'firebarrel', anim: 'firebarrel_anim' },
                { x: 14, y: 3, sprite: 'firebarrel', anim: 'firebarrel_anim' },
            ],
            entities: [
                { x: 8, y: 1.5, key: 'missing_damien', spriteKey: 'missing', type: 'missing', frame: 3 }
            ],
            enemies: [
                { id: 'billy_4', x: 17, y: 9, key: 'enemy_billy', name: 'Billy Vellena', hp: 4, speed: 55, dialogue: 'enemy_billy', bullet: 'bullet_php' }
            ],
            cars: [
                { y: 5.5, speed: 90, dir: 1, delay: 4000, variant: 0 },
                { y: 7, speed: -80, dir: -1, delay: 5500, variant: 1 },
            ],
            lamps: [5, 12, 19]
        };
    }

    _zoneFinish() {
        const w = 20, h = 12;
        const map = this._makeStreet(w, h, true, false);
        map[1][w-2] = 32;
        map[2][w-2] = 32;
        return {
            name: "L'Entreprise - Arrivée",
            map, width: w, height: h,
            spawnX: 2 * TILE, spawnY: 9 * TILE,
            entities: [
                { x: w - 2, y: 3, key: 'interview', spriteKey: 'poster', anim: 'poster_anim', type: 'interview' },
            ],
            introDialogue: {
                title: 'Victorio (émotion)',
                color: '#ffd700',
                pages: [
                    `C'est ici... L'immeuble est devant moi.\nLa porte dorée brille.`,
                    `Cinéma, anime, jeux vidéo...\nMes passions m'ont porté jusqu'ici.\nElles font partie de qui je suis.`,
                    `📍 ${CV_DATA.location}\n🔗 ${CV_DATA.contact.linkedin}`,
                    `La porte est là-bas.\nIl est temps d'entrer et de montrer\nce que je vaux. Allons-y !`
                ]
            },
            decorations: [
                { x: 3, y: 9, sprite: 'trashcan' },
                { x: 14, y: 3, sprite: 'trashcan' },
            ],
            enemies: [],
            cars: [
                { y: 5.5, speed: 80, dir: 1, delay: 5000, variant: 2 },
            ],
            lamps: [4, 10, 16]
        };
    }

    // === ROOM LOADING ===
    _loadRoom(index) {
        this.currentRoom = index;
        const room = this.rooms[index];

        // Cleanup
        this.physics.world.colliders.destroy();
        if (this.groundLayer) { this.groundLayer.destroy(); this.groundLayer = null; }
        if (this.tilemap) { this.tilemap.destroy(); this.tilemap = null; }
        if (this.interactables) this.interactables.clear(true, true);
        else this.interactables = this.add.group();
        if (this.enemies) this.enemies.clear(true, true);
        else this.enemies = this.physics.add.group();
        if (this.decoSprites) this.decoSprites.forEach(d => { this.tweens.killTweensOf(d); d.destroy(); });
        this.decoSprites = [];
        if (this.torchLights) this.torchLights.forEach(l => { this.tweens.killTweensOf(l); l.destroy(); });
        this.torchLights = [];
        if (this.torchTimer) { this.torchTimer.remove(false); this.torchTimer = null; }
        if (this.carTimers) this.carTimers.forEach(t => t.remove(false));
        this.carTimers = [];
        if (this.carSprites) this.carSprites.forEach(c => c.destroy());
        this.carSprites = [];

        // Tilemap
        this.tilemap = this.make.tilemap({ data: room.map, tileWidth: TILE, tileHeight: TILE });
        const tileset = this.tilemap.addTilesetImage('tileset', 'tileset', TILE, TILE, 0, 0);
        this.groundLayer = this.tilemap.createLayer(0, tileset, 0, 0);
        this.groundLayer.setScale(GAME_SCALE);
        this.groundLayer.setDepth(0);

        // Collisions: buildings, roofs, building bases
        this.groundLayer.setCollision([10, 11, 12, 13, 14, 15, 31, 32, 33]);
        this.physics.add.collider(this.player, this.groundLayer);

        // Player position
        this.player.setPosition(room.spawnX * GAME_SCALE, room.spawnY * GAME_SCALE);
        this.player.setVelocity(0, 0);

        // Camera bounds
        this.cameras.main.setBounds(0, 0, room.width * TILE * GAME_SCALE, room.height * TILE * GAME_SCALE);

        // Entities (posters) - smaller hitbox so they don't interfere with combat
        room.entities.forEach(ent => {
            const sprite = this.physics.add.sprite(ent.x * TILE * GAME_SCALE, ent.y * TILE * GAME_SCALE, ent.spriteKey, 0);
            sprite.setScale(GAME_SCALE).setDepth(5).setImmovable(true);
            sprite.body.setSize(8, 8);
            sprite.setData('dialogueKey', ent.key);
            sprite.setData('type', ent.type || 'poster');
            if (ent.anim && this.anims.exists(ent.anim)) sprite.play(ent.anim);
            this.interactables.add(sprite);
        });

        // Decorations
        if (room.decorations) {
            room.decorations.forEach(deco => {
                if (!this.textures.exists(deco.sprite)) return;
                const s = this.add.sprite(deco.x * TILE * GAME_SCALE, deco.y * TILE * GAME_SCALE, deco.sprite).setScale(GAME_SCALE).setDepth(3);
                this.decoSprites.push(s);
                // Add collision for trashcans
                if (deco.sprite === 'trashcan') {
                    const body = this.physics.add.existing(s, true);
                    this.physics.add.collider(this.player, s);
                }
            });
        }

        // Enemies
        if (room.enemies) {
            room.enemies.forEach(e => {
                if (this.defeatedEnemies.has(e.id)) return;
                if (!this.textures.exists(e.key)) return;
                const enemy = this.physics.add.sprite(e.x * TILE * GAME_SCALE, e.y * TILE * GAME_SCALE, e.key, 0);
                enemy.setScale(GAME_SCALE).setDepth(9);
                enemy.body.setSize(10, 10).setOffset(3, 12);
                enemy.setCollideWorldBounds(true);
                enemy.setData('id', e.id);
                enemy.setData('name', e.name);
                enemy.setData('hp', e.hp);
                enemy.setData('maxHp', e.hp);
                enemy.setData('speed', e.speed);
                enemy.setData('dialogue', e.dialogue);
                enemy.setData('enemyKey', e.key);
                enemy.setData('bulletType', e.bullet || 'bullet_java');
                enemy.setData('stunTimer', 0);
                enemy.setData('shootTimer', 0);
                if (this.anims.exists(e.key + '_idle')) enemy.play(e.key + '_idle');
                this.enemies.add(enemy);
                this.physics.add.collider(enemy, this.groundLayer);
            });
            this.physics.add.overlap(this.player, this.enemies, (p, enemy) => this._onEnemyHit(enemy));
        }

        // Cars
        this.carTimers = [];
        this.carSprites = [];
        if (room.cars) {
            room.cars.forEach(carDef => {
                const timer = this.time.addEvent({
                    delay: carDef.delay,
                    loop: true,
                    callback: () => this._spawnCar(room, carDef)
                });
                this.carTimers.push(timer);
                // Spawn first car immediately with a random delay
                this.time.delayedCall(Math.random() * carDef.delay, () => this._spawnCar(room, carDef));
            });
        }

        // Lamp lights
        if (room.lamps) {
            room.lamps.forEach(lx => {
                if (!this.textures.exists('lampglow')) return;
                const light = this.add.image(
                    lx * TILE * GAME_SCALE + TILE * GAME_SCALE / 2,
                    3 * TILE * GAME_SCALE,
                    'lampglow'
                ).setScale(3).setAlpha(0.5).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({
                    targets: light, alpha: 0.25, duration: 500 + Math.random() * 300,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                this.torchLights.push(light);
            });
        }

        // Notify UI
        this.events.emit('roomChanged', room.name, index, this.rooms.length);
        this.events.emit('hpChanged', this.playerHP, this.maxHP);

        // Show intro dialogue for this zone (with a short delay for fade-in)
        if (room.introDialogue && !this._zoneIntroShown) {
            this._zoneIntroShown = new Set();
        }
        if (room.introDialogue && !this._zoneIntroShown.has(index)) {
            this._zoneIntroShown.add(index);
            this.time.delayedCall(600, () => {
                this.events.emit('showDialogue', room.introDialogue, 'zone_intro_' + index);
            });
        }
    }

    _createLighting() {
        this.darkOverlay = this.add.graphics().setDepth(12).setScrollFactor(1);
        if (this.textures.exists('lampglow')) {
            this.playerLight = this.add.image(0, 0, 'lampglow')
                .setScale(4).setAlpha(0.4).setDepth(15)
                .setBlendMode(Phaser.BlendModes.ADD);
        }
    }

    _spawnCar(room, carDef) {
        if (!this.textures.exists('car')) return;
        const startX = carDef.dir > 0 ? -2 * TILE * GAME_SCALE : (room.width + 2) * TILE * GAME_SCALE;
        const car = this.physics.add.sprite(startX, carDef.y * TILE * GAME_SCALE, 'car', carDef.variant || 0);
        car.setScale(GAME_SCALE).setDepth(8);
        car.setVelocityX(carDef.speed * GAME_SCALE / 2);
        if (carDef.dir < 0) car.setFlipX(true);
        car.body.setSize(30, 12);

        // Car hits player
        this.physics.add.overlap(this.player, car, () => {
            if (!this.invincible) {
                this._onCarHit();
            }
        });

        this.carSprites.push(car);

        // Destroy when off screen
        this.time.delayedCall(8000, () => {
            if (car.active) car.destroy();
        });
    }

    _onCarHit() {
        if (this.invincible) return;
        this.playerHP = Math.max(0, this.playerHP - 2);
        this.invincible = true;
        this.events.emit('hpChanged', this.playerHP, this.maxHP);
        this.cameras.main.shake(200, 0.02);
        this.player.setTint(0xff0000);
        // Knockback
        this.player.setVelocityY(-200);

        let blinks = 0;
        this.time.addEvent({
            delay: 100, repeat: 15,
            callback: () => { blinks++; this.player.setAlpha(blinks % 2 ? 0.3 : 1); }
        });
        this.time.delayedCall(1600, () => {
            this.invincible = false;
            this.player.setAlpha(1).clearTint();
        });
        if (this.playerHP <= 0) this._playerDeath();
    }

    // === INTERACTION ===
    _interact() {
        if (this.transitioning) return;

        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.dialogueActive) { uiScene.advanceDialogue(); return; }
        if (uiScene && uiScene.skillsActive) { uiScene.closeSkills(); return; }

        if (this.nearestEntity) {
            const key = this.nearestEntity.getData('dialogueKey');
            const type = this.nearestEntity.getData('type');
            if (type === 'interview') {
                this._victory();
                return;
            }
            if (key && DIALOGUES[key]) {
                this.events.emit('showDialogue', DIALOGUES[key], key);
            }
        }
    }

    // === VOMIT ATTACK ===
    _vomitAttack() {
        if (this.vomitCooldown || this.isAttacking || this.transitioning) return;
        const uiScene = this.scene.get('UIScene');
        if (uiScene && (uiScene.dialogueActive || uiScene.skillsActive)) {
            // During dialogue, SPACE advances it
            if (uiScene.dialogueActive) uiScene.advanceDialogue();
            else if (uiScene.skillsActive) uiScene.closeSkills();
            return;
        }
        this.isAttacking = true;
        this.vomitCooldown = true;

        // Flash player green while vomiting
        this.player.setTint(0x88cc22);
        this.time.delayedCall(300, () => { if (this.player.active) this.player.clearTint(); });

        let vx = 0, vy = 0;
        const spd = 280;
        // Offset spawn point in front of player
        let spawnX = this.player.x, spawnY = this.player.y;
        switch (this.lastDir) {
            case 'right': vx = spd; spawnX += 20; break;
            case 'left': vx = -spd; spawnX -= 20; break;
            case 'up': vy = -spd; spawnY -= 20; break;
            case 'down': vy = spd; spawnY += 20; break;
        }

        const projectile = this.physics.add.sprite(spawnX, spawnY, 'vomit', 0);
        projectile.setScale(GAME_SCALE).setDepth(11);
        projectile.setRotation(Math.atan2(vy, vx));
        if (this.anims.exists('vomit_anim')) projectile.play('vomit_anim');
        projectile.setVelocity(vx, vy);

        // Trail particles behind vomit
        const trail = this.time.addEvent({
            delay: 60, repeat: 8,
            callback: () => {
                if (!projectile.active) return;
                const drip = this.add.rectangle(
                    projectile.x + (Math.random()-0.5)*10,
                    projectile.y + (Math.random()-0.5)*10,
                    3*GAME_SCALE, 2*GAME_SCALE, 0x66aa00
                ).setDepth(10).setAlpha(0.7);
                this.tweens.add({
                    targets: drip, alpha: 0, scaleX: 0.3, scaleY: 0.3,
                    duration: 400, onComplete: () => drip.destroy()
                });
            }
        });

        // Hit enemies
        this.physics.add.overlap(projectile, this.enemies, (proj, enemy) => {
            this._damageEnemy(enemy);
            // Splash effect
            if (this.textures.exists('vomitsplash')) {
                const splash = this.add.sprite(enemy.x, enemy.y, 'vomitsplash', 0).setScale(GAME_SCALE).setDepth(25);
                if (this.anims.exists('vomitsplash_anim')) {
                    splash.play('vomitsplash_anim');
                    splash.once('animationcomplete', () => splash.destroy());
                } else { this.time.delayedCall(300, () => splash.destroy()); }
            }
            proj.destroy();
        });

        this.cameras.main.shake(50, 0.003);

        // Destroy after distance
        this.time.delayedCall(600, () => { if (projectile.active) projectile.destroy(); });
        this.time.delayedCall(400, () => { this.isAttacking = false; this.vomitCooldown = false; });
    }

    _damageEnemy(enemy) {
        const hp = enemy.getData('hp') - 1;
        enemy.setData('hp', hp);
        enemy.setData('stunTimer', 45);

        // Reduced knockback
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);

        // Clamp enemy to room bounds after a short delay
        this.time.delayedCall(200, () => {
            if (!enemy.active) return;
            const room = this.rooms[this.currentRoom];
            const minX = 2 * TILE * GAME_SCALE;
            const maxX = (room.width - 2) * TILE * GAME_SCALE;
            const minY = 3 * TILE * GAME_SCALE;
            const maxY = (room.height - 2) * TILE * GAME_SCALE;
            enemy.x = Phaser.Math.Clamp(enemy.x, minX, maxX);
            enemy.y = Phaser.Math.Clamp(enemy.y, minY, maxY);
        });

        const key = enemy.getData('enemyKey');
        if (this.anims.exists(key + '_hurt')) enemy.play(key + '_hurt');
        enemy.setTint(0x88cc22);
        this.time.delayedCall(200, () => { if (enemy.active) enemy.clearTint(); });
        this.cameras.main.shake(80, 0.005);

        // Notify UI of enemy HP change
        this.events.emit('enemyHpChanged', enemy.getData('name'), hp, enemy.getData('maxHp'));

        if (hp <= 0) this._killEnemy(enemy);
    }

    _killEnemy(enemy) {
        const id = enemy.getData('id');
        const name = enemy.getData('name');
        this.defeatedEnemies.add(id);

        if (this.textures.exists('deathpoof')) {
            const poof = this.add.sprite(enemy.x, enemy.y, 'deathpoof', 0).setScale(GAME_SCALE).setDepth(25);
            if (this.anims.exists('deathpoof_anim')) {
                poof.play('deathpoof_anim');
                poof.once('animationcomplete', () => poof.destroy());
            }
        }

        this.cameras.main.shake(200, 0.02);
        this.cameras.main.flash(200, 136, 204, 34);
        enemy.destroy();

        // Custom defeat messages per enemy
        const defeatMessages = {
            'Magalie Goudet': {
                title: 'K.O. ! Magalie Goudet',
                color: '#88cc22',
                pages: [
                    `Magalie est couverte de vomi !`,
                    `"Attends... je vais re-chiffrer ce combat...\n2 semaines ? Non, 1 heure !\nArgh..."`,
                    `Son chiffrage approximatif ne l'a\npas sauvée cette fois !`
                ]
            },
            'Victoria Codfert': {
                title: 'K.O. ! Victoria Codfert',
                color: '#88cc22',
                pages: [
                    `Victoria glisse dans le vomi !`,
                    `"NON ! C'est comme la scène du\nrestaurant dans l'Exorciste !\nSauf que c'est MOI qui le prends !"`,
                    `Même ses références cinéphiles\nne peuvent plus la sauver !`
                ]
            },
            'Philippe Malinge': {
                title: 'K.O. ! Philippe Malinge',
                color: '#88cc22',
                pages: [
                    `Philippe est à terre !`,
                    `"NOOON ! Le kernel... le kernel panic...\nLINUX ACKBAR... un dernier sudo...\nsudo rm -rf /ma-dignité..."`,
                    `Même l'open source ne peut pas\npatcher cette défaite !`
                ]
            },
            'Billy Vellena': {
                title: 'K.O. ! Billy Vellena',
                color: '#88cc22',
                pages: [
                    `Billy s'effondre lamentablement !`,
                    `"Attends... attends !\nJ'en parlerai à Madame Goudet !\nElle va pas être contente !!"`,
                    `"MADAME GOUDET !! AU SECOURS !!\nIl m'a vomi dessus !!"`,
                    `Billy la balance, fidèle à lui-même\njusqu'au bout...`
                ]
            }
        };

        const msg = defeatMessages[name] || {
            title: 'K.O. !', color: '#88cc22',
            pages: [`${name} a été aspergé(e) de vomi !\nLa route est dégagée !`]
        };
        this.events.emit('showDialogue', msg, 'victory');
    }

    _onEnemyHit(enemy) {
        if (this.invincible || this.isAttacking) return;
        if (enemy.getData('stunTimer') > 0) return;

        this.playerHP = Math.max(0, this.playerHP - 1);
        this.invincible = true;
        this.events.emit('hpChanged', this.playerHP, this.maxHP);

        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        this.player.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);
        this.cameras.main.shake(100, 0.008);
        this.player.setTint(0xff0000);

        let blinks = 0;
        this.time.addEvent({
            delay: 100, repeat: 15,
            callback: () => { blinks++; this.player.setAlpha(blinks % 2 ? 0.3 : 1); }
        });
        this.time.delayedCall(1600, () => {
            this.invincible = false;
            this.player.setAlpha(1).clearTint();
        });
        if (this.playerHP <= 0) this._playerDeath();
    }

    _playerDeath() {
        this.transitioning = true;
        this.player.setVelocity(0, 0);
        this.cameras.main.shake(300, 0.03);
        this.time.delayedCall(500, () => {
            this.cameras.main.fadeOut(800, 100, 0, 0);
            const reset = () => {
                this.playerHP = this.maxHP;
                this.invincible = false;
                this.player.setAlpha(1).clearTint();
                this._loadRoom(this.currentRoom);
                this.cameras.main.fadeIn(400, 5, 5, 16);
                this.time.delayedCall(500, () => { this.transitioning = false; });
            };
            this.cameras.main.once('camerafadeoutcomplete', reset);
            this.time.delayedCall(1000, () => { if (this.transitioning) reset(); });
        });
    }

    _victory() {
        this.transitioning = true;
        this.player.setVelocity(0, 0);

        // Fade out to golden
        this.cameras.main.fadeOut(800, 50, 40, 10);

        const showEnding = () => {
            // Switch to ending cutscene
            this.scene.get('UIScene').enemyBarContainer.setVisible(false);

            // Clear the game scene
            if (this.enemies) this.enemies.clear(true, true);
            if (this.carTimers) this.carTimers.forEach(t => t.remove(false));
            this.carSprites.forEach(c => { if (c.active) c.destroy(); });
            this.bubble.setVisible(false);

            // Change player tint to "suit" look (darker, classier)
            this.player.setTint(0x3355aa);
            this.player.setPosition(
                this.cameras.main.scrollX + 400 * GAME_SCALE / 3,
                this.cameras.main.scrollY + 300 * GAME_SCALE / 3
            );

            // Fade back in
            this.cameras.main.fadeIn(1000, 5, 5, 16);

            // Unlock transitioning so dialogue inputs work
            this.time.delayedCall(1100, () => { this.transitioning = false; });

            // Show the epic ending dialogue
            this.time.delayedCall(1200, () => {
                this.events.emit('showDialogue', {
                    title: '✨ VICTORIO GARCIA ✨',
                    color: '#ffd700',
                    pages: [
                        `Il était une fois un homme dans la rue...\nSans abri, sans espoir,\nmais avec un rêve.`,

                        `Ce rêve ? Devenir développeur.\nEt il l'a fait.`,

                        `Tout a commencé à 3iL Ingénieurs.\nUn Bachelor en Systèmes d'Information\noù il a appris PHP, Symfony, JavaScript...`,

                        `Puis le Mastère MS2D :\nManager de Solutions Digitales & Data.\nGestion de projet, qualité logicielle,\nles armes du monde professionnel.`,

                        `Son premier stage chez SECUTOP.\nPHP, MySQL, à distance.\n2 mois pour prouver sa valeur.`,

                        `Puis SOSSO DIGIT GROUP.\nUn an en alternance.\nReact Native, React.js...\nLe full stack prenait forme.`,

                        `Et maintenant, Lise Charmel.\nDéveloppeur Web en alternance.\nUne maison de luxe française.\nLyon, sur site, chaque jour.`,

                        `C# MVC, WPF, MongoDB, Vue.js...\nSes armes techniques sont affûtées.\nMais Victorio, c'est plus que du code.`,

                        `C'est un passionné de cinéma,\nqui trouve l'inspiration dans chaque plan.\nUn fan d'anime et de jeux vidéo,\nqui transforme sa créativité en code.`,

                        `Aujourd'hui, Victorio entre dans\ncet immeuble chic en costard.\nIl n'est plus le SDF de la rue.\nIl est développeur Full Stack.`,

                        `Il a traversé les rues sales,\névité les voitures,\nvomi sur Magalie et son chiffrage,\nsur Victoria et ses mails de refus,`,

                        `sur Philippe et son Linux Ackbar,\net sur Billy la balance.\nRien ne l'a arrêté.`,

                        `${CV_DATA.name}\n${CV_DATA.title}\n${CV_DATA.subtitle}\n📍 ${CV_DATA.location}`,

                        `🔗 ${CV_DATA.contact.linkedin}`,

                        `Merci d'avoir joué à\nSTREET QUEST CV !\n\n🎉 N'hésitez pas à contacter\nVictorio pour en savoir plus !\n\nFIN.`
                    ]
                }, 'victory_final');
            });

            // Confetti effect
            this.time.addEvent({
                delay: 200, repeat: 40,
                callback: () => {
                    const colors = [0xffd700, 0xff4488, 0x44ffcc, 0xffaa00, 0x4488ff, 0x88cc22];
                    for (let i = 0; i < 3; i++) {
                        const cx = this.player.x + (Math.random() - 0.5) * 400;
                        const cy = this.player.y - 200 + Math.random() * 100;
                        const confetti = this.add.rectangle(
                            cx, cy,
                            (2 + Math.random() * 3) * GAME_SCALE,
                            (1 + Math.random() * 2) * GAME_SCALE,
                            Phaser.Utils.Array.GetRandom(colors)
                        ).setDepth(30).setRotation(Math.random() * Math.PI);

                        this.tweens.add({
                            targets: confetti,
                            y: confetti.y + 300 + Math.random() * 200,
                            x: confetti.x + (Math.random() - 0.5) * 100,
                            rotation: confetti.rotation + Math.random() * 4,
                            alpha: 0,
                            duration: 2000 + Math.random() * 1000,
                            onComplete: () => confetti.destroy()
                        });
                    }
                }
            });
        };

        this.cameras.main.once('camerafadeoutcomplete', showEnding);
        this.time.delayedCall(1000, () => {
            if (this.transitioning) showEnding();
        });
    }

    _updateEnemies() {
        if (!this.enemies) return;

        let closestEnemy = null;
        let closestDist = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            const stun = enemy.getData('stunTimer');
            if (stun > 0) {
                enemy.setData('stunTimer', stun - 1);
                if (stun === 1) {
                    enemy.setVelocity(0, 0);
                    const key = enemy.getData('enemyKey');
                    if (this.anims.exists(key + '_idle')) enemy.play(key + '_idle');
                }
                return;
            }

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const speed = enemy.getData('speed');

            // Track closest enemy for UI display
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }

            // Auto-trigger dialogue when first approaching an enemy
            const id = enemy.getData('id');
            if (dist < 200 && !this.enemyIntroShown.has(id)) {
                this.enemyIntroShown.add(id);
                const dlgKey = enemy.getData('dialogue');
                if (dlgKey && DIALOGUES[dlgKey]) {
                    this.events.emit('showDialogue', DIALOGUES[dlgKey], dlgKey);
                }
            }

            if (dist < 280 && dist > 25) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

                // Shoot at player periodically
                const shootTimer = (enemy.getData('shootTimer') || 0) + 1;
                enemy.setData('shootTimer', shootTimer);
                if (shootTimer > 90 && dist > 60) { // Every ~1.5 seconds, from range
                    enemy.setData('shootTimer', 0);
                    this._enemyShoot(enemy);
                }

                if (dist < 60) {
                    const key = enemy.getData('enemyKey');
                    if (this.anims.exists(key + '_attack')) enemy.play(key + '_attack', true);
                }
            } else if (dist >= 280) {
                if (Math.random() < 0.02) {
                    enemy.setVelocity((Math.random()-0.5)*speed*0.5, (Math.random()-0.5)*speed*0.5);
                }
                // Shoot from far away too, less frequently
                const shootTimer = (enemy.getData('shootTimer') || 0) + 1;
                enemy.setData('shootTimer', shootTimer);
                if (shootTimer > 150 && dist < 500) {
                    enemy.setData('shootTimer', 0);
                    this._enemyShoot(enemy);
                }
            } else {
                enemy.setVelocity(0, 0);
            }

            // Keep enemies inside room bounds
            const room = this.rooms[this.currentRoom];
            const minX = 2 * TILE * GAME_SCALE;
            const maxX = (room.width - 2) * TILE * GAME_SCALE;
            const minY = 3 * TILE * GAME_SCALE;
            const maxY = (room.height - 2) * TILE * GAME_SCALE;
            enemy.x = Phaser.Math.Clamp(enemy.x, minX, maxX);
            enemy.y = Phaser.Math.Clamp(enemy.y, minY, maxY);
        });

        // Always show enemy HP bar if any enemy exists in the zone
        if (closestEnemy) {
            this.events.emit('enemyNearby',
                closestEnemy.getData('name'),
                closestEnemy.getData('hp'),
                closestEnemy.getData('maxHp')
            );
        } else {
            this.events.emit('enemyNearby', null, 0, 0);
        }
    }

    _enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const bulletSpeed = 180;
        const bulletType = enemy.getData('bulletType') || 'bullet_java';

        // Classic red bullet
        const bullet = this.add.rectangle(
            enemy.x, enemy.y, 6 * GAME_SCALE, 3 * GAME_SCALE, 0xff3333
        ).setDepth(11);
        this.physics.add.existing(bullet);
        bullet.body.setVelocity(
            Math.cos(angle) * bulletSpeed,
            Math.sin(angle) * bulletSpeed
        );
        bullet.setRotation(angle);

        // Hit player
        this.physics.add.overlap(this.player, bullet, () => {
            if (!this.invincible) {
                this.playerHP = Math.max(0, this.playerHP - 1);
                this.invincible = true;
                this.events.emit('hpChanged', this.playerHP, this.maxHP);
                this.cameras.main.shake(80, 0.006);
                this.player.setTint(0xff0000);

                // Knockback
                const kb = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                this.player.setVelocity(Math.cos(kb) * 150, Math.sin(kb) * 150);

                let blinks = 0;
                this.time.addEvent({
                    delay: 100, repeat: 10,
                    callback: () => { blinks++; this.player.setAlpha(blinks % 2 ? 0.3 : 1); }
                });
                this.time.delayedCall(1200, () => {
                    this.invincible = false;
                    this.player.setAlpha(1).clearTint();
                });
                if (this.playerHP <= 0) this._playerDeath();
            }
            bullet.destroy();
        });

        // Destroy after 3 seconds
        this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });

        // Flash enemy briefly to show shooting
        const key = enemy.getData('enemyKey');
        if (this.anims.exists(key + '_attack')) enemy.play(key + '_attack');
        this.time.delayedCall(300, () => {
            if (enemy.active && this.anims.exists(key + '_idle')) enemy.play(key + '_idle');
        });
    }

    // === TRANSITIONS ===
    _checkDoors() {
        const room = this.rooms[this.currentRoom];
        const px = this.player.x / (TILE * GAME_SCALE);

        if (px > room.width - 1.5 && this.currentRoom < this.rooms.length - 1)
            this._transitionToRoom(this.currentRoom + 1);
        if (px < 1.5 && this.currentRoom > 0)
            this._transitionToRoom(this.currentRoom - 1);
    }

    _transitionToRoom(targetIndex) {
        if (this.transitioning) return;
        this.transitioning = true;
        this.player.setVelocity(0, 0);
        this.cameras.main.resetFX();
        this.cameras.main.fadeOut(350, 5, 5, 16);

        const doTransition = () => {
            this._loadRoom(targetIndex);
            this.cameras.main.fadeIn(350, 5, 5, 16);
            this.time.delayedCall(500, () => { this.transitioning = false; });
        };

        this.cameras.main.once('camerafadeoutcomplete', doTransition);
        this.time.delayedCall(500, () => {
            if (this.transitioning && this.currentRoom !== targetIndex) doTransition();
        });
    }

    // === UPDATE ===
    update() {
        if (this.transitioning) return;

        const uiScene = this.scene.get('UIScene');
        const dialogueActive = uiScene && (uiScene.dialogueActive || uiScene.skillsActive);

        // Freeze EVERYTHING during dialogue
        if (dialogueActive) {
            this.player.setVelocity(0, 0);
            this._dialoguePaused = true;
            // Freeze all enemies - save their velocity
            if (this.enemies) {
                this.enemies.getChildren().forEach(e => {
                    if (e.getData('savedVx') === undefined) {
                        e.setData('savedVx', e.body.velocity.x);
                        e.setData('savedVy', e.body.velocity.y);
                    }
                    e.setVelocity(0, 0);
                });
            }
            // Freeze all cars
            if (this.carSprites) {
                this.carSprites.forEach(c => {
                    if (c.active && c.body) {
                        if (c.getData('savedVx') === undefined) {
                            c.setData('savedVx', c.body.velocity.x);
                            c.setData('savedVy', c.body.velocity.y);
                        }
                        c.body.setVelocity(0, 0);
                    }
                });
            }
            return;
        }

        // Restore velocities when dialogue ends
        if (this._dialoguePaused) {
            this._dialoguePaused = false;
            // Restore enemies
            if (this.enemies) {
                this.enemies.getChildren().forEach(e => {
                    if (e.getData('savedVx') !== undefined) {
                        e.setVelocity(e.getData('savedVx'), e.getData('savedVy'));
                        e.setData('savedVx', undefined);
                        e.setData('savedVy', undefined);
                    }
                });
            }
            // Restore cars
            if (this.carSprites) {
                this.carSprites.forEach(c => {
                    if (c.active && c.body && c.getData('savedVx') !== undefined) {
                        c.body.setVelocity(c.getData('savedVx'), c.getData('savedVy'));
                        c.setData('savedVx', undefined);
                        c.setData('savedVy', undefined);
                    }
                });
            }
            // Brief invincibility after dialogue so player doesn't get instantly hit
            this.invincible = true;
            this.time.delayedCall(500, () => { this.invincible = false; });
        }

        const speed = 150;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.keyQ.isDown || this.keyA.isDown) vx = -speed;
        else if (this.cursors.right.isDown || this.keyD.isDown) vx = speed;
        if (this.cursors.up.isDown || this.keyZ.isDown || this.keyW.isDown) vy = -speed;
        else if (this.cursors.down.isDown || this.keyS.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        this.player.setVelocity(vx, vy);

        if (vx < 0) { this.player.play('hero_left', true); this.lastDir = 'left'; }
        else if (vx > 0) { this.player.play('hero_right', true); this.lastDir = 'right'; }
        else if (vy < 0) { this.player.play('hero_up', true); this.lastDir = 'up'; }
        else if (vy > 0) { this.player.play('hero_down', true); this.lastDir = 'down'; }
        else {
            this.player.anims.stop();
            const anim = this.player.anims.currentAnim;
            if (anim) {
                const idleKey = anim.key + '_idle';
                if (this.anims.exists(idleKey)) this.player.play(idleKey, true);
            }
        }

        // Player light
        if (this.playerLight) this.playerLight.setPosition(this.player.x, this.player.y);

        // Nearest entity
        this.nearestEntity = null;
        let minDist = 40 * GAME_SCALE;
        this.interactables.getChildren().forEach(ent => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ent.x, ent.y);
            if (dist < minDist) { minDist = dist; this.nearestEntity = ent; }
        });

        if (this.nearestEntity && !dialogueActive) {
            this.bubble.setVisible(true);
            this.bubble.setPosition(this.nearestEntity.x, this.nearestEntity.y - 30 * GAME_SCALE / 2);
            if (!this.bubble.anims.isPlaying) this.bubble.play('bubble_anim');
        } else {
            this.bubble.setVisible(false);
        }

        if (!dialogueActive) {
            this._updateEnemies();
            this._checkDoors();
        }

        // Clean up off-screen cars
        this.carSprites = this.carSprites.filter(c => c.active);
    }
}

// === DIALOGUES ===
const DIALOGUES = {
    intro: {
        title: 'Panneau de rue',
        color: '#44ffcc',
        pages: [
            `Bienvenue dans la jungle urbaine...\nTu es ${CV_DATA.name}, ${CV_DATA.title}.`,
            `Tu vis dans la rue, mais aujourd'hui\ntout va changer.`,
            `Un entretien d'embauche t'attend\nau bout de cette avenue !`,
            `Lis les affiches sur les murs pour\ndécouvrir ton parcours.\nÉvite les voitures !\nVomis sur tes ennemis avec ESPACE !`
        ]
    },
    edu_master: {
        title: 'Affiche - Mastère',
        color: '#ff4488',
        pages: [
            `📋 ${CV_DATA.education[0].school}`,
            `${CV_DATA.education[0].degree}`,
            `📅 ${CV_DATA.education[0].period}`,
            `✨ ${CV_DATA.education[0].skills.join(', ')}`
        ]
    },
    edu_bachelor: {
        title: 'Affiche - Bachelor',
        color: '#4488ff',
        pages: [
            `📋 ${CV_DATA.education[1].school}`,
            `${CV_DATA.education[1].degree}`,
            `📅 ${CV_DATA.education[1].period}`,
            `✨ ${CV_DATA.education[1].skills.join(', ')}`
        ]
    },
    exp_lise: {
        title: CV_DATA.experiences[0].company,
        color: '#ff4488',
        pages: [
            `💼 ${CV_DATA.experiences[0].role} - ${CV_DATA.experiences[0].type}`,
            `📅 ${CV_DATA.experiences[0].period}`,
            `📍 ${CV_DATA.experiences[0].location}`,
            `${CV_DATA.experiences[0].description}`
        ]
    },
    exp_sosso: {
        title: CV_DATA.experiences[1].company,
        color: '#44ffcc',
        pages: [
            `💼 ${CV_DATA.experiences[1].role} - ${CV_DATA.experiences[1].type}`,
            `📅 ${CV_DATA.experiences[1].period}`,
            `📍 ${CV_DATA.experiences[1].location}`,
            `${CV_DATA.experiences[1].description}`
        ]
    },
    exp_secutop: {
        title: CV_DATA.experiences[2].company,
        color: '#ffaa00',
        pages: [
            `💼 ${CV_DATA.experiences[2].role} - ${CV_DATA.experiences[2].type}`,
            `📅 ${CV_DATA.experiences[2].period}`,
            `📍 ${CV_DATA.experiences[2].location}`,
            `${CV_DATA.experiences[2].description}`
        ]
    },
    skills: {
        title: 'Panneau Compétences',
        color: '#ff4488',
        pages: [`Les néons révèlent tes compétences\ntechniques...`],
        onClose: 'showSkills'
    },
    contact: {
        title: 'Panneau Contact',
        color: '#ffd700',
        pages: [
            `📞 Contact : ${CV_DATA.name}`,
            `🔗 LinkedIn : ${CV_DATA.contact.linkedin}`,
            `📍 ${CV_DATA.location}`
        ]
    },
    passion_all: {
        title: 'Panneau Passions',
        color: '#44ffcc',
        pages: [
            `🎬 ${CV_DATA.passions[0].description}`,
            `🎌 ${CV_DATA.passions[1].description}`,
            `🎮 ${CV_DATA.passions[2].description}`,
            `⚡ ${CV_DATA.passions[3].description}`
        ]
    },
    interview: {
        title: "ENTRETIEN D'EMBAUCHE",
        color: '#ffd700',
        pages: [`La porte dorée est devant toi !\nAppuie sur ESPACE pour entrer...`]
    },
    enemy_magalie: {
        title: 'Magalie Goudet - Chef de Projet',
        color: '#ff0000',
        pages: [
            `Ah te voilà, le SDF développeur !\nJe suis Magalie Goudet !`,
            `Tu sais combien je chiffre ce combat ?\n3 jours-homme... non, 0.5 !\nComme tous mes projets ! HAHAHA !`,
            `Mon chiffrage est aussi précis\nqu'une horloge cassée !\nAllez, 2 story points pour te battre !`
        ]
    },
    enemy_victoria: {
        title: 'Victoria Codfert - Cinéphile',
        color: '#aa00ff',
        pages: [
            `Tiens, Victorio le "cinéphile" !\nJe suis Victoria Codfert !`,
            `Tu connais même pas la différence\nentre Kubrick et Michael Bay !\nTu regardes sûrement que des Marvel...`,
            `"Rosebud" ? Tu crois que c'est\nune marque de bière, pas vrai ?\nRetourne regarder tes anime, inculte !`
        ]
    },
    enemy_philippe: {
        title: 'Philippe Malinge - Camarade Linux',
        color: '#00ff44',
        pages: [
            `LINUX ACKBAR !! 🐧\nJe suis Philippe Malinge !`,
            `Windows ? PROPRIÉTAIRE !\nmacOS ? BOURGEOIS !\nSeul Linux est la voie, camarade !`,
            `Le code source doit être LIBRE !\nComme la classe ouvrière !\nLINUX ACKBAR !! Vive le GNU !\n🚩🐧🚩`
        ]
    },
    enemy_billy: {
        title: 'Billy Vellena - La Balance',
        color: '#ffaa00',
        pages: [
            `Hé hé hé... Billy Vellena ici.\nCette ruelle est mon territoire !`,
            `Tu crois que tes compétences\nte sauveront ? Pathétique !`,
            `Avance si tu l'oses...\nMais je te préviens,\nje rapporte TOUT à Madame Goudet !`
        ]
    },
    missing_virgile: {
        title: 'Avis de recherche',
        color: '#6688aa',
        pages: [
            `DISPARU - Virgile Patouillard`,
            `Dernières paroles connues :\n"Hé les gars, quelqu'un sait\ncomment on installe PhpStorm ?"`,
            `"Non mais sérieux, c'est quoi\ncette licence JetBrains ?\nPourquoi c'est si compliqué ??\nJ'arrive pas à le crack..."`,
            `Il n'a jamais réussi à l'installer.\nOn ne l'a plus revu depuis.`
        ]
    },
    missing_luca: {
        title: 'Avis de recherche',
        color: '#88aa66',
        pages: [
            `DISPARU - Luca Persle`,
            `Dernière connexion :\nServeur WoW - Royaume d'Azeroth\nNiveau 80, Chaman Orc`,
            `"Juste un dernier donjon les gars...\njuste un dernier..."\n\nÇa fait 3 semaines.`,
            `Sa guilde le cherche encore.\nSon personnage est toujours\nconnecté à Orgrimmar.\nLEEROY JENKINS !!`
        ]
    },
    missing_ayoub: {
        title: '⚠️ AVIS DE RECHERCHE ⚠️',
        color: '#ff4444',
        pages: [
            `DANGEREUX - Ayoub Boumallasha\n\n⚠️ NE PAS APPROCHER ⚠️`,
            `Considéré comme MALÉFIQUE.\nSuspecté d'avoir corrompu\nplusieurs bases de données\navec des DROP TABLE.`,
            `Il murmure "rm -rf /" dans son\nsommeil et rit de façon démoniaque\ndevant les 500 Internal Server Error.`,
            `Si vous le croisez, fuyez.\nEt surtout, faites des backups.`
        ]
    },
    missing_damien: {
        title: 'Avis de recherche',
        color: '#8866aa',
        pages: [
            `DISPARU - Damien Daescensao`,
            `Dernières paroles connues :\n"Allez les gars, on lance CS:GO ?\nJuste une petite game rapide..."`,
            `"Ranked, juste une.\nBon ok deux.\nTrois max.\n... Il est 4h du mat ??"`,
            `Dernière position connue :\nDust 2, site B, avec un AWP.\nSa dernière commit :\n"fix: je reviens après cette game"`
        ]
    }
};
