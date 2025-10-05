import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  onLeft: () => void;
  onRight: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onPause: () => void;
  onNewGame: () => void;
  status: 'playing'|'paused'|'over';
};

export default function Controls(p: Props) {
  // Simple tap buttons; you can add hold-to-repeat later
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <Btn label="⟲" onPress={p.onRotateCCW} />
        <Btn label="⟳" onPress={p.onRotateCW} />
        <Btn label="⤓ Hard" onPress={p.onHardDrop} grow />
      </View>
      <View style={styles.row}>
        <Btn label="←" onPress={p.onLeft} />
        <Btn label="↓" onPress={p.onSoftDrop} />
        <Btn label="→" onPress={p.onRight} />
      </View>
      <View style={styles.row}>
        <Btn label={p.status === 'paused' ? 'Resume' : 'Pause'} onPress={p.onPause} />
        <Btn label="New Game" onPress={p.onNewGame} grow />
      </View>
    </View>
  );
}

function Btn({ label, onPress, grow }: { label: string; onPress: () => void; grow?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, grow && styles.grow, pressed && styles.pressed]}>
      <Text style={styles.btnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: {
    backgroundColor: '#1b1f27',
    borderColor: '#2a2f3a',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  grow: { flex: 1 },
  pressed: { opacity: 0.8 },
  btnText: { color: '#e6ebf5', fontSize: 16, fontWeight: '700' },
});
