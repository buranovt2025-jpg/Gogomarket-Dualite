import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Image, Keyboard, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const POPULAR_CATEGORIES = ['Электроника', 'Одежда', 'Кроссовки', 'iPhone', 'Ноутбуки'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Адаптивность
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 800);
  const numColumns = contentWidth >= 600 ? 4 : 2;

  useEffect(() => { loadRecentSearches(); }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) performSearch(query);
      else if (query.trim().length === 0) setResults([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('@gogomarket_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {}
  };

  const saveRecentSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    try {
      let updated = [trimmed, ...recentSearches.filter(item => item !== trimmed)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem('@gogomarket_recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem('@gogomarket_recent_searches');
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true); saveRecentSearch(searchQuery);
    try {
      const { data, error } = await supabase.from('products').select('id, title, price, images, category').eq('status', 'active').ilike('title', `%${searchQuery}%`).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      setResults(data || []);
    } catch (error) {} finally { setLoading(false); }
  };

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  const renderSearchResult = ({ item }: { item: any }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400/E5E5EA/8E8E93.png?text=Нет+фото';
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.8}>
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={24} color="#1C1C1E" /></TouchableOpacity>
          <View style={styles.searchBar}>
            <SearchIcon size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput style={styles.input} placeholder="Поиск товаров..." value={query} onChangeText={setQuery} autoFocus={true} returnKeyType="search" onSubmitEditing={() => performSearch(query)} />
            {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')} style={styles.clearInputBtn}><X size={18} color="#8E8E93" /></TouchableOpacity>}
          </View>
        </View>

        {query.length > 0 ? (
          loading ? (
            <View style={styles.centerContainer}><ActivityIndicator size="large" color="#FF5A00" /></View>
          ) : (
            <FlatList
              key={numColumns}
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchResult}
              numColumns={numColumns}
              contentContainerStyle={styles.resultsContent}
              ListEmptyComponent={<View style={styles.emptyContainer}><SearchIcon size={48} color="#D1D1D6" /><Text style={styles.emptyTitle}>Ничего не найдено</Text></View>}
            />
          )
        ) : (
          <View style={styles.suggestionsContainer}>
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Вы искали</Text><TouchableOpacity onPress={clearRecentSearches}><Text style={styles.clearText}>Очистить</Text></TouchableOpacity></View>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.recentItem} onPress={() => { setQuery(item); performSearch(item); Keyboard.dismiss(); }}>
                    <Clock size={20} color="#8E8E93" /><Text style={styles.recentText}>{item}</Text><ArrowLeft size={20} color="#E5E5EA" style={{ transform: [{ rotate: '135deg' }] }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.section}>
              <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Часто ищут</Text><TrendingUp size={20} color="#FF5A00" /></View>
              <View style={styles.tagsContainer}>
                {POPULAR_CATEGORIES.map((cat, index) => (
                  <TouchableOpacity key={index} style={styles.tag} onPress={() => { setQuery(cat); performSearch(cat); Keyboard.dismiss(); }}>
                    <Text style={styles.tagText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  backButton: { padding: 8, marginLeft: -8, marginRight: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1C1C1E' },
  clearInputBtn: { padding: 4 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  suggestionsContainer: { flex: 1, padding: 16 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  clearText: { fontSize: 14, color: '#FF5A00', fontWeight: '500' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  recentText: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  tagText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  resultsContent: { padding: 8, paddingBottom: 40 },
  card: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F2F2F7', overflow: 'hidden' },
  cardImage: { width: '100%', aspectRatio: 1, backgroundColor: '#E5E5EA' },
  cardContent: { padding: 12 },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  cardTitle: { fontSize: 14, color: '#3A3A3C', height: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginTop: 16 },
});
