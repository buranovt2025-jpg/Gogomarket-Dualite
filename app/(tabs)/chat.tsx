import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const MOCK_CHATS = [
  {
    id: '1',
    user: 'Tech Store',
    avatar: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=150&auto=format&fit=crop',
    lastMessage: 'Да, товар еще в наличии. Можете забрать сегодня.',
    time: '14:30',
    unread: 2,
  },
  {
    id: '2',
    user: 'Азиз',
    avatar: 'https://placehold.co/150x150/E5E5EA/8E8E93.png?text=А',
    lastMessage: 'Какая окончательная цена?',
    time: 'Вчера',
    unread: 0,
  }
];

export default function ChatListScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof MOCK_CHATS[0] }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => router.push(`/chat/${item.id}`)}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName} numberOfLines={1}>{item.user}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Сообщения</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  searchButton: { padding: 4 },
  listContent: { paddingTop: 8 },
  chatItem: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E5EA', marginRight: 16 },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', flex: 1, marginRight: 8 },
  timeText: { fontSize: 12, color: '#8E8E93' },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#8E8E93', flex: 1, marginRight: 16 },
  unreadBadge: {
    backgroundColor: '#FF5A00', borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 88 },
});
