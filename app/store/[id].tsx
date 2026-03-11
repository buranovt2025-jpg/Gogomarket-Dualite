import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, Grid, Video } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function StorefrontScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reels'>('products');

  // Адаптивность
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 800);
  const numColumns = contentWidth >= 600 ? 5 : 3;
  const ITEM_SIZE = contentWidth / numColumns;

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', id).single();
        setProfile(dbProfile);
        const { data: dbProducts } = await supabase.from('products').select('*').eq('seller_id', id).eq('status', 'active').order('created_at', { ascending: false });
        setProducts(dbProducts || []);
        const { data: dbReels } = await supabase.from('reels').select('*').eq('seller_id', id).order('created_at', { ascending: false });
        setReels(dbReels || []);
      } catch (error) {} finally { setLoading(false); }
    };
    fetchStoreData();
  }, [id]);

  const renderHeader = () => {
    if (!profile) return null;
    const isBusiness = profile.tier === 'business';
    return (
      <View style={styles.headerContainer}>
        <View style={styles.profileInfo}>
          <Image source={{ uri: profile.avatar_url || `https://placehold.co/150x150/FF5A00/FFF?text=${profile.first_name?.[0] || 'U'}` }} style={styles.avatar} />
          <View style={styles.statsContainer}>
            <View style={styles.statItem}><Text style={styles.statNumber}>{products.length}</Text><Text style={styles.statLabel}>Товаров</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>Подписчиков</Text></View>
          </View>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
          {isBusiness && <ShieldCheck size={18} color="#34C759" style={{ marginLeft: 4 }} />}
        </View>
        <Text style={styles.tierText}>{isBusiness ? 'Проверенный магазин' : 'Частный продавец'}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>Подписаться</Text></TouchableOpacity>
          <TouchableOpacity style={styles.messageBtn} onPress={() => router.push(`/chat/${profile.id}`)}><Text style={styles.messageBtnText}>Написать</Text></TouchableOpacity>
        </View>
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'products' && styles.activeTab]} onPress={() => setActiveTab('products')}><Grid size={24} color={activeTab === 'products' ? '#1C1C1E' : '#8E8E93'} /></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'reels' && styles.activeTab]} onPress={() => setActiveTab('reels')}><Video size={24} color={activeTab === 'reels' ? '#1C1C1E' : '#8E8E93'} /></TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProduct = ({ item }: { item: any }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400/E5E5EA/8E8E93.png?text=Нет+фото';
    return (
      <TouchableOpacity style={[styles.gridItem, { width: ITEM_SIZE, height: ITEM_SIZE }]} onPress={() => router.push(`/product/${item.id}`)}>
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
      </TouchableOpacity>
    );
  };

  const renderReel = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.gridItem, { width: ITEM_SIZE, height: ITEM_SIZE }]} onPress={() => router.push({ pathname: '/(tabs)/reels', params: { initialReelId: item.id } })}>
      <Image source={{ uri: item.video_url }} style={styles.gridImage} />
      <View style={styles.reelOverlay}><Text style={styles.reelViews}>▶ {item.likes_count}</Text></View>
    </TouchableOpacity>
  );

  if (loading) return <SafeAreaView style={styles.centerContainer}><ActivityIndicator size="large" color="#FF5A00" /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}><ArrowLeft size={24} color="#1C1C1E" /></TouchableOpacity>
          <Text style={styles.navTitle}>{profile?.first_name || 'Витрина'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <FlatList
          key={numColumns}
          ListHeaderComponent={renderHeader}
          data={activeTab === 'products' ? products : reels}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          renderItem={activeTab === 'products' ? renderProduct : renderReel}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>{activeTab === 'products' ? 'Нет активных товаров' : 'Нет загруженных рилсов'}</Text></View>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  backButton: { padding: 8, marginLeft: -8 },
  navTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 24, borderWidth: 1, borderColor: '#E5E5EA' },
  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  statLabel: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  tierText: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },
  actionButtons: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  followBtn: { flex: 1, backgroundColor: '#FF5A00', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  followBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  messageBtn: { flex: 1, backgroundColor: '#F2F2F7', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  messageBtnText: { color: '#1C1C1E', fontSize: 14, fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#1C1C1E' },
  gridItem: { borderWidth: 0.5, borderColor: '#fff' },
  gridImage: { width: '100%', height: '100%', backgroundColor: '#E5E5EA' },
  reelOverlay: { position: 'absolute', bottom: 4, left: 4, flexDirection: 'row', alignItems: 'center' },
  reelViews: { color: '#fff', fontSize: 12, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93', fontSize: 14 },
});
