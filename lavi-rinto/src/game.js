import { Container } from 'pixi.js';
import { MAP_COLS, MAP_ROWS, FLOWER_POSITIONS, CATCH_RADIUS } from './constants.js';
import { MapRenderer, setTileSize, getTileSize } from './map.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { VirtualJoystick } from './joystick.js';
import { Flower, HUD, CharacterSelectScreen, GameOverScreen } from './ui.js';

const STATE = { SELECT: 'select', PLAYING: 'playing', GAMEOVER: 'gameover' };

// Keyboard input
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup',   e => { keys[e.code] = false; });

function getKeyDir() {
  return {
    x: (keys['ArrowRight'] || keys['KeyD'] ? 1 : 0) - (keys['ArrowLeft'] || keys['KeyA'] ? 1 : 0),
    y: (keys['ArrowDown']  || keys['KeyS'] ? 1 : 0) - (keys['ArrowUp']   || keys['KeyW'] ? 1 : 0),
  };
}

export class Game {
  constructor(app) {
    this.app = app;
    this.root = new Container();
    app.stage.addChild(this.root);

    this._state = STATE.SELECT;
    this._screenW = app.screen.width;
    this._screenH = app.screen.height;

    // Compute tile size to fit map in screen
    this._tileSize = Math.floor(Math.min(
      this._screenW / MAP_COLS,
      this._screenH / MAP_ROWS
    ));
    setTileSize(this._tileSize);

    // Map pixel offset (center in screen)
    this._mapOffX = Math.floor((this._screenW - MAP_COLS * this._tileSize) / 2);
    this._mapOffY = Math.floor((this._screenH - MAP_ROWS * this._tileSize) / 2);

    this._elapsed = 0;
    this._difficultyMult = 1;

    this._showSelect();
  }

  // ─── Screens ───────────────────────────────────────────────────────────────

  _showSelect() {
    this._state = STATE.SELECT;
    this.root.removeChildren();

    const screen = new CharacterSelectScreen(
      this._screenW, this._screenH,
      (key) => this._startGame(key)
    );
    this.root.addChild(screen.container);
    this._selectScreen = screen;
  }

  _startGame(characterKey) {
    this._state = STATE.PLAYING;
    this.root.removeChildren();
    this._elapsed = 0;
    this._flowersCollected = 0;

    const ts = this._tileSize;

    // ── World container (contains map + entities) ──
    this._world = new Container();
    this._world.x = this._mapOffX;
    this._world.y = this._mapOffY;

    // Map
    this._map = new MapRenderer(ts);
    this._world.addChild(this._map.container);

    // Flowers
    this._flowers = FLOWER_POSITIONS.map(({ col, row }) => {
      const f = new Flower(col, row, ts);
      this._world.addChild(f.container);
      return f;
    });

    // Player
    this._player = new Player(characterKey);
    this._player.setPosition(9, 4); // top garden, near gate
    this._world.addChild(this._player.container);

    // Enemies (other two characters)
    const allChars = ['lavinia', 'jacopo', 'sofia'];
    const enemyKeys = allChars.filter(k => k !== characterKey);
    this._enemies = [
      this._spawnEnemy(enemyKeys[0], 5, 28),
      this._spawnEnemy(enemyKeys[1], 15, 28),
    ];

    // ── HUD & Joystick (screen-space, not in world) ──
    this._hud = new HUD(this._screenW, this._screenH);
    this._joystick = new VirtualJoystick(this._screenW, this._screenH);

    this.root.addChild(this._world);
    this.root.addChild(this._hud.container);
    this.root.addChild(this._joystick.container);

    this._hud.update(0, this._flowers.length, 0);
  }

  _spawnEnemy(key, col, row) {
    const e = new Enemy(key);
    e.setPosition(col, row);
    this._world.addChild(e.container);
    return e;
  }

  _showGameOver(victory) {
    this._state = STATE.GAMEOVER;
    if (this._joystick) this._joystick.destroy();

    const screen = new GameOverScreen(this._screenW, this._screenH, {
      victory,
      flowers: this._flowersCollected,
      total:   this._flowers.length,
      seconds: this._elapsed,
      onRestart: () => this._startGame(this._player.characterKey),
      onMenu:    () => this._showSelect(),
    });

    this.root.addChild(screen.container);
  }

  // ─── Update loop ───────────────────────────────────────────────────────────

  update(dt) {
    if (this._state !== STATE.PLAYING) return;
    this._elapsed += dt;

    // Player movement
    this._player.update(dt, this._joystick.dir, getKeyDir());

    // Enemy AI (speed ramps up every 30s)
    const speedMult = 1 + Math.floor(this._elapsed / 30) * 0.15;
    const pc = this._player.col;
    const pr = this._player.row;
    this._enemies.forEach(e => e.update(dt, pc, pr, speedMult));

    // Flower collection
    this._flowers.forEach(f => {
      f.update(dt);
      if (!f.collected && f.distanceTo(this._player.x, this._player.y) < getTileSize() * 0.65) {
        f.collect();
        this._flowersCollected++;
        this._hud.update(this._flowersCollected, this._flowers.length, this._elapsed);
      }
    });

    // Win check
    if (this._flowersCollected >= this._flowers.length) {
      this._showGameOver(true);
      return;
    }

    // Catch check
    for (const e of this._enemies) {
      if (e.distanceTo(this._player.x, this._player.y) < CATCH_RADIUS + this._player.radius + e.radius) {
        this._showGameOver(false);
        return;
      }
    }

    // Animate map
    this._map.update(dt);
    this._hud.update(this._flowersCollected, this._flowers.length, this._elapsed);

    // Camera: follow player vertically if map taller than screen
    this._updateCamera();
  }

  _updateCamera() {
    const mapH = MAP_ROWS * this._tileSize;
    if (mapH <= this._screenH) return; // no scroll needed

    const targetY = this._screenH / 2 - this._player.y;
    const minY = this._screenH - mapH;
    const clampedY = Math.max(minY, Math.min(0, targetY));
    // Smooth follow
    this._world.y += (this._mapOffY + clampedY - this._world.y) * 0.12;
  }

  // ─── Resize ────────────────────────────────────────────────────────────────

  resize(w, h) {
    this._screenW = w;
    this._screenH = h;
    if (this._joystick) this._joystick.resize(w, h);
  }
}
