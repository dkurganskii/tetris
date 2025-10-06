import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { DifficultyLevel } from '../game/types';
import { DIFFICULTY_SETTINGS, getDifficultyColor } from '../game/difficulty';

type Props = {
  selectedDifficulty: DifficultyLevel;
  onSelect: (difficulty: DifficultyLevel) => void;
  disabled?: boolean;
};

export default function DifficultySelector({ selectedDifficulty, onSelect, disabled = false }: Props) {
  const difficulties: DifficultyLevel[] = ['super-easy', 'easy', 'medium', 'hard', 'super-hard'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Difficulty</Text>
      <View style={styles.buttons}>
        {difficulties.map((difficulty) => {
          const settings = DIFFICULTY_SETTINGS[difficulty];
          const isSelected = selectedDifficulty === difficulty;
          const color = getDifficultyColor(difficulty);
          
          return (
            <Pressable
              key={difficulty}
              onPress={() => !disabled && onSelect(difficulty)}
              style={({ pressed }) => [
                styles.button,
                isSelected && styles.selected,
                { borderColor: color },
                pressed && styles.pressed,
                disabled && styles.disabled,
              ]}
            >
              <Text style={[styles.buttonText, { color: isSelected ? '#fff' : color }]}>
                {settings.name}
              </Text>
              <Text style={[styles.description, { color: isSelected ? '#ccc' : '#666' }]}>
                {settings.gravityMs}ms • {settings.previewCount} previews
                {settings.ghostPiece ? ' • Ghost' : ''}
                {!settings.hardDropEnabled ? ' • No Hard Drop' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1a1d23',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2f3a',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e6ebf5',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#151820',
  },
  selected: {
    backgroundColor: '#2a2f3a',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
  },
});
