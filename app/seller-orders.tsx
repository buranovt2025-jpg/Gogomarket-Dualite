import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Inbox, CheckCircle, Truck, XCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import Toast from 'react-native-toast-message';

export default function SellerOrdersScreen() {
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
      const { data } = await supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (error) {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, [user]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchOrders(); }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      Toast.show({ type: 'success', text1: 'Статус обновлен', text2: `Заказ теперь: ${newStatus}` });
    } catch (error) { Alert.alert('Ошибка', 'Не удалось обновить статус'); }
  };

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Новый': return '#007AFF';
      case 'В пути': return '#FF9500';
      case 'Доставлен': return '#34C759';
      case 'Отменен': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.orderCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
      {item.items.map((prod: any, index: number) => (
        <View key={index} style={styles.productRow}>
          <Image source={{ uri: prod.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>{prod.title}</Text>
            <Text style={[styles.productQty, { color: colors.textSecondary }]}>{prod.quantity} шт. x {formatPrice(prod.price)}</Text>
          </View>
        </View>
      ))}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Итого к оплате:</Text>
        <Text style={styles.totalAmount}>{formatPrice(item.total_amount)}</Text>
      </View>
      {item.status !== 'Доставлен' && item.status !== 'Отменен' && (
        <View style={styles.actionsRow}>
          {item.status === 'Новый' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF9500' }]} onPress={() => updateOrderStatus(item.id, 'В пути')}>
              <Truck size={16} color="#fff" /><Text style={styles.actionBtnText}>Отправить</Text>
            </TouchableOpacity>
          )}
          {item.status === 'В пути' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34C759' }]} onPress={() => updateOrderStatus(item.id, 'Доставлен')}>
              <CheckCircle size={16} color="#fff" /><Text style={styles.actionBtnText}>Доставлен</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]} onPress={() => updateOrderStatus(item.id, 'Отменен')}>
            <XCircle size={16} color="#FF3B30" /><Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Отменить</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Входящие заказы</Text>
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
                <Inbox size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Нет новых заказов</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Когда кто-то купит ваш товар, заказ появится здесь.</Text>
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
  orderCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  orderDate: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#E5E5EA', marginRight: 12 },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 14, marginBottom: 2 },
  productQty: { fontSize: 13 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 15 },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#FF5A00' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
