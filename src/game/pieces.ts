import type { PieceId } from './types';

export const COLOR_CODE: Record<PieceId, number> = {
  I: 1, O: 2, T: 3, J: 4, L: 5, S: 6, Z: 7,
};

// Base 4x4 matrices using '.' = empty, 'X' = filled
const BASE: Record<PieceId, string[]> = {
  I: [
    '....',
    'XXXX',
    '....',
    '....',
  ],
  O: [
    '.XX.',
    '.XX.',
    '....',
    '....',
  ],
  T: [
    '.X..',
    'XXX.',
    '....',
    '....',
  ],
  J: [
    'X...',
    'XXX.',
    '....',
    '....',
  ],
  L: [
    '..X.',
    'XXX.',
    '....',
    '....',
  ],
  S: [
    '.XX.',
    'XX..',
    '....',
    '....',
  ],
  Z: [
    'XX..',
    '.XX.',
    '....',
    '....',
  ],
};

export function shapeFromStrings(rows: string[]): number[][] {
  return rows.map(r => r.split('').map(ch => (ch === 'X' ? 1 : 0)));
}

export function rotateCW(m: number[][]): number[][] {
  const N = m.length;
  const out = Array.from({ length: N }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    out[x][N - 1 - y] = m[y][x];
  }
  return out;
}

export function rotateCCW(m: number[][]): number[][] {
  const N = m.length;
  const out = Array.from({ length: N }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    out[N - 1 - x][y] = m[y][x];
  }
  return out;
}

export function baseMatrix(id: PieceId): number[][] {
  return shapeFromStrings(BASE[id]);
}

// Basic kick attempts (not full SRS but close enough for MVP)
export const KICKS: Array<[number, number]> = [
  [0, 0], [1, 0], [-1, 0], [2, 0], [-2, 0], [0, -1]
];
