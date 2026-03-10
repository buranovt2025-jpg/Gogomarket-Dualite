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
import { ArrowLeft, Store, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  { id: 'start', name: 'Start', price: '100 000 UZS / мес', features: ['Безлимит товаров', 'Базовая аналитика'] },
  { id: 'business', name: 'Business', price: '250 000 UZS / мес', features: ['Продвижение в ленте', 'Полная аналитика'] },
  { id: 'store', name: 'Store', price: '500 000 UZS / мес', features: ['Приоритет в поиске', 'Менеджер аккаунта'] },
];

export default function UpgradeBusinessScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  
  const [inn, setInn] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0].id);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!inn || inn.length < 9) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный ИНН (минимум 9 цифр).');
      return;
    }

    if (!user) return;

    setLoading(true);

    // Обновляем профиль в БД: меняем уровень на business и сохраняем ИНН
    const { error } = await supabase
      .from('profiles')
      .update({ 
        tier: 'business',
        inn: inn.trim()
      })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус. Попробуйте позже.');
      setLoading(false);
    } else {
      await refreshProfile();
      setLoading(false);
      Alert.alert(
        'Успешно!', 
        'Ваш аккаунт успешно переведен на Уровень 3 (Бизнес). Теперь вам доступны все функции маркетплейса!',
        [{ text: 'Отлично', onPress: () => router.push('/(tabs)/profile') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Стать Бизнесом</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Store size={48} color="#FF5A00" />
            </View>
            <Text style={styles.heroTitle}>Откройте свой магазин</Text>
            <Text style={styles.heroSubtitle}>
              Получите галочку верификации, снимите лимиты на товары и получите доступ к аналитике.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>1. Верификация</Text>
            <Text style={styles.label}>ИНН компании или ИП *</Text>
            <TextInput
              style={styles.input}
              placeholder="Введите 9 или 14 цифр"
              value={inn}
              onChangeText={setInn}
              keyboardType="numeric"
              maxLength={14}
            />
            <View style={styles.infoRow}>
              <ShieldCheck size={16} color="#34C759" />
              <Text style={styles.infoText}>Ваши данные надежно защищены</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>2. Выбор тарифа</Text>
            {PLANS.map((plan) => (
              <TouchableOpacity 
                key={plan.id}
                style={[
                  styles.planCard, 
                  selectedPlan === plan.id && styles.planCardActive
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Text style={[
                    styles.planName,
                    selectedPlan === plan.id && styles.planNameActive
                  ]}>{plan.name}</Text>
                  {selectedPlan === plan.id && (
                    <CheckCircle2 size={24} color="#FF5A00" />
                  )}
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <View style={styles.planFeatures}>
                  {plan.features.map((feature, idx) => (
                    <Text key={idx} style={styles.planFeatureText}>• {feature}</Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payButton} onPress={handleUpgrade} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Оплатить и активировать</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  planCardActive: {
    borderColor: '#FF5A00',
    backgroundColor: '#FFF5F0',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  planNameActive: {
    color: '#FF5A00',
  },
  planPrice: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 12,
  },
  planFeatures: {
    gap: 4,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  payButton: {
    backgroundColor: '#FF5A00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
