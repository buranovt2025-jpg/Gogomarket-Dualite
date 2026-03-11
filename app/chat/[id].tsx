import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Paperclip } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user || !id) return;
    const fetchChatData = async () => {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single();
      setOtherUser(profileData);
      const { data: messagesData } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
      setMessages(messagesData || []);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    };
    fetchChatData();

    const channel = supabase.channel(`chat_${user.id}_${id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const newMsg = payload.new;
      if ((newMsg.sender_id === user.id && newMsg.receiver_id === id) || (newMsg.sender_id === id && newMsg.receiver_id === user.id)) {
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, id]);

  const sendMessage = async () => {
    if (!message.trim() || !user || !id) return;
    const textToSend = message.trim();
    setMessage('');
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: id, text: textToSend });
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/chat')} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.icon} />
          </TouchableOpacity>
          <Image source={{ uri: otherUser?.avatar_url || `https://placehold.co/100x100/E5E5EA/8E8E93.png?text=${otherUser?.first_name?.[0] || 'U'}` }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{otherUser?.first_name || 'Загрузка...'}</Text>
            {otherUser && <Text style={styles.status}>В сети</Text>}
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {loading ? (
            <View style={styles.centerContainer}><ActivityIndicator color={colors.tint} /></View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                const isMe = item.sender_id === user?.id;
                return (
                  <View style={[styles.messageBubble, isMe ? styles.messageMe : [styles.messageThem, { backgroundColor: colors.backgroundSecondary }]]}>
                    <Text style={[styles.messageText, isMe ? styles.messageTextMe : { color: colors.text }]}>{item.text}</Text>
                    <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : { color: colors.textSecondary }]}>{formatTime(item.created_at)}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={<View style={styles.emptyContainer}><Text style={{ color: colors.textSecondary }}>Напишите первое сообщение...</Text></View>}
            />
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.attachBtn}><Paperclip size={24} color={colors.textSecondary} /></TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              placeholder="Сообщение..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={[styles.sendBtn, !message.trim() && { backgroundColor: colors.border }]} onPress={sendMessage} disabled={!message.trim()}>
              <Send size={20} color={message.trim() ? "#fff" : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginLeft: -8, marginRight: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  status: { fontSize: 12, color: '#34C759' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatContent: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  messageMe: { alignSelf: 'flex-end', backgroundColor: '#FF5A00', borderBottomRightRadius: 4 },
  messageThem: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTextMe: { color: '#fff' },
  messageTime: { fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },
  messageTimeMe: { color: '#FFE0CC' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1 },
  attachBtn: { padding: 10 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 15, marginHorizontal: 8 },
  sendBtn: { backgroundColor: '#FF5A00', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
