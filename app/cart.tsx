import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import Toast from 'react-native-toast-message';

export default function CartScreen() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { session, user } = useAuth();
  const router = useRouter();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  const handleCheckout = async () => {
    if (!session || !user) { 
      Alert.alert('Требуется авторизация', 'Войдите в аккаунт, чтобы оформить заказ.'); 
      router.push('/(auth)/login');
      return; 
    }
    Alert.alert('Оформление заказа', 'Вы уверены, что хотите оформить этот заказ?', [{ text: 'Отмена', style: 'cancel' }, { text: 'Подтвердить', onPress: processCheckout }]);
  };

  const processCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const ordersBySeller = items.reduce((acc: any, item) => {
        if (!acc[item.seller_id]) acc[item.seller_id] = { items: [], total: 0 };
        acc[item.seller_id].items.push(item);
        acc[item.seller_id].total += item.price * item.quantity;
        return acc;
      }, {});

      const orderPromises = Object.entries(ordersBySeller).map(([sellerId, data]: [string, any]) => {
        return supabase.from('orders').insert({ buyer_id: user?.id, seller_id: sellerId, items: data.items, total_amount: data.total, status: 'Новый' });
      });

      const results = await Promise.all(orderPromises);
      if (results.some(result => result.error)) throw new Error('Не удалось создать некоторые заказы');

      clearCart();
      Toast.show({ type: 'success', text1: 'Заказ оформлен!', text2: 'Продавец скоро свяжется с вами.', position: 'top' });
      router.push('/my-orders');
    } catch (error: any) { Alert.alert('Ошибка оформления', error.message || 'Произошла ошибка при оформлении заказа'); } finally { setIsCheckingOut(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Корзина</Text>
          </View>
          {items.length > 0 && (
            <TouchableOpacity onPress={clearCart} disabled={isCheckingOut}>
              <Text style={styles.clearText}>Очистить</Text>
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.backgroundSecondary }]}><ShoppingBag size={64} color={colors.textSecondary} /></View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Корзина пуста</Text>
            <TouchableOpacity style={styles.goShoppingBtn} onPress={() => router.push('/(tabs)/')}>
              <Text style={styles.goShoppingBtnText}>Перейти к покупкам</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={[styles.cartItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                    <View style={styles.itemActions}>
                      <View style={[styles.quantityControl, { backgroundColor: colors.backgroundSecondary }]}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)} disabled={isCheckingOut}>
                          <Minus size={16} color={colors.icon} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)} disabled={isCheckingOut}>
                          <Plus size={16} color={colors.icon} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)} disabled={isCheckingOut}>
                        <Trash2 size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Итого:</Text>
                <Text style={[styles.totalPrice, { color: colors.text }]}>{formatPrice(totalPrice)}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>Оформить заказ</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  clearText: { fontSize: 16, color: '#FF3B30' },
  listContent: { padding: 16 },
  cartItem: { flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#E5E5EA', marginRight: 12 },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemTitle: { fontSize: 16, marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF5A00' },
  itemActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
  qtyBtn: { padding: 8 },
  qtyText: { fontSize: 16, fontWeight: '600', paddingHorizontal: 12 },
  removeBtn: { padding: 8 },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 18 },
  totalPrice: { fontSize: 24, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
  goShoppingBtn: { backgroundColor: '#FF5A00', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  goShoppingBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#FF5A00', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
