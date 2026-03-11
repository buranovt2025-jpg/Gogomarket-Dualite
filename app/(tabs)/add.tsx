import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Video, Camera, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function AddScreen() {
  const router = useRouter();
  const { profile, session } = useAuth();

  const checkAccessAndNavigate = (route: any) => {
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    if (!profile || profile.tier === 'buyer') {
      Toast.show({
        type: 'error',
        text1: 'Доступ закрыт',
        text2: 'Сначала станьте продавцом в Профиле (это бесплатно)',
        position: 'top'
      });
      router.push('/(tabs)/profile');
    } else {
      router.push(route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Создать</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Что вы хотите опубликовать?</Text>
        
        {(!profile || profile.tier === 'buyer') && (
          <View style={styles.warningBox}>
            <AlertCircle size={20} color="#FF9500" />
            <Text style={styles.warningText}>
              Чтобы публиковать товары и рилсы, перейдите в профиль и станьте продавцом (это бесплатно).
            </Text>
          </View>
        )}

        <View style={styles.optionsGrid}>
          <TouchableOpacity style={styles.optionCard} onPress={() => checkAccessAndNavigate('/add-product')}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF5F0' }]}>
              <Package size={32} color="#FF5A00" />
            </View>
            <Text style={styles.optionTitle}>Объявление</Text>
            <Text style={styles.optionSubtitle}>Продать товар или услугу</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={() => checkAccessAndNavigate('/add-reel')}>
            <View style={[styles.iconContainer, { backgroundColor: '#F0F5FF' }]}>
              <Video size={32} color="#007AFF" />
            </View>
            <Text style={styles.optionTitle}>Рилс</Text>
            <Text style={styles.optionSubtitle}>Короткое видео о товаре</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={() => checkAccessAndNavigate('/add-story')}>
            <View style={[styles.iconContainer, { backgroundColor: '#F5F0FF' }]}>
              <Camera size={32} color="#AF52DE" />
            </View>
            <Text style={styles.optionTitle}>История</Text>
            <Text style={styles.optionSubtitle}>Фото или видео на 24 часа</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 20 },
  warningBox: { flexDirection: 'row', backgroundColor: '#FFF5E5', padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center', gap: 12 },
  warningText: { flex: 1, fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  optionsGrid: { gap: 16 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 16, borderRadius: 16 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  optionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  optionSubtitle: { fontSize: 14, color: '#8E8E93' },
});
