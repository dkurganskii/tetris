export type PieceId = 'I' | 'O' | 'T' | 'J' | 'L' | 'S' | 'Z';

// 0 = empty, 1..7 = piece colors (I,O,T,J,L,S,Z)
export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Grid = Cell[][];

export type DifficultyLevel = 'super-easy' | 'easy' | 'medium' | 'hard' | 'super-hard';

export interface DifficultySettings {
  name: string;
  gravityMs: number;        // Base gravity interval (ms per row)
  lockDelayMs: number;      // Lock delay when piece touches ground
  previewCount: number;     // Number of next pieces to show
  ghostPiece: boolean;      // Show ghost piece
  hardDropEnabled: boolean; // Allow hard drop
  softDropMultiplier: number; // Score multiplier for soft drop
}

export interface FallingPiece {
  id: PieceId;
  x: number; // column (0..9)
  y: number; // row (0..19)
  m: number[][]; // 4x4 matrix, 1 = block, 0 = empty
}

export interface GameState {
  grid: Grid;
  falling: FallingPiece | null;
  next: PieceId[]; // preview queue (>=5)
  score: number;
  level: number;
  lines: number;
  bestScore: number;
  combo: number;
  status: 'playing' | 'paused' | 'over';
  difficulty: DifficultyLevel;
  // timers (ms)
  gravityMs: number;       // current gravity interval by level
  gravityAcc: number;      // accumulated dt
  lockDelayMs: number;     // e.g., 500ms
  lockAcc: number | null;  // null when not touching ground
}
