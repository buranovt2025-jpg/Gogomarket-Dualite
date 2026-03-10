import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
};

type FavoritesContextType = {
  favorites: Product[];
  toggleFavorite: (product: any) => void;
  isFavorite: (id: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType>({} as FavoritesContextType);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem('@gogomarket_favorites');
        if (stored) setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    };
    loadFavorites();
  }, []);

  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('@gogomarket_favorites', JSON.stringify(favorites));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }
    };
    saveFavorites();
  }, [favorites]);

  const toggleFavorite = (product: any) => {
    setFavorites((prev) => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        Toast.show({
          type: 'info',
          text1: 'Удалено',
          text2: 'Товар удален из избранного',
          position: 'bottom',
        });
        return prev.filter(item => item.id !== product.id);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Сохранено',
        text2: 'Товар добавлен в избранное',
        position: 'bottom',
      });
      
      return [...prev, {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/200x200/E5E5EA/8E8E93.png?text=Нет+фото',
        category: product.category
      }];
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some(item => item.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
