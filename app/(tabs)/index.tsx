import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, TouchableOpacity, Image, SafeAreaView, Dimensions, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Search, Bookmark, Plus, ShoppingCart, Play } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import Skeleton from '../../components/Skeleton';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const EXPLORE_ITEM_SIZE = width / 3;

const CATEGORIES = ['Все', 'Электроника', 'Одежда', 'Дом и сад', 'Авто', 'Услуги'];
const LOGO_LIGHT = 'https://images.dualite.app/d5f3f285-d75c-4283-a4c0-6b6cacd910a4/asset-4166a9e1-b311-4a78-b40a-89462e577da5.webp';
const LOGO_DARK = 'https://images.dualite.app/d5f3f285-d75c-4283-a4c0-6b6cacd910a4/asset-477bfb1a-ce8f-4c93-948e-85e0ff3e2934.webp';

export default function FeedScreen() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Все');
  const router = useRouter();
  const { items } = useCart();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const fetchFeed = async () => {
    try {
      // 1. Загружаем активные истории
      const { data: dbStories } = await supabase
        .from('stories')
        .select('*, profiles(first_name, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      setStories(dbStories || []);

      // 2. Загружаем товары
      let query = supabase.from('products').select(`*, profiles (first_name, tier)`).eq('status', 'active').order('created_at', { ascending: false });
      if (activeCategory !== 'Все') query = query.eq('category', activeCategory);
      const { data: dbProducts } = await query;
      const formattedProducts = (dbProducts || []).map(p => ({ ...p, type: 'product' }));
      
      // 3. Загружаем рилсы (только если выбрана категория "Все")
      let combined = [...formattedProducts];
      if (activeCategory === 'Все') {
        const { data: dbReels } = await supabase.from('reels').select('*, profiles(first_name, avatar_url)').order('created_at', { ascending: false });
        const formattedReels = (dbReels || []).map(r => ({ ...r, type: 'reel' }));
        
        // Подмешиваем рилсы в ленту товаров (каждый 3-й элемент)
        formattedReels.forEach((reel, index) => {
          const insertPos = Math.min(combined.length, (index + 1) * 3);
          combined.splice(insertPos, 0, reel);
        });
      }

      setFeedItems(combined);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); fetchFeed(); }, [activeCategory]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchFeed(); }, [activeCategory]);

  const renderTopHeader = () => (
    <View style={[styles.topHeader, { backgroundColor: colorScheme === 'dark' ? '#FF5A00' : colors.card, borderBottomColor: colorScheme === 'dark' ? '#FF5A00' : colors.border }]}>
      <Image source={{ uri: colorScheme === 'dark' ? LOGO_DARK : LOGO_LIGHT }} style={styles.logoImage} resizeMode="contain" />
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search')}><Search size={24} color={colorScheme === 'dark' ? '#FFFFFF' : colors.icon} /></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/favorites')}><Bookmark size={24} color={colorScheme === 'dark' ? '#FFFFFF' : colors.icon} /></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/cart')}>
          <ShoppingCart size={24} color={colorScheme === 'dark' ? '#FFFFFF' : colors.icon} />
          {items.length > 0 && <View style={[styles.cartBadge, colorScheme === 'dark' && { borderColor: '#FF5A00' }]}><Text style={styles.cartBadgeText}>{items.length}</Text></View>}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStories = () => (
    <View style={[styles.storiesSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContent}>
        <TouchableOpacity style={styles.storyItem} onPress={() => router.push('/(tabs)/add')}>
          <View style={[styles.addStoryCircle, { backgroundColor: colorScheme === 'dark' ? '#331200' : '#FFF5F0', borderColor: colorScheme === 'dark' ? '#662400' : '#FFE0CC' }]}>
            <Plus size={24} color="#FF5A00" />
          </View>
          <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>Добавить</Text>
        </TouchableOpacity>
        {stories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyItem} onPress={() => router.push(`/story/${story.id}`)}>
            <View style={[styles.storyAvatarContainer, styles.storyAvatarUnseen]}>
              <Image source={{ uri: story.profiles?.avatar_url || `https://placehold.co/100x100/FF5A00/FFF?text=${story.profiles?.first_name?.[0] || 'U'}` }} style={styles.storyAvatar} />
            </View>
            <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>{story.profiles?.first_name || 'User'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const ListHeader = () => (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filtersContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.filtersContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.filterChip, { backgroundColor: colors.backgroundSecondary }, activeCategory === cat && { backgroundColor: colors.text }]} onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.filterText, { color: colors.textSecondary }, activeCategory === cat && { color: colors.background }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {renderStories()}
    </View>
  );

  const renderGridItem = ({ item }: { item: any }) => {
    if (item.type === 'reel') {
      return (
        <TouchableOpacity style={[styles.gridItem, { borderColor: colors.background }]} onPress={() => router.push({ pathname: '/(tabs)/reels', params: { initialReelId: item.id } })} activeOpacity={0.9}>
          <Image source={{ uri: item.video_url }} style={styles.gridImage} />
          <View style={styles.reelOverlay}><Play size={24} color="#fff" fill="#fff" /></View>
        </TouchableOpacity>
      );
    }
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400/E5E5EA/8E8E93.png?text=Нет+фото';
    return (
      <TouchableOpacity style={[styles.gridItem, { borderColor: colors.background }]} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.9}>
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#FF5A00' : colors.card }]}>
      {renderTopHeader()}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {loading && !refreshing ? (
          <View style={{ flex: 1 }}><ListHeader /><View style={styles.skeletonGrid}>{Array.from({ length: 12 }).map((_, i) => <View key={i} style={[styles.gridItem, { borderColor: colors.background }]}><Skeleton width="100%" height="100%" borderRadius={0} /></View>)}</View></View>
        ) : (
          <FlatList
            data={feedItems} keyExtractor={(item) => item.id} renderItem={renderGridItem} numColumns={3}
            contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]} ListHeaderComponent={ListHeader}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5A00" />}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={[styles.emptyTitle, { color: colors.text }]}>Ничего не найдено</Text></View>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  logoImage: { width: 140, height: 32 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 4, position: 'relative' },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 4 },
  filtersContainer: { paddingVertical: 12 },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 14, fontWeight: '600' },
  storiesSection: { paddingVertical: 8, borderBottomWidth: 1 },
  storiesContent: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 72 },
  addStoryCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  storyAvatarContainer: { width: 68, height: 68, borderRadius: 34, padding: 2, marginBottom: 6 },
  storyAvatarUnseen: { borderWidth: 2, borderColor: '#FF5A00' },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: '#E5E5EA' },
  storyName: { fontSize: 12, textAlign: 'center' },
  listContent: { paddingBottom: 30 },
  gridItem: { width: EXPLORE_ITEM_SIZE, height: EXPLORE_ITEM_SIZE, borderWidth: 0.5 },
  gridImage: { width: '100%', height: '100%', backgroundColor: '#E5E5EA' },
  reelOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
});
