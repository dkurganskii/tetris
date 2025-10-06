import type { DifficultyLevel, DifficultySettings } from './types';

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultySettings> = {
  'super-easy': {
    name: 'Super Easy',
    gravityMs: 1200,        // Very slow falling
    lockDelayMs: 2000,      // Long lock delay
    previewCount: 5,        // Show 5 next pieces
    ghostPiece: true,       // Show ghost piece
    hardDropEnabled: true,  // Allow hard drop
    softDropMultiplier: 2,  // 2x score for soft drop
  },
  'easy': {
    name: 'Easy',
    gravityMs: 800,         // Slow falling
    lockDelayMs: 1500,      // Medium lock delay
    previewCount: 4,        // Show 4 next pieces
    ghostPiece: true,       // Show ghost piece
    hardDropEnabled: true,  // Allow hard drop
    softDropMultiplier: 2,  // 2x score for soft drop
  },
  'medium': {
    name: 'Medium',
    gravityMs: 500,         // Normal falling
    lockDelayMs: 1000,      // Standard lock delay
    previewCount: 3,        // Show 3 next pieces
    ghostPiece: true,       // Show ghost piece
    hardDropEnabled: true,  // Allow hard drop
    softDropMultiplier: 1,  // 1x score for soft drop
  },
  'hard': {
    name: 'Hard',
    gravityMs: 300,         // Fast falling
    lockDelayMs: 500,       // Short lock delay
    previewCount: 2,        // Show 2 next pieces
    ghostPiece: false,      // No ghost piece
    hardDropEnabled: true,  // Allow hard drop
    softDropMultiplier: 1,  // 1x score for soft drop
  },
  'super-hard': {
    name: 'Super Hard',
    gravityMs: 150,         // Very fast falling
    lockDelayMs: 200,       // Very short lock delay
    previewCount: 1,        // Show 1 next piece
    ghostPiece: false,      // No ghost piece
    hardDropEnabled: false, // No hard drop
    softDropMultiplier: 1,  // 1x score for soft drop
  },
};

export function getDifficultySettings(level: DifficultyLevel): DifficultySettings {
  return DIFFICULTY_SETTINGS[level];
}

export function getDifficultyColor(level: DifficultyLevel): string {
  const colors = {
    'super-easy': '#4ade80', // Green
    'easy': '#22c55e',       // Green
    'medium': '#f59e0b',     // Yellow
    'hard': '#f97316',       // Orange
    'super-hard': '#ef4444', // Red
  };
  return colors[level];
}
