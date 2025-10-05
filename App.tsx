import 'react-native-gesture-handler';
import React, { useEffect, useReducer, useRef } from 'react';
import { SafeAreaView, StatusBar, View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import BoardView from './src/components/BoardView';
import HUD from './src/components/HUD';
import { initialState, reducer } from './src/game/reducer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined as any, () => initialState(0));

  // Load best score from storage
  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem('@bestScore');
      const best = v ? parseInt(v, 10) : 0;
      dispatch({ type: 'LOAD_BEST', best });
    })();
  }, []);

  // Game loop (60Hz with setInterval ~16ms)
  const last = useRef<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (state.status !== 'playing') { last.current = null; return; }
      const now = Date.now();
      const dt = last.current ? (now - last.current) : 16;
      last.current = now;
      dispatch({ type: 'TICK', dt });
    }, 16);
    return () => clearInterval(id);
  }, [state.status]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.top}>
          <HUD state={state} direction="row" />
        </View>
        <View style={styles.boardWrap}>
          <BoardView
            state={state}
            maxWidthOverride={undefined}
            onMove={(dx) => dispatch({ type: 'MOVE', dx })}
            onSoftDrop={() => dispatch({ type: 'SOFT_DROP' })}
            onHardDrop={() => dispatch({ type: 'HARD_DROP' })}
            onRotate={(dir) => dispatch({ type: 'ROTATE', dir })}
          />
        </View>
        <View style={styles.actionsRow}>
          <Pressable onPress={() => dispatch({ type: 'PAUSE_TOGGLE' })} style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
            <Text style={styles.actionText}>{state.status === 'paused' ? 'Resume' : 'Pause'}</Text>
          </Pressable>
          <Pressable onPress={() => dispatch({ type: 'NEW_GAME' })} style={({ pressed }) => [styles.actionBtn, styles.grow, pressed && styles.pressed]}>
            <Text style={styles.actionText}>New Game</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0c10' },
  container: { flex: 1, padding: 12, gap: 10, paddingBottom: 12, justifyContent: 'space-between' },
  top: { alignItems: 'center' },
  boardWrap: { alignItems: 'center' },
  controlsWrap: { paddingTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    backgroundColor: '#1b1f27',
    borderColor: '#2a2f3a',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  actionText: { color: '#e6ebf5', fontSize: 16, fontWeight: '700' },
  grow: { flex: 1 },
  pressed: { opacity: 0.85 },
});
