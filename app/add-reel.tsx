import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Video as VideoIcon, Package } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function AddReelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
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

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const uploadVideoToSupabase = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop() || 'mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `reels/${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, blob);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
    return publicUrl;
  };

  const handlePublish = async () => {
    if (!videoUri || !description) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите видео и добавьте описание.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const publicUrl = await uploadVideoToSupabase(videoUri);

      const { error } = await supabase.from('reels').insert({
        seller_id: user.id,
        video_url: publicUrl,
        description: description.trim(),
        product_id: selectedProductId // Привязываем товар, если выбран
      });

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'Успешно!', text2: 'Ваш Рилс опубликован.' });
      router.canGoBack() ? router.back() : router.replace('/');
    } catch (error: any) {
      const errorMessage = error.message === 'Bucket not found' 
        ? 'Хранилище "uploads" не создано в Supabase. Зайдите в Storage и создайте Public bucket "uploads".' 
        : error.message || 'Не удалось загрузить видео';
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
        <Text style={styles.headerTitle}>Новый Рилс</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.imageUploadBlock} onPress={pickVideo}>
            {videoUri ? (
              <View style={styles.videoSelected}>
                <VideoIcon size={48} color="#fff" />
                <Text style={styles.videoSelectedText}>Видео выбрано</Text>
                <Text style={styles.reselectText}>Нажмите, чтобы изменить</Text>
              </View>
            ) : (
              <>
                <VideoIcon size={48} color="#007AFF" />
                <Text style={styles.imageUploadText}>Выбрать видео из галереи</Text>
                <Text style={styles.imageUploadSubtext}>До 60 секунд</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.label}>Описание *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Опишите ваше видео..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

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
        <TouchableOpacity style={[styles.publishButton, { backgroundColor: '#007AFF' }]} onPress={handlePublish} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Опубликовать Рилс</Text>}
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
  imageUploadBlock: { height: 300, backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#D6E4FF', borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 24, overflow: 'hidden' },
  videoSelected: { width: '100%', height: '100%', backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  videoSelectedText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  reselectText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8 },
  imageUploadText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginTop: 12 },
  imageUploadSubtext: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: -8 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1C1C1E' },
  textArea: { height: 120, paddingTop: 16, textAlignVertical: 'top' },
  
  productScroll: { flexDirection: 'row', marginTop: 8, marginBottom: 16 },
  productChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', paddingRight: 16, paddingLeft: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  productChipActive: { backgroundColor: '#F0F5FF', borderColor: '#007AFF' },
  productChipImage: { width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: '#E5E5EA', marginLeft: -8 },
  productChipText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500', maxWidth: 150 },
  productChipTextActive: { color: '#007AFF' },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  publishButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  publishButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
