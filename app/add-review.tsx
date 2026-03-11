import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
  SafeAreaView, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function AddReviewScreen() {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: rating,
          text: text.trim()
        });

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'Спасибо!', text2: 'Ваш отзыв опубликован.' });
      router.back(); // Возвращаемся на карточку товара
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось опубликовать отзыв');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Оставить отзыв</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <Text style={styles.label}>Оценка</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                  <Star 
                    size={40} 
                    color={star <= rating ? "#FF9500" : "#E5E5EA"} 
                    fill={star <= rating ? "#FF9500" : "transparent"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Комментарий (необязательно)</Text>
            <TextInput
              style={styles.input}
              placeholder="Расскажите о своих впечатлениях..."
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={6}
            />
          </View>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Опубликовать</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  content: { flex: 1, padding: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 16 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 },
  starBtn: { padding: 4 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, fontSize: 16, color: '#1C1C1E', height: 150, textAlignVertical: 'top' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  publishButton: { backgroundColor: '#FF5A00', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  publishButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
