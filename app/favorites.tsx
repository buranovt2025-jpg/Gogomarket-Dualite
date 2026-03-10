import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useFavorites } from '../context/FavoritesContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 24;

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Избранное</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={64} color="#D1D1D6" />
            <Text style={styles.emptyTitle}>Нет сохраненных товаров</Text>
            <Text style={styles.emptySubtitle}>Добавляйте товары в избранное, чтобы не потерять их</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/product/${item.id}`)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <TouchableOpacity 
              style={styles.favoriteBtn}
              onPress={() => toggleFavorite(item)}
            >
              <Heart size={20} color="#FF3B30" fill="#FF3B30" />
            </TouchableOpacity>
            <View style={styles.cardContent}>
              <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  listContent: { padding: 16, paddingBottom: 40 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    width: COLUMN_WIDTH, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#F2F2F7', overflow: 'hidden',
  },
  cardImage: { width: '100%', height: COLUMN_WIDTH, backgroundColor: '#E5E5EA' },
  favoriteBtn: {
    position: 'absolute', top: 8, right: 8, backgroundColor: '#fff',
    borderRadius: 16, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardContent: { padding: 12 },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  cardTitle: { fontSize: 14, color: '#3A3A3C', height: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32 },
});
