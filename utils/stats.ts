import { FocusSession, SessionStats } from '../types';
import { getSessions } from './storage';

export const calculateStats = async (): Promise<SessionStats> => {
  const sessions = await getSessions();
  
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.date === today);
  const todayTotal = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  
  const allTimeTotal = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalDistractions = sessions.reduce((sum, s) => sum + s.distractionCount, 0);
  
  // Son 7 gün
  const last7Days: Array<{ date: string; duration: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter((s) => s.date === dateStr);
    const duration = daySessions.reduce((sum, s) => sum + s.duration, 0);
    last7Days.push({ date: dateStr, duration });
  }
  
  // Kategori dağılımı
  const categoryMap = new Map<string, number>();
  sessions.forEach((session) => {
    const current = categoryMap.get(session.category) || 0;
    categoryMap.set(session.category, current + session.duration);
  });
  
  const categoryDistribution = Array.from(categoryMap.entries()).map(([category, duration]) => {
    const percentage = allTimeTotal > 0 ? (duration / allTimeTotal) * 100 : 0;
    return { category, duration, percentage };
  });
  
  return {
    todayTotal,
    allTimeTotal,
    totalDistractions,
    last7Days,
    categoryDistribution,
  };
};










