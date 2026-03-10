import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, RefreshControl, TouchableOpacity, 
  Image, SafeAreaView, Dimensions, ScrollView, useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Search, Heart, Plus, ShoppingCart } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import Skeleton from '../../components/Skeleton';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const EXPLORE_ITEM_SIZE = width / 3;

type Product = {
  id: string; title: string; price: number; category: string; images: string[]; created_at: string;
  profiles: { first_name: string; tier: string; };
};

const CATEGORIES = ['Все', 'Электроника', 'Одежда', 'Дом и сад', 'Авто', 'Услуги'];

const MOCK_STORIES = [
  { id: '1', user: 'Tech Store', avatar: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=150&auto=format&fit=crop', hasUnseen: true },
  { id: '2', user: 'Fashion Uz', avatar: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=150&auto=format&fit=crop', hasUnseen: true },
  { id: '3', user: 'Auto Market', avatar: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=150&auto=format&fit=crop', hasUnseen: false },
];

export default function FeedScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Все');
  const router = useRouter();
  const { items } = useCart();
  
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select(`id, title, price, category, images, created_at, profiles (first_name, tier)`).eq('status', 'active').order('created_at', { ascending: false });
      if (activeCategory !== 'Все') query = query.eq('category', activeCategory);
      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); fetchProducts(); }, [activeCategory]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchProducts(); }, [activeCategory]);

  const renderTopHeader = () => (
    <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <Text style={styles.appName}>GogoMarket</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search')}>
          <Search size={24} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/favorites')}>
          <Heart size={24} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/cart')}>
          <ShoppingCart size={24} color={colors.icon} />
          {cartItemsCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={[styles.filtersContainer, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.filtersContent}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity 
          key={cat} 
          style={[
            styles.filterChip, 
            { backgroundColor: colors.backgroundSecondary },
            activeCategory === cat && { backgroundColor: colors.text }
          ]} 
          onPress={() => setActiveCategory(cat)}
        >
          <Text style={[
            styles.filterText, 
            { color: colors.textSecondary },
            activeCategory === cat && { color: colors.background }
          ]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
        {MOCK_STORIES.map((story) => (
          <TouchableOpacity 
            key={story.id} 
            style={styles.storyItem}
            onPress={() => router.push(`/story/${story.id}`)}
          >
            <View style={[styles.storyAvatarContainer, story.hasUnseen && styles.storyAvatarUnseen]}>
              <Image source={{ uri: story.avatar }} style={styles.storyAvatar} />
            </View>
            <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>{story.user}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const ListHeader = () => (
    <View>
      {renderFilters()}
      {renderStories()}
    </View>
  );

  const renderGridItem = ({ item }: { item: Product }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400/E5E5EA/8E8E93.png?text=Нет+фото';

    return (
      <TouchableOpacity 
        style={[styles.gridItem, { borderColor: colors.background }]} 
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
      </TouchableOpacity>
    );
  };

  const renderSkeletons = () => {
    const skeletons = Array.from({ length: 12 });
    return (
      <View style={{ flex: 1 }}>
        <ListHeader />
        <View style={styles.skeletonGrid}>
          {skeletons.map((_, index) => (
            <View key={index} style={[styles.gridItem, { borderColor: colors.background }]}>
              <Skeleton width="100%" height="100%" borderRadius={0} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderTopHeader()}
      {loading && !refreshing ? (
        renderSkeletons()
      ) : (
        <FlatList
          data={products} 
          keyExtractor={(item) => item.id} 
          renderItem={renderGridItem} 
          numColumns={3} 
          contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]} 
          ListHeaderComponent={ListHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5A00" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Ничего не найдено</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Попробуйте выбрать другую категорию</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  appName: { fontSize: 24, fontWeight: '900', color: '#FF5A00', letterSpacing: -0.5 },
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
  
  gridItem: {
    width: EXPLORE_ITEM_SIZE,
    height: EXPLORE_ITEM_SIZE,
    borderWidth: 0.5,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA',
  },
  
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtitle: { fontSize: 14 },
});
