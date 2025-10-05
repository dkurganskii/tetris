import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import type { GameState } from '../game/types';
import { ghostY } from '../game/utils';

const COLORS: Record<number, string> = {
  0: '#111214',
  1: '#4dd2ff', // I
  2: '#ffd84d', // O
  3: '#b180ff', // T
  4: '#4d7aff', // J
  5: '#ff9a4d', // L
  6: '#4dff88', // S
  7: '#ff6060', // Z
};

export default function BoardView({ state, maxWidthOverride }: { state: GameState; maxWidthOverride?: number }) {
  const cols = state.grid[0].length;
  const rows = state.grid.length;
  const win = Dimensions.get('window');
  const maxWidth = Math.min(maxWidthOverride ?? (win.width - 24), 380);
  const maxHeight = Math.min(win.height * 0.65, 560);
  const tile = Math.floor(Math.min(maxWidth / cols, maxHeight / rows));
  const width = cols * tile;
  const height = rows * tile;

  const ghost = useMemo(() => {
    if (!state.falling) return null;
    const y = ghostY(state.grid, state.falling);
    return { ...state.falling, y };
  }, [state.grid, state.falling]);

  return (
    <View style={[styles.wrapper, { width, height }]}>      
      {state.grid.map((row, ry) => (
        <View key={ry} style={{ flexDirection: 'row' }}>
          {row.map((c, rx) => (
            <View
              key={rx}
              style={[
                styles.cell,
                { width: tile, height: tile, backgroundColor: COLORS[c] },
                c !== 0 && styles.brick,
              ]}
            />
          ))}
        </View>
      ))}

      {ghost && ghost.m.map((r, y) => r.map((v, x) => {
        if (!v) return null;
        const gx = (ghost.x + x) * tile, gy = (ghost.y + y) * tile;
        if (ghost.y + y < 0) return null;
        return <View key={`g-${x}-${y}`} style={[styles.ghost, { left: gx, top: gy, width: tile, height: tile }]} />;
      }))}

      {state.falling && state.falling.m.map((r, y) => r.map((v, x) => {
        if (!v) return null;
        const fx = (state.falling!.x + x) * tile, fy = (state.falling!.y + y) * tile;
        if (state.falling!.y + y < 0) return null;
        const color = COLORS[['I','O','T','J','L','S','Z'].indexOf(state.falling!.id) + 1];
        return <View key={`f-${x}-${y}`} style={[styles.falling, { left: fx, top: fy, width: tile, height: tile, backgroundColor: color }]} />;
      }))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    backgroundColor: '#0b0c10',
    borderWidth: 2,
    borderColor: '#22252b',
    borderRadius: 10,
    overflow: 'hidden',
  },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1c1f26',
  },
  brick: {
    borderColor: '#0a0a0a',
  },
  falling: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0a0a0a',
    borderRadius: 4,
  },
  ghost: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#888',
    backgroundColor: 'transparent',
  },
});
