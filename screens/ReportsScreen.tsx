import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { SessionStats } from '../types';
import { calculateStats } from '../utils/stats';

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
    name: item.category,
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

        {pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
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
          </View>
        )}

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
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '30%',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoryList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#333',
  },
  categoryValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});
