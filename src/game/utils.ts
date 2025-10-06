import type { Cell, Grid, FallingPiece } from './types';
import { COLOR_CODE, rotateCW, rotateCCW, KICKS } from './pieces';

export function emptyGrid(rows = 16, cols = 10): Grid {
  return Array.from({ length: rows }, () => Array<Cell>(cols).fill(0 as Cell));
}

export function cloneGrid(g: Grid): Grid {
  return g.map(r => [...r]);
}

export function collides(grid: Grid, fp: FallingPiece): boolean {
  const rows = grid.length, cols = grid[0].length;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    if (!fp.m[y][x]) continue;
    const gx = fp.x + x, gy = fp.y + y;
    if (gx < 0 || gx >= cols || gy >= rows) return true;
    if (gy >= 0 && grid[gy][gx] !== 0) return true;
  }
  return false;
}

export function mergePiece(grid: Grid, fp: FallingPiece): Grid {
  const out = cloneGrid(grid);
  const color = COLOR_CODE[fp.id] as Cell;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    if (fp.m[y][x]) {
      const gx = fp.x + x, gy = fp.y + y;
      if (gy >= 0) out[gy][gx] = color;
    }
  }
  return out;
}

export function clearLines(grid: Grid): { grid: Grid; cleared: number; clearedRows: number[] } {
  const rows = grid.length, cols = grid[0].length;
  const kept: Grid = [];
  const clearedRows: number[] = [];
  let cleared = 0;
  for (let r = 0; r < rows; r++) {
    if (grid[r].every(c => c !== 0)) {
      cleared++;
      clearedRows.push(r);
    } else {
      kept.push(grid[r]);
    }
  }
  while (kept.length < rows) kept.unshift(Array<Cell>(cols).fill(0 as Cell));
  return { grid: kept, cleared, clearedRows };
}

// Basic score table (multiplied by (level+1))
const BASE_POINTS = [0, 100, 300, 500, 800];

export function scoreForClears(n: number, level: number): number {
  return (BASE_POINTS[n] || 0) * (level + 1);
}

export function ghostY(grid: Grid, fp: FallingPiece): number {
  let y = fp.y;
  const test = { ...fp };
  while (true) {
    test.y = y + 1;
    if (collides(grid, test)) return y;
    y++;
  }
}

export function tryMove(grid: Grid, fp: FallingPiece, dx: number, dy: number) {
  const next = { ...fp, x: fp.x + dx, y: fp.y + dy };
  return collides(grid, next) ? fp : next;
}

export function tryRotate(grid: Grid, fp: FallingPiece, dir: 1 | -1) {
  const m = dir === 1 ? rotateCW(fp.m) : rotateCCW(fp.m);
  for (const [kx, ky] of KICKS) {
    const test = { ...fp, m, x: fp.x + kx, y: fp.y + ky };
    if (!collides(grid, test)) return test;
  }
  return fp; // rotation failed
}

// Simple speed curve: fast enough but mobile-friendly
export function gravityForLevel(level: number): number {
  // ms per row; decreases with level (min 50ms)
  return Math.max(50, 800 - level * 60);
}
