import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, TouchableOpacity, Image, SafeAreaView, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Search, Plus, ShoppingCart, Play, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import { useThemeContext } from '../../context/ThemeContext';
import Skeleton from '../../components/Skeleton';
import { Colors } from '../../constants/Colors';
import { Video, ResizeMode } from 'expo-av';

const CATEGORIES = ['Все', 'Электроника', 'Одежда', 'Дом и сад', 'Авто', 'Услуги'];
const LOGO_LIGHT = 'https://images.dualite.app/d5f3f285-d75c-4283-a4c0-6b6cacd910a4/asset-4166a9e1-b311-4a78-b40a-89462e577da5.webp';
const LOGO_DARK = 'https://images.dualite.app/d5f3f285-d75c-4283-a4c0-6b6cacd910a4/asset-477bfb1a-ce8f-4c93-948e-85e0ff3e2934.webp';

export default function FeedScreen() {
  const [feedBlocks, setFeedBlocks] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Все');
  
  const router = useRouter();
  const { items } = useCart();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const flatListRef = useRef<FlatList>(null);

  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 800);
  const ITEM_SIZE = contentWidth / 3;

  const buildBlocks = (products: any[], reels: any[]) => {
    const blocks = [];
    let pIdx = 0;
    let rIdx = 0;
    let isReelLeft = true;

    while (pIdx < products.length || rIdx < reels.length) {
      if (rIdx < reels.length && pIdx + 4 <= products.length) {
        blocks.push({ id: `block-mixed-${rIdx}-${pIdx}`, type: isReelLeft ? 'reel-left' : 'reel-right', reel: reels[rIdx], products: products.slice(pIdx, pIdx + 4) });
        rIdx++; pIdx += 4; isReelLeft = !isReelLeft;
      } else if (pIdx + 3 <= products.length) {
        blocks.push({ id: `block-row-${pIdx}`, type: 'row', items: products.slice(pIdx, pIdx + 3) });
        pIdx += 3;
      } else {
        const remaining = [];
        while (pIdx < products.length) remaining.push(products[pIdx++]);
        while (rIdx < reels.length) remaining.push(reels[rIdx++]);
        for (let i = 0; i < remaining.length; i += 3) {
          blocks.push({ id: `block-rem-${i}`, type: 'row', items: remaining.slice(i, i + 3) });
        }
        break;
      }
    }
    return blocks;
  };

  const fetchFeed = async () => {
    try {
      const { data: dbStories } = await supabase.from('stories').select('*, profiles(first_name, avatar_url)').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
      setStories(dbStories || []);

      let query = supabase.from('products').select(`*, profiles (first_name, tier)`).eq('status', 'active').order('created_at', { ascending: false });
      if (activeCategory !== 'Все') query = query.eq('category', activeCategory);
      const { data: dbProducts } = await query;
      const products = dbProducts || [];
      
      let reels: any[] = [];
      if (activeCategory === 'Все') {
        const { data: dbReels } = await supabase.from('reels').select('*, profiles(first_name, avatar_url)').order('created_at', { ascending: false });
        reels = dbReels || [];
      }
      
      setFeedBlocks(buildBlocks(products, reels));
    } catch (error) {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { setLoading(true); fetchFeed(); }, [activeCategory]);
  
  const onRefresh = useCallback(() => { 
    setRefreshing(true); 
    fetchFeed(); 
  }, [activeCategory]);

  // Функция для скролла наверх и обновления по клику на логотип
  const handleLogoPress = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    onRefresh();
  };

  const renderTopHeader = () => (
    <View style={[styles.topHeader, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.8}>
        <Image source={{ uri: isDark ? LOGO_DARK : LOGO_LIGHT }} style={styles.logoImage} resizeMode="contain" />
      </TouchableOpacity>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <Bell size={24} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search')}>
          <Search size={24} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/cart')}>
          <ShoppingCart size={24} color={colors.icon} />
          {items.length > 0 && (
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{items.length}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStories = () => (
    <View style={[styles.storiesSection, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContent}>
        <TouchableOpacity style={styles.storyItem} onPress={() => router.push('/(tabs)/add')}>
          <View style={[styles.addStoryContainer, { borderColor: colors.border }]}>
            <View style={[styles.addStoryInner, { backgroundColor: colors.backgroundSecondary }]}>
              <Plus size={28} color={colors.tint} />
            </View>
          </View>
          <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>Добавить</Text>
        </TouchableOpacity>
        
        {stories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyItem} onPress={() => router.push(`/story/${story.id}`)}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.storyRing}>
              <View style={[styles.storyAvatarContainer, { backgroundColor: colors.background }]}>
                <Image source={{ uri: story.profiles?.avatar_url || `https://placehold.co/100x100/FF5A00/FFF?text=${story.profiles?.first_name?.[0] || 'U'}` }} style={styles.storyAvatar} />
              </View>
            </LinearGradient>
            <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>{story.profiles?.first_name || 'User'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const ListHeader = () => (
    <View style={{ backgroundColor: colors.background }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[
              styles.filterChip, 
              { backgroundColor: activeCategory === cat ? colors.text : colors.backgroundSecondary },
            ]} 
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[
              styles.filterText, 
              { color: activeCategory === cat ? colors.background : colors.textSecondary }
            ]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {renderStories()}
    </View>
  );

  const ReelItem = ({ item, style }: { item: any, style: any }) => (
    <TouchableOpacity style={[styles.gridItem, style, { borderColor: colors.background }]} onPress={() => router.push({ pathname: '/(tabs)/reels', params: { initialReelId: item.id } })} activeOpacity={0.9}>
      <Video
        source={{ uri: item.video_url }}
        style={styles.gridImage}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={true}
        isMuted={true}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.reelOverlay}>
        <Play size={20} color="#fff" fill="#fff" />
        <Text style={styles.reelViews}>{item.likes_count || 0}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const ProductItem = ({ item, style }: { item: any, style: any }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400/E5E5EA/8E8E93.png?text=Нет+фото';
    return (
      <TouchableOpacity style={[styles.gridItem, style, { borderColor: colors.background }]} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.9}>
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
      </TouchableOpacity>
    );
  };

  const renderBlock = ({ item: block }: { item: any }) => {
    if (block.type === 'reel-left') {
      return (
        <View style={{ flexDirection: 'row', width: contentWidth, height: ITEM_SIZE * 2 }}>
          <ReelItem item={block.reel} style={{ width: ITEM_SIZE, height: ITEM_SIZE * 2 }} />
          <View style={{ width: ITEM_SIZE * 2, height: ITEM_SIZE * 2, flexDirection: 'row', flexWrap: 'wrap' }}>
            {block.products.map((p: any) => <ProductItem key={p.id} item={p} style={{ width: ITEM_SIZE, height: ITEM_SIZE }} />)}
          </View>
        </View>
      );
    }
    if (block.type === 'reel-right') {
      return (
        <View style={{ flexDirection: 'row', width: contentWidth, height: ITEM_SIZE * 2 }}>
          <View style={{ width: ITEM_SIZE * 2, height: ITEM_SIZE * 2, flexDirection: 'row', flexWrap: 'wrap' }}>
            {block.products.map((p: any) => <ProductItem key={p.id} item={p} style={{ width: ITEM_SIZE, height: ITEM_SIZE }} />)}
          </View>
          <ReelItem item={block.reel} style={{ width: ITEM_SIZE, height: ITEM_SIZE * 2 }} />
        </View>
      );
    }
    return (
      <View style={{ flexDirection: 'row', width: contentWidth }}>
        {block.items.map((item: any) => (
          item.video_url
            ? <ReelItem key={item.id} item={item} style={{ width: ITEM_SIZE, height: ITEM_SIZE }} />
            : <ProductItem key={item.id} item={item} style={{ width: ITEM_SIZE, height: ITEM_SIZE }} />
        ))}
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={{ flex: 1 }}>
      <ListHeader />
      <View style={{ width: contentWidth, height: ITEM_SIZE * 2, flexDirection: 'row' }}>
        <Skeleton width={ITEM_SIZE} height={ITEM_SIZE * 2} borderRadius={0} />
        <View style={{ width: ITEM_SIZE * 2, height: ITEM_SIZE * 2, flexDirection: 'row', flexWrap: 'wrap' }}>
          {[1,2,3,4].map(i => <Skeleton key={i} width={ITEM_SIZE} height={ITEM_SIZE} borderRadius={0} style={{ borderWidth: 0.5, borderColor: colors.background }} />)}
        </View>
      </View>
      <View style={{ width: contentWidth, height: ITEM_SIZE, flexDirection: 'row' }}>
        {[1,2,3].map(i => <Skeleton key={i} width={ITEM_SIZE} height={ITEM_SIZE} borderRadius={0} style={{ borderWidth: 0.5, borderColor: colors.background }} />)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        {renderTopHeader()}
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {loading && !refreshing ? (
            renderSkeleton()
          ) : (
            <FlatList
              ref={flatListRef}
              data={feedBlocks} 
              keyExtractor={(item) => item.id} 
              renderItem={renderBlock} 
              contentContainerStyle={styles.listContent} 
              ListHeaderComponent={ListHeader}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
              ListEmptyComponent={<View style={styles.emptyContainer}><Text style={[styles.emptyTitle, { color: colors.text }]}>Ничего не найдено</Text></View>}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, zIndex: 10 },
  logoImage: { width: 140, height: 32 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconButton: { position: 'relative' },
  cartBadge: { position: 'absolute', top: -6, right: -8, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 4 },
  
  filtersContainer: { paddingVertical: 12 },
  filtersContent: { paddingHorizontal: 16, gap: 10 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24 },
  filterText: { fontSize: 14, fontWeight: '600' },
  
  storiesSection: { paddingVertical: 12, paddingBottom: 16, zIndex: 5 },
  storiesContent: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 76 },
  
  addStoryContainer: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  addStoryInner: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  
  storyRing: { width: 76, height: 76, borderRadius: 38, padding: 3, marginBottom: 6 },
  storyAvatarContainer: { flex: 1, borderRadius: 35, padding: 3 },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: '#E5E5EA' },
  storyName: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
  
  listContent: { paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
  gridItem: { overflow: 'hidden', borderWidth: 0.5 }, 
  gridImage: { width: '100%', height: '100%', backgroundColor: '#E5E5EA' },
  reelOverlay: { ...StyleSheet.absoluteFillObject, top: '50%', justifyContent: 'flex-end', padding: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  reelViews: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
});
