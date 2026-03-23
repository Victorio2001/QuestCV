// === Sprite Generator - NYC Street Theme ===
const PAL = {
    // Night sky
    sky1: '#0a0a1f', sky2: '#111133', sky3: '#0d0d28',
    // Sidewalk
    side1: '#555566', side2: '#444455', side3: '#666677', sideCrack: '#333344',
    // Road
    road1: '#222228', road2: '#1a1a22', road3: '#2a2a30', roadLine: '#cccc44',
    // Bricks
    brick1: '#663333', brick2: '#553322', brick3: '#774444', brickDark: '#442222', brickLight: '#885555',
    // Windows
    winOn: '#ffdd66', winOff: '#222244', winGlow: '#ffe488',
    // Lamp
    lampPost: '#444444', lampLight: '#ffeeaa', lampGlow: '#fff4cc',
    // Neon
    neonPink: '#ff4488', neonCyan: '#44ffcc', neonOrange: '#ffaa00', neonBlue: '#4488ff',
    // Vomit
    vomit1: '#88cc22', vomit2: '#66aa00', vomit3: '#aaee44', vomitDark: '#447711',
    // Character
    skin: '#d4a876', skinDark: '#b8845a', bonnet: '#884422', coat: '#4a4a3a', coatDark: '#333328',
    pants: '#3a3a4a', boots: '#2a2a22', beard: '#6b5030',
    // Cars
    carRed: '#cc3333', carBlue: '#3355aa', carYellow: '#ccaa33', carWhite: '#aabbcc',
    carDark: '#1a1a22', carLight: '#ffee88', carTail: '#ff3333',
    // Enemies
    enemyRed: '#882222', enemyPurple: '#442266', enemyGreen: '#226644', enemyOrange: '#885522',
    // UI
    gold: '#ffd700', goldDark: '#cc9900', white: '#eeeef6', gray: '#8888aa', grayDark: '#555577',
    black: '#0a0a1a', red: '#e94560', green: '#44cc66',
    // Misc
    trash: '#556655', trashDark: '#334433', puddle: '#223355',
};

const TILE = 16;

const SpriteGen = {
    createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return { canvas: c, ctx: c.getContext('2d') };
    },

    px(ctx, x, y, color) {
        if (!color || color === 0) return;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    },

    drawGrid(ctx, grid, offX = 0, offY = 0) {
        for (let y = 0; y < grid.length; y++)
            for (let x = 0; x < grid[y].length; x++)
                this.px(ctx, offX + x, offY + y, grid[y][x]);
    },

    // ===== TILESET =====
    generateTileset(scene) {
        const cols = 10, rows = 6;
        const { canvas, ctx } = this.createCanvas(cols * TILE, rows * TILE);

        // Row 0: Ground tiles
        this._tileSidewalk(ctx, 0, 0);           // 0: sidewalk A
        this._tileSidewalkB(ctx, TILE, 0);        // 1: sidewalk B
        this._tileSidewalkCrack(ctx, 2*TILE, 0);  // 2: sidewalk cracked
        this._tileRoad(ctx, 3*TILE, 0);           // 3: road
        this._tileRoadLine(ctx, 4*TILE, 0);       // 4: road with center line
        this._tileCurb(ctx, 5*TILE, 0);           // 5: curb (transition sidewalk-road)
        this._tileSidewalkDeco(ctx, 6*TILE, 0);   // 6: sidewalk with gum/stain

        // Row 1: Building tiles
        this._tileBrickWall(ctx, 0, TILE);         // 10: brick wall
        this._tileBrickWindow(ctx, TILE, TILE);    // 11: brick + lit window
        this._tileBrickWindowOff(ctx, 2*TILE, TILE); // 12: brick + dark window
        this._tileBrickDoor(ctx, 3*TILE, TILE);    // 13: building door
        this._tileRoof(ctx, 4*TILE, TILE);         // 14: roof edge
        this._tileBrickNeon(ctx, 5*TILE, TILE);    // 15: brick + neon sign slot

        // Row 2: Lamp posts (4 animation frames)
        for (let i = 0; i < 4; i++) this._tileLamp(ctx, i*TILE, 2*TILE, i);
        // 24: Sewer grate
        this._tileSewer(ctx, 4*TILE, 2*TILE);
        // 25: Puddle
        this._tilePuddle(ctx, 5*TILE, 2*TILE);

        // Row 3: Transition/special
        this._tileSidewalkEdge(ctx, 0, 3*TILE);    // 30: sidewalk top edge
        this._tileBuildingBase(ctx, TILE, 3*TILE);  // 31: building base (bottom row)
        this._tileInterviewDoor(ctx, 2*TILE, 3*TILE); // 32: golden interview door
        this._tileNeonSign(ctx, 3*TILE, 3*TILE);   // 33: neon CV poster frame

        scene.textures.addCanvas('tileset', canvas);
    },

    _tileSidewalk(ctx, x, y) {
        ctx.fillStyle = PAL.side1;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = PAL.side2;
        ctx.fillRect(x, y, 16, 1);
        ctx.fillRect(x, y, 1, 16);
        ctx.fillStyle = PAL.side3;
        ctx.fillRect(x+1, y+1, 14, 1);
        this.px(ctx, x+5, y+7, PAL.sideCrack);
        this.px(ctx, x+11, y+4, PAL.sideCrack);
    },

    _tileSidewalkB(ctx, x, y) {
        ctx.fillStyle = PAL.side2;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = PAL.side1;
        ctx.fillRect(x, y, 16, 1);
        ctx.fillRect(x, y, 1, 16);
        this.px(ctx, x+8, y+10, PAL.side3);
        this.px(ctx, x+3, y+13, PAL.side3);
    },

    _tileSidewalkCrack(ctx, x, y) {
        this._tileSidewalk(ctx, x, y);
        ctx.fillStyle = PAL.sideCrack;
        for (let i = 0; i < 6; i++) this.px(ctx, x+4+i, y+5+Math.floor(i*0.7), PAL.sideCrack);
        this.px(ctx, x+10, y+10, PAL.sideCrack);
        this.px(ctx, x+11, y+11, PAL.sideCrack);
    },

    _tileSidewalkDeco(ctx, x, y) {
        this._tileSidewalk(ctx, x, y);
        // Gum stain
        ctx.fillStyle = '#665566';
        ctx.fillRect(x+6, y+8, 3, 2);
    },

    _tileRoad(ctx, x, y) {
        ctx.fillStyle = PAL.road1;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = PAL.road2;
        this.px(ctx, x+3, y+5, PAL.road2);
        this.px(ctx, x+10, y+11, PAL.road2);
        this.px(ctx, x+7, y+3, PAL.road3);
    },

    _tileRoadLine(ctx, x, y) {
        this._tileRoad(ctx, x, y);
        ctx.fillStyle = PAL.roadLine;
        ctx.fillRect(x+2, y+7, 5, 2);
        ctx.fillRect(x+10, y+7, 5, 2);
    },

    _tileCurb(ctx, x, y) {
        ctx.fillStyle = PAL.side1;
        ctx.fillRect(x, y, 16, 6);
        ctx.fillStyle = PAL.side3;
        ctx.fillRect(x, y+5, 16, 2);
        ctx.fillStyle = PAL.road1;
        ctx.fillRect(x, y+7, 16, 9);
    },

    _tileSidewalkEdge(ctx, x, y) {
        ctx.fillStyle = PAL.side1;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = PAL.side3;
        ctx.fillRect(x, y+14, 16, 2);
    },

    _tileBrickWall(ctx, x, y) {
        ctx.fillStyle = PAL.brick1;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = PAL.brickDark;
        ctx.fillRect(x, y+5, 16, 1);
        ctx.fillRect(x, y+10, 16, 1);
        ctx.fillRect(x+8, y, 1, 5);
        ctx.fillRect(x+4, y+6, 1, 4);
        ctx.fillRect(x+12, y+6, 1, 4);
        ctx.fillRect(x+8, y+11, 1, 5);
        ctx.fillStyle = PAL.brickLight;
        this.px(ctx, x+2, y+2, PAL.brickLight);
        this.px(ctx, x+11, y+7, PAL.brickLight);
    },

    _tileBrickWindow(ctx, x, y) {
        this._tileBrickWall(ctx, x, y);
        ctx.fillStyle = '#1a1a33';
        ctx.fillRect(x+4, y+3, 8, 8);
        ctx.fillStyle = PAL.winOn;
        ctx.fillRect(x+5, y+4, 6, 6);
        ctx.fillStyle = PAL.winGlow;
        ctx.fillRect(x+5, y+4, 3, 3);
        ctx.fillStyle = '#ccbb44';
        ctx.fillRect(x+7, y+4, 1, 6);
        ctx.fillRect(x+5, y+7, 6, 1);
    },

    _tileBrickWindowOff(ctx, x, y) {
        this._tileBrickWall(ctx, x, y);
        ctx.fillStyle = '#111122';
        ctx.fillRect(x+4, y+3, 8, 8);
        ctx.fillStyle = PAL.winOff;
        ctx.fillRect(x+5, y+4, 6, 6);
        ctx.fillStyle = '#1a1a33';
        ctx.fillRect(x+7, y+4, 1, 6);
        ctx.fillRect(x+5, y+7, 6, 1);
    },

    _tileBrickDoor(ctx, x, y) {
        this._tileBrickWall(ctx, x, y);
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(x+4, y+4, 8, 12);
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(x+5, y+5, 6, 11);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(x+9, y+10, 1, 1);
    },

    _tileRoof(ctx, x, y) {
        ctx.fillStyle = PAL.sky2;
        ctx.fillRect(x, y, 16, 8);
        ctx.fillStyle = '#333344';
        ctx.fillRect(x, y+8, 16, 8);
        ctx.fillStyle = '#444455';
        ctx.fillRect(x, y+8, 16, 2);
    },

    _tileBrickNeon(ctx, x, y) {
        this._tileBrickWall(ctx, x, y);
        ctx.fillStyle = '#111';
        ctx.fillRect(x+2, y+2, 12, 12);
        ctx.fillStyle = PAL.neonPink;
        ctx.fillRect(x+2, y+2, 12, 1);
        ctx.fillRect(x+2, y+13, 12, 1);
        ctx.fillRect(x+2, y+2, 1, 12);
        ctx.fillRect(x+13, y+2, 1, 12);
    },

    _tileLamp(ctx, x, y, frame) {
        this._tileSidewalk(ctx, x, y);
        ctx.fillStyle = PAL.lampPost;
        ctx.fillRect(x+7, y+4, 2, 12);
        ctx.fillRect(x+5, y+3, 6, 2);
        const glowAlpha = [0.9, 0.7, 0.8, 0.6][frame];
        const gc = frame % 2 === 0 ? PAL.lampLight : PAL.lampGlow;
        ctx.fillStyle = gc;
        ctx.fillRect(x+6, y+1, 4, 3);
        ctx.fillRect(x+5, y+0, 6, 1);
    },

    _tileSewer(ctx, x, y) {
        this._tileSidewalk(ctx, x, y);
        ctx.fillStyle = '#222';
        ctx.fillRect(x+3, y+5, 10, 6);
        ctx.fillStyle = PAL.lampPost;
        for (let i = 0; i < 4; i++) ctx.fillRect(x+4+i*2, y+5, 1, 6);
    },

    _tilePuddle(ctx, x, y) {
        this._tileSidewalk(ctx, x, y);
        ctx.fillStyle = PAL.puddle;
        ctx.fillRect(x+3, y+6, 10, 5);
        ctx.fillStyle = '#334466';
        ctx.fillRect(x+5, y+7, 6, 3);
    },

    _tileBuildingBase(ctx, x, y) {
        ctx.fillStyle = PAL.brick2;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = PAL.brickDark;
        ctx.fillRect(x, y, 16, 2);
        ctx.fillRect(x, y+5, 16, 1);
        ctx.fillRect(x, y+10, 16, 1);
    },

    _tileInterviewDoor(ctx, x, y) {
        this._tileBrickWall(ctx, x, y);
        ctx.fillStyle = PAL.goldDark;
        ctx.fillRect(x+3, y+2, 10, 14);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(x+4, y+3, 8, 13);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x+6, y+5, 4, 3);
        ctx.fillStyle = PAL.goldDark;
        ctx.fillRect(x+10, y+9, 1, 1);
    },

    _tileNeonSign(ctx, x, y) {
        ctx.fillStyle = PAL.brick1;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x+1, y+1, 14, 14);
        ctx.fillStyle = PAL.neonCyan;
        ctx.fillRect(x+1, y+1, 14, 1);
        ctx.fillRect(x+1, y+14, 14, 1);
        ctx.fillRect(x+1, y+1, 1, 14);
        ctx.fillRect(x+14, y+1, 1, 14);
    },

    // ===== HERO - SDF VICTORIO =====
    generateHero(scene) {
        const fw = 16, fh = 24;
        const { canvas, ctx } = this.createCanvas(fw * 4, fh * 4);
        const dirs = ['down', 'left', 'right', 'up'];
        dirs.forEach((dir, row) => {
            for (let frame = 0; frame < 4; frame++)
                this._drawHeroFrame(ctx, frame * fw, row * fh, dir, frame);
        });
        scene.textures.addSpriteSheet('hero', canvas, { frameWidth: fw, frameHeight: fh });
    },

    _drawHeroFrame(ctx, x, y, dir, frame) {
        const _ = 0;
        const S = PAL.skin, SD = PAL.skinDark;
        const Bo = PAL.bonnet, C = PAL.coat, CD = PAL.coatDark;
        const P = PAL.pants, Bt = PAL.boots, Br = PAL.beard;
        const E = '#111', B = '#222';
        const bob = (frame === 1 || frame === 3) ? -1 : 0;

        let grid;
        if (dir === 'down') {
            grid = [
                [_,_,_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_,_,_],
                [_,_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_,_],
                [_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_],
                [_,_,_,Bo,S,S,S,S,S,S,S,S,Bo,_,_,_],
                [_,_,_,Bo,S,E,S,S,S,E,S,S,Bo,_,_,_],
                [_,_,_,_,S,S,S,SD,S,S,S,S,_,_,_,_],
                [_,_,_,_,S,Br,Br,Br,Br,Br,S,_,_,_,_,_],
                [_,_,_,_,_,Br,S,S,S,Br,_,_,_,_,_,_],
                [_,_,_,C,C,C,C,C,C,C,C,C,C,_,_,_],
                [_,_,C,C,CD,C,C,C,C,C,CD,C,C,C,_,_],
                [_,_,C,C,CD,C,C,CD,C,C,CD,C,C,C,_,_],
                [_,_,C,SD,SD,C,C,CD,C,C,SD,SD,C,_,_,_],
                [_,_,_,C,SD,C,C,C,C,C,SD,C,_,_,_,_],
                [_,_,_,C,C,C,C,C,C,C,C,C,C,_,_,_],
                [_,_,_,C,C,C,CD,CD,CD,C,C,C,_,_,_,_],
                [_,_,_,_,C,C,C,C,C,C,C,_,_,_,_,_],
                [_,_,_,_,P,P,P,P,P,P,P,P,_,_,_,_],
                [_,_,_,_,P,P,P,_,_,P,P,P,_,_,_,_],
                [_,_,_,_,P,P,P,_,_,P,P,P,_,_,_,_],
                [_,_,_,_,P,P,_,_,_,_,P,P,_,_,_,_],
                [_,_,_,Bt,Bt,Bt,_,_,_,Bt,Bt,Bt,_,_,_,_],
                [_,_,_,Bt,Bt,Bt,_,_,_,Bt,Bt,Bt,_,_,_,_],
                [_,_,_,B,B,B,B,_,_,B,B,B,B,_,_,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            ];
            if (frame === 1) {
                grid[17] = [_,_,_,_,_,P,P,P,P,P,_,_,_,_,_,_];
                grid[18] = [_,_,_,_,_,P,P,_,_,P,P,_,_,_,_,_];
                grid[19] = [_,_,_,_,P,P,_,_,_,_,P,P,_,_,_,_];
                grid[20] = [_,_,_,Bt,Bt,_,_,_,_,_,Bt,Bt,_,_,_,_];
                grid[21] = [_,_,Bt,Bt,_,_,_,_,_,_,_,Bt,Bt,_,_,_];
                grid[22] = [_,_,B,B,_,_,_,_,_,_,_,B,B,_,_,_];
            } else if (frame === 3) {
                grid[17] = [_,_,_,_,P,P,_,_,_,_,P,P,_,_,_,_];
                grid[18] = [_,_,_,P,P,_,_,_,_,_,_,P,P,_,_,_];
                grid[19] = [_,_,_,P,P,_,_,_,_,_,_,P,P,_,_,_];
                grid[20] = [_,_,Bt,Bt,_,_,_,_,_,_,_,Bt,Bt,_,_];
                grid[21] = [_,_,Bt,Bt,_,_,_,_,_,_,_,Bt,Bt,_,_];
                grid[22] = [_,_,B,B,_,_,_,_,_,_,_,B,B,_,_,_];
            }
        } else if (dir === 'up') {
            grid = [
                [_,_,_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_,_,_],
                [_,_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_,_],
                [_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_],
                [_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_],
                [_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_],
                [_,_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_,_],
                [_,_,_,_,_,S,Bo,Bo,Bo,S,_,_,_,_,_,_],
                [_,_,_,_,_,S,S,S,S,S,_,_,_,_,_,_],
                [_,_,_,C,C,C,C,C,C,C,C,C,C,_,_,_],
                [_,_,C,C,CD,C,C,C,C,C,CD,C,C,C,_,_],
                [_,_,C,C,CD,C,C,CD,C,C,CD,C,C,C,_,_],
                [_,_,C,SD,SD,C,C,CD,C,C,SD,SD,C,_,_,_],
                [_,_,_,C,SD,C,C,C,C,C,SD,C,_,_,_,_],
                [_,_,_,C,C,C,C,C,C,C,C,C,C,_,_,_],
                [_,_,_,C,C,C,CD,CD,CD,C,C,C,_,_,_,_],
                [_,_,_,_,C,C,C,C,C,C,C,_,_,_,_,_],
                [_,_,_,_,P,P,P,P,P,P,P,P,_,_,_,_],
                [_,_,_,_,P,P,P,_,_,P,P,P,_,_,_,_],
                [_,_,_,_,P,P,P,_,_,P,P,P,_,_,_,_],
                [_,_,_,_,P,P,_,_,_,_,P,P,_,_,_,_],
                [_,_,_,Bt,Bt,Bt,_,_,_,Bt,Bt,Bt,_,_,_,_],
                [_,_,_,Bt,Bt,Bt,_,_,_,Bt,Bt,Bt,_,_,_,_],
                [_,_,_,B,B,B,B,_,_,B,B,B,B,_,_,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            ];
            if (frame === 1 || frame === 3) {
                const s = frame === 1 ? 1 : -1;
                grid[17] = [_,_,_,_,_,P,P,P,P,P,_,_,_,_,_,_];
                grid[18] = [_,_,_,_,P,P,_,_,_,_,P,P,_,_,_,_];
                grid[19] = [_,_,_,_,P,P,_,_,_,_,P,P,_,_,_,_];
                grid[20] = [_,_,_,Bt,Bt,_,_,_,_,_,Bt,Bt,_,_,_,_];
                grid[21] = [_,_,_,Bt,Bt,_,_,_,_,_,Bt,Bt,_,_,_,_];
                grid[22] = [_,_,_,B,B,_,_,_,_,_,B,B,_,_,_,_];
            }
        } else {
            // Left and right share structure, right is drawn, left is flipped
            const isLeft = dir === 'left';
            grid = [
                [_,_,_,_,_,Bo,Bo,Bo,Bo,Bo,_,_,_,_,_,_],
                [_,_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_,_,_],
                [_,_,_,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,Bo,_,_,_,_],
                [_,_,_,Bo,S,S,S,S,S,S,Bo,Bo,_,_,_,_],
                [_,_,_,_,S,E,S,S,S,S,Bo,_,_,_,_,_],
                [_,_,_,_,S,S,S,SD,S,S,_,_,_,_,_,_],
                [_,_,_,_,S,Br,Br,Br,S,_,_,_,_,_,_,_],
                [_,_,_,_,_,S,S,S,_,_,_,_,_,_,_,_],
                [_,_,_,C,C,C,C,C,C,C,C,C,_,_,_,_],
                [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
                [_,_,C,C,SD,C,C,CD,C,C,C,C,C,_,_,_],
                [_,_,C,SD,SD,C,C,CD,C,C,SD,C,_,_,_,_],
                [_,_,_,C,SD,C,C,C,C,C,C,_,_,_,_,_],
                [_,_,_,C,C,C,C,C,C,C,C,_,_,_,_,_],
                [_,_,_,_,C,C,CD,CD,C,C,_,_,_,_,_,_],
                [_,_,_,_,_,C,C,C,C,_,_,_,_,_,_,_],
                [_,_,_,_,P,P,P,P,P,P,_,_,_,_,_,_],
                [_,_,_,_,P,P,_,_,P,P,_,_,_,_,_,_],
                [_,_,_,_,P,P,_,_,P,P,_,_,_,_,_,_],
                [_,_,_,_,P,_,_,_,_,P,_,_,_,_,_,_],
                [_,_,_,Bt,Bt,_,_,_,Bt,Bt,_,_,_,_,_,_],
                [_,_,_,Bt,Bt,_,_,_,Bt,Bt,_,_,_,_,_,_],
                [_,_,_,B,B,_,_,_,B,B,_,_,_,_,_,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            ];
            if (frame === 1 || frame === 3) {
                grid[17] = [_,_,_,_,_,P,_,_,P,P,_,_,_,_,_,_];
                grid[18] = [_,_,_,_,P,_,_,_,_,P,P,_,_,_,_,_];
                grid[19] = [_,_,_,Bt,_,_,_,_,_,Bt,_,_,_,_,_,_];
                grid[20] = [_,_,_,Bt,_,_,_,_,_,Bt,_,_,_,_,_,_];
                grid[21] = [_,_,B,B,_,_,_,_,B,B,_,_,_,_,_,_];
                grid[22] = [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_];
            }
            if (isLeft) {
                grid = grid.map(row => [...row].reverse());
            }
        }

        if (bob !== 0) { grid.pop(); grid.unshift(new Array(16).fill(0)); }
        this.drawGrid(ctx, grid, x, y);
    },

    // ===== NPCS / ENEMIES =====
    generateNPC(scene, key, color, colorDark) {
        const fw = 16, fh = 24;
        const { canvas, ctx } = this.createCanvas(fw * 2, fh);
        for (let f = 0; f < 2; f++)
            this._drawNPCFrame(ctx, f * fw, 0, color, colorDark, f);
        scene.textures.addSpriteSheet(key, canvas, { frameWidth: fw, frameHeight: fh });
    },

    _drawNPCFrame(ctx, x, y, cloak, cloakDk, frame) {
        const _ = 0;
        const bob = frame === 1 ? -1 : 0;
        const grid = [
            [_,_,_,_,_,_,cloakDk,cloakDk,cloakDk,cloakDk,_,_,_,_,_,_],
            [_,_,_,_,_,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,_,_,_,_,_],
            [_,_,_,_,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,_,_,_,_],
            [_,_,_,_,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,_,_,_,_],
            [_,_,_,_,cloak,'#ff0000',cloak,cloak,cloak,cloak,'#ff0000',cloak,_,_,_,_],
            [_,_,_,_,cloak,'#ff0000',cloak,cloak,cloak,cloak,'#ff0000',cloak,_,_,_,_],
            [_,_,_,_,cloak,cloak,cloak,PAL.skin,cloak,cloak,cloak,cloak,_,_,_,_],
            [_,_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_,_],
            [_,_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_,_],
            [_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_],
            [_,_,cloak,cloak,cloak,cloak,cloak,cloakDk,cloakDk,cloak,cloak,cloak,cloak,cloak,_,_],
            [_,_,cloak,cloak,PAL.skin,cloak,cloak,cloakDk,cloakDk,cloak,cloak,PAL.skin,cloak,cloak,_,_],
            [_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_],
            [_,_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_,_],
            [_,_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_,_],
            [_,_,_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_,_,_],
            [_,_,_,_,cloak,cloak,cloak,cloak,cloak,cloak,cloak,cloak,_,_,_,_],
            [_,_,_,_,_,cloak,cloak,cloak,cloak,cloak,cloak,_,_,_,_,_],
            [_,_,_,_,_,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,cloakDk,_,_,_,_,_],
            [_,_,_,_,_,cloakDk,cloakDk,_,_,cloakDk,cloakDk,_,_,_,_,_],
            [_,_,_,_,_,'#111','#111',_,_,'#111','#111',_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ];
        if (bob) { grid.pop(); grid.unshift(new Array(16).fill(0)); }
        this.drawGrid(ctx, grid, x, y);
    },

    // ===== ENEMIES =====
    generateEnemies(scene) {
        const enemies = [
            { key: 'enemy_magalie', color: '#882222', dark: '#551111', eyes: '#ff0000' },
            { key: 'enemy_victoria', color: '#442266', dark: '#221144', eyes: '#aa00ff' },
            { key: 'enemy_philippe', color: '#226644', dark: '#114422', eyes: '#00ff44' },
            { key: 'enemy_billy', color: '#885522', dark: '#553311', eyes: '#ffaa00' }
        ];
        enemies.forEach(e => this._genEnemy(scene, e.key, e.color, e.dark, e.eyes));
        this._genVomitProjectile(scene);
        this._genVomitSplash(scene);
        this._genStarsKO(scene);
        this._genDeathPoof(scene);
        this._genEnemyBullets(scene);
    },

    _genEnemy(scene, key, color, dark, eyes) {
        const fw = 16, fh = 24;
        const { canvas, ctx } = this.createCanvas(fw * 4, fh);
        const _ = 0, S = PAL.skin, SD = PAL.skinDark;
        for (let f = 0; f < 4; f++) {
            const x = f * fw;
            const isHurt = f === 2;
            const grid = [
                [_,_,_,_,_,dark,dark,dark,dark,dark,_,_,_,_,_,_],
                [_,_,_,_,dark,dark,dark,dark,dark,dark,dark,_,_,_,_,_],
                [_,_,_,dark,dark,dark,dark,dark,dark,dark,dark,dark,_,_,_,_],
                [_,_,_,dark,S,S,S,S,S,S,S,dark,_,_,_,_],
                [_,_,_,dark,eyes,S,S,S,S,eyes,S,dark,_,_,_,_],
                [_,_,_,_,S,S,S,SD,S,S,S,_,_,_,_,_],
                [_,_,_,_,_,S,S,S,S,S,_,_,_,_,_,_],
                [_,_,_,_,_,S,S,S,S,_,_,_,_,_,_,_],
                [_,_,_,color,color,color,color,color,color,color,color,color,_,_,_,_],
                [_,_,color,color,color,color,color,color,color,color,color,color,color,_,_,_],
                [_,_,color,color,S,color,color,dark,color,color,S,color,color,_,_,_],
                [_,_,color,color,S,color,color,dark,color,color,S,color,color,_,_,_],
                [_,_,_,color,color,color,color,color,color,color,color,color,_,_,_,_],
                [_,_,_,color,color,color,color,color,color,color,color,color,_,_,_,_],
                [_,_,_,_,color,color,dark,dark,color,color,_,_,_,_,_,_],
                [_,_,_,_,_,color,color,color,color,_,_,_,_,_,_,_],
                [_,_,_,_,'#333','#333','#333','#333','#333','#333',_,_,_,_,_,_],
                [_,_,_,_,'#333','#333',_,_,'#333','#333',_,_,_,_,_,_],
                [_,_,_,_,'#333','#333',_,_,'#333','#333',_,_,_,_,_,_],
                [_,_,_,_,'#222','#222',_,_,'#222','#222',_,_,_,_,_,_],
                [_,_,_,'#111','#111','#111',_,_,'#111','#111','#111',_,_,_,_,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            ];
            if (f === 1) { grid.pop(); grid.unshift(new Array(16).fill(0)); }
            this.drawGrid(ctx, grid, x, 0);
            if (isHurt) {
                ctx.fillStyle = 'rgba(255,0,0,0.4)';
                ctx.fillRect(x, 0, fw, fh);
            }
        }
        scene.textures.addSpriteSheet(key, canvas, { frameWidth: fw, frameHeight: fh });
    },

    // ===== EFFECTS =====
    _genVomitProjectile(scene) {
        // Bigger, chunkier vomit projectile 16x12
        const { canvas, ctx } = this.createCanvas(64, 12);
        for (let f = 0; f < 4; f++) {
            const x = f * 16;
            // Main blob
            ctx.fillStyle = PAL.vomit2;
            ctx.fillRect(x+3, 3, 10, 6);
            ctx.fillRect(x+5, 1, 6, 10);
            // Darker inner
            ctx.fillStyle = PAL.vomitDark;
            ctx.fillRect(x+6, 4, 4, 4);
            // Light highlights
            ctx.fillStyle = PAL.vomit3;
            ctx.fillRect(x+4, 2+f%2, 3, 2);
            ctx.fillRect(x+10, 5-f%2, 2, 2);
            // Chunks/bits flying off
            ctx.fillStyle = PAL.vomit1;
            ctx.fillRect(x+1+(f%3), 2+f%2, 2, 2);
            ctx.fillRect(x+12-(f%2), 7+f%2, 2, 1);
            ctx.fillRect(x+2, 8-f%2, 1, 2);
            // Drip trail
            ctx.fillStyle = PAL.vomit2;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x+1, 5, 2, 1);
            ctx.fillRect(x+0, 6+f%2, 1, 1);
            ctx.globalAlpha = 1;
        }
        scene.textures.addSpriteSheet('vomit', canvas, { frameWidth: 16, frameHeight: 12 });
    },

    _genVomitSplash(scene) {
        // Big splash with chunks
        const { canvas, ctx } = this.createCanvas(80, 20);
        for (let f = 0; f < 4; f++) {
            const x = f * 20, r = 4 + f * 2;
            // Main splat
            ctx.fillStyle = PAL.vomit2;
            ctx.beginPath();
            ctx.arc(x+10, 10, r, 0, Math.PI*2);
            ctx.fill();
            // Inner darker
            ctx.fillStyle = PAL.vomitDark;
            ctx.beginPath();
            ctx.arc(x+10, 10, r*0.5, 0, Math.PI*2);
            ctx.fill();
            // Flying chunks
            ctx.fillStyle = PAL.vomit3;
            for (let i = 0; i < 6; i++) {
                const a = (i/6)*Math.PI*2 + f*0.5;
                const pr = r * (1 + f*0.3);
                ctx.fillRect(x+10+Math.cos(a)*pr, 10+Math.sin(a)*pr, 2, 2);
            }
            // Drips downward
            ctx.fillStyle = PAL.vomit1;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x+8, 10+r, 1, 2+f);
            ctx.fillRect(x+12, 10+r-1, 1, 1+f);
            ctx.globalAlpha = 1;
        }
        scene.textures.addSpriteSheet('vomitsplash', canvas, { frameWidth: 20, frameHeight: 20 });
    },

    // Enemy-specific projectiles
    _genEnemyBullets(scene) {
        // PHP logo for Billy (purple)
        this._genTextBullet(scene, 'bullet_php', '<?php', '#7A86B8', '#4F5B93');
        // Java for Magalie (orange)
        this._genTextBullet(scene, 'bullet_java', 'Java', '#f89820', '#5382a1');
        // Linux penguin for Philippe (black/white)
        this._genLinuxBullet(scene);
        // Rejection email for Victoria (red)
        this._genMailBullet(scene);
    },

    _genTextBullet(scene, key, text, color, bgColor) {
        const { canvas, ctx } = this.createCanvas(32, 12);
        // Background pill
        ctx.fillStyle = bgColor;
        ctx.fillRect(2, 1, 28, 10);
        ctx.fillRect(1, 2, 30, 8);
        // Text
        ctx.fillStyle = color;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(text, 4, 9);
        scene.textures.addCanvas(key, canvas);
    },

    _genLinuxBullet(scene) {
        const { canvas, ctx } = this.createCanvas(16, 16);
        // Tux-like penguin mini sprite
        const _ = 0, B = '#111', W = '#eee', Y = '#ffaa00';
        const grid = [
            [_,_,_,_,_,B,B,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,B,W,W,B,_,_,_,_,_,_,_,_],
            [_,_,_,B,W,B,B,W,B,_,_,_,_,_,_,_],
            [_,_,_,B,W,W,W,W,B,_,_,_,_,_,_,_],
            [_,_,_,_,B,Y,Y,B,_,_,_,_,_,_,_,_],
            [_,_,_,B,B,B,B,B,B,_,_,_,_,_,_,_],
            [_,_,B,W,W,B,B,W,W,B,_,_,_,_,_,_],
            [_,_,B,W,W,B,B,W,W,B,_,_,_,_,_,_],
            [_,_,_,B,B,B,B,B,B,_,_,_,_,_,_,_],
            [_,_,_,_,B,Y,Y,B,_,_,_,_,_,_,_,_],
            [_,_,_,B,Y,_,_,Y,B,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ];
        this.drawGrid(ctx, grid, 0, 0);
        scene.textures.addCanvas('bullet_linux', canvas);
    },

    _genMailBullet(scene) {
        const { canvas, ctx } = this.createCanvas(24, 16);
        // Envelope with red X
        ctx.fillStyle = '#ddd';
        ctx.fillRect(2, 3, 20, 12);
        ctx.fillStyle = '#bbb';
        ctx.fillRect(2, 3, 20, 1);
        // Envelope flap
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(2, 3);
        ctx.lineTo(12, 9);
        ctx.lineTo(22, 3);
        ctx.fill();
        // Red X stamp (rejection)
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, 6);
        ctx.lineTo(18, 14);
        ctx.moveTo(18, 6);
        ctx.lineTo(6, 14);
        ctx.stroke();
        scene.textures.addCanvas('bullet_mail', canvas);
    },

    _genStarsKO(scene) {
        const { canvas, ctx } = this.createCanvas(64, 16);
        for (let f = 0; f < 4; f++) {
            const x = f * 16;
            ctx.fillStyle = PAL.gold;
            for (let i = 0; i < 3; i++) {
                const a = (i/3)*Math.PI*2 + f*0.8;
                ctx.fillRect(x+8+Math.cos(a)*5, 5+Math.sin(a)*4, 3, 3);
            }
        }
        scene.textures.addSpriteSheet('starsKO', canvas, { frameWidth: 16, frameHeight: 16 });
    },

    _genDeathPoof(scene) {
        const { canvas, ctx } = this.createCanvas(96, 24);
        for (let f = 0; f < 4; f++) {
            const x = f * 24, r = 4 + f * 3;
            ctx.globalAlpha = 1 - f * 0.25;
            ctx.fillStyle = PAL.vomit2;
            ctx.beginPath();
            ctx.arc(x+12, 12, r, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = PAL.vomitDark;
            ctx.beginPath();
            ctx.arc(x+12, 12, r*0.5, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        scene.textures.addSpriteSheet('deathpoof', canvas, { frameWidth: 24, frameHeight: 24 });
    },

    // ===== OBJECTS =====
    generateObjects(scene) {
        this._genTrashcan(scene);
        this._genCar(scene);
        this._genPoster(scene);
        this._genBubble(scene);
        this._genFireBarrel(scene);
        this._genMissingPoster(scene);
    },

    _genTrashcan(scene) {
        const { canvas, ctx } = this.createCanvas(16, 16);
        const _ = 0, T = PAL.trash, TD = PAL.trashDark;
        const grid = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,TD,TD,TD,TD,TD,TD,_,_,_,_,_],
            [_,_,_,_,TD,T,T,T,T,T,T,TD,_,_,_,_],
            [_,_,_,_,TD,T,T,T,T,T,T,TD,_,_,_,_],
            [_,_,_,TD,T,T,T,T,T,T,T,T,TD,_,_,_],
            [_,_,_,TD,T,T,T,T,T,T,T,T,TD,_,_,_],
            [_,_,_,TD,T,TD,T,T,T,TD,T,T,TD,_,_,_],
            [_,_,_,TD,T,TD,T,T,T,TD,T,T,TD,_,_,_],
            [_,_,_,TD,T,T,T,T,T,T,T,T,TD,_,_,_],
            [_,_,_,TD,T,TD,T,T,T,TD,T,T,TD,_,_,_],
            [_,_,_,TD,T,TD,T,T,T,TD,T,T,TD,_,_,_],
            [_,_,_,TD,T,T,T,T,T,T,T,T,TD,_,_,_],
            [_,_,_,_,TD,TD,TD,TD,TD,TD,TD,TD,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ];
        this.drawGrid(ctx, grid, 0, 0);
        scene.textures.addCanvas('trashcan', canvas);
    },

    _genCar(scene) {
        // 32x16 car, 3 color variants
        const colors = [PAL.carRed, PAL.carBlue, PAL.carYellow];
        const { canvas, ctx } = this.createCanvas(32 * 3, 16);
        colors.forEach((col, ci) => {
            const x = ci * 32;
            ctx.fillStyle = PAL.carDark;
            ctx.fillRect(x+2, 8, 28, 6);
            ctx.fillStyle = col;
            ctx.fillRect(x+1, 4, 30, 8);
            ctx.fillRect(x+4, 2, 24, 4);
            // Windshield
            ctx.fillStyle = '#6688aa';
            ctx.fillRect(x+6, 3, 8, 3);
            ctx.fillRect(x+18, 3, 8, 3);
            // Wheels
            ctx.fillStyle = '#111';
            ctx.fillRect(x+4, 11, 5, 4);
            ctx.fillRect(x+23, 11, 5, 4);
            // Lights
            ctx.fillStyle = PAL.carLight;
            ctx.fillRect(x+29, 6, 2, 2);
            ctx.fillStyle = PAL.carTail;
            ctx.fillRect(x+1, 6, 2, 2);
        });
        scene.textures.addSpriteSheet('car', canvas, { frameWidth: 32, frameHeight: 16 });
    },

    _genPoster(scene) {
        // CV poster - neon frame, 16x24
        const { canvas, ctx } = this.createCanvas(64, 24);
        const neons = [PAL.neonPink, PAL.neonCyan, PAL.neonOrange, PAL.neonBlue];
        for (let i = 0; i < 4; i++) {
            const x = i * 16;
            ctx.fillStyle = PAL.brick1;
            ctx.fillRect(x, 0, 16, 24);
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(x+1, 1, 14, 22);
            ctx.fillStyle = neons[i];
            ctx.fillRect(x+1, 1, 14, 1);
            ctx.fillRect(x+1, 22, 14, 1);
            ctx.fillRect(x+1, 1, 1, 22);
            ctx.fillRect(x+14, 1, 1, 22);
            // "CV" text hint
            ctx.fillStyle = neons[i];
            ctx.fillRect(x+4, 8, 1, 5);
            ctx.fillRect(x+4, 8, 3, 1);
            ctx.fillRect(x+4, 12, 3, 1);
            ctx.fillRect(x+9, 8, 1, 3);
            ctx.fillRect(x+11, 8, 1, 3);
            ctx.fillRect(x+10, 11, 1, 2);
        }
        scene.textures.addSpriteSheet('poster', canvas, { frameWidth: 16, frameHeight: 24 });
    },

    _genBubble(scene) {
        const { canvas, ctx } = this.createCanvas(32, 16);
        ctx.fillStyle = PAL.white;
        ctx.fillRect(4, 0, 8, 12);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(5, 1, 6, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(7, 2, 2, 5);
        ctx.fillRect(7, 8, 2, 2);
        ctx.fillStyle = PAL.white;
        ctx.fillRect(20, 0, 8, 12);
        ctx.fillStyle = '#ffee44';
        ctx.fillRect(21, 1, 6, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(23, 2, 2, 5);
        ctx.fillRect(23, 8, 2, 2);
        scene.textures.addSpriteSheet('bubble', canvas, { frameWidth: 16, frameHeight: 16 });
    },

    _genFireBarrel(scene) {
        // 16x24 barrel with fire, 4 animation frames
        const { canvas, ctx } = this.createCanvas(64, 24);
        for (let f = 0; f < 4; f++) {
            const x = f * 16;
            const _ = 0, B = PAL.brown, BD = PAL.brownDark;
            // Barrel body
            ctx.fillStyle = BD;
            ctx.fillRect(x+3, 8, 10, 14);
            ctx.fillStyle = '#553311';
            ctx.fillRect(x+4, 9, 8, 12);
            ctx.fillStyle = BD;
            ctx.fillRect(x+3, 11, 10, 1);
            ctx.fillRect(x+3, 16, 10, 1);
            // Open top (dark inside)
            ctx.fillStyle = '#111';
            ctx.fillRect(x+4, 7, 8, 3);
            // Fire flames (animated)
            const flames = [
                () => { ctx.fillStyle='#ff6b35'; ctx.fillRect(x+5,2,6,6); ctx.fillStyle='#ffaa00'; ctx.fillRect(x+6,0,4,5); ctx.fillStyle='#ffe44d'; ctx.fillRect(x+7,1,2,3); },
                () => { ctx.fillStyle='#ff6b35'; ctx.fillRect(x+4,3,7,5); ctx.fillStyle='#ffaa00'; ctx.fillRect(x+5,1,5,5); ctx.fillStyle='#ffe44d'; ctx.fillRect(x+6,0,3,3); },
                () => { ctx.fillStyle='#ff6b35'; ctx.fillRect(x+5,2,6,6); ctx.fillStyle='#ffaa00'; ctx.fillRect(x+7,0,3,5); ctx.fillStyle='#ffe44d'; ctx.fillRect(x+7,1,2,2); ctx.fillStyle='#ff4444'; ctx.fillRect(x+5,1,2,3); },
                () => { ctx.fillStyle='#ff6b35'; ctx.fillRect(x+4,3,8,5); ctx.fillStyle='#ffaa00'; ctx.fillRect(x+6,1,4,5); ctx.fillStyle='#ffe44d'; ctx.fillRect(x+7,0,2,4); }
            ];
            flames[f]();
            // Embers/sparks
            ctx.fillStyle = '#ffee44';
            ctx.fillRect(x+3+f*2, f, 1, 1);
            ctx.fillRect(x+10-f, 1+f%2, 1, 1);
            // Glow at base
            ctx.fillStyle = 'rgba(255,100,30,0.15)';
            ctx.fillRect(x, 18, 16, 6);
        }
        scene.textures.addSpriteSheet('firebarrel', canvas, { frameWidth: 16, frameHeight: 24 });
    },

    _genMissingPoster(scene) {
        // 16x24 "missing/dead" poster on wall, 4 variants (one per person)
        const { canvas, ctx } = this.createCanvas(64, 24);
        const people = [
            { name: 'Virgile P.', color: '#6688aa' },
            { name: 'Luca P.', color: '#88aa66' },
            { name: 'Ayoub B.', color: '#aa8866' },
            { name: 'Damien D.', color: '#8866aa' }
        ];
        people.forEach((p, i) => {
            const x = i * 16;
            // Worn paper background
            ctx.fillStyle = '#ccbbaa';
            ctx.fillRect(x+1, 1, 14, 22);
            ctx.fillStyle = '#bbaa99';
            ctx.fillRect(x+1, 1, 14, 1);
            // "DISPARU" header
            ctx.fillStyle = '#880000';
            ctx.font = 'bold 5px monospace';
            ctx.fillText('DISPARU', x+2, 6);
            // Face silhouette
            ctx.fillStyle = p.color;
            ctx.fillRect(x+5, 8, 6, 6);
            ctx.fillRect(x+6, 7, 4, 1);
            // Eyes
            ctx.fillStyle = '#222';
            ctx.fillRect(x+6, 10, 1, 1);
            ctx.fillRect(x+9, 10, 1, 1);
            // Name
            ctx.fillStyle = '#333';
            ctx.font = '4px monospace';
            ctx.fillText(p.name, x+2, 18);
            // RIP cross or flower
            ctx.fillStyle = '#666';
            ctx.fillRect(x+7, 19, 2, 4);
            ctx.fillRect(x+6, 20, 4, 1);
        });
        scene.textures.addSpriteSheet('missing', canvas, { frameWidth: 16, frameHeight: 24 });
    },

    // ===== DECORATIONS =====
    generateDecorations(scene) {
        // Nothing extra needed, objects cover decorations
    },

    // ===== LIGHTS =====
    generateLightMask(scene) {
        const size = 256;
        const { canvas, ctx } = this.createCanvas(size, size);
        const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.4, 'rgba(0,0,0,0)');
        g.addColorStop(0.7, 'rgba(0,0,0,0.3)');
        g.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        scene.textures.addCanvas('lightmask', canvas);
    },

    generateSmallLight(scene) {
        const size = 128;
        const { canvas, ctx } = this.createCanvas(size, size);
        const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        g.addColorStop(0, 'rgba(255, 238, 170, 0.4)');
        g.addColorStop(0.5, 'rgba(255, 200, 100, 0.15)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        scene.textures.addCanvas('lampglow', canvas);
    }
};
