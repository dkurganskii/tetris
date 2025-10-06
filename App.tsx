import React, { useEffect, useReducer, useRef } from 'react';
import { SafeAreaView, StatusBar, View, StyleSheet, ScrollView, Pressable, Text, Animated } from 'react-native';
import BoardView from './src/components/BoardView';
import HUD from './src/components/HUD';
import DifficultySelector from './src/components/DifficultySelector';
import { initialState, reducer } from './src/game/reducer';
import { getDifficultySettings } from './src/game/difficulty';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined as any, () => initialState(0));
  const [showDifficultySelector, setShowDifficultySelector] = React.useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

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

  const difficultySettings = getDifficultySettings(state.difficulty);

  // Screen shake animation for hard drop
  const triggerScreenShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 3,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -3,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 2,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -2,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 30,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleHardDrop = () => {
    dispatch({ type: 'HARD_DROP' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnimation }] }]}>
        {showDifficultySelector ? (
          <View style={styles.difficultyContainer}>
            <DifficultySelector
              selectedDifficulty={state.difficulty}
              onSelect={(difficulty) => {
                dispatch({ type: 'SET_DIFFICULTY', difficulty });
                setShowDifficultySelector(false);
              }}
            />
            <Pressable
              onPress={() => setShowDifficultySelector(false)}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Text style={styles.backBtnText}>Back to Game</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.top}>
              <HUD state={state} direction="row" />
              <Pressable
                onPress={() => setShowDifficultySelector(true)}
                style={({ pressed }) => [styles.difficultyBtn, pressed && styles.pressed]}
              >
                <Text style={styles.difficultyBtnText}>{difficultySettings.name}</Text>
              </Pressable>
            </View>
            <View style={styles.boardWrap}>
              <BoardView
                state={state}
                maxWidthOverride={undefined}
                onMove={(dx) => dispatch({ type: 'MOVE', dx })}
                onSoftDrop={() => dispatch({ type: 'SOFT_DROP' })}
                onHardDrop={handleHardDrop}
                onHardDropStart={() => {
                  triggerScreenShake();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }}
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
            <View style={styles.testRow}>
                      <Pressable onPress={() => {
                        triggerScreenShake();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        dispatch({ type: 'HARD_DROP' });
                      }} style={({ pressed }) => [styles.testBtn, pressed && styles.pressed]}>
                        <Text style={styles.testText}>Test Hard Drop</Text>
                      </Pressable>
                      <Pressable onPress={() => {
                        // Trigger lightning trails manually
                        if (state.falling) {
                          const color = ['#4dd2ff', '#ffd84d', '#b180ff', '#4d7aff', '#ff9a4d', '#4dff88', '#ff6060'][['I','O','T','J','L','S','Z'].indexOf(state.falling.id)];
                          const tile = Math.floor(Math.min(380 / 10, 560 / 16));
                          state.falling.m.forEach((row, y) => {
                            row.forEach((cell, x) => {
                              if (cell) {
                                const fx = (state.falling!.x + x) * tile;
                                const fy = (state.falling!.y + y) * tile;
                                if (fy >= 0) {
                                  // Create trail manually
                                }
                              }
                            });
                          });
                        }
                      }} style={({ pressed }) => [styles.testBtn, pressed && styles.pressed]}>
                        <Text style={styles.testText}>Test Lightning</Text>
                      </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0c10' },
  container: { flex: 1, padding: 12, gap: 10, paddingBottom: 12, justifyContent: 'space-between' },
  top: { alignItems: 'center', gap: 8 },
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
  difficultyContainer: { flex: 1, justifyContent: 'center' },
  difficultyBtn: {
    backgroundColor: '#1b1f27',
    borderColor: '#2a2f3a',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBtnText: { color: '#e6ebf5', fontSize: 14, fontWeight: '600' },
  backBtn: {
    backgroundColor: '#2a2f3a',
    borderColor: '#3a3f4a',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backBtnText: { color: '#e6ebf5', fontSize: 16, fontWeight: '600' },
  testRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 8,
    justifyContent: 'center',
  },
  testBtn: {
    backgroundColor: '#2a2f3a',
    borderColor: '#3a3f4a',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxWidth: 120,
  },
  testText: { 
    color: '#e6ebf5', 
    fontSize: 12, 
    fontWeight: '600',
    textAlign: 'center',
  },
});
