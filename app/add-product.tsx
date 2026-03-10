import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, UploadCloud } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Электроника', 
  'Одежда', 
  'Дом и сад', 
  'Авто', 
  'Услуги', 
  'Другое'
];

export default function AddProductScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!title || !price || !category) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните название, цену и выберите категорию.');
      return;
    }

    if (!user) {
      Alert.alert('Ошибка', 'Вы не авторизованы.');
      return;
    }

    setLoading(true);

    // Вычисляем дату удаления (через 7 дней для Уровня 2)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase.from('products').insert({
      seller_id: user.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category,
      status: 'active',
      expires_at: profile?.tier === 'private_seller' ? expiresAt.toISOString() : null, // У бизнеса нет автоудаления
    });

    setLoading(false);

    if (error) {
      Alert.alert('Ошибка публикации', error.message);
    } else {
      Alert.alert('Успешно!', 'Ваш товар опубликован.', [
        { text: 'ОК', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новое объявление</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Блок загрузки фото (пока заглушка для MVP) */}
          <TouchableOpacity style={styles.imageUploadBlock}>
            <UploadCloud size={32} color="#FF5A00" />
            <Text style={styles.imageUploadText}>Добавить фото</Text>
            <Text style={styles.imageUploadSubtext}>До 5 фотографий</Text>
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.label}>Название товара *</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: iPhone 13 Pro 128GB"
              value={title}
              onChangeText={setTitle}
              maxLength={70}
            />

            <Text style={styles.label}>Цена (UZS) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Категория *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Опишите состояние, комплектацию и другие важные детали..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>Опубликовать</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  imageUploadBlock: {
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFE0CC',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5A00',
    marginTop: 12,
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FF5A00',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#fff',
  },
  publishButton: {
    backgroundColor: '#FF5A00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
