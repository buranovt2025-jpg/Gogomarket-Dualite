import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  seller_id: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Загрузка корзины при старте
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('@gogomarket_cart');
        if (storedCart) {
          setItems(JSON.parse(storedCart));
        }
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    };
    loadCart();
  }, []);

  // Сохранение корзины при изменении
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('@gogomarket_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart', e);
      }
    };
    saveCart();
  }, [items]);

  const addToCart = (product: any) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        Toast.show({
          type: 'info',
          text1: 'Уже в корзине',
          text2: 'Этот товар уже добавлен в вашу корзину.',
          position: 'top',
        });
        return prevItems;
      }

      const newItem: CartItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/200x200/E5E5EA/8E8E93.png?text=Нет+фото',
        quantity: 1,
        seller_id: product.seller_id,
      };

      Toast.show({
        type: 'success',
        text1: 'Успешно',
        text2: 'Товар добавлен в корзину!',
        position: 'top',
      });
      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prevItems) => 
      prevItems.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
