import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PetProps {
  totalMinutes: number;
}

// Evcil hayvan seviyeleri (her 60 dakika = 1 seviye)
const getPetLevel = (minutes: number): number => {
  return Math.floor(minutes / 60) + 1;
};

const getPetSize = (level: number): number => {
  // Seviye 1: 60px, Seviye 2: 80px, Seviye 3: 100px, maksimum 120px
  return Math.min(60 + (level - 1) * 20, 120);
};

const getPetEmoji = (level: number): string => {
  if (level >= 12) return '🦄'; // Unicorn
  if (level >= 10) return '🐉'; // Ejderha
  if (level >= 7) return '🦁'; // Aslan
  if (level >= 5) return '🐺'; // Kurt
  if (level >= 3) return '🐱'; // Kedi
  return '🐣'; // Civciv
};

const getPetName = (level: number): string => {
  if (level >= 12) return 'Unicorn';
  if (level >= 10) return 'Ejderha';
  if (level >= 7) return 'Aslan';
  if (level >= 5) return 'Kurt';
  if (level >= 3) return 'Kedi';
  return 'Civciv';
};

const getNextLevelMinutes = (currentMinutes: number): number => {
  const currentLevel = getPetLevel(currentMinutes);
  return currentLevel * 60;
};

export default function Pet({ totalMinutes }: PetProps) {
  const level = getPetLevel(totalMinutes);
  const size = getPetSize(level);
  const emoji = getPetEmoji(level);
  const petName = getPetName(level);
  const nextLevelMinutes = getNextLevelMinutes(totalMinutes);
  const progress = ((totalMinutes % 60) / 60) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.petContainer}>
        <Text style={[styles.petEmoji, { fontSize: size }]}>{emoji}</Text>
        <Text style={styles.petName}>{petName}</Text>
        <Text style={styles.petLevel}>Seviye {level}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {nextLevelMinutes - totalMinutes} dakika sonra seviye atlayacak!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  petEmoji: {
    marginBottom: 10,
  },
  petName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  petLevel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginTop: 10,
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

