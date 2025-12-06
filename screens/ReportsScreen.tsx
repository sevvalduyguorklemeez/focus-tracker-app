import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { SessionStats } from '../types';
import { calculateStats } from '../utils/stats';
import Pet from '../components/Pet';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await calculateStats();
    setStats(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const barData = {
    labels: stats.last7Days.map((day) => {
      const date = new Date(day.date);
      return date.toLocaleDateString('tr-TR', { weekday: 'short' });
    }),
    datasets: [
      {
        data: stats.last7Days.map((day) => day.duration),
      },
    ],
  };

  const pieData = stats.categoryDistribution.map((item) => ({
    name: `${item.category} (${item.percentage.toFixed(1)}%)`,
    population: item.duration,
    color: getColorForCategory(item.category),
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Raporlar</Text>

        {/* Evcil Hayvan */}
        <Pet totalMinutes={stats.allTimeTotal} />

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Bugün Toplam</Text>
            <Text style={styles.statValue}>{stats.todayTotal} dk</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tüm Zamanlar</Text>
            <Text style={styles.statValue}>{stats.allTimeTotal} dk</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Toplam Dikkat Dağınıklığı</Text>
            <Text style={styles.statValue}>{stats.totalDistractions}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Son 7 Gün</Text>
          <BarChart
            data={barData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" dk"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            showValuesOnTopOfBars
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>
                Henüz kategori verisi yok.{'\n'}Seans tamamladığınızda burada görünecek.
              </Text>
            </View>
          )}
        </View>

        {stats.categoryDistribution.length > 0 && (
          <View style={styles.categoryList}>
            <Text style={styles.chartTitle}>Kategori Detayları</Text>
            {stats.categoryDistribution.map((item, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={[styles.categoryColor, { backgroundColor: getColorForCategory(item.category) }]} />
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.categoryValue}>
                  {item.duration} dk ({item.percentage.toFixed(1)}%)
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getColorForCategory = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Ders Çalışma': '#4A90E2',
    'Kodlama': '#50C878',
    'Proje': '#FF6B6B',
    'Kitap Okuma': '#FFA500',
  };
  return colors[category] || '#999';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 28,
    letterSpacing: -1,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    width: '30%',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4A90E2',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  categoryList: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  categoryValue: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
