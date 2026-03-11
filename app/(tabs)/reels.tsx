import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, useWindowDimensions, Share, Platform, TextInput, KeyboardAvoidingView, RefreshControl, TouchableWithoutFeedback } from 'react-native';
import { Heart, MessageCircle, Share2, ShoppingBag, X, Send, ArrowLeft, Volume2, VolumeX } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { useThemeContext } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Video, ResizeMode } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';

export default function ReelsScreen() {
  const router = useRouter();
  const { initialReelId } = useLocalSearchParams();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);
  
  const [reels, setReels] = useState<any[]>([]);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  
  const [activeCommentsReel, setActiveCommentsReel] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Получаем точные размеры экрана
  const { width, height } = useWindowDimensions();
  
  const reelId = Array.isArray(initialReelId) ? initialReelId[0] : initialReelId;

  const [activeIndex, setActiveIndex] = useState(0);
  const initialScrollDone = useRef(false);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const fetchReels = async () => {
    const { data } = await supabase.from('reels').select('*, profiles(first_name, avatar_url), products(price)').order('created_at', { ascending: false });
    const fetchedReels = data || [];
    setReels(fetchedReels);
    
    if (reelId && !initialScrollDone.current) {
      const idx = fetchedReels.findIndex(r => r.id === reelId);
      if (idx >= 0) {
        setActiveIndex(idx);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        }, 200);
      }
      initialScrollDone.current = true;
    }

    if (user) {
      const { data: likes } = await supabase.from('reel_likes').select('reel_id').eq('user_id', user.id);
      if (likes) setLikedReels(new Set(likes.map(l => l.reel_id)));
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchReels(); }, [user]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchReels(); }, [user]);

  const toggleLike = async (id: string, currentLikes: number) => {
    if (!user) { Toast.show({ type: 'error', text1: 'Войдите в аккаунт' }); return; }
    const isLiked = likedReels.has(id);
    const newLikedReels = new Set(likedReels);
    
    if (isLiked) {
      newLikedReels.delete(id);
      setReels(reels.map(r => r.id === id ? { ...r, likes_count: Math.max(0, currentLikes - 1) } : r));
      await supabase.from('reel_likes').delete().eq('user_id', user.id).eq('reel_id', id);
      await supabase.from('reels').update({ likes_count: Math.max(0, currentLikes - 1) }).eq('id', id);
    } else {
      newLikedReels.add(id);
      setReels(reels.map(r => r.id === id ? { ...r, likes_count: currentLikes + 1 } : r));
      await supabase.from('reel_likes').insert({ user_id: user.id, reel_id: id });
      await supabase.from('reels').update({ likes_count: currentLikes + 1 }).eq('id', id);
    }
    setLikedReels(newLikedReels);
  };

  const handleShare = async (reel: any) => {
    const shareMessage = `Смотри крутое видео на GogoMarket: ${reel.description}`;
    const incrementShare = async () => {
      setReels(reels.map(r => r.id === reel.id ? { ...r, shares_count: r.shares_count + 1 } : r));
      await supabase.from('reels').update({ shares_count: reel.shares_count + 1 }).eq('id', reel.id);
    };

    if (Platform.OS === 'web') {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareMessage);
          Toast.show({ type: 'success', text1: 'Ссылка скопирована' });
          incrementShare();
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = shareMessage;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          Toast.show({ type: 'success', text1: 'Ссылка скопирована' });
          incrementShare();
        }
      } catch (error) { Toast.show({ type: 'error', text1: 'Ошибка', text2: 'Нет доступа к буферу обмена' }); }
    } else {
      try {
        const result = await Share.share({ message: shareMessage });
        if (result.action === Share.sharedAction) incrementShare();
      } catch (error) { console.error(error); }
    }
  };

  const openComments = async (reelId: string) => {
    setActiveCommentsReel(reelId);
    setLoadingComments(true);
    const { data } = await supabase.from('reel_comments').select('*, profiles(first_name, avatar_url)').eq('reel_id', reelId).order('created_at', { ascending: true });
    setComments(data || []);
    setLoadingComments(false);
  };

  const sendComment = async () => {
    if (!user) { Toast.show({ type: 'error', text1: 'Войдите в аккаунт' }); return; }
    if (!newComment.trim() || !activeCommentsReel) return;

    const text = newComment.trim();
    setNewComment('');
    const tempComment = { id: Math.random().toString(), text, created_at: new Date().toISOString(), profiles: { first_name: 'Вы' } };
    setComments([...comments, tempComment]);

    const { error } = await supabase.from('reel_comments').insert({ reel_id: activeCommentsReel, user_id: user.id, text });
    if (!error) {
      const currentReel = reels.find(r => r.id === activeCommentsReel);
      if (currentReel) {
        setReels(reels.map(r => r.id === activeCommentsReel ? { ...r, comments_count: r.comments_count + 1 } : r));
        await supabase.from('reels').update({ comments_count: currentReel.comments_count + 1 }).eq('id', activeCommentsReel);
      }
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const formatPrice = (price: number) => price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS" : '';
    const isLiked = likedReels.has(item.id);
    const isActive = index === activeIndex;
    const isPlaying = isActive && isFocused;

    return (
      <View style={[styles.reelContainer, { width, height }]}>
        <TouchableWithoutFeedback onPress={() => setIsGlobalMuted(!isGlobalMuted)}>
          <View style={StyleSheet.absoluteFill}>
            <Video
              source={{ uri: item.video_url }}
              style={styles.videoBackground}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying}
              isLooping={index === reels.length - 1}
              isMuted={isGlobalMuted}
              onPlaybackStatusUpdate={(status: any) => {
                if (status.isLoaded && status.didJustFinish && isActive) {
                  if (index < reels.length - 1) {
                    flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
                  }
                }
              }}
            />
            <View style={styles.overlay} />
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/store/${item.seller_id}`)}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.profiles?.avatar_url || `https://placehold.co/100x100/FF5A00/FFF?text=${item.profiles?.first_name?.[0] || 'U'}` }} style={styles.avatar} />
              <View style={styles.followBadge}><Text style={styles.followBadgeText}>+</Text></View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.id, item.likes_count)}>
            <Heart size={32} color={isLiked ? "#FF3B30" : "#fff"} fill={isLiked ? "#FF3B30" : "transparent"} />
            <Text style={styles.actionText}>{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item.id)}>
            <MessageCircle size={32} color="#fff" />
            <Text style={styles.actionText}>{item.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
            <Share2 size={32} color="#fff" />
            <Text style={styles.actionText}>{item.shares_count}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          <TouchableOpacity onPress={() => router.push(`/store/${item.seller_id}`)}>
            <Text style={styles.username}>{item.profiles?.first_name || 'User'}</Text>
          </TouchableOpacity>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          {item.product_id && item.products && (
            <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/product/${item.product_id}`)}>
              <ShoppingBag size={16} color="#fff" />
              <Text style={styles.productPrice}>{formatPrice(item.products.price)}</Text>
              <Text style={styles.productAction}>Купить</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}><ActivityIndicator size="large" color="#FF5A00" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.responsiveWrapper, { width }]}>
        
        <SafeAreaView style={styles.topNavigationSafeArea}>
          <View style={styles.topNavigation}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
              <View style={styles.backButtonBg}>
                <ArrowLeft size={24} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.navTabs}>
              <Text style={styles.topNavTextInactive}>Подписки</Text>
              <Text style={styles.topNavTextActive}>Рекомендации</Text>
            </View>
            
            <TouchableOpacity style={styles.backButton} onPress={() => setIsGlobalMuted(!isGlobalMuted)}>
              <View style={styles.backButtonBg}>
                {isGlobalMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <FlatList
          ref={flatListRef}
          data={reels}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(data, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={['#FF5A00']} progressViewOffset={Platform.OS === 'ios' ? 80 : 40} />}
        />

        {activeCommentsReel && (
          <View style={[styles.commentsModal, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={[styles.commentsHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>Комментарии</Text>
              <TouchableOpacity onPress={() => setActiveCommentsReel(null)}><X size={24} color={colors.icon} /></TouchableOpacity>
            </View>
            
            {loadingComments ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#FF5A00" />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Image source={{ uri: item.profiles?.avatar_url || `https://placehold.co/100/E5E5EA/8E8E93?text=${item.profiles?.first_name?.[0] || 'U'}` }} style={styles.commentAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentName, { color: colors.textSecondary }]}>{item.profiles?.first_name}</Text>
                      <Text style={[styles.commentText, { color: colors.text }]}>{item.text}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>Нет комментариев. Будьте первым!</Text>}
              />
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[styles.commentInputContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <TextInput
                  style={[styles.commentInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                  placeholder="Добавить комментарий..."
                  placeholderTextColor={colors.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendComment} disabled={!newComment.trim()}>
                  <Send size={20} color={newComment.trim() ? "#FF5A00" : colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, alignSelf: 'center', backgroundColor: 'transparent' },
  
  topNavigationSafeArea: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
  navTabs: { flexDirection: 'row', gap: 20 },
  topNavTextActive: { color: '#fff', fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  topNavTextInactive: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '600' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButtonBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  
  reelContainer: { justifyContent: 'flex-end' },
  videoBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', top: '50%' },
  
  // Поднимаем кнопки и текст выше, чтобы они не перекрывались нижним TabBar
  rightActions: { position: 'absolute', right: 16, bottom: Platform.OS === 'ios' ? 120 : 100, alignItems: 'center', gap: 24, zIndex: 10 },
  actionButton: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 },
  avatarContainer: { marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  followBadge: { position: 'absolute', bottom: -8, alignSelf: 'center', backgroundColor: '#FF5A00', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  followBadgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 18 },
  
  // Добавляем отступ снизу для текста, чтобы он был над TabBar
  bottomInfo: { padding: 16, paddingRight: 80, paddingBottom: Platform.OS === 'ios' ? 100 : 80, zIndex: 10 },
  username: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  description: { color: '#fff', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  productPrice: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 8, marginRight: 12 },
  productAction: { color: '#FF5A00', fontSize: 14, fontWeight: 'bold' },
  
  commentsModal: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, borderWidth: 1 },
  commentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  commentsTitle: { fontSize: 18, fontWeight: 'bold' },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentName: { fontSize: 12, marginBottom: 2 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  commentInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, marginRight: 12 },
  sendBtn: { padding: 8 },
});
