import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Image, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploadingImage(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      Toast.show({ type: 'success', text1: 'Фото загружено' });
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось загрузить фото. Убедитесь, что бакет uploads настроен.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Toast.show({ type: 'success', text1: 'Профиль обновлен!' });
      router.back();
    } catch (error: any) {
      Alert.alert('Ошибка сохранения', error.message);
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
          <Text style={styles.headerTitle}>Редактировать профиль</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploadingImage}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>{firstName ? firstName[0].toUpperCase() : 'U'}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  {uploadingImage ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Нажмите, чтобы изменить фото</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Имя *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ваше имя"
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.label}>Фамилия</Text>
              <TextInput
                style={styles.input}
                placeholder="Ваша фамилия"
                value={lastName}
                onChangeText={setLastName}
              />

              <Text style={styles.label}>Номер телефона</Text>
              <TextInput
                style={styles.input}
                placeholder="+998 90 123 45 67"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading || uploadingImage}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Сохранить изменения</Text>}
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
  content: { flex: 1, paddingHorizontal: 16 },
  avatarSection: { alignItems: 'center', marginVertical: 32 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#FF5A00', justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1C1C1E', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarHint: { marginTop: 12, color: '#8E8E93', fontSize: 14 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: -8 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1C1C1E' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  saveButton: { backgroundColor: '#FF5A00', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
