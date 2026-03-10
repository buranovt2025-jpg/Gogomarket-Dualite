import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react-native';

export default function CartScreen() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { session } = useAuth();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  };

  const handleCheckout = () => {
    if (!session) {
      Alert.alert(
        'Требуется авторизация', 
        'Пожалуйста, войдите в аккаунт, чтобы оформить заказ.',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Войти', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }

    Alert.alert(
      'Оформление заказа',
      'В MVP версии заказ оформляется автоматически (демо).',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Подтвердить', 
          onPress: () => {
            clearCart();
            Alert.alert('Успешно', 'Ваш заказ успешно оформлен!');
            router.push('/(tabs)/');
          }
        }
      ]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.headerAbsolute}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyIconContainer}>
          <ShoppingBag size={64} color="#D1D1D6" />
        </View>
        <Text style={styles.emptyTitle}>Корзина пуста</Text>
        <Text style={styles.emptySubtitle}>Найдите что-нибудь интересное в ленте товаров</Text>
        <TouchableOpacity 
          style={styles.goShoppingBtn}
          onPress={() => router.push('/(tabs)/')}
        >
          <Text style={styles.goShoppingBtnText}>Перейти к покупкам</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Корзина</Text>
        </View>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Очистить</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              
              <View style={styles.itemActions}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={16} color="#1C1C1E" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={16} color="#1C1C1E" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.removeBtn}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Итого:</Text>
          <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Оформить заказ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  clearText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5A00',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  qtyBtn: {
    padding: 8,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    color: '#1C1C1E',
  },
  removeBtn: {
    padding: 8,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    color: '#8E8E93',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  checkoutBtn: {
    backgroundColor: '#FF5A00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  goShoppingBtn: {
    backgroundColor: '#FF5A00',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  goShoppingBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
