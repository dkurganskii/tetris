import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GameState } from '../game/types';

type Props = { state: GameState; direction?: 'row' | 'column' };

export default function HUD({ state, direction = 'row' }: Props) {
  const containerStyle = direction === 'row' ? styles.row : styles.col;
  const statusStyle = [
    direction === 'row' ? styles.statusRow : styles.statusCol,
    state.status !== 'playing' && styles.alert,
  ];
  return (
    <View style={containerStyle}>
      <Stat label="Score" value={state.score} />
      <Stat label="Best" value={state.bestScore} />
      <Stat label="Level" value={state.level} />
      <Stat label="Lines" value={state.lines} />
      <Text style={statusStyle}>{state.status.toUpperCase()}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
  col: { flexDirection: 'column', gap: 8 },
  stat: { backgroundColor: '#151820', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  label: { color: '#9aa2b1', fontSize: 12 },
  value: { color: '#e6ebf5', fontSize: 18, fontWeight: '700' },
  statusRow: { marginLeft: 'auto', color: '#9aa2b1' },
  statusCol: { color: '#9aa2b1', marginTop: 4 },
  alert: { color: '#ffb347', fontWeight: '700' }
});
