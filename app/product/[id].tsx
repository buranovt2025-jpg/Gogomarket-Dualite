import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, Dimensions, FlatList, Share, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MessageCircle, Heart, Share2, ShieldCheck, Star, ChevronRight, Bookmark } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import Toast from 'react-native-toast-message';

const MOCK_COMMENTS = [
  { id: '1', user: 'Алексей', avatar: 'https://placehold.co/100x100/E5E5EA/8E8E93.png?text=А', text: 'Отличный товар, полностью соответствует описанию. Рекомендую продавца!', rating: 5, date: 'Вчера' },
  { id: '2', user: 'Мадина', avatar: 'https://placehold.co/100x100/E5E5EA/8E8E93.png?text=М', text: 'Доставили быстро, качество супер. Буду заказывать еще.', rating: 4, date: '3 дня назад' }
];

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  // Адаптивность
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 800); // Макс ширина контента 800px

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data, error } = await supabase.from('products').select(`*, profiles (id, first_name, last_name, tier, avatar_url)`).eq('id', id).single();
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

  const handleShare = async () => {
    const shareMessage = `Смотри, что я нашел на GogoMarket: ${product.title} за ${formatPrice(product.price)}!`;
    try {
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      if (Platform.OS === 'web') {
        try {
          await navigator.clipboard.writeText(shareMessage);
          Toast.show({ type: 'success', text1: 'Скопировано', text2: 'Текст скопирован в буфер обмена', position: 'top' });
        } catch (clipboardError) {}
      }
    }
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#FF5A00" /></View>;
  if (!product) return <View style={styles.centerContainer}><Text>Товар не найден</Text></View>;

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  const images = product.images && product.images.length > 0 ? product.images : ['https://placehold.co/600x600/E5E5EA/8E8E93.png?text=Нет+фото'];
  const isBusiness = product.profiles?.tier === 'business';
  const isSaved = isFavorite(product.id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.headerIcon}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIcon} onPress={handleShare}><Share2 size={24} color="#1C1C1E" /></TouchableOpacity>
            <TouchableOpacity style={[styles.headerIcon, { marginLeft: 16 }]} onPress={() => setLiked(!liked)}>
              <Heart size={24} color={liked ? "#FF3B30" : "#1C1C1E"} fill={liked ? "#FF3B30" : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerIcon, { marginLeft: 16 }]} onPress={() => toggleFavorite(product)}>
              <Bookmark size={24} color="#1C1C1E" fill={isSaved ? "#1C1C1E" : "transparent"} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            <FlatList 
              data={images} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onScroll={(e) => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / contentWidth))}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => <Image source={{ uri: item }} style={{ width: contentWidth, height: contentWidth, backgroundColor: '#F2F2F7' }} resizeMode="cover" />}
            />
          </View>

          <View style={styles.content}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.title}>{product.title}</Text>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.sellerSection} onPress={() => router.push(`/store/${product.profiles?.id}`)} activeOpacity={0.7}>
              <View style={styles.sellerAvatar}><Text style={styles.sellerAvatarText}>{product.profiles?.first_name ? product.profiles.first_name[0].toUpperCase() : 'U'}</Text></View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{product.profiles?.first_name} {product.profiles?.last_name}</Text>
                <View style={styles.sellerTierRow}>
                  {isBusiness ? (
                    <><ShieldCheck size={14} color="#34C759" /><Text style={[styles.sellerTier, { color: '#34C759', marginLeft: 4 }]}>Проверенный магазин</Text></>
                  ) : (
                    <Text style={styles.sellerTier}>Частный продавец</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.description}>{product.description || 'Нет описания.'}</Text>

            <View style={styles.divider} />

            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Отзывы (2)</Text>
              <View style={styles.ratingBadge}><Star size={16} color="#FF9500" fill="#FF9500" /><Text style={styles.ratingText}>4.8</Text></View>
            </View>

            {MOCK_COMMENTS.map(comment => (
              <View key={comment.id} style={styles.commentCard}>
                <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}><Text style={styles.commentUser}>{comment.user}</Text><Text style={styles.commentDate}>{comment.date}</Text></View>
                  <View style={styles.starsRow}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} color={i < comment.rating ? "#FF9500" : "#E5E5EA"} fill={i < comment.rating ? "#FF9500" : "transparent"} />)}
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addCommentBtn} onPress={() => Toast.show({ type: 'info', text1: 'В разработке' })}>
              <Text style={styles.addCommentBtnText}>Оставить отзыв</Text>
            </TouchableOpacity>

          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.chatButton} onPress={() => router.push(`/chat/${product.seller_id}`)}>
            <MessageCircle size={24} color="#FF5A00" />
            <Text style={styles.chatButtonText}>Написать</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton} onPress={() => addToCart(product)}>
            <Text style={styles.buyButtonText}>В корзину</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', backgroundColor: '#fff', position: 'relative' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerActions: { flexDirection: 'row' },
  headerIcon: { padding: 4 },
  content: { padding: 16 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  title: { fontSize: 20, color: '#1C1C1E', marginBottom: 12, lineHeight: 28 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 20 },
  sellerSection: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF5A00', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sellerAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  sellerTierRow: { flexDirection: 'row', alignItems: 'center' },
  sellerTier: { fontSize: 14, color: '#8E8E93' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 16 },
  description: { fontSize: 15, color: '#3A3A3C', lineHeight: 24 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  ratingText: { color: '#FF9500', fontWeight: 'bold', fontSize: 14 },
  commentCard: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E5EA', marginRight: 12 },
  commentContent: { flex: 1, backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { fontWeight: 'bold', color: '#1C1C1E', fontSize: 14 },
  commentDate: { color: '#8E8E93', fontSize: 12 },
  starsRow: { flexDirection: 'row', marginBottom: 8, gap: 2 },
  commentText: { color: '#3A3A3C', fontSize: 14, lineHeight: 20 },
  addCommentBtn: { borderWidth: 1, borderColor: '#FF5A00', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  addCommentBtnText: { color: '#FF5A00', fontWeight: 'bold', fontSize: 14 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E5E5EA', gap: 12 },
  chatButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F0', borderRadius: 12, paddingVertical: 14, gap: 8 },
  chatButtonText: { color: '#FF5A00', fontSize: 16, fontWeight: '600' },
  buyButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF5A00', borderRadius: 12, paddingVertical: 14 },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
