// ─── Tile IDs ───────────────────────────────────────────────────────────────
export const T = {
  ROAD:   0,
  GRASS:  1,
  HEDGE:  2,
  HOUSE:  3,
  PATH:   4,  // vialetto (walkable)
  POOL:   5,
  SAND:   6,
  SEA:    7,
  PAVING: 8,  // veranda / selciato (walkable)
  TREE:   9,  // drawn as circle on top of grass (obstacle)
};

// ROAD è decorativo — non walkable, per impedire ai nemici di aggirare le siepi
export const WALKABLE = new Set([T.GRASS, T.PATH, T.SAND, T.PAVING]);

export const TILE_COLOR = {
  [T.ROAD]:   0x9ca3af,
  [T.GRASS]:  0x86efac,
  [T.HEDGE]:  0x166534,
  [T.HOUSE]:  0xfdfcfb,
  [T.PATH]:   0xc8a96e,
  [T.POOL]:   0x7dd3fc,
  [T.SAND]:   0xfde68a,
  [T.SEA]:    0x38bdf8,
  [T.PAVING]: 0xe8e0d5,
  [T.TREE]:   0x14532d,
};

// ─── Map data (20 cols × 42 rows) ────────────────────────────────────────────
// R=road G=grass H=hedge W=house P=path(vialetto) L=pool S=sand M=sea V=paving TR=tree
const { ROAD: R, GRASS: G, HEDGE: H, HOUSE: W, PATH: P,
        POOL: L, SAND: S, SEA: M, PAVING: V, TREE: TR } = T;

export const MAP_DATA = [
//    0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19
  [ R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R], // 0  Via Londra
  [ R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R], // 1  Via Londra
  [ R,  H,  H,  H,  H,  H,  H,  H,  H,  P,  P,  H,  H,  H,  H,  H,  H,  H,  H,  R], // 2  cancello ingresso
  [ R,  G,TR,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G, TR,  G,  R], // 3  giardino top
  [ R,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  L,  L,  L,  L,  G,  R], // 4  giardino + piscina
  [ R,  G, TR,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  L,  L,  L,  L,  G,  R], // 5  piscina
  [ R,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  L,  L,  L,  L,  G,  R], // 6  piscina
  [ R,  G,  G,  G, TR,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  R], // 7  giardino
  [ R,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G, TR,  G,  G,  R], // 8  giardino
  [ R,  G,  G,  H,  G,  G,  H,  H,  H,  H,  H,  H,  H,  H,  G,  G,  H,  G,  G,  R], // 9  siepe esterna casa (aperture ai vialetti)
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 10 vialetti + muro casa
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 11
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 12
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 13
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 14
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 15
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 16
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 17
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 18
  [ R,  G,  G,  H,  P,  P,  W,  W,  W,  W,  W,  W,  W,  W,  P,  P,  H,  G,  G,  R], // 19
  [ R,  G,  G,  H,  G,  G,  H,  H,  H,  H,  H,  H,  H,  H,  G,  G,  H,  G,  G,  R], // 20 siepe esterna bassa
  [ R,  G,  G,  G,  V,  V,  V,  V,  V,  V,  H,  H,  H,  H,  V,  V,  G,  G,  G,  R], // 21 veranda sx + gazebo muri
  [ R,  G,  G,  G,  V,  V,  V,  V,  V,  V,  H,  W,  W,  H,  V,  V,  G,  G,  G,  R], // 22 gazebo interno
  [ R,  G,  G,  G,  V,  V,  V,  V,  V,  V,  H,  W,  W,  H,  V,  V,  G,  G,  G,  R], // 23
  [ R,  G,  G,  G,  V,  V,  V,  V,  V,  V,  H,  H,  H,  H,  V,  V,  G,  G,  G,  R], // 24 veranda fondo
  [ R,  H,  H,  H,  H,  H,  H,  H,  H,  P,  P,  H,  H,  H,  H,  H,  H,  H,  H,  R], // 25 recinzione bassa (cancello centrale)
  [ R,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  R], // 26 giardino inferiore
  [ R,  G, TR,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G, TR,  G,  R], // 27
  [ R,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  R], // 28
  [ R,  G,  G,  G, TR,  G,  G,  G,  G,  G,  G,  G,  G,  G, TR,  G,  G,  G,  G,  R], // 29
  [ R,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  R], // 30
  [ R,  H,  H,  H,  H,  H,  H,  H,  H,  P,  P,  H,  H,  H,  H,  H,  H,  H,  H,  R], // 31 recinzione fondo prop. (cancello)
  [ R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R], // 32 Strada
  [ R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R,  R], // 33 Strada
  [ S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S], // 34 Spiaggia
  [ S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S], // 35
  [ S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S,  S], // 36
  [ M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M], // 37 Mare
  [ M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M], // 38
  [ M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M], // 39
  [ M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M], // 40
  [ M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M], // 41
];

export const MAP_COLS = MAP_DATA[0].length; // 20
export const MAP_ROWS = MAP_DATA.length;    // 42

// ─── Flower positions (col, row) ─────────────────────────────────────────────
export const FLOWER_POSITIONS = [
  // Giardino superiore
  { col: 2, row: 4 }, { col: 5, row: 3 }, { col: 7, row: 5 },
  { col: 9, row: 7 }, { col: 11, row: 4 }, { col: 12, row: 6 },
  { col: 3, row: 6 }, { col: 8, row: 8 },
  // Fianco sinistro casa
  { col: 1, row: 12 }, { col: 2, row: 16 },
  // Fianco destro casa
  { col: 17, row: 11 }, { col: 18, row: 15 },
  // Vialetti
  { col: 4, row: 13 }, { col: 15, row: 12 },
  // Veranda
  { col: 5, row: 22 }, { col: 8, row: 23 }, { col: 14, row: 22 },
  // Giardino inferiore
  { col: 3, row: 27 }, { col: 6, row: 28 }, { col: 9, row: 29 },
  { col: 11, row: 27 }, { col: 14, row: 28 }, { col: 17, row: 29 },
  { col: 4, row: 30 },
];

// ─── Characters ──────────────────────────────────────────────────────────────
export const CHARACTERS = {
  lavinia: { name: 'Lavinia', color: 0xf9a8d4, label: 'La Protagonista' },
  jacopo:  { name: 'Jacopo',  color: 0x93c5fd, label: "L'Inseguitore"  },
  sofia:   { name: 'Sofia',   color: 0xc4b5fd, label: "L'Inseguitrice" },
};

// ─── Game settings ────────────────────────────────────────────────────────────
export const PLAYER_SPEED  = 85;  // px/s
export const ENEMY_SPEED   = 42;  // px/s — nemici più lenti per bilanciamento
export const CATCH_RADIUS  = 10;  // px
export const PLAYER_RADIUS = 9;   // px
