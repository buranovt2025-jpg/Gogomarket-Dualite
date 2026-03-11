import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, UploadCloud, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

const CATEGORIES = ['Электроника', 'Одежда', 'Дом и сад', 'Авто', 'Услуги', 'Другое'];

export default function AddProductScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Лимит', 'Можно добавить максимум 5 фотографий');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const uploadImageToSupabase = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      if (error.message !== 'Bucket not found') {
        console.error('Error uploading image:', error);
      }
      throw error;
    }
  };

  const handlePublish = async () => {
    if (!title || !price || !category) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните название, цену и выберите категорию.');
      return;
    }
    if (!user) return;

    setLoading(true);

    try {
      // 1. Загружаем все картинки в Supabase Storage
      const uploadedImageUrls = [];
      for (const uri of images) {
        const publicUrl = await uploadImageToSupabase(uri);
        uploadedImageUrls.push(publicUrl);
      }

      // 2. Вычисляем дату удаления (через 7 дней для Уровня 2)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 3. Сохраняем товар в БД
      const { error } = await supabase.from('products').insert({
        seller_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category,
        images: uploadedImageUrls,
        status: 'active',
        expires_at: profile?.tier === 'private_seller' ? expiresAt.toISOString() : null,
      });

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'Успешно!', text2: 'Ваш товар опубликован.' });
      router.canGoBack() ? router.back() : router.replace('/');
    } catch (error: any) {
      const errorMessage = error.message === 'Bucket not found' 
        ? 'Хранилище "uploads" не создано в Supabase. Зайдите в Storage и создайте Public bucket "uploads".' 
        : error.message || 'Не удалось загрузить товар';
      Alert.alert('Ошибка публикации', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новое объявление</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.imageUploadBlock} onPress={pickImage}>
                <UploadCloud size={32} color="#FF5A00" />
                <Text style={styles.imageUploadText}>Добавить фото</Text>
                <Text style={styles.imageUploadSubtext}>{images.length}/5</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.form}>
            <Text style={styles.label}>Название товара *</Text>
            <TextInput style={styles.input} placeholder="Например: iPhone 13 Pro" value={title} onChangeText={setTitle} maxLength={70} />

            <Text style={styles.label}>Цена (UZS) *</Text>
            <TextInput style={styles.input} placeholder="0" value={price} onChangeText={setPrice} keyboardType="numeric" />

            <Text style={styles.label}>Категория *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.categoryChip, category === cat && styles.categoryChipActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Описание</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Опишите детали..." value={description} onChangeText={setDescription} multiline numberOfLines={4} />
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Опубликовать</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  content: { flex: 1, paddingHorizontal: 16 },
  imageScroll: { flexDirection: 'row', marginTop: 20, marginBottom: 24 },
  imagePreviewContainer: { width: 100, height: 100, marginRight: 12, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  imageUploadBlock: { width: 100, height: 100, backgroundColor: '#FFF5F0', borderWidth: 1, borderColor: '#FFE0CC', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  imageUploadText: { fontSize: 12, fontWeight: '600', color: '#FF5A00', marginTop: 8 },
  imageUploadSubtext: { fontSize: 10, color: '#8E8E93', marginTop: 2 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: -8 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1C1C1E' },
  textArea: { height: 120, paddingTop: 16, textAlignVertical: 'top' },
  categoryScroll: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },
  categoryChip: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#FF5A00' },
  categoryChipText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  categoryChipTextActive: { color: '#fff' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  publishButton: { backgroundColor: '#FF5A00', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  publishButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
