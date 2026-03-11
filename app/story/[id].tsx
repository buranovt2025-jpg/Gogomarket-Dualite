import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, SafeAreaView, StatusBar, PanResponder, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ChevronUp, ShoppingBag } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function StoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const progress = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchStories = async () => {
      const { data } = await supabase
        .from('stories')
        .select('*, profiles(first_name, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (data) {
        setStories(data);
        const idx = data.findIndex(s => s.id === id);
        setCurrentIndex(idx >= 0 ? idx : 0);
      }
      setLoading(false);
    };
    fetchStories();
  }, [id]);

  useEffect(() => { 
    if (!loading && stories.length > 0) startAnimation(); 
  }, [currentIndex, loading]);

  const startAnimation = () => {
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 5000, useNativeDriver: false }).start(({ finished }) => {
      if (finished) nextStory();
    });
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
    else { router.canGoBack() ? router.back() : router.replace('/'); }
  };

  const prevStory = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else { progress.setValue(0); startAnimation(); }
  };

  const handleActionPress = () => {
    const currentStory = stories[currentIndex];
    if (currentStory.product_id) {
      router.push(`/product/${currentStory.product_id}`);
    } else {
      router.push(`/store/${currentStory.seller_id}`);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => { if (gestureState.dy > 0) translateY.setValue(gestureState.dy); },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) { router.canGoBack() ? router.back() : router.replace('/'); }
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A00" /></View>;
  
  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
      <StatusBar hidden />
      <Image source={{ uri: currentStory.image_url }} style={styles.image} resizeMode="cover" />
      <View style={styles.topOverlay} />
      <View style={styles.bottomOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          {stories.map((story, index) => (
            <View key={story.id} style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarForeground, { width: index === currentIndex ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : index < currentIndex ? '100%' : '0%' }]} />
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <TouchableOpacity style={styles.userInfo} onPress={() => router.push(`/store/${currentStory.seller_id}`)}>
            <Image source={{ uri: currentStory.profiles?.avatar_url || `https://placehold.co/100x100/FF5A00/FFF?text=${currentStory.profiles?.first_name?.[0] || 'U'}` }} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{currentStory.profiles?.first_name}</Text>
              <Text style={styles.time}>Недавно</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><X size={28} color="#fff" /></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.touchArea} activeOpacity={1} onPress={(e) => e.nativeEvent.locationX < width / 3 ? prevStory() : nextStory()} />

        <View style={styles.footer}>
          <Text style={styles.storyTitle}>{currentStory.title}</Text>
          <TouchableOpacity style={styles.productButton} onPress={handleActionPress}>
            {currentStory.product_id ? (
              <>
                <ShoppingBag size={20} color="#fff" />
                <Text style={styles.productButtonText}>Смотреть товар</Text>
              </>
            ) : (
              <>
                <ChevronUp size={20} color="#fff" />
                <Text style={styles.productButtonText}>Перейти в магазин</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 150, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(0,0,0,0.6)' },
  safeArea: { flex: 1 },
  progressContainer: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10, gap: 4 },
  progressBarBackground: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressBarForeground: { height: '100%', backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, zIndex: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#fff' },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  time: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 8 },
  touchArea: { flex: 1 },
  footer: { padding: 24, alignItems: 'center', zIndex: 10 },
  storyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  productButton: { alignItems: 'center', flexDirection: 'row', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  productButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
