import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, Share, Platform, useWindowDimensions, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MessageCircle, Heart, Share2, ShieldCheck, Star, ChevronRight, Bookmark, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import Toast from 'react-native-toast-message';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Состояния для полноэкранного просмотра
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width, 800);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const { data: productData } = await supabase.from('products').select(`*, profiles (id, first_name, last_name, tier, avatar_url)`).eq('id', id).single();
        setProduct(productData);
        const { data: reviewsData } = await supabase.from('reviews').select('*, profiles(first_name, avatar_url)').eq('product_id', id).order('created_at', { ascending: false });
        setReviews(reviewsData || []);
      } catch (error) {} finally { setLoading(false); }
    };
    if (id) fetchProductAndReviews();
  }, [id]);

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (activeImageIndex !== roundIndex) {
      setActiveImageIndex(roundIndex);
    }
  };

  const openFullScreen = (index: number) => {
    setFullScreenIndex(index);
    setIsFullScreen(true);
  };

  if (loading) return <View style={[styles.centerContainer, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.tint} /></View>;
  if (!product) return <View style={[styles.centerContainer, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>Товар не найден</Text></View>;

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  const images = product.images && product.images.length > 0 ? product.images : ['https://placehold.co/600x600/E5E5EA/8E8E93.png?text=Нет+фото'];
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        
        <View style={styles.floatingHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonContainer}>
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.iconButtonBlur}>
              <ArrowLeft size={24} color={colors.icon} />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButtonContainer}>
              <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.iconButtonBlur}>
                <Share2 size={24} color={colors.icon} />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButtonContainer, { marginLeft: 12 }]} onPress={() => toggleFavorite(product)}>
              <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.iconButtonBlur}>
                <Bookmark size={24} color={colors.icon} fill={isFavorite(product.id) ? colors.icon : "transparent"} />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ width: contentWidth, height: contentWidth }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              style={{ width: contentWidth, height: contentWidth }}
            >
              {images.map((img: string, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  activeOpacity={0.9} 
                  onPress={() => openFullScreen(index)}
                >
                  <Image 
                    source={{ uri: img }} 
                    style={{ width: contentWidth, height: contentWidth, backgroundColor: colors.border }} 
                    resizeMode="cover" 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Индикаторы страниц (точки) */}
            {images.length > 1 && (
              <View style={styles.pagination}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activeImageIndex === index ? styles.activeDot : styles.inactiveDot
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={[styles.content, { backgroundColor: colors.background }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.text }]}>{formatPrice(product.price)}</Text>
              <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.likeBtn}>
                <Heart size={28} color={liked ? colors.danger : colors.icon} fill={liked ? colors.danger : "transparent"} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.title, { color: colors.textSecondary }]}>{product.title}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={[styles.sellerSection, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => router.push(`/store/${product.profiles?.id}`)}>
              <Image source={{ uri: product.profiles?.avatar_url || `https://placehold.co/100/FF5A00/FFF?text=${product.profiles?.first_name?.[0] || 'U'}` }} style={styles.sellerAvatar} />
              <View style={styles.sellerInfo}>
                <Text style={[styles.sellerName, { color: colors.text }]}>{product.profiles?.first_name} {product.profiles?.last_name}</Text>
                <View style={styles.sellerTierRow}>
                  {product.profiles?.tier === 'business' ? (
                    <><ShieldCheck size={14} color={colors.success} /><Text style={[styles.sellerTier, { color: colors.success, marginLeft: 4 }]}>Проверенный магазин</Text></>
                  ) : (
                    <Text style={[styles.sellerTier, { color: colors.textSecondary }]}>Частный продавец</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Описание</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description || 'Нет описания.'}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Отзывы ({reviews.length})</Text>
              {reviews.length > 0 && (
                <View style={styles.ratingBadge}>
                  <Star size={16} color="#FF9500" fill="#FF9500" />
                  <Text style={styles.ratingText}>{avgRating}</Text>
                </View>
              )}
            </View>

            {reviews.length === 0 ? (
              <Text style={[styles.noReviewsText, { color: colors.textSecondary }]}>Пока нет отзывов. Будьте первым!</Text>
            ) : (
              reviews.map(comment => (
                <View key={comment.id} style={[styles.commentCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Image source={{ uri: comment.profiles?.avatar_url || `https://placehold.co/100/E5E5EA/8E8E93?text=U` }} style={styles.commentAvatar} />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentUser, { color: colors.text }]}>{comment.profiles?.first_name}</Text>
                      <Text style={[styles.commentDate, { color: colors.textSecondary }]}>{new Date(comment.created_at).toLocaleDateString('ru-RU')}</Text>
                    </View>
                    <View style={styles.starsRow}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} color={i < comment.rating ? "#FF9500" : colors.border} fill={i < comment.rating ? "#FF9500" : "transparent"} />)}
                    </View>
                    {comment.text && <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>}
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={[styles.addCommentBtn, { borderColor: colors.tint }]} onPress={() => router.push(`/add-review?productId=${product.id}`)}>
              <Text style={[styles.addCommentBtnText, { color: colors.tint }]}>Оставить отзыв</Text>
            </TouchableOpacity>

          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={styles.bottomBarBlur}>
          <View style={styles.bottomBarContent}>
            <TouchableOpacity style={[styles.chatButton, { backgroundColor: isDark ? '#331200' : '#FFF5F0' }]} onPress={() => router.push(`/chat/${product.seller_id}`)}>
              <MessageCircle size={24} color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyButtonContainer} onPress={() => addToCart(product)}>
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.buyButton}>
                <Text style={styles.buyButtonText}>В корзину</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Полноэкранный просмотрщик изображений */}
        <Modal
          visible={isFullScreen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsFullScreen(false)}
        >
          <View style={styles.fullScreenContainer}>
            <SafeAreaView style={{ flex: 1 }}>
              <TouchableOpacity 
                style={styles.closeFullScreenBtn} 
                onPress={() => setIsFullScreen(false)}
              >
                <X size={28} color="#fff" />
              </TouchableOpacity>
              
              <FlatList
                data={images}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={fullScreenIndex}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                  setFullScreenIndex(idx);
                }}
                renderItem={({ item }) => (
                  <View style={{ width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <Image 
                      source={{ uri: item }} 
                      style={{ width: '100%', height: '100%' }} 
                      resizeMode="contain" 
                    />
                  </View>
                )}
              />

              {images.length > 1 && (
                <View style={[styles.pagination, { bottom: 40 }]}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        fullScreenIndex === index ? styles.activeDot : styles.inactiveDot
                      ]}
                    />
                  ))}
                </View>
              )}
            </SafeAreaView>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', position: 'relative' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  floatingHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconButtonContainer: { borderRadius: 22, overflow: 'hidden' },
  iconButtonBlur: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row' },
  
  pagination: { position: 'absolute', bottom: 48, flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  activeDot: { width: 20, backgroundColor: '#FF5A00' },
  inactiveDot: { width: 8, backgroundColor: 'rgba(255, 255, 255, 0.6)' },

  content: { padding: 20, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 8 },
  price: { fontSize: 32, fontWeight: '900' },
  likeBtn: { padding: 8 },
  title: { fontSize: 18, lineHeight: 26, fontWeight: '500' },
  divider: { height: 1, marginVertical: 24, opacity: 0.5 },
  sellerSection: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  sellerAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  sellerTierRow: { flexDirection: 'row', alignItems: 'center' },
  sellerTier: { fontSize: 13 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  description: { fontSize: 16, lineHeight: 26 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  ratingText: { color: '#FF9500', fontWeight: 'bold', fontSize: 15 },
  noReviewsText: { fontStyle: 'italic', marginBottom: 16 },
  commentCard: { flexDirection: 'row', marginBottom: 16, padding: 16, borderRadius: 20, borderWidth: 1 },
  commentAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { fontWeight: 'bold', fontSize: 15 },
  commentDate: { fontSize: 12 },
  starsRow: { flexDirection: 'row', marginBottom: 8, gap: 2 },
  commentText: { fontSize: 15, lineHeight: 22 },
  addCommentBtn: { borderWidth: 1.5, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  addCommentBtnText: { fontWeight: 'bold', fontSize: 16 },
  bottomBarBlur: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 0.5, borderTopColor: 'rgba(150,150,150,0.2)' },
  bottomBarContent: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 20, gap: 12 },
  chatButton: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  buyButtonContainer: { flex: 1 },
  buyButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20, height: 60 },
  buyButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Стили для полноэкранного просмотра
  fullScreenContainer: { flex: 1, backgroundColor: '#000' },
  closeFullScreenBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, zIndex: 100, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
});
