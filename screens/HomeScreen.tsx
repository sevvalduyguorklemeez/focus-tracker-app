import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, AppState, AppStateStatus } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Category, FocusSession } from '../types';
import { saveSession } from '../utils/storage';
import { 
  sendTimerCompleteNotification, 
  scheduleReminderNotification,
  cancelAllNotifications,
  requestNotificationPermissions 
} from '../utils/notifications';

const DEFAULT_DURATION = 25; // dakika
const categories: Category[] = ['Ders Çalışma', 'Kodlama', 'Proje', 'Kitap Okuma'];
const durationOptions = [5, 10, 15, 20, 25, 30, 45, 60]; // dakika cinsinden seçenekler

export default function HomeScreen() {
  const [selectedDuration, setSelectedDuration] = useState<number>(DEFAULT_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION * 60); // saniye cinsinden
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Ders Çalışma');
  const [distractionCount, setDistractionCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<FocusSession | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const wasInBackground = useRef(false);
  const reminderNotificationIdRef = useRef<string | null>(null);
  const sessionDataRef = useRef<{
    startTime: number;
    duration: number;
    category: Category;
    distractions: number;
  } | null>(null);

  // Bildirim izinlerini başlangıçta iste
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // AppState listener
  useEffect(() => {
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
                  setIsRunning(true);
                  setIsPaused(false);
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

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, [isRunning, isPaused]);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          // Yarı yolda hatırlatma bildirimi (sadece bir kez)
          if (newTime === Math.floor(prev / 2) && reminderNotificationIdRef.current === null && sessionDataRef.current) {
            const remainingSeconds = Math.floor(newTime);
            if (remainingSeconds > 60) { // En az 1 dakika kaldıysa hatırlat
              scheduleReminderNotification(
                remainingSeconds,
                sessionDataRef.current.category
              ).then(id => {
                if (id) reminderNotificationIdRef.current = id;
              });
            }
          }
          
          if (newTime <= 0) {
            // Timer bitti
            setIsRunning(false);
            setIsPaused(false);
            if (sessionDataRef.current) {
              completeSession(true);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused]);

  const completeSession = async (completed: boolean) => {
    if (!sessionDataRef.current) return;

    const endTime = Date.now();
    const sessionDuration = Math.floor(
      (sessionDataRef.current.duration * 60 - timeLeft) / 60
    );
    const today = new Date().toISOString().split('T')[0];

    const session: FocusSession = {
      id: Date.now().toString(),
      startTime: sessionDataRef.current.startTime,
      endTime,
      duration: sessionDuration,
      category: sessionDataRef.current.category,
      distractionCount: sessionDataRef.current.distractions,
      completed,
      date: today,
    };

    await saveSession(session);
    
    // Timer tamamlandığında bildirim gönder
    if (completed) {
      await sendTimerCompleteNotification(
        sessionDataRef.current.category,
        sessionDuration
      );
    }
    
    // Bekleyen hatırlatma bildirimlerini iptal et
    if (reminderNotificationIdRef.current) {
      await cancelAllNotifications();
      reminderNotificationIdRef.current = null;
    }
    
    setSessionSummary(session);
    setShowSummary(true);
    sessionDataRef.current = null;
  };

  const handleStart = () => {
    if (!selectedCategory) {
      Alert.alert('Uyarı', 'Lütfen bir kategori seçin');
      return;
    }
    // Önce interval'ı temizle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Önceki bildirimleri iptal et
    cancelAllNotifications();
    reminderNotificationIdRef.current = null;
    
    setTimeLeft(selectedDuration * 60);
    const startTime = Date.now();
    setSessionStartTime(startTime);
    sessionDataRef.current = {
      startTime,
      duration: selectedDuration,
      category: selectedCategory,
      distractions: 0,
    };
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
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Bildirimleri iptal et
            cancelAllNotifications();
            reminderNotificationIdRef.current = null;
            
            setTimeLeft(selectedDuration * 60);
            setIsRunning(false);
            setIsPaused(false);
            setDistractionCount(0);
            setSessionStartTime(null);
            setShowSummary(false);
            sessionDataRef.current = null;
          },
        },
      ]
    );
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
            // Bildirimleri iptal et
            cancelAllNotifications();
            reminderNotificationIdRef.current = null;
            
            if (sessionDataRef.current) {
              sessionDataRef.current.distractions = distractionCount;
              completeSession(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setTimeLeft(selectedDuration * 60);
    setSessionStartTime(null);
    setDistractionCount(0);
    sessionDataRef.current = null;
  };

  const handleDurationChange = (duration: number) => {
    if (!isRunning && !isPaused) {
      setSelectedDuration(duration);
      setTimeLeft(duration * 60);
    }
  };

  // Dikkat dağınıklığı sayısını ref'e kaydet
  useEffect(() => {
    if (sessionDataRef.current) {
      sessionDataRef.current.distractions = distractionCount;
    }
  }, [distractionCount]);

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

        <View style={styles.categoryContainer}>
          <Text style={styles.label}>Süre Seçin (dakika):</Text>
          <View style={styles.durationSelector}>
            <TouchableOpacity
              style={[styles.durationButton, (!isRunning && !isPaused && selectedDuration > 5) ? styles.durationButtonActive : styles.durationButtonDisabled]}
              onPress={() => {
                if (!isRunning && !isPaused && selectedDuration > 5) {
                  handleDurationChange(selectedDuration - 5);
                }
              }}
              disabled={isRunning || isPaused || selectedDuration <= 5}
            >
              <Text style={[styles.durationButtonText, (!isRunning && !isPaused && selectedDuration > 5) ? styles.durationButtonTextActive : styles.durationButtonTextDisabled]}>−</Text>
            </TouchableOpacity>
            
            <View style={styles.durationDisplay}>
              <Text style={styles.durationValue}>{selectedDuration}</Text>
              <Text style={styles.durationUnit}>dakika</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.durationButton, (!isRunning && !isPaused && selectedDuration < 60) ? styles.durationButtonActive : styles.durationButtonDisabled]}
              onPress={() => {
                if (!isRunning && !isPaused && selectedDuration < 60) {
                  handleDurationChange(selectedDuration + 5);
                }
              }}
              disabled={isRunning || isPaused || selectedDuration >= 60}
            >
              <Text style={[styles.durationButtonText, (!isRunning && !isPaused && selectedDuration < 60) ? styles.durationButtonTextActive : styles.durationButtonTextDisabled]}>+</Text>
            </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 40,
    letterSpacing: -1,
    textAlign: 'center',
  },
  categoryContainer: {
    width: '100%',
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 8,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  durationButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  durationButtonActive: {
    backgroundColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  durationButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  durationButtonText: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  durationButtonTextActive: {
    color: '#FFFFFF',
  },
  durationButtonTextDisabled: {
    color: '#CBD5E1',
  },
  durationDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  durationValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  picker: {
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 30,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    minWidth: 280,
  },
  timerText: {
    fontSize: 88,
    fontWeight: '900',
    color: '#4A90E2',
    marginBottom: 12,
    letterSpacing: -3,
    textShadowColor: 'rgba(74, 144, 226, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  distractionContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  distractionText: {
    fontSize: 15,
    color: '#92400E',
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  startButton: {
    backgroundColor: '#4A90E2',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
  },
  resumeButton: {
    backgroundColor: '#10B981',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
  },
  resetButton: {
    backgroundColor: '#64748B',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 24,
    margin: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  summaryValue: {
    fontSize: 17,
    color: '#1E293B',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  closeButton: {
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
