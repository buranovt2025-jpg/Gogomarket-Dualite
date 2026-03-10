import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, SafeAreaView, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Paperclip } from 'lucide-react-native';

const MOCK_MESSAGES = [
  { id: '1', text: 'Здравствуйте! Товар еще в наличии?', sender: 'me', time: '14:20' },
  { id: '2', text: 'Да, в наличии. Можете забрать сегодня.', sender: 'them', time: '14:30' },
];

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages([...messages, { 
      id: Date.now().toString(), 
      text: message.trim(), 
      sender: 'me', 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    }]);
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Image source={{ uri: 'https://placehold.co/100x100/E5E5EA/8E8E93.png?text=U' }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>Продавец</Text>
          <Text style={styles.status}>В сети</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContent}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.sender === 'me' ? styles.messageMe : styles.messageThem]}>
              <Text style={[styles.messageText, item.sender === 'me' && styles.messageTextMe]}>{item.text}</Text>
              <Text style={[styles.messageTime, item.sender === 'me' && styles.messageTimeMe]}>{item.time}</Text>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Paperclip size={24} color="#8E8E93" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Сообщение..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 8, marginLeft: -8, marginRight: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  status: { fontSize: 12, color: '#34C759' },
  chatContent: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  messageMe: { alignSelf: 'flex-end', backgroundColor: '#FF5A00', borderBottomRightRadius: 4 },
  messageThem: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: '#1C1C1E', lineHeight: 20 },
  messageTextMe: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#8E8E93', alignSelf: 'flex-end', marginTop: 4 },
  messageTimeMe: { color: '#FFE0CC' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E5EA',
  },
  attachBtn: { padding: 10 },
  input: {
    flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 15, marginHorizontal: 8,
  },
  sendBtn: {
    backgroundColor: '#FF5A00', width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
});
