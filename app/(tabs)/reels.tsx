import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Dimensions, 
  Image, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Heart, MessageCircle, Share2, MoreVertical, ShoppingBag } from 'lucide-react-native';

const { width, height: screenHeight } = Dimensions.get('window');

// Моковые данные для демонстрации UI Рилсов
const MOCK_REELS = [
  {
    id: '1',
    videoUrl: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=80&w=1000&auto=format&fit=crop',
    user: {
      username: '@tech_store_uz',
      avatar: 'https://placehold.co/100x100/FF5A00/FFF?text=TS',
      isBusiness: true,
    },
    description: 'Новое поступление! 🔥 Скидки на все аксессуары до конца недели. Успей забрать свой! #техника #скидки #ташкент',
    likes: '12.4K',
    comments: '342',
    shares: '89',
    productPrice: '150 000 UZS'
  },
  {
    id: '2',
    videoUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop',
    user: {
      username: '@fashion_boutique',
      avatar: 'https://placehold.co/100x100/34C759/FFF?text=FB',
      isBusiness: true,
    },
    description: 'Летняя коллекция уже в наличии! 👗✨ Заказывайте с доставкой прямо сейчас.',
    likes: '8.1K',
    comments: '156',
    shares: '45',
    productPrice: '450 000 UZS'
  },
  {
    id: '3',
    videoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    user: {
      username: '@sneaker_head',
      avatar: 'https://placehold.co/100x100/007AFF/FFF?text=SH',
      isBusiness: false,
    },
    description: 'Оригинальные кроссовки, размер 42. Надевал пару раз, состояние идеальное! 👟',
    likes: '245',
    comments: '12',
    shares: '3',
    productPrice: '800 000 UZS'
  }
];

export default function ReelsScreen() {
  const [activeReel, setActiveReel] = useState(0);
  // Изначально ставим примерную высоту, но она сразу же обновится через onLayout
  const [containerHeight, setContainerHeight] = useState(screenHeight - 90);

  const renderItem = ({ item, index }: { item: typeof MOCK_REELS[0], index: number }) => {
    return (
      <View style={[styles.reelContainer, { height: containerHeight }]}>
        {/* Имитация видео (картинка на весь экран) */}
        <Image 
          source={{ uri: item.videoUrl }} 
          style={styles.videoBackground} 
          resizeMode="cover"
        />

        {/* Темный градиент снизу для читаемости текста */}
        <View style={styles.overlay} />

        {/* Правая панель кнопок (Лайк, Коммент, Поделиться) */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
              <View style={styles.followBadge}>
                <Text style={styles.followBadgeText}>+</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Heart size={32} color="#fff" />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={32} color="#fff" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={32} color="#fff" />
            <Text style={styles.actionText}>{item.shares}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MoreVertical size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Нижняя панель (Информация о пользователе и товаре) */}
        <View style={styles.bottomInfo}>
          <Text style={styles.username}>{item.user.username}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          
          {/* Плашка товара */}
          <TouchableOpacity style={styles.productCard}>
            <ShoppingBag size={16} color="#fff" />
            <Text style={styles.productPrice}>{item.productPrice}</Text>
            <Text style={styles.productAction}>Купить</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View 
      style={styles.container}
      // Динамически получаем точную высоту доступного пространства (без учета таб-бара)
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) setContainerHeight(height);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Верхнее меню (Рилсы / Подписки) */}
      <SafeAreaView style={styles.topNavigation}>
        <Text style={styles.topNavTextInactive}>Подписки</Text>
        <Text style={styles.topNavTextActive}>Рекомендации</Text>
      </SafeAreaView>

      <FlatList
        data={MOCK_REELS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.y / containerHeight);
          setActiveReel(newIndex);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 10,
  },
  topNavTextActive: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topNavTextInactive: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reelContainer: {
    width: width,
    justifyContent: 'flex-end',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    top: '50%', // Градиент только снизу
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  followBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: '#FF5A00',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  bottomInfo: {
    padding: 16,
    paddingRight: 80, // Оставляем место для правых кнопок
    paddingBottom: 24,
    zIndex: 10,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  productPrice: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 12,
  },
  productAction: {
    color: '#FF5A00',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
