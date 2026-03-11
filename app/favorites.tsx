import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();

  // Адаптивность
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 800);
  const numColumns = contentWidth >= 600 ? 4 : 2;

  const formatPrice = (price: number) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={24} color="#1C1C1E" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Избранное</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          key={numColumns}
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bookmark size={64} color="#D1D1D6" />
              <Text style={styles.emptyTitle}>Нет сохраненных товаров</Text>
              <Text style={styles.emptySubtitle}>Добавляйте товары в избранное, чтобы не потерять их</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.8}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(item)}>
                <Bookmark size={20} color="#1C1C1E" fill="#1C1C1E" />
              </TouchableOpacity>
              <View style={styles.cardContent}>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  listContent: { padding: 8, paddingBottom: 40 },
  card: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F2F2F7', overflow: 'hidden' },
  cardImage: { width: '100%', aspectRatio: 1, backgroundColor: '#E5E5EA' },
  favoriteBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 16, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardContent: { padding: 12 },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  cardTitle: { fontSize: 14, color: '#3A3A3C', height: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32 },
});
