export const MOCK_USERS = [
  { 
    id: 'mock_1', 
    username: '@tech_store_uz', 
    name: 'Tech Store', 
    avatar: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=150&auto=format&fit=crop', 
    tier: 'business',
    followers: '12.4K'
  },
  { 
    id: 'mock_2', 
    username: '@fashion_boutique', 
    name: 'Fashion Uz', 
    avatar: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=150&auto=format&fit=crop', 
    tier: 'business',
    followers: '8.1K'
  },
  { 
    id: 'mock_3', 
    username: '@auto_market', 
    name: 'Auto Market', 
    avatar: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=150&auto=format&fit=crop', 
    tier: 'private_seller',
    followers: '2.3K'
  },
  { 
    id: 'mock_4', 
    username: '@sneaker_head', 
    name: 'Sneaker Head', 
    avatar: 'https://placehold.co/150x150/007AFF/FFF?text=SH', 
    tier: 'private_seller',
    followers: '845'
  },
];

export const MOCK_STORIES = [
  { 
    id: '1', 
    userId: 'mock_1',
    user: 'Tech Store', 
    avatar: MOCK_USERS[0].avatar, 
    image: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=1000&auto=format&fit=crop', 
    title: 'Новый iPhone 15 Pro уже в наличии! 🔥',
    time: '2 ч назад',
    hasUnseen: true
  },
  { 
    id: '2', 
    userId: 'mock_2',
    user: 'Fashion Uz', 
    avatar: MOCK_USERS[1].avatar, 
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop', 
    title: 'Летняя коллекция со скидкой 30% 👗',
    time: '5 ч назад',
    hasUnseen: true
  },
  { 
    id: '3', 
    userId: 'mock_3',
    user: 'Auto Market', 
    avatar: MOCK_USERS[2].avatar, 
    image: 'https://images.unsplash.com/photo-1503376712344-c8f8b8096333?q=80&w=1000&auto=format&fit=crop', 
    title: 'Шины премиум класса по лучшей цене 🚗',
    time: '12 ч назад',
    hasUnseen: false
  },
];

export const MOCK_REELS = [
  {
    id: 'r1',
    userId: 'mock_1',
    videoUrl: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=80&w=1000&auto=format&fit=crop',
    user: MOCK_USERS[0],
    description: 'Новое поступление! 🔥 Скидки на все аксессуары до конца недели. Успей забрать свой! #техника #скидки #ташкент',
    likes: '12.4K',
    comments: '342',
    shares: '89',
    productPrice: '150 000 UZS'
  },
  {
    id: 'r2',
    userId: 'mock_2',
    videoUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop',
    user: MOCK_USERS[1],
    description: 'Летняя коллекция уже в наличии! 👗✨ Заказывайте с доставкой прямо сейчас.',
    likes: '8.1K',
    comments: '156',
    shares: '45',
    productPrice: '450 000 UZS'
  },
  {
    id: 'r3',
    userId: 'mock_4',
    videoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    user: MOCK_USERS[3],
    description: 'Оригинальные кроссовки, размер 42. Надевал пару раз, состояние идеальное! 👟',
    likes: '245',
    comments: '12',
    shares: '3',
    productPrice: '800 000 UZS'
  }
];
