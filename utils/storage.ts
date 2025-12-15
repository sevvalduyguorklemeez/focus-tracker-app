import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { FocusSession } from '../types';

const SESSIONS_KEY = '@focus_sessions';

// Firebase'e session kaydet
const saveSessionToFirebase = async (session: FocusSession): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'sessions'), {
        ...session,
        odid: user.uid,
        odcreatedAt: new Date(),
      });
    }
  } catch (error) {
    console.log('Firebase kayıt hatası (normal olabilir):', error);
  }
};

// Session kaydet (hem yerel hem Firebase)
export const saveSession = async (session: FocusSession): Promise<void> => {
  try {
    // Yerel depolama
    const existingSessions = await getSessions();
    const updatedSessions = [...existingSessions, session];
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    
    // Firebase'e de kaydet
    await saveSessionToFirebase(session);
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

// Session'ları al (yerel depolamadan)
export const getSessions = async (): Promise<FocusSession[]> => {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

// Tüm session'ları temizle
export const clearAllSessions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
};
