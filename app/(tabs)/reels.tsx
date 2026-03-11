import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, Image, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Heart, MessageCircle, Share2, ShoppingBag } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width, height: screenHeight } = Dimensions.get('window');

export default function ReelsScreen() {
  const router = useRouter();
  const { initialReelId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerHeight, setContainerHeight] = useState(screenHeight - 90);
  const reelId = Array.isArray(initialReelId) ? initialReelId[0] : initialReelId;

  useEffect(() => {
    const fetchReels = async () => {
      const { data } = await supabase
        .from('reels')
        .select('*, profiles(first_name, avatar_url), products(price)')
        .order('created_at', { ascending: false });
      setReels(data || []);
      setLoading(false);
    };
    fetchReels();
  }, []);

  useEffect(() => {
    if (reelId && containerHeight > 0 && reels.length > 0) {
      const index = reels.findIndex(r => r.id === reelId);
      if (index >= 0 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    }
  }, [reelId, containerHeight, reels]);

  const renderItem = ({ item }: { item: any }) => {
    const formatPrice = (price: number) => price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS" : '';
    
    return (
      <View style={[styles.reelContainer, { height: containerHeight }]}>
        <Image source={{ uri: item.video_url }} style={styles.videoBackground} resizeMode="cover" />
        <View style={styles.overlay} />

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/store/${item.seller_id}`)}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.profiles?.avatar_url || `https://placehold.co/100x100/FF5A00/FFF?text=${item.profiles?.first_name?.[0] || 'U'}` }} style={styles.avatar} />
              <View style={styles.followBadge}><Text style={styles.followBadgeText}>+</Text></View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Heart size={32} color="#fff" /><Text style={styles.actionText}>{item.likes_count}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><MessageCircle size={32} color="#fff" /><Text style={styles.actionText}>{item.comments_count}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Share2 size={32} color="#fff" /><Text style={styles.actionText}>{item.shares_count}</Text></TouchableOpacity>
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

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A00" /></View>;

  return (
    <View style={styles.container} onLayout={(e) => { if (e.nativeEvent.layout.height > 0) setContainerHeight(e.nativeEvent.layout.height); }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.topNavigation}>
        <Text style={styles.topNavTextInactive}>Подписки</Text>
        <Text style={styles.topNavTextActive}>Рекомендации</Text>
      </SafeAreaView>

      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(data, index) => ({ length: containerHeight, offset: containerHeight * index, index })}
        ListEmptyComponent={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: containerHeight }}><Text style={{ color: '#fff' }}>Нет рилсов</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topNavigation: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'center', gap: 20, paddingTop: 10 },
  topNavTextActive: { color: '#fff', fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  topNavTextInactive: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '600' },
  reelContainer: { width: width, justifyContent: 'flex-end' },
  videoBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', top: '50%' },
  rightActions: { position: 'absolute', right: 16, bottom: 100, alignItems: 'center', gap: 24, zIndex: 10 },
  actionButton: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 },
  avatarContainer: { marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  followBadge: { position: 'absolute', bottom: -8, alignSelf: 'center', backgroundColor: '#FF5A00', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  followBadgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 18 },
  bottomInfo: { padding: 16, paddingRight: 80, paddingBottom: 24, zIndex: 10 },
  username: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  description: { color: '#fff', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  productPrice: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 8, marginRight: 12 },
  productAction: { color: '#FF5A00', fontSize: 14, fontWeight: 'bold' },
});
