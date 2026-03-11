import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Search, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    if (!user) { setLoading(false); setRefreshing(false); return; }
    try {
      const { data, error } = await supabase.from('messages').select(`*, sender:sender_id(id, first_name, avatar_url), receiver:receiver_id(id, first_name, avatar_url)`).or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false });
      if (error) throw error;

      const chatsMap = new Map();
      (data || []).forEach(msg => {
        const isMeSender = msg.sender_id === user.id;
        const otherUser = isMeSender ? msg.receiver : msg.sender;
        if (!otherUser) return;
        if (!chatsMap.has(otherUser.id)) {
          const messageDate = new Date(msg.created_at);
          const today = new Date();
          const isToday = messageDate.getDate() === today.getDate() && messageDate.getMonth() === today.getMonth();
          chatsMap.set(otherUser.id, {
            id: otherUser.id,
            user: otherUser.first_name || 'Пользователь',
            avatar: otherUser.avatar_url || `https://placehold.co/150x150/E5E5EA/8E8E93.png?text=${otherUser.first_name?.[0] || 'U'}`,
            lastMessage: msg.text,
            time: isToday ? messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : messageDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
            unread: 0,
          });
        }
      });
      setChats(Array.from(chatsMap.values()));
    } catch (error) {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchChats(); }, [user]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchChats(); }, [user]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.chatItem, { backgroundColor: colors.background }]} onPress={() => router.push(`/chat/${item.id}`)}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{item.user}</Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unread}</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Войдите в аккаунт</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Чтобы просматривать свои сообщения</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Сообщения</Text>
          <TouchableOpacity style={styles.searchButton}><Search size={24} color={colors.icon} /></TouchableOpacity>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.centerContainer}><ActivityIndicator size="large" color={colors.tint} /></View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MessageCircle size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Нет сообщений</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Здесь появятся ваши переписки</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  searchButton: { padding: 4 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: 8, paddingBottom: 40 },
  chatItem: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E5EA', marginRight: 16 },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  timeText: { fontSize: 12 },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, flex: 1, marginRight: 16 },
  unreadBadge: { backgroundColor: '#FF5A00', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  separator: { height: 1, marginLeft: 88 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  loginBtn: { backgroundColor: '#FF5A00', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
