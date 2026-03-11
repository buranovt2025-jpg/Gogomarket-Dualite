import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

export default function MyOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (error) {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, [user]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchOrders(); }, [user]);

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Новый': return '#007AFF';
      case 'В пути': return '#FF9500';
      case 'Доставлен': return '#34C759';
      case 'Отменен': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const itemsCount = item.items.reduce((sum: number, currentItem: any) => sum + (currentItem.quantity || 1), 0);
    return (
      <TouchableOpacity style={[styles.orderCard, { backgroundColor: colors.background, borderColor: colors.border }]} activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={[styles.orderId, { color: colors.text }]}>Заказ #{item.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.orderFooter}>
          <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>{itemsCount} {itemsCount === 1 ? 'товар' : itemsCount < 5 ? 'товара' : 'товаров'}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.orderTotal, { color: colors.text }]}>{formatPrice(item.total_amount)}</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Мои покупки</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}><ActivityIndicator size="large" color={colors.tint} /></View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Package size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>У вас пока нет заказов</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Перейдите в ленту, чтобы найти интересные товары</Text>
                <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)/')}>
                  <Text style={styles.shopButtonText}>Начать покупки</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  orderCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  orderDate: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsCount: { fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderTotal: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 },
  shopButton: { backgroundColor: '#FF5A00', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  shopButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
