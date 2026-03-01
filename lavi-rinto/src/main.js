import { Application } from 'pixi.js';
import { Game } from './game.js';

const app = new Application();

await app.init({
  width:           window.innerWidth,
  height:          window.innerHeight,
  background:      0x0a1a0a,
  resolution:      Math.min(window.devicePixelRatio || 1, 2),
  autoDensity:     true,
  antialias:       false,
  powerPreference: 'high-performance',
});

document.body.appendChild(app.canvas);

const game = new Game(app);

app.ticker.add(ticker => {
  const dt = ticker.deltaMS / 1000; // seconds
  game.update(Math.min(dt, 0.05));  // cap at 50ms to avoid spiral of death
});

// Handle resize
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  app.renderer.resize(w, h);
  game.resize(w, h);
});
