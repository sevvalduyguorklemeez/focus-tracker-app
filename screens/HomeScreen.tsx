import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, AppState, AppStateStatus } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Category, FocusSession } from '../types';
import { saveSession } from '../utils/storage';

const DEFAULT_DURATION = 25; // dakika
const categories: Category[] = ['Ders Çalışma', 'Kodlama', 'Proje', 'Kitap Okuma'];

export default function HomeScreen() {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION * 60); // saniye cinsinden
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Ders Çalışma');
  const [distractionCount, setDistractionCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<FocusSession | null>(null);

  const intervalRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);
  const wasInBackground = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Uygulamaya geri dönüldü
      if (wasInBackground.current && isRunning && !isPaused) {
        Alert.alert(
          'Dikkat Dağınıklığı Tespit Edildi',
          'Uygulamadan ayrıldınız. Seansı devam ettirmek ister misiniz?',
          [
            {
              text: 'Devam Et',
              onPress: () => {
                wasInBackground.current = false;
              },
            },
            {
              text: 'Durdur',
              onPress: () => {
                setIsRunning(false);
                setIsPaused(true);
                wasInBackground.current = false;
              },
            },
          ]
        );
      }
    } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // Uygulamadan ayrıldı
      if (isRunning && !isPaused) {
        wasInBackground.current = true;
        setDistractionCount((prev) => prev + 1);
        setIsRunning(false);
        setIsPaused(true);
      }
    }
    appState.current = nextAppState;
  };

  const handleStart = () => {
    if (!selectedCategory) {
      Alert.alert('Uyarı', 'Lütfen bir kategori seçin');
      return;
    }
    setSessionStartTime(Date.now());
    setIsRunning(true);
    setIsPaused(false);
    setDistractionCount(0);
    setShowSummary(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Sıfırla',
      'Zamanlayıcıyı sıfırlamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            setTimeLeft(DEFAULT_DURATION * 60);
            setIsRunning(false);
            setIsPaused(false);
            setDistractionCount(0);
            setSessionStartTime(null);
            setShowSummary(false);
          },
        },
      ]
    );
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsPaused(false);
    saveSessionData(true);
  };

  const handleStop = () => {
    Alert.alert(
      'Seansı Bitir',
      'Seansı şimdi bitirmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Bitir',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            saveSessionData(false);
          },
        },
      ]
    );
  };

  const saveSessionData = async (completed: boolean) => {
    if (!sessionStartTime) return;

    const endTime = Date.now();
    const duration = Math.floor((DEFAULT_DURATION * 60 - timeLeft) / 60); // dakika
    const today = new Date().toISOString().split('T')[0];

    const session: FocusSession = {
      id: Date.now().toString(),
      startTime: sessionStartTime,
      endTime,
      duration,
      category: selectedCategory,
      distractionCount,
      completed,
      date: today,
    };

    await saveSession(session);
    setSessionSummary(session);
    setShowSummary(true);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setTimeLeft(DEFAULT_DURATION * 60);
    setSessionStartTime(null);
    setDistractionCount(0);
  };

  if (showSummary && sessionSummary) {
    return (
      <View style={styles.container}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Seans Özeti</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Süre:</Text>
            <Text style={styles.summaryValue}>{sessionSummary.duration} dakika</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Kategori:</Text>
            <Text style={styles.summaryValue}>{sessionSummary.category}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Dikkat Dağınıklığı:</Text>
            <Text style={styles.summaryValue}>{sessionSummary.distractionCount} kez</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Durum:</Text>
            <Text style={styles.summaryValue}>
              {sessionSummary.completed ? 'Tamamlandı ✓' : 'Yarıda Kesildi'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseSummary}>
            <Text style={styles.closeButtonText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Odaklanma Seansı</Text>

        <View style={styles.categoryContainer}>
          <Text style={styles.label}>Kategori Seçin:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={(itemValue: Category) => setSelectedCategory(itemValue)}
              enabled={!isRunning}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerLabel}>
            {isRunning ? 'Çalışıyor...' : isPaused ? 'Duraklatıldı' : 'Hazır'}
          </Text>
        </View>

        {distractionCount > 0 && (
          <View style={styles.distractionContainer}>
            <Text style={styles.distractionText}>
              ⚠️ Dikkat Dağınıklığı: {distractionCount} kez
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {!isRunning && !isPaused ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.buttonText}>Başlat</Text>
            </TouchableOpacity>
          ) : (
            <>
              {isPaused ? (
                <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                  <Text style={styles.buttonText}>Devam Et</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
                  <Text style={styles.buttonText}>Duraklat</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Text style={styles.buttonText}>Bitir</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.buttonText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  categoryContainer: {
    width: '100%',
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 10,
  },
  timerLabel: {
    fontSize: 18,
    color: '#666',
  },
  distractionContainer: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  distractionText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  startButton: {
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FFA500',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#28A745',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#DC3545',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#6C757D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
