import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  Alert,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Trash2, Clock, PackageX } from 'lucide-react-native';

type Product = {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  expires_at: string | null;
  created_at: string;
};

export default function MyProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyProducts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching my products:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список товаров');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyProducts();
  }, [user]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Удалить товар?',
      'Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
              Alert.alert('Ошибка', 'Не удалось удалить товар');
            } else {
              setProducts(products.filter(p => p.id !== id));
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  };

  const getDaysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const renderItem = ({ item }: { item: Product }) => {
    const imageUrl = item.images && item.images.length > 0 
      ? item.images[0] 
      : 'https://placehold.co/200x200/E5E5EA/8E8E93.png?text=Нет+фото';
    
    const daysLeft = getDaysLeft(item.expires_at);

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          
          <View style={styles.cardFooter}>
            {daysLeft !== null ? (
              <View style={[styles.statusBadge, daysLeft <= 3 ? styles.statusWarning : styles.statusActive]}>
                <Clock size={12} color={daysLeft <= 3 ? '#FF9500' : '#34C759'} />
                <Text style={[styles.statusText, daysLeft <= 3 ? styles.statusTextWarning : styles.statusTextActive]}>
                  {daysLeft > 0 ? `Осталось ${daysLeft} дн.` : 'Истекает'}
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusActive]}>
                <Text style={styles.statusTextActive}>Активно (Бизнес)</Text>
              </View>
            )}

            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои товары</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF5A00" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <PackageX size={64} color="#D1D1D6" />
              <Text style={styles.emptyTitle}>У вас пока нет товаров</Text>
              <Text style={styles.emptySubtitle}>Добавьте свой первый товар, чтобы начать продавать</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/add-product')}
              >
                <Text style={styles.addButtonText}>Добавить товар</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
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
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5A00',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusActive: {
    backgroundColor: '#E5F9E5',
  },
  statusWarning: {
    backgroundColor: '#FFF5E5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#34C759',
  },
  statusTextWarning: {
    color: '#FF9500',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addButton: {
    backgroundColor: '#FF5A00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
