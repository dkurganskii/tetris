import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, GestureResponderEvent, PanResponderGestureState, Animated } from 'react-native';
import type { GameState, FallingPiece } from '../game/types';
import { ghostY } from '../game/utils';
import { getDifficultySettings } from '../game/difficulty';

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

type Handlers = {
  onMove?: (dx: number) => void;
  onSoftDrop?: () => void;
  onHardDrop?: () => void;
  onRotate?: (dir: 1 | -1) => void;
  onHardDropStart?: () => void;
};

export default function BoardView({ state, maxWidthOverride, onMove, onSoftDrop, onHardDrop, onRotate, onHardDropStart }: { state: GameState; maxWidthOverride?: number } & Handlers) {
  const cols = state.grid[0].length;
  const rows = state.grid.length;
  const win = Dimensions.get('window');
  const maxWidth = Math.min(maxWidthOverride ?? (win.width - 24), 380);
  const maxHeight = Math.min(win.height * 0.65, 560);
  const tile = Math.floor(Math.min(maxWidth / cols, maxHeight / rows));
  const width = cols * tile;
  const height = rows * tile;

  // Gesture handling (tap to rotate, drag to move, quick flick down to hard drop)
  const accumXRef = useRef(0);
  const accumYRef = useRef(0);
  const startTSRef = useRef(0);

  const thresholdH = Math.max(4, Math.floor(tile * 0.3));
  const thresholdV = Math.max(4, Math.floor(tile * 0.2));
  const quickVX = 0.22; // quick swipe horizontal
  const quickVY = 0.6;  // quick swipe vertical
  const minRepeatMs = 70; // rate limit for velocity-based extra moves
  const lastMoveTsRef = useRef(0);
  const difficultySettings = getDifficultySettings(state.difficulty);
  
  // Lightning trail effect
  const [lightningTrails, setLightningTrails] = useState<Array<{id: string, x: number, y: number, color: string, opacity: Animated.Value}>>([]);
  const trailIdRef = useRef(0);

  // Create lightning trail effect
  const createLightningTrail = (x: number, y: number, color: string) => {
    const id = `trail-${trailIdRef.current++}`;
    const opacity = new Animated.Value(1);
    
    const trail = { id, x, y, color, opacity };
    setLightningTrails(prev => [...prev, trail]);
    
    // Animate trail fade out
    Animated.timing(opacity, {
      toValue: 0,
      duration: 1000, // Longer duration to see them better
      useNativeDriver: true,
    }).start(() => {
      setLightningTrails(prev => prev.filter(t => t.id !== id));
    });
  };

  // Track hard drop for lightning trails
  const [isHardDropping, setIsHardDropping] = useState(false);
  const hardDropPieceRef = useRef<FallingPiece | null>(null);
  
  // Create lightning trails immediately when hard drop starts
  useEffect(() => {
    if (isHardDropping && hardDropPieceRef.current) {
      const piece = hardDropPieceRef.current;
      const color = COLORS[['I','O','T','J','L','S','Z'].indexOf(piece.id) + 1];
      piece.m.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const fx = (piece.x + x) * tile;
            const fy = (piece.y + y) * tile;
            if (fy >= 0) {
              createLightningTrail(fx, fy, color);
            }
          }
        });
      });
    }
  }, [isHardDropping, tile]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      accumXRef.current = 0;
      accumYRef.current = 0;
      startTSRef.current = Date.now();
    },
    onPanResponderMove: (_evt: GestureResponderEvent, gs: PanResponderGestureState) => {
      // Horizontal discrete steps using accumulated delta
      const dx = gs.dx - accumXRef.current;
      if (Math.abs(dx) >= thresholdH) {
        const steps = Math.trunc(dx / thresholdH);
        const dir = steps > 0 ? 1 : -1;
        for (let i = 0; i < Math.abs(steps); i++) onMove && onMove(dir);
        accumXRef.current += steps * thresholdH;
      }

      // Velocity-assisted nudge to feel snappier
      const now = Date.now();
      if (Math.abs(gs.vx) > quickVX && now - lastMoveTsRef.current > minRepeatMs) {
        onMove && onMove(gs.vx > 0 ? 1 : -1);
        lastMoveTsRef.current = now;
      }

      // Soft drop once per threshold step
      const dy = gs.dy - accumYRef.current;
      if (dy >= thresholdV) {
        const stepsV = Math.trunc(dy / thresholdV);
        for (let i = 0; i < stepsV; i++) onSoftDrop && onSoftDrop();
        accumYRef.current += stepsV * thresholdV;
      }

      // Velocity-assisted soft drop
      if (gs.vy > quickVY && now - lastMoveTsRef.current > minRepeatMs) {
        onSoftDrop && onSoftDrop();
        lastMoveTsRef.current = now;
      }
    },
    onPanResponderRelease: (_evt: GestureResponderEvent, gs: PanResponderGestureState) => {
      const dt = Date.now() - startTSRef.current;
      const dist = Math.hypot(gs.dx, gs.dy);
      const smallTap = dist < 8 && dt < 250;
      
      
      if (smallTap) {
        onRotate && onRotate(1);
        return;
      }
      if (onHardDrop && difficultySettings.hardDropEnabled && (gs.vy > 0.001 || gs.dy > 5)) {
        // Store the piece that's being hard dropped BEFORE calling onHardDrop
        if (state.falling) {
          hardDropPieceRef.current = { ...state.falling };
        }
        setIsHardDropping(true);
        onHardDropStart && onHardDropStart();
        onHardDrop();
        // Reset hard dropping state after a longer delay to allow trails
        setTimeout(() => {
          setIsHardDropping(false);
          hardDropPieceRef.current = null;
        }, 500);
      }
    },
  }), [tile, thresholdH, thresholdV, onMove, onSoftDrop, onHardDrop, onRotate, difficultySettings.hardDropEnabled]);
  
  const ghost = useMemo(() => {
    if (!state.falling || !difficultySettings.ghostPiece) return null;
    const y = ghostY(state.grid, state.falling);
    return { ...state.falling, y };
  }, [state.grid, state.falling, difficultySettings.ghostPiece]);

  return (
    <View style={[styles.wrapper, { width, height }]} {...panResponder.panHandlers}>      
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

      {/* Lightning trails */}
      {lightningTrails.map(trail => (
        <Animated.View
          key={trail.id}
          style={[
            styles.lightningTrail,
            {
              left: trail.x,
              top: trail.y,
              width: tile,
              height: tile,
              backgroundColor: trail.color,
              opacity: trail.opacity,
            }
          ]}
        />
      ))}
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
  lightningTrail: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#ffff00',
    backgroundColor: '#ffff00',
    shadowColor: '#ffff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 15,
  },
});
