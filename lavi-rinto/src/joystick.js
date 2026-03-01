import { Container, Graphics } from 'pixi.js';

const OUTER_RADIUS = 48;
const INNER_RADIUS = 22;
const DEAD_ZONE    = 6;

export class VirtualJoystick {
  constructor(screenW, screenH) {
    this.container = new Container();
    this.dir = { x: 0, y: 0 };
    this._active = false;
    this._touchId = null;
    this._baseX = screenW / 2;
    this._baseY = screenH - OUTER_RADIUS - 20;

    this._outer = new Graphics();
    this._inner = new Graphics();

    this._outer
      .circle(0, 0, OUTER_RADIUS)
      .fill({ color: 0xffffff, alpha: 0.15 })
      .stroke({ color: 0xffffff, width: 2, alpha: 0.35 });

    this._inner
      .circle(0, 0, INNER_RADIUS)
      .fill({ color: 0xffffff, alpha: 0.5 });

    this.container.addChild(this._outer, this._inner);
    this.container.x = this._baseX;
    this.container.y = this._baseY;
    this.container.alpha = 0.7;
    this.container.eventMode = 'none';

    this._setupListeners();
  }

  _setupListeners() {
    window.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove',  this._onTouchMove.bind(this),  { passive: false });
    window.addEventListener('touchend',   this._onTouchEnd.bind(this),   { passive: false });
    window.addEventListener('touchcancel',this._onTouchEnd.bind(this),   { passive: false });
  }

  _onTouchStart(e) {
    if (this._touchId !== null) return;
    const t = e.changedTouches[0];
    this._touchId = t.identifier;
    this._active = true;
    this._update(t.clientX, t.clientY);
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this._touchId) {
        this._update(t.clientX, t.clientY);
        return;
      }
    }
  }

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this._touchId) {
        this._reset();
        return;
      }
    }
  }

  _update(clientX, clientY) {
    const dx = clientX - this._baseX;
    const dy = clientY - this._baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, OUTER_RADIUS - INNER_RADIUS);

    const nx = dist > DEAD_ZONE ? (dx / dist) * clamped : 0;
    const ny = dist > DEAD_ZONE ? (dy / dist) * clamped : 0;

    this._inner.x = nx;
    this._inner.y = ny;

    this.dir.x = dist > DEAD_ZONE ? dx / dist : 0;
    this.dir.y = dist > DEAD_ZONE ? dy / dist : 0;
  }

  _reset() {
    this._touchId = null;
    this._active = false;
    this._inner.x = 0;
    this._inner.y = 0;
    this.dir.x = 0;
    this.dir.y = 0;
  }

  destroy() {
    window.removeEventListener('touchstart', this._onTouchStart.bind(this));
    window.removeEventListener('touchmove',  this._onTouchMove.bind(this));
    window.removeEventListener('touchend',   this._onTouchEnd.bind(this));
    window.removeEventListener('touchcancel',this._onTouchEnd.bind(this));
  }

  resize(screenW, screenH) {
    this._baseX = screenW / 2;
    this._baseY = screenH - OUTER_RADIUS - 20;
    this.container.x = this._baseX;
    this.container.y = this._baseY;
  }
}
