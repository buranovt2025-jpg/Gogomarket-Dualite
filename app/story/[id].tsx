import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  SafeAreaView, 
  StatusBar,
  PanResponder
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ChevronUp } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Моковые данные для историй
const MOCK_STORIES = [
  { 
    id: '1', 
    user: 'Tech Store', 
    avatar: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=150&auto=format&fit=crop', 
    image: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=1000&auto=format&fit=crop', 
    title: 'Новый iPhone 15 Pro уже в наличии! 🔥',
    time: '2 ч назад'
  },
  { 
    id: '2', 
    user: 'Fashion Uz', 
    avatar: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=150&auto=format&fit=crop', 
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop', 
    title: 'Летняя коллекция со скидкой 30% 👗',
    time: '5 ч назад'
  },
  { 
    id: '3', 
    user: 'Auto Market', 
    avatar: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=150&auto=format&fit=crop', 
    image: 'https://images.unsplash.com/photo-1503376712344-c8f8b8096333?q=80&w=1000&auto=format&fit=crop', 
    title: 'Шины премиум класса по лучшей цене 🚗',
    time: '12 ч назад'
  },
];

export default function StoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const initialIndex = MOCK_STORIES.findIndex(s => s.id === id);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  
  const progress = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentStory = MOCK_STORIES[currentIndex];

  useEffect(() => {
    startAnimation();
  }, [currentIndex]);

  const startAnimation = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000, // 5 секунд на одну историю
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });
  };

  const nextStory = () => {
    if (currentIndex < MOCK_STORIES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back(); // Закрываем, если истории закончились
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      progress.setValue(0);
      startAnimation();
    }
  };

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < width / 3) {
      prevStory();
    } else {
      nextStory();
    }
  };

  // Свайп вниз для закрытия
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          router.back();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!currentStory) return null;

  return (
    <Animated.View 
      style={[styles.container, { transform: [{ translateY }] }]} 
      {...panResponder.panHandlers}
    >
      <StatusBar hidden />
      
      <Image source={{ uri: currentStory.image }} style={styles.image} resizeMode="cover" />
      
      {/* Темный градиент сверху для читаемости текста */}
      <View style={styles.topOverlay} />
      {/* Темный градиент снизу */}
      <View style={styles.bottomOverlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Прогресс бары */}
        <View style={styles.progressContainer}>
          {MOCK_STORIES.map((story, index) => {
            return (
              <View key={story.id} style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarForeground,
                    {
                      width: index === currentIndex 
                        ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : index < currentIndex ? '100%' : '0%'
                    }
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Шапка истории (Аватар, Имя, Кнопка закрытия) */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: currentStory.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{currentStory.user}</Text>
              <Text style={styles.time}>{currentStory.time}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <X size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Зоны для клика (Влево/Вправо) */}
        <TouchableOpacity style={styles.touchArea} activeOpacity={1} onPress={handlePress} />

        {/* Нижняя часть (Текст и кнопка перехода) */}
        <View style={styles.footer}>
          <Text style={styles.storyTitle}>{currentStory.title}</Text>
          
          <TouchableOpacity style={styles.productButton} onPress={() => router.push('/(tabs)/')}>
            <ChevronUp size={20} color="#fff" />
            <Text style={styles.productButtonText}>Посмотреть товары</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarForeground: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  time: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  touchArea: {
    flex: 1,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  storyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  productButton: {
    alignItems: 'center',
  },
  productButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
