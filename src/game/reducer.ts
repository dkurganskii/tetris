import type { GameState, FallingPiece, PieceId, DifficultyLevel } from './types';
import { emptyGrid, collides, mergePiece, clearLines, scoreForClears, tryMove, tryRotate, gravityForLevel } from './utils';
import { SevenBag } from './bag';
import { baseMatrix } from './pieces';
import { getDifficultySettings } from './difficulty';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Action =
  | { type: 'TICK'; dt: number }
  | { type: 'MOVE'; dx: number }
  | { type: 'SOFT_DROP' }
  | { type: 'HARD_DROP' }
  | { type: 'ROTATE'; dir: 1 | -1 }
  | { type: 'PAUSE_TOGGLE' }
  | { type: 'NEW_GAME' }
  | { type: 'SET_DIFFICULTY'; difficulty: DifficultyLevel }
  | { type: 'LOAD_BEST'; best: number }
  | { type: 'START_LINE_CLEAR'; lines: number[] }
  | { type: 'COMPLETE_LINE_CLEAR' };

let bag = new SevenBag();

function spawn(next: PieceId[]): { piece: FallingPiece; next: PieceId[] } {
  const ensure = [...next];
  while (ensure.length < 5) ensure.push(bag.next());
  const id = ensure.shift()!;
  const m = baseMatrix(id);
  const piece: FallingPiece = { id, m, x: 3, y: -1 };
  return { piece, next: ensure };
}

async function saveBest(best: number) {
  try { await AsyncStorage.setItem('@bestScore', String(best)); } catch {}
}

export function initialState(bestScore = 0, difficulty: DifficultyLevel = 'medium'): GameState {
  bag = new SevenBag();
  const { piece, next } = spawn([]);
  const settings = getDifficultySettings(difficulty);
  return {
    grid: emptyGrid(),
    falling: piece,
    next,
    score: 0,
    level: 0,
    lines: 0,
    bestScore,
    combo: -1, // -1 means no combo yet
    status: 'playing',
    difficulty,
    gravityMs: settings.gravityMs,
    gravityAcc: 0,
    lockDelayMs: settings.lockDelayMs,
    lockAcc: null,
    clearingLines: [],
    clearAnimationPhase: 'none',
  };
}

export function reducer(state: GameState, a: Action): GameState {
  if (a.type === 'LOAD_BEST') {
    return { ...state, bestScore: a.best };
  }
  if (a.type === 'START_LINE_CLEAR') {
    return { ...state, clearingLines: a.lines, clearAnimationPhase: 'flashing' };
  }
  if (a.type === 'COMPLETE_LINE_CLEAR') {
    const { grid: cleared } = clearLines(state.grid);
    const lines = state.lines + state.clearingLines.length;
    const level = Math.floor(lines / 10);
    const gained = scoreForClears(state.clearingLines.length, level);
    const score = state.score + gained;
    const bestScore = Math.max(state.bestScore, score);
    const { piece, next } = spawn(state.next);
    const topout = collides(cleared, piece);
    if (bestScore > state.bestScore) saveBest(bestScore);
    return {
      ...state,
      grid: cleared,
      falling: topout ? null : piece,
      next,
      score,
      lines,
      level,
      bestScore,
      combo: state.clearingLines.length > 0 ? (state.combo + 1) : -1,
      clearingLines: [],
      clearAnimationPhase: 'none',
      gravityMs: gravityForLevel(level),
      gravityAcc: 0,
      lockAcc: null,
      status: topout ? 'over' : 'playing',
    };
  }
  if (state.status !== 'playing' && a.type !== 'NEW_GAME' && a.type !== 'PAUSE_TOGGLE') return state;

  switch (a.type) {
    case 'PAUSE_TOGGLE':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;

    case 'NEW_GAME':
      return initialState(state.bestScore, state.difficulty);

    case 'SET_DIFFICULTY': {
      const settings = getDifficultySettings(a.difficulty);
      return {
        ...state,
        difficulty: a.difficulty,
        gravityMs: settings.gravityMs,
        lockDelayMs: settings.lockDelayMs,
      };
    }

    case 'MOVE': {
      if (!state.falling) return state;
      const moved = tryMove(state.grid, state.falling, a.dx, 0);
      const touching = collides(state.grid, { ...moved, y: moved.y + 1 });
      return { ...state, falling: moved, lockAcc: touching ? 0 : null };
    }

    case 'SOFT_DROP': {
      if (!state.falling) return state;
      const moved = tryMove(state.grid, state.falling, 0, 1);
      if (moved === state.falling) {
        // can't move; start/continue lock
        const touching = true;
        return { ...state, lockAcc: touching ? (state.lockAcc ?? 0) : null, score: state.score + 1 };
      }
      return { ...state, falling: moved, score: state.score + 1 };
    }

    case 'HARD_DROP': {
      if (!state.falling) return state;
      let fp = state.falling;
      let dist = 0;
      while (true) {
        const down = tryMove(state.grid, fp, 0, 1);
        if (down === fp) break;
        fp = down; dist++;
      }
      // lock
      let grid = mergePiece(state.grid, fp);
      const { grid: cleared, cleared: n, clearedRows } = clearLines(grid);
      
      if (n > 0) {
        // Start line clear animation
        return {
          ...state,
          grid: mergePiece(state.grid, fp), // Don't clear lines yet
          falling: null, // Remove falling piece
          score: state.score + dist * 2, // Add hard drop bonus
          clearingLines: clearedRows,
          clearAnimationPhase: 'flashing',
        };
      } else {
        // No lines to clear, proceed normally
        const { piece, next } = spawn(state.next);
        const topout = collides(grid, piece);
        return {
          ...state,
          grid,
          falling: topout ? null : piece,
          next,
          score: state.score + dist * 2,
          gravityAcc: 0,
          lockAcc: null,
          status: topout ? 'over' : 'playing',
        };
      }
    }

    case 'ROTATE': {
      if (!state.falling) return state;
      const rotated = tryRotate(state.grid, state.falling, a.dir);
      const touching = collides(state.grid, { ...rotated, y: rotated.y + 1 });
      return { ...state, falling: rotated, lockAcc: touching ? 0 : null };
    }

    case 'TICK': {
      if (!state.falling) return state;
      let { gravityAcc, gravityMs, lockAcc } = state;
      gravityAcc += a.dt;

      let s = state;
      // apply gravity steps
      while (gravityAcc >= gravityMs) {
        gravityAcc -= gravityMs;
        const down = tryMove(s.grid, s.falling!, 0, 1);
        if (down === s.falling) {
          // touching ground
          lockAcc = (lockAcc ?? 0);
          break;
        } else {
          s = { ...s, falling: down };
          lockAcc = null;
        }
      }

      // handle lock delay when resting
      if (lockAcc !== null) {
        lockAcc += a.dt;
        if (lockAcc >= s.lockDelayMs) {
          // lock piece
          const fp = s.falling!;
          let grid = mergePiece(s.grid, fp);
          const { grid: cleared, cleared: n, clearedRows } = clearLines(grid);
          
          if (n > 0) {
            // Start line clear animation
            return {
              ...s,
              grid: mergePiece(s.grid, fp), // Don't clear lines yet
              falling: null, // Remove falling piece
              clearingLines: clearedRows,
              clearAnimationPhase: 'flashing',
              gravityAcc,
              lockAcc: null,
            };
          } else {
            // No lines to clear, proceed normally
            const { piece, next } = spawn(s.next);
            const topout = collides(grid, piece);
            return {
              ...s,
              grid,
              falling: topout ? null : piece,
              next,
              gravityAcc,
              lockAcc: null,
              status: topout ? 'over' : 'playing',
            };
          }
        }
      }
      return { ...s, gravityAcc, lockAcc };
    }
  }
}
