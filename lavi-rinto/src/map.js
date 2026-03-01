import { Container, Graphics } from 'pixi.js';
import { T, TILE_COLOR, MAP_DATA, MAP_COLS, MAP_ROWS, WALKABLE } from './constants.js';

export class MapRenderer {
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.container = new Container();
    this._seaGraphics = null;
    this._seaTime = 0;
    this._build();
  }

  _build() {
    const ts = this.tileSize;

    // Pre-build one Graphics for static tiles, one for sea (animated)
    const staticGfx = new Graphics();
    this._seaGraphics = new Graphics();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = MAP_DATA[row][col];
        const x = col * ts;
        const y = row * ts;

        if (tile === T.SEA) {
          // Sea tiles drawn in animated layer
          this._seaGraphics.rect(x, y, ts, ts).fill(TILE_COLOR[T.SEA]);
        } else if (tile === T.TREE) {
          // Draw grass base, then dark green circle on top
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[T.GRASS]);
          const r = ts * 0.42;
          staticGfx.circle(x + ts / 2, y + ts / 2, r).fill(TILE_COLOR[T.TREE]);
          // Highlight dot
          staticGfx.circle(x + ts * 0.38, y + ts * 0.35, r * 0.25).fill(0x22c55e);
        } else if (tile === T.POOL) {
          // Solid pool tile
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[T.POOL]);
          // Inner lighter area
          const pad = ts * 0.15;
          staticGfx.rect(x + pad, y + pad, ts - pad * 2, ts - pad * 2).fill(0xbae6fd);
        } else if (tile === T.HOUSE) {
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[T.HOUSE]);
          // Subtle wall outline inside tile
          staticGfx.rect(x, y, ts, ts).stroke({ color: 0xe2d9c8, width: 0.5 });
        } else if (tile === T.HEDGE) {
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[T.HEDGE]);
          // Darker inner circle to mimic dense hedge
          staticGfx.rect(x + 1, y + 1, ts - 2, ts - 2).fill(0x14532d);
        } else if (tile === T.GRASS) {
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[T.GRASS]);
          // Subtle variation: slightly darker inner quad for depth
          if ((col + row) % 2 === 0) {
            staticGfx.rect(x, y, ts, ts).fill({ color: 0x000000, alpha: 0.03 });
          }
        } else if (tile === T.ROAD) {
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[T.ROAD]);
          // Road center line (just top road rows)
          if (row <= 1 && col % 3 === 1) {
            staticGfx.rect(x + ts * 0.4, y + ts * 0.2, ts * 0.2, ts * 0.6).fill(0xfbbf24);
          }
        } else if (tile === T.SAND) {
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[T.SAND]);
          // Sandy texture dots
          if ((col * 7 + row * 3) % 5 === 0) {
            staticGfx.circle(x + ts * 0.3, y + ts * 0.4, ts * 0.08).fill(0xfbbf24);
          }
        } else {
          // PATH, PAVING, ROAD (fallback)
          staticGfx.rect(x, y, ts, ts).fill(TILE_COLOR[tile] ?? 0xcccccc);
        }
      }
    }

    // House details: windows and door (drawn after base tiles)
    this._drawHouseDetails(staticGfx);

    // Pool label / shimmer line
    this._drawPoolDetails(staticGfx);

    // Spiaggia/mare boundary wave line
    const waveY = 37 * ts;
    staticGfx.rect(0, waveY, MAP_COLS * ts, 2).fill({ color: 0x0ea5e9, alpha: 0.6 });

    this.container.addChild(staticGfx);
    this.container.addChild(this._seaGraphics);
  }

  _drawHouseDetails(g) {
    const ts = this.tileSize;
    // House spans rows 10-19, cols 6-13
    const houseX = 6 * ts;
    const houseY = 10 * ts;
    const houseW = 8 * ts;
    const houseH = 10 * ts;

    // Outer wall border
    g.rect(houseX, houseY, houseW, houseH).stroke({ color: 0xd4b89a, width: 1.5 });

    // Windows - visible from top (horizontal slits)
    const winColor = 0x7dd3fc;
    const winH = Math.max(2, ts * 0.15);
    const winW = ts * 0.6;
    // Top row of windows
    for (let c = 0; c < 3; c++) {
      const wx = houseX + ts * 0.7 + c * ts * 2.5;
      const wy = houseY + ts * 0.5;
      if (wx + winW < houseX + houseW - ts * 0.3) {
        g.rect(wx, wy, winW, winH).fill(winColor);
      }
    }
    // Bottom row of windows
    for (let c = 0; c < 3; c++) {
      const wx = houseX + ts * 0.7 + c * ts * 2.5;
      const wy = houseY + houseH - ts * 0.7;
      if (wx + winW < houseX + houseW - ts * 0.3) {
        g.rect(wx, wy, winW, winH).fill(winColor);
      }
    }

    // Roof ridge line (center horizontal)
    g.rect(houseX + ts * 0.5, houseY + houseH / 2 - 1, houseW - ts, 2).fill(0xd4b89a);
  }

  _drawPoolDetails(g) {
    const ts = this.tileSize;
    // Pool area rows 4-6, cols 14-17 → draw a shimmer line
    const px = 14 * ts + ts * 0.1;
    const py = 4 * ts + ts * 0.15;
    const pw = 4 * ts - ts * 0.2;
    const ph = 3 * ts - ts * 0.3;
    g.rect(px, py, pw, ph).stroke({ color: 0x0ea5e9, width: 1 });
    // Pool label "PISCINA"
    // (text drawn in UI, here just decorative lines)
    g.rect(px + pw * 0.1, py + ph * 0.35, pw * 0.8, 1).fill({ color: 0xffffff, alpha: 0.4 });
    g.rect(px + pw * 0.1, py + ph * 0.65, pw * 0.8, 1).fill({ color: 0xffffff, alpha: 0.4 });
  }

  // Animate sea tiles (wave effect)
  update(dt) {
    this._seaTime += dt;
    const alpha = 0.85 + Math.sin(this._seaTime * 2) * 0.15;
    this._seaGraphics.alpha = alpha;
  }

  // Returns true if tile at (col, row) is walkable
  static isWalkable(col, row) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
    return WALKABLE.has(MAP_DATA[row][col]);
  }

  // Pixel-level walkability check (centered on entity radius)
  static canMoveTo(px, py, radius) {
    const points = [
      [px - radius, py - radius],
      [px + radius, py - radius],
      [px - radius, py + radius],
      [px + radius, py + radius],
    ];
    return points.every(([x, y]) => MapRenderer.isWalkable(
      Math.floor(x / _tileSize), Math.floor(y / _tileSize)
    ));
  }

  get pixelWidth()  { return MAP_COLS * this.tileSize; }
  get pixelHeight() { return MAP_ROWS * this.tileSize; }
}

// Module-level tile size (set once by Game)
let _tileSize = 32;
export function setTileSize(ts) { _tileSize = ts; }
export function getTileSize()   { return _tileSize; }

// Standalone walkability helpers used by Player and Enemy
export function isWalkablePx(px, py, radius = 0) {
  if (radius === 0) {
    const col = Math.floor(px / _tileSize);
    const row = Math.floor(py / _tileSize);
    return MapRenderer.isWalkable(col, row);
  }
  const r = radius - 1; // 1px tolerance
  return (
    MapRenderer.isWalkable(Math.floor((px - r) / _tileSize), Math.floor((py - r) / _tileSize)) &&
    MapRenderer.isWalkable(Math.floor((px + r) / _tileSize), Math.floor((py - r) / _tileSize)) &&
    MapRenderer.isWalkable(Math.floor((px - r) / _tileSize), Math.floor((py + r) / _tileSize)) &&
    MapRenderer.isWalkable(Math.floor((px + r) / _tileSize), Math.floor((py + r) / _tileSize))
  );
}

// BFS pathfinding (returns array of [col,row] steps)
export function findPath(startCol, startRow, endCol, endRow) {
  const key = (c, r) => `${c},${r}`;
  const queue = [{ c: startCol, r: startRow, path: [] }];
  const visited = new Set([key(startCol, startRow)]);

  while (queue.length > 0) {
    const { c, r, path } = queue.shift();
    if (c === endCol && r === endRow) return path;

    const next = [[c-1,r],[c+1,r],[c,r-1],[c,r+1]];
    for (const [nc, nr] of next) {
      const k = key(nc, nr);
      if (!visited.has(k) && MapRenderer.isWalkable(nc, nr)) {
        visited.add(k);
        queue.push({ c: nc, r: nr, path: [...path, [nc, nr]] });
      }
    }
  }
  return [];
}
