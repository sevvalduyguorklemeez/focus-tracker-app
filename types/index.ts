export interface FocusSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // dakika cinsinden
  category: string;
  distractionCount: number;
  completed: boolean;
  date: string; // YYYY-MM-DD formatında
}

export type Category = 'Ders Çalışma' | 'Kodlama' | 'Proje' | 'Kitap Okuma';

export interface SessionStats {
  todayTotal: number; // dakika
  allTimeTotal: number; // dakika
  totalDistractions: number;
  last7Days: Array<{ date: string; duration: number }>;
  categoryDistribution: Array<{ category: string; duration: number; percentage: number }>;
}


