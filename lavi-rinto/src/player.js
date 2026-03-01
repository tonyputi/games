import { Container, Graphics, Text } from 'pixi.js';
import { PLAYER_SPEED, PLAYER_RADIUS, CHARACTERS } from './constants.js';
import { isWalkablePx, getTileSize } from './map.js';

export class Player {
  constructor(characterKey, photoTexture = null) {
    this.characterKey = characterKey;
    this.char = CHARACTERS[characterKey];
    this.photoTexture = photoTexture;
    this.x = 0;
    this.y = 0;
    this.radius = PLAYER_RADIUS;
    this.container = new Container();
    this._buildSprite();
  }

  _buildSprite() {
    this.container.removeChildren();

    const g = new Graphics();
    const r = this.radius;

    // Shadow
    g.ellipse(0, r * 0.5, r * 0.8, r * 0.3).fill({ color: 0x000000, alpha: 0.25 });

    // Body circle
    g.circle(0, 0, r).fill(this.char.color);
    g.circle(0, 0, r).stroke({ color: 0xffffff, width: 1.5 });

    // Initial letter
    const label = new Text({
      text: this.char.name[0],
      style: { fontFamily: 'Arial', fontSize: r * 1.1, fontWeight: 'bold', fill: '#ffffff' }
    });
    label.anchor.set(0.5);
    label.y = -1;

    this.container.addChild(g, label);
  }

  setPosition(col, row) {
    const ts = getTileSize();
    this.x = col * ts + ts / 2;
    this.y = row * ts + ts / 2;
    this.container.x = this.x;
    this.container.y = this.y;
  }

  update(dt, joystickDir, keyDir) {
    // Merge joystick + keyboard directions
    let dx = joystickDir.x + keyDir.x;
    let dy = joystickDir.y + keyDir.y;

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) { dx /= len; dy /= len; }

    const speed = PLAYER_SPEED * dt;
    const r = this.radius;

    // Try X movement
    const nx = this.x + dx * speed;
    if (isWalkablePx(nx, this.y, r)) {
      this.x = nx;
    }

    // Try Y movement
    const ny = this.y + dy * speed;
    if (isWalkablePx(this.x, ny, r)) {
      this.y = ny;
    }

    this.container.x = this.x;
    this.container.y = this.y;

    // Squish animation when moving
    if (len > 0.1) {
      const squish = 1 + Math.sin(Date.now() * 0.015) * 0.06;
      this.container.scale.set(squish, 2 - squish);
    } else {
      this.container.scale.set(1, 1);
    }
  }

  get col() { return Math.floor(this.x / getTileSize()); }
  get row() { return Math.floor(this.y / getTileSize()); }
}
