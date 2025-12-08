import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusSession } from '../types';

const SESSIONS_KEY = '@focus_sessions';

export const saveSession = async (session: FocusSession): Promise<void> => {
  try {
    const existingSessions = await getSessions();
    const updatedSessions = [...existingSessions, session];
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getSessions = async (): Promise<FocusSession[]> => {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

export const clearAllSessions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
};









