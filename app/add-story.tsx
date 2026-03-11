import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Image as ImageIcon, Package } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function AddStoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from('products')
        .select('id, title, images')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setProducts(data);
        });
    }
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `stories/${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, blob);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
    return publicUrl;
  };

  const handlePublish = async () => {
    if (!imageUri || !title) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите фото и добавьте текст.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const publicUrl = await uploadImageToSupabase(imageUri);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase.from('stories').insert({
        seller_id: user.id,
        image_url: publicUrl,
        title: title.trim(),
        expires_at: expiresAt.toISOString(),
        product_id: selectedProductId // Привязываем товар
      });

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'Успешно!', text2: 'Ваша История опубликована.' });
      router.canGoBack() ? router.back() : router.replace('/');
    } catch (error: any) {
      const errorMessage = error.message === 'Bucket not found' 
        ? 'Хранилище "uploads" не создано в Supabase. Зайдите в Storage и создайте Public bucket "uploads".' 
        : error.message || 'Не удалось загрузить историю';
      Alert.alert('Ошибка публикации', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новая История</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.imageUploadBlock} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <>
                <ImageIcon size={48} color="#AF52DE" />
                <Text style={styles.imageUploadText}>Выбрать фото из галереи</Text>
                <Text style={styles.imageUploadSubtext}>Формат 9:16</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.label}>Текст на истории *</Text>
            <TextInput style={styles.input} placeholder="Например: Скидки 50%!" value={title} onChangeText={setTitle} maxLength={50} />

            <Text style={[styles.label, { marginTop: 8 }]}>Прикрепить товар (необязательно)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
              <TouchableOpacity
                style={[styles.productChip, !selectedProductId && styles.productChipActive]}
                onPress={() => setSelectedProductId(null)}
              >
                <Text style={[styles.productChipText, !selectedProductId && styles.productChipTextActive]}>Без товара</Text>
              </TouchableOpacity>
              
              {products.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.productChip, selectedProductId === p.id && styles.productChipActive]}
                  onPress={() => setSelectedProductId(p.id)}
                >
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={styles.productChipImage} />
                  ) : (
                    <View style={[styles.productChipImage, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Package size={14} color="#8E8E93" />
                    </View>
                  )}
                  <Text style={[styles.productChipText, selectedProductId === p.id && styles.productChipTextActive]} numberOfLines={1}>
                    {p.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.publishButton, { backgroundColor: '#AF52DE' }]} onPress={handlePublish} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Опубликовать Историю</Text>}
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
  imageUploadBlock: { height: 400, backgroundColor: '#F5F0FF', borderWidth: 1, borderColor: '#E9D6FF', borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 24, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageUploadText: { fontSize: 16, fontWeight: '600', color: '#AF52DE', marginTop: 12 },
  imageUploadSubtext: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: -8 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1C1C1E' },
  
  productScroll: { flexDirection: 'row', marginTop: 8, marginBottom: 16 },
  productChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', paddingRight: 16, paddingLeft: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  productChipActive: { backgroundColor: '#F5F0FF', borderColor: '#AF52DE' },
  productChipImage: { width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: '#E5E5EA', marginLeft: -8 },
  productChipText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500', maxWidth: 150 },
  productChipTextActive: { color: '#AF52DE' },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  publishButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  publishButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
