import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  SafeAreaView,
  Dimensions,
  FlatList,
  Alert,
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MessageCircle, Heart, Share2, ShieldCheck, Star } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';

const { width } = Dimensions.get('window');

type ProductDetails = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    tier: string;
    avatar_url: string;
  };
};

// Моковые данные для отзывов
const MOCK_REVIEWS = [
  { 
    id: '1', 
    user: 'Алексей', 
    avatar: 'https://placehold.co/100x100/E5E5EA/8E8E93.png?text=А', 
    rating: 5, 
    date: '12 Марта 2024', 
    text: 'Отличный товар! Полностью соответствует описанию. Продавец быстро ответил и отправил заказ.' 
  },
  { 
    id: '2', 
    user: 'Мария', 
    avatar: 'https://placehold.co/100x100/E5E5EA/8E8E93.png?text=М', 
    rating: 4, 
    date: '10 Марта 2024', 
    text: 'Все хорошо, качество супер. Сняла одну звезду, потому что коробка была немного помята при доставке.' 
  },
];

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            profiles (id, first_name, last_name, tier, avatar_url)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5A00" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Товар не найден</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Text style={styles.backBtnText}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  };

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://placehold.co/600x600/E5E5EA/8E8E93.png?text=Нет+фото'];

  const isBusiness = product.profiles?.tier === 'business';
  const liked = isFavorite(product.id);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  const handleLeaveReview = () => {
    Alert.alert('Оставить отзыв', 'Функция добавления отзыва будет доступна после настройки базы данных для отзывов.');
  };

  // Функция нативного шеринга
  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Смотри, что я нашел на GogoMarket: ${product.title} за ${formatPrice(product.price)}!`,
        title: product.title,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Поделились через конкретное приложение
          console.log('Shared via', result.activityType);
        } else {
          // Просто поделились
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Окно шеринга было закрыто
        console.log('Share dismissed');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.headerIcon}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleShare}>
            <Share2 size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerIcon, { marginLeft: 16 }]} onPress={() => toggleFavorite(product)}>
            <Heart size={24} color={liked ? "#FF3B30" : "#1C1C1E"} fill={liked ? "#FF3B30" : "transparent"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image Carousel */}
        <View>
          <FlatList 
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
            )}
          />
          {/* Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.paginationContainer}>
              {images.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    currentImageIndex === index ? styles.activeDot : styles.inactiveDot
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title & Price */}
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.title}>{product.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(product.created_at).toLocaleDateString('ru-RU')}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {product.profiles?.first_name ? product.profiles.first_name[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>
                {product.profiles?.first_name} {product.profiles?.last_name}
              </Text>
              <View style={styles.sellerTierRow}>
                {isBusiness ? (
                  <>
                    <ShieldCheck size={14} color="#34C759" />
                    <Text style={[styles.sellerTier, { color: '#34C759', marginLeft: 4 }]}>
                      Проверенный магазин
                    </Text>
                  </>
                ) : (
                  <Text style={styles.sellerTier}>Частное лицо</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>
            {product.description || 'Продавец не добавил описание к этому товару.'}
          </Text>

          <View style={styles.divider} />

          {/* Reviews Section */}
          <Text style={styles.sectionTitle}>Отзывы</Text>
          
          <View style={styles.ratingSummary}>
            <Text style={styles.ratingBigText}>4.8</Text>
            <View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={18} color="#FF9500" fill={i <= 4 ? "#FF9500" : "transparent"} />
                ))}
              </View>
              <Text style={styles.reviewCount}>На основе 12 отзывов</Text>
            </View>
          </View>

          {MOCK_REVIEWS.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewAuthor}>{review.user}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={12} color="#FF9500" fill={i <= review.rating ? "#FF9500" : "transparent"} />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.leaveReviewBtn} onPress={handleLeaveReview}>
            <Text style={styles.leaveReviewBtnText}>Оставить отзыв</Text>
          </TouchableOpacity>

        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton} onPress={() => router.push(`/chat/${product.seller_id}`)}>
          <MessageCircle size={24} color="#FF5A00" />
          <Text style={styles.chatButtonText}>Написать</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton} onPress={() => addToCart(product)}>
          <Text style={styles.buyButtonText}>В корзину</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#8E8E93', marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F2F2F7', borderRadius: 8 },
  backBtnText: { color: '#1C1C1E', fontWeight: '600' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  headerActions: { flexDirection: 'row' },
  headerIcon: { padding: 4 },
  image: { width: width, height: width, backgroundColor: '#F2F2F7' },
  paginationContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    position: 'absolute', bottom: 16, width: '100%',
  },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  activeDot: { width: 24, backgroundColor: '#FF5A00' },
  inactiveDot: { width: 8, backgroundColor: 'rgba(255,255,255,0.8)' },
  content: { padding: 16 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  title: { fontSize: 20, color: '#1C1C1E', marginBottom: 12, lineHeight: 28 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  dateText: { fontSize: 12, color: '#C7C7CC' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 20 },
  sellerSection: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF5A00',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  sellerAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  sellerTierRow: { flexDirection: 'row', alignItems: 'center' },
  sellerTier: { fontSize: 14, color: '#8E8E93' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 16 },
  description: { fontSize: 15, color: '#3A3A3C', lineHeight: 24 },
  
  /* Стили для отзывов */
  ratingSummary: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12 },
  ratingBigText: { fontSize: 40, fontWeight: 'bold', color: '#1C1C1E', marginRight: 16 },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  reviewCount: { fontSize: 13, color: '#8E8E93' },
  reviewCard: { marginBottom: 20 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  reviewDate: { fontSize: 12, color: '#8E8E93' },
  reviewText: { fontSize: 14, color: '#3A3A3C', lineHeight: 20 },
  leaveReviewBtn: { 
    borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, 
    paddingVertical: 14, alignItems: 'center', marginTop: 8 
  },
  leaveReviewBtnText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    flexDirection: 'row', padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#E5E5EA', gap: 12,
  },
  chatButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF5F0', borderRadius: 12, paddingVertical: 14, gap: 8,
  },
  chatButtonText: { color: '#FF5A00', fontSize: 16, fontWeight: '600' },
  buyButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF5A00', borderRadius: 12, paddingVertical: 14,
  },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
