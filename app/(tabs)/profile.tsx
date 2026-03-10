import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, useColorScheme } from 'react-native';
import { User, ShieldCheck, LogOut, Package, Store, ChevronRight, List, TrendingUp, Heart, Globe, Database } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { session, user, profile, refreshProfile, signOut } = useAuth();
  const { t, locale, changeLanguage } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const TIER_NAMES = {
    buyer: t('profile.tier_1'),
    private_seller: t('profile.tier_2'),
    business: t('profile.tier_3'),
  };

  const toggleLanguage = () => {
    const newLang = locale === 'ru' ? 'uz' : 'ru';
    changeLanguage(newLang);
  };

  const handleSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    
    const dummyProducts = [
      {
        seller_id: user.id,
        title: 'Apple iPhone 15 Pro 256GB Natural Titanium',
        description: 'Абсолютно новый, запечатанный. Гарантия 1 год от магазина. Возможна доставка.',
        price: 13500000,
        category: 'Электроника',
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Кроссовки Nike Air Force 1 White',
        description: 'Оригинал, размер 42. Носил пару раз, состояние идеальное. Продаю, так как не подошел размер.',
        price: 1200000,
        category: 'Одежда',
        images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'MacBook Pro 14 M3 Pro 18GB/512GB',
        description: 'Идеальное состояние, полный комплект. Батарея 100%. Использовался только дома.',
        price: 21000000,
        category: 'Электроника',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Стильный диван для гостиной (Велюр)',
        description: 'Очень удобный и мягкий диван. Ткань легко чистится. Самовывоз из центра города.',
        price: 4500000,
        category: 'Дом и сад',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Sony PlayStation 5 (С дисководом)',
        description: 'В комплекте 2 оригинальных джойстика DualSense и 3 игры на дисках. Не шумит, не греется.',
        price: 6500000,
        category: 'Электроника',
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1000&auto=format&fit=crop'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Умные часы Apple Watch Series 9 45mm',
        description: 'Цвет Midnight. На экране защитная пленка с первого дня. Полный комплект с коробкой.',
        price: 4800000,
        category: 'Электроника',
        images: ['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=1000&auto=format&fit=crop'],
        status: 'active'
      }
    ];

    const { error } = await supabase.from('products').insert(dummyProducts);
    setSeeding(false);

    if (error) {
      Alert.alert('Ошибка', error.message);
    } else {
      Toast.show({
        type: 'success',
        text1: 'Готово!',
        text2: 'Тестовые товары успешно добавлены в базу.',
        position: 'bottom'
      });
      router.push('/(tabs)/');
    }
  };

  if (!session) {
    return (
      <View style={[styles.unauthContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.unauthIconContainer, { backgroundColor: colors.border }]}>
          <User size={64} color={colors.textSecondary} />
        </View>
        <Text style={[styles.unauthTitle, { color: colors.text }]}>{t('profile.login_prompt')}</Text>
        <Text style={[styles.unauthSubtitle, { color: colors.textSecondary }]}>
          {t('profile.login_subtitle')}
        </Text>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginButtonText}>{t('profile.login_btn')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.langToggleBtn, { borderColor: colors.border }]} onPress={toggleLanguage}>
          <Globe size={20} color={colors.icon} />
          <Text style={[styles.langToggleText, { color: colors.text }]}>
            {locale === 'ru' ? 'Oʻzbek tiliga oʻtish' : 'Перейти на русский'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpgradeToSeller = () => {
    Alert.alert(
      t('profile.become_seller_title'),
      t('profile.become_seller_desc'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('profile.agree'),
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase.from('profiles').update({ tier: 'private_seller' }).eq('id', profile?.id);
            if (!error) {
              await refreshProfile();
              Alert.alert(t('profile.success'), t('profile.congrats_seller'));
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {profile?.first_name ? profile.first_name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.first_name} {profile?.last_name}</Text>
          <View style={[styles.tierBadge, profile?.tier === 'private_seller' && styles.tierBadgeSeller, profile?.tier === 'business' && styles.tierBadgeBusiness]}>
            <Text style={[styles.tierText, profile?.tier === 'private_seller' && styles.tierTextSeller, profile?.tier === 'business' && styles.tierTextBusiness]}>
              {TIER_NAMES[profile?.tier || 'buyer']}
            </Text>
          </View>
        </View>
      </View>

      {profile?.tier === 'buyer' && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={24} color="#FF5A00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile.want_to_sell')}</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{t('profile.want_to_sell_desc')}</Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeToSeller} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.upgradeButtonText}>{t('profile.start_selling')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {profile?.tier === 'private_seller' && (
        <>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Package size={24} color="#FF5A00" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile.sales_management')}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionButton, { flex: 1, marginRight: 8 }]} onPress={() => router.push('/add-product')}>
                <Text style={styles.actionButtonText}>{t('profile.add_product')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButtonSecondary, { flex: 1, marginLeft: 8, backgroundColor: colorScheme === 'dark' ? '#331200' : '#FFF5F0' }]} onPress={() => router.push('/my-products')}>
                <List size={20} color="#FF5A00" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonTextSecondary}>{t('profile.my_products')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.businessPromoCard} onPress={() => router.push('/upgrade-business')}>
            <View style={styles.businessPromoContent}>
              <Store size={28} color="#fff" />
              <View style={styles.businessPromoTextContainer}>
                <Text style={styles.businessPromoTitle}>{t('profile.become_business')}</Text>
                <Text style={styles.businessPromoSubtitle}>{t('profile.remove_limits')}</Text>
              </View>
            </View>
            <ChevronRight size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {profile?.tier === 'business' && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Store size={24} color="#FF5A00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile.store_panel')}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, { flex: 1, marginRight: 8 }]} onPress={() => router.push('/add-product')}>
              <Text style={styles.actionButtonText}>{t('profile.add_product')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButtonSecondary, { flex: 1, marginLeft: 8, backgroundColor: colorScheme === 'dark' ? '#331200' : '#FFF5F0' }]} onPress={() => router.push('/my-products')}>
              <List size={20} color="#FF5A00" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonTextSecondary}>{t('profile.my_products')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.analyticsButton, { backgroundColor: colors.backgroundSecondary }]}>
            <TrendingUp size={20} color="#34C759" style={{ marginRight: 8 }} />
            <Text style={[styles.analyticsButtonText, { color: colors.text }]}>{t('profile.sales_stats')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/my-orders')}>
          <View style={styles.menuItemLeft}><Package size={20} color={colors.icon} /><Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.my_orders')}</Text></View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/favorites')}>
          <View style={styles.menuItemLeft}><Heart size={20} color={colors.icon} /><Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.favorites')}</Text></View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={toggleLanguage}>
          <View style={styles.menuItemLeft}><Globe size={20} color={colors.icon} /><Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.language')}</Text></View>
          <View style={styles.langBadge}>
            <Text style={styles.langBadgeText}>{locale.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Кнопка для генерации тестовых данных */}
      <TouchableOpacity 
        style={[styles.seedButton, { backgroundColor: colorScheme === 'dark' ? '#1A3300' : '#F0FFF0', borderColor: '#34C759' }]} 
        onPress={handleSeedData}
        disabled={seeding}
      >
        {seeding ? (
          <ActivityIndicator color="#34C759" />
        ) : (
          <>
            <Database size={20} color="#34C759" />
            <Text style={styles.seedText}>Сгенерировать тестовые товары</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colorScheme === 'dark' ? '#330000' : '#FFF0F0' }]} onPress={signOut}>
        <LogOut size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  unauthContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  unauthIconContainer: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  unauthTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  unauthSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginButton: { backgroundColor: '#FF5A00', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 24 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  langToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1 },
  langToggleText: { fontSize: 14, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 16 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF5A00', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  tierBadge: { backgroundColor: '#E5F0FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  tierBadgeSeller: { backgroundColor: '#FFF0E5' },
  tierBadgeBusiness: { backgroundColor: '#E5F9E5' },
  tierText: { color: '#007AFF', fontSize: 12, fontWeight: '600' },
  tierTextSeller: { color: '#FF5A00' },
  tierTextBusiness: { color: '#34C759' },
  card: { padding: 20, borderRadius: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  cardDescription: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  upgradeButton: { backgroundColor: '#FF5A00', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { backgroundColor: '#FF5A00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  actionButtonSecondary: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  actionButtonTextSecondary: { color: '#FF5A00', fontSize: 14, fontWeight: 'bold' },
  businessPromoCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  businessPromoContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  businessPromoTextContainer: { marginLeft: 16, flex: 1 },
  businessPromoTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  businessPromoSubtitle: { color: '#8E8E93', fontSize: 13 },
  analyticsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 12 },
  analyticsButtonText: { fontSize: 14, fontWeight: '600' },
  menuSection: { borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemText: { fontSize: 16 },
  langBadge: { backgroundColor: '#FF5A00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  langBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  seedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, marginBottom: 16, borderWidth: 1, borderStyle: 'dashed' },
  seedText: { color: '#34C759', fontSize: 15, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
