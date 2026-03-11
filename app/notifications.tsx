import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Package, MessageCircle, Info } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications(data || []);
      setLoading(false);
      // Mark as read
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    };
    fetchNotifications();
  }, [user]);

  const getIcon = (type: string) => {
    if (type === 'order') return <Package size={24} color="#34C759" />;
    if (type === 'message') return <MessageCircle size={24} color="#007AFF" />;
    return <Info size={24} color="#FF5A00" />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={24} color={colors.icon} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Уведомления</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}><ActivityIndicator size="large" color="#FF5A00" /></View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.notificationCard, { backgroundColor: item.is_read ? colors.background : colors.backgroundSecondary }]}>
                <View style={styles.iconContainer}>{getIcon(item.type)}</View>
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
                  <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Bell size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Нет уведомлений</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Здесь будут появляться важные события</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  notificationCard: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 12 },
  iconContainer: { marginRight: 16, paddingTop: 2 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  time: { fontSize: 12, color: '#8E8E93' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
