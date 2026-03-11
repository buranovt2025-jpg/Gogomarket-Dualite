import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform } from 'react-native';
import { User, ShieldCheck, LogOut, Package, Store, ChevronRight, List, TrendingUp, Bookmark, Globe, Settings, Inbox, Moon, Sun, Smartphone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { session, user, profile, refreshProfile, signOut } = useAuth();
  const { t, locale, changeLanguage } = useLanguage();
  const { isDark, themeMode, setThemeMode } = useThemeContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const colors = Colors[isDark ? 'dark' : 'light'];

  const TIER_NAMES = {
    buyer: t('profile.tier_1'),
    private_seller: t('profile.tier_2'),
    business: t('profile.tier_3'),
  };

  const toggleLanguage = () => changeLanguage(locale === 'ru' ? 'uz' : 'ru');

  const cycleTheme = () => {
    if (themeMode === 'system') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('dark');
    else setThemeMode('system');
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') return <Smartphone size={22} color={colors.icon} />;
    if (themeMode === 'light') return <Sun size={22} color={colors.icon} />;
    return <Moon size={22} color={colors.icon} />;
  };

  const handleUpgradeToSeller = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ tier: 'private_seller' }).eq('id', user?.id);
    if (error) {
      Toast.show({ type: 'error', text1: 'Ошибка', text2: error.message });
    } else {
      await refreshProfile();
      Toast.show({ type: 'success', text1: 'Успешно!', text2: 'Теперь вы Частный продавец.' });
    }
    setLoading(false);
  };

  if (!session) {
    return (
      <View style={[styles.unauthContainer, { backgroundColor: colors.background }]}>
        <View style={styles.responsiveWrapper}>
          <View style={[styles.unauthIconContainer, { backgroundColor: colors.background, borderColor: colors.border }]}><User size={64} color={colors.tint} /></View>
          <Text style={[styles.unauthTitle, { color: colors.text }]}>{t('profile.login_prompt')}</Text>
          <Text style={[styles.unauthSubtitle, { color: colors.textSecondary }]}>{t('profile.login_subtitle')}</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>{t('profile.login_btn')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 80 }}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}><Text style={styles.avatarText}>{profile?.first_name ? profile.first_name[0].toUpperCase() : 'U'}</Text></View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.first_name || 'Пользователь'} {profile?.last_name}</Text>
            <View style={[styles.tierBadge, profile?.tier === 'private_seller' && { backgroundColor: `${colors.tint}15` }, profile?.tier === 'business' && { backgroundColor: `${colors.success}15` }]}>
              <Text style={[styles.tierText, profile?.tier === 'private_seller' && { color: colors.tint }, profile?.tier === 'business' && { color: colors.success }]}>
                {TIER_NAMES[profile?.tier || 'buyer']}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.settingsButton, { backgroundColor: colors.backgroundSecondary }]} onPress={() => router.push('/edit-profile')}>
            <Settings size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {(!profile || profile.tier === 'buyer') && (
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.cardHeader}><ShieldCheck size={26} color={colors.tint} /><Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile.want_to_sell')}</Text></View>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{t('profile.want_to_sell_desc')}</Text>
            <TouchableOpacity onPress={handleUpgradeToSeller} disabled={loading}>
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.upgradeButton}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.upgradeButtonText}>{t('profile.start_selling')}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {profile?.tier === 'private_seller' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.cardHeader}><Package size={26} color={colors.tint} /><Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile.sales_management')}</Text></View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={{ flex: 1, marginRight: 8 }} onPress={() => router.push('/add-product')}>
                  <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>{t('profile.add_product')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButtonSecondary, { flex: 1, marginLeft: 8, backgroundColor: `${colors.tint}10` }]} onPress={() => router.push('/my-products')}>
                  <List size={20} color={colors.tint} style={{ marginRight: 8 }} />
                  <Text style={[styles.actionButtonTextSecondary, { color: colors.tint }]}>{t('profile.my_products')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.analyticsButton, { backgroundColor: colors.backgroundSecondary }]} onPress={() => router.push('/seller-orders')}>
                <Inbox size={20} color="#007AFF" style={{ marginRight: 8 }} />
                <Text style={[styles.analyticsButtonText, { color: colors.text }]}>{t('profile.incoming_orders')}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={() => router.push('/upgrade-business')} activeOpacity={0.9}>
              <LinearGradient colors={['#1C1C1E', '#2C2C2E']} style={styles.businessPromoCard}>
                <View style={styles.businessPromoContent}>
                  <View style={styles.businessIconBg}><Store size={24} color="#fff" /></View>
                  <View style={styles.businessPromoTextContainer}>
                    <Text style={styles.businessPromoTitle}>{t('profile.become_business')}</Text>
                    <Text style={styles.businessPromoSubtitle}>{t('profile.remove_limits')}</Text>
                  </View>
                </View>
                <ChevronRight size={24} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {profile?.tier === 'business' && (
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.cardHeader}><Store size={26} color={colors.tint} /><Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile.store_panel')}</Text></View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={{ flex: 1, marginRight: 8 }} onPress={() => router.push('/add-product')}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{t('profile.add_product')}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButtonSecondary, { flex: 1, marginLeft: 8, backgroundColor: `${colors.tint}10` }]} onPress={() => router.push('/my-products')}>
                <List size={20} color={colors.tint} style={{ marginRight: 8 }} />
                <Text style={[styles.actionButtonTextSecondary, { color: colors.tint }]}>{t('profile.my_products')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.analyticsButton, { flex: 1, marginRight: 8, backgroundColor: colors.backgroundSecondary }]} onPress={() => router.push('/seller-orders')}>
                <Inbox size={20} color="#007AFF" style={{ marginRight: 8 }} />
                <Text style={[styles.analyticsButtonText, { color: colors.text }]}>{t('profile.incoming_orders')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.analyticsButton, { flex: 1, marginLeft: 8, backgroundColor: colors.backgroundSecondary }]}>
                <TrendingUp size={20} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={[styles.analyticsButtonText, { color: colors.text }]}>{t('profile.sales_stats')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.menuSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/my-orders')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: `${colors.tint}15` }]}><Package size={20} color={colors.tint} /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.my_orders')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/favorites')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}><Bookmark size={20} color="#FF3B30" /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.favorites')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={cycleTheme}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.backgroundSecondary }]}>{getThemeIcon()}</View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Тема оформления</Text>
            </View>
            <Text style={[styles.menuValueText, { color: colors.textSecondary }]}>{themeMode === 'system' ? 'Авто' : themeMode === 'light' ? 'Светлая' : 'Темная'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: 'transparent' }]} onPress={toggleLanguage}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: 'rgba(0, 122, 255, 0.15)' }]}><Globe size={20} color="#007AFF" /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.language')}</Text>
            </View>
            <Text style={[styles.menuValueText, { color: colors.textSecondary }]}>{locale.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: isDark ? '#330000' : '#FFF0F0' }]} onPress={signOut}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  unauthContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  unauthIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1 },
  unauthTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  unauthSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  loginButton: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
  avatarWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarImage: { width: 72, height: 72, borderRadius: 36, marginRight: 16, borderWidth: 2, borderColor: '#fff' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  settingsButton: { padding: 10, borderRadius: 16 },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  tierText: { fontSize: 13, fontWeight: '700' },
  
  card: { padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  cardDescription: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  upgradeButton: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionButton: { paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  actionButtonSecondary: { paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  actionButtonTextSecondary: { fontSize: 15, fontWeight: 'bold' },
  
  businessPromoCard: { borderRadius: 24, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  businessPromoContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  businessIconBg: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
  businessPromoTextContainer: { marginLeft: 16, flex: 1 },
  businessPromoTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  businessPromoSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  
  analyticsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, marginTop: 12 },
  analyticsButtonText: { fontSize: 15, fontWeight: '600' },
  
  menuSection: { borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuItemText: { fontSize: 16, fontWeight: '500' },
  menuValueText: { fontSize: 15, fontWeight: '500' },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, gap: 10, marginBottom: 20 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
});
