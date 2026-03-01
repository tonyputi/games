import { Container, Graphics, Text } from 'pixi.js';
import { ENEMY_SPEED, CHARACTERS } from './constants.js';
import { getTileSize, findPath, isWalkablePx } from './map.js';

const REPATH_INTERVAL = 0.55; // seconds between BFS recalculations

export class Enemy {
  constructor(characterKey) {
    this.char = CHARACTERS[characterKey];
    this.x = 0;
    this.y = 0;
    this.radius = 9;
    this.container = new Container();
    this._path = [];
    this._repathTimer = Math.random() * REPATH_INTERVAL; // stagger between enemies
    this._targetX = 0;
    this._targetY = 0;
    this._moving = false;
    this._buildSprite();
  }

  _buildSprite() {
    const g = new Graphics();
    const r = this.radius;

    // Shadow
    g.ellipse(0, r * 0.5, r * 0.8, r * 0.3).fill({ color: 0x000000, alpha: 0.2 });

    // Body
    g.circle(0, 0, r).fill(this.char.color);
    g.circle(0, 0, r).stroke({ color: 0xef4444, width: 1.5 });

    // ⚡ icon to mark as enemy
    const label = new Text({
      text: this.char.name[0],
      style: { fontFamily: 'Arial', fontSize: r * 1.0, fontWeight: 'bold', fill: '#ffffff' }
    });
    label.anchor.set(0.5);
    label.y = -1;

    this.container.addChild(g, label);
  }

  setPosition(col, row) {
    const ts = getTileSize();
    this.x = col * ts + ts / 2;
    this.y = row * ts + ts / 2;
    this._targetX = this.x;
    this._targetY = this.y;
    this.container.x = this.x;
    this.container.y = this.y;
  }

  update(dt, playerCol, playerRow, speedMultiplier = 1) {
    const ts = getTileSize();

    // Recalculate path periodically
    this._repathTimer -= dt;
    if (this._repathTimer <= 0) {
      this._repathTimer = REPATH_INTERVAL;
      const myCol = Math.floor(this.x / ts);
      const myRow = Math.floor(this.y / ts);
      this._path = findPath(myCol, myRow, playerCol, playerRow);
    }

    // Follow next step in path
    const speed = ENEMY_SPEED * speedMultiplier * dt;

    if (!this._moving && this._path.length > 0) {
      const [nc, nr] = this._path.shift();
      this._targetX = nc * ts + ts / 2;
      this._targetY = nr * ts + ts / 2;
      this._moving = true;
    }

    if (this._moving) {
      const dx = this._targetX - this.x;
      const dy = this._targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= speed + 0.5) {
        this.x = this._targetX;
        this.y = this._targetY;
        this._moving = false;
      } else {
        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
      }
    }

    this.container.x = this.x;
    this.container.y = this.y;
  }

  distanceTo(px, py) {
    const dx = this.x - px;
    const dy = this.y - py;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
