import { Container, Graphics, Text } from 'pixi.js';
import { FLOWER_POSITIONS, CHARACTERS } from './constants.js';

// ─── Flower sprite ─────────────────────────────────────────────────────────
export class Flower {
  constructor(col, row, tileSize) {
    this.col = col;
    this.row = row;
    this.collected = false;
    this.container = new Container();
    this._time = Math.random() * Math.PI * 2;

    const ts = tileSize;
    const cx = col * ts + ts / 2;
    const cy = row * ts + ts / 2;
    this.container.x = cx;
    this.container.y = cy;

    this._draw();
  }

  _draw() {
    const g = new Graphics();
    const r = 4.5;
    const petals = 5;

    // Petals
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      g.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, r * 0.9, r * 0.5).fill(0xfb7185);
    }
    // Center
    g.circle(0, 0, r * 0.55).fill(0xfde68a);

    this.container.addChild(g);
  }

  update(dt) {
    if (this.collected) return;
    this._time += dt * 2.5;
    this.container.y += Math.sin(this._time) * 0.15;
  }

  collect() {
    this.collected = true;
    this.container.visible = false;
  }

  distanceTo(px, py) {
    const dx = this.container.x - px;
    const dy = this.container.y - py;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// ─── HUD ────────────────────────────────────────────────────────────────────
export class HUD {
  constructor(screenW, screenH) {
    this.container = new Container();
    this._screenW = screenW;

    // Flower counter pill
    const pill = new Graphics();
    pill.roundRect(8, 8, 110, 36, 18).fill({ color: 0x000000, alpha: 0.45 });
    this._flowerText = new Text({
      text: '🌸 0/0',
      style: { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: '#ffffff' }
    });
    this._flowerText.x = 20;
    this._flowerText.y = 15;

    // Timer pill
    const tpill = new Graphics();
    tpill.roundRect(8, 50, 90, 32, 16).fill({ color: 0x000000, alpha: 0.35 });
    this._timerText = new Text({
      text: '⏱ 0:00',
      style: { fontFamily: 'Arial', fontSize: 14, fill: '#d1fae5' }
    });
    this._timerText.x = 18;
    this._timerText.y = 58;

    this.container.addChild(pill, this._flowerText, tpill, this._timerText);
    this.container.zIndex = 10;
  }

  update(collected, total, seconds) {
    this._flowerText.text = `🌸 ${collected}/${total}`;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this._timerText.text = `⏱ ${m}:${s.toString().padStart(2, '0')}`;
  }
}

// ─── Character Select Screen ──────────────────────────────────────────────
export class CharacterSelectScreen {
  constructor(screenW, screenH, onSelect) {
    this.container = new Container();
    this._screenW = screenW;
    this._screenH = screenH;

    // Dimmed background
    const bg = new Graphics();
    bg.rect(0, 0, screenW, screenH).fill({ color: 0x14532d, alpha: 0.97 });

    // Title
    const title = new Text({
      text: 'LaviRinto',
      style: { fontFamily: 'Arial', fontSize: 38, fontWeight: 'bold', fill: '#f0fdf4' }
    });
    title.anchor.set(0.5, 0);
    title.x = screenW / 2;
    title.y = screenH * 0.08;

    const sub = new Text({
      text: 'Giardino del Nonno',
      style: { fontFamily: 'Arial', fontSize: 15, fill: '#bbf7d0' }
    });
    sub.anchor.set(0.5, 0);
    sub.x = screenW / 2;
    sub.y = title.y + 50;

    this.container.addChild(bg, title, sub);

    // Character cards
    const chars = Object.entries(CHARACTERS);
    const cardW = Math.min(130, (screenW - 60) / chars.length);
    const cardH = cardW * 1.45;
    const totalW = chars.length * cardW + (chars.length - 1) * 16;
    const startX = (screenW - totalW) / 2;
    const cardY = screenH * 0.32;

    chars.forEach(([key, char], i) => {
      const card = this._makeCard(key, char, cardW, cardH, onSelect);
      card.x = startX + i * (cardW + 16);
      card.y = cardY;
      this.container.addChild(card);
    });

    // High score
    const hs = parseInt(localStorage.getItem('lavirinto_highscore') || '0');
    const hsText = new Text({
      text: `Record: ${hs} 🌸`,
      style: { fontFamily: 'Arial', fontSize: 14, fill: '#86efac' }
    });
    hsText.anchor.set(0.5, 0);
    hsText.x = screenW / 2;
    hsText.y = cardY + cardH + 30;
    this.container.addChild(hsText);
  }

  _makeCard(key, char, w, h, onSelect) {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 14).fill({ color: 0xffffff, alpha: 0.1 });
    bg.roundRect(0, 0, w, h, 14).stroke({ color: char.color, width: 2 });

    const circle = new Graphics();
    circle.circle(w / 2, h * 0.32, w * 0.28).fill(char.color);

    const initial = new Text({
      text: char.name[0],
      style: { fontFamily: 'Arial', fontSize: w * 0.22, fontWeight: 'bold', fill: '#ffffff' }
    });
    initial.anchor.set(0.5);
    initial.x = w / 2;
    initial.y = h * 0.32;

    const name = new Text({
      text: char.name,
      style: { fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fill: '#ffffff' }
    });
    name.anchor.set(0.5, 0);
    name.x = w / 2;
    name.y = h * 0.62;

    const role = new Text({
      text: char.label,
      style: { fontFamily: 'Arial', fontSize: 11, fill: '#bbf7d0' }
    });
    role.anchor.set(0.5, 0);
    role.x = w / 2;
    role.y = h * 0.78;

    card.addChild(bg, circle, initial, name, role);

    card.on('pointerdown', () => {
      card.scale.set(0.95);
      setTimeout(() => { card.scale.set(1); onSelect(key); }, 120);
    });
    card.on('pointerover', () => { bg.clear().roundRect(0,0,w,h,14).fill({color:0xffffff,alpha:0.2}).roundRect(0,0,w,h,14).stroke({color:char.color,width:2}); });
    card.on('pointerout',  () => { bg.clear().roundRect(0,0,w,h,14).fill({color:0xffffff,alpha:0.1}).roundRect(0,0,w,h,14).stroke({color:char.color,width:2}); });

    return card;
  }
}

// ─── Game Over Screen ─────────────────────────────────────────────────────
export class GameOverScreen {
  constructor(screenW, screenH, { victory, flowers, total, seconds, onRestart, onMenu }) {
    this.container = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.72 });

    const panel = new Graphics();
    const pw = Math.min(320, screenW - 40);
    const ph = 280;
    const px = (screenW - pw) / 2;
    const py = (screenH - ph) / 2;
    panel.roundRect(px, py, pw, ph, 20).fill({ color: victory ? 0x14532d : 0x7f1d1d, alpha: 0.95 });

    const title = new Text({
      text: victory ? '🎉 Vittoria!' : '😢 Catturata!',
      style: { fontFamily: 'Arial', fontSize: 30, fontWeight: 'bold', fill: '#ffffff' }
    });
    title.anchor.set(0.5, 0);
    title.x = screenW / 2;
    title.y = py + 28;

    const flowText = new Text({
      text: `🌸 Fiori: ${flowers}/${total}`,
      style: { fontFamily: 'Arial', fontSize: 20, fill: '#bbf7d0' }
    });
    flowText.anchor.set(0.5, 0);
    flowText.x = screenW / 2;
    flowText.y = py + 85;

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const timeText = new Text({
      text: `⏱ Tempo: ${m}:${s.toString().padStart(2,'0')}`,
      style: { fontFamily: 'Arial', fontSize: 16, fill: '#d1fae5' }
    });
    timeText.anchor.set(0.5, 0);
    timeText.x = screenW / 2;
    timeText.y = py + 120;

    const hs = Math.max(parseInt(localStorage.getItem('lavirinto_highscore') || '0'), flowers);
    if (victory || flowers > 0) localStorage.setItem('lavirinto_highscore', hs);
    const hsText = new Text({
      text: `Record: ${hs} 🌸`,
      style: { fontFamily: 'Arial', fontSize: 14, fill: '#fde68a' }
    });
    hsText.anchor.set(0.5, 0);
    hsText.x = screenW / 2;
    hsText.y = py + 152;

    // Buttons
    const btnY = py + ph - 68;
    const btn1 = this._makeBtn('RIPROVA', 0x15803d, screenW/2 - 82, btnY, 76, onRestart);
    const btn2 = this._makeBtn('MENU',    0x374151, screenW/2 + 6,  btnY, 76, onMenu);

    this.container.addChild(bg, panel, title, flowText, timeText, hsText, btn1, btn2);
  }

  _makeBtn(label, color, x, y, w, cb) {
    const c = new Container();
    c.eventMode = 'static';
    c.cursor = 'pointer';
    const g = new Graphics();
    g.roundRect(0, 0, w, 44, 12).fill(color);
    const t = new Text({ text: label, style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff' } });
    t.anchor.set(0.5);
    t.x = w / 2;
    t.y = 22;
    c.addChild(g, t);
    c.x = x;
    c.y = y;
    c.on('pointerdown', cb);
    return c;
  }
}
