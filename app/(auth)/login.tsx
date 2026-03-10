import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Zap } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    setLoading(false);

    if (error) {
      Alert.alert('Ошибка входа', error.message);
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    const demoEmail = 'test@gogo.com';
    const demoPassword = 'password123';

    // 1. Сначала пробуем просто войти
    let { error: loginError } = await supabase.auth.signInWithPassword({ 
      email: demoEmail, 
      password: demoPassword 
    });

    if (loginError) {
      // 2. Если ошибка (пользователя нет), пробуем зарегистрировать
      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            first_name: 'Тест',
            last_name: 'Пользователь',
          }
        }
      });

      if (signUpError) {
        Alert.alert('Ошибка демо-регистрации', signUpError.message);
        setLoading(false);
        return;
      }

      // 3. Пробуем войти еще раз после регистрации
      const { error: loginError2 } = await supabase.auth.signInWithPassword({ 
        email: demoEmail, 
        password: demoPassword 
      });

      if (loginError2) {
        // Если просит подтвердить email - выдаем инструкцию
        if (loginError2.message.includes('Email not confirmed')) {
          Alert.alert(
            '⚠️ Требуется настройка Supabase',
            'Пожалуйста, зайдите в панель Supabase -> Authentication -> Providers -> Email и ВЫКЛЮЧИТЕ тумблер "Confirm email". После этого нажмите эту кнопку еще раз.',
            [{ text: 'Понятно' }]
          );
        } else {
          Alert.alert('Ошибка демо-входа', loginError2.message);
        }
        setLoading(false);
        return;
      }
    }

    // Успешный вход
    setLoading(false);
    router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>С возвращением!</Text>
        <Text style={styles.subtitle}>Войдите в свой аккаунт GogoMarket</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите ваш email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Войти</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ИЛИ</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FF5A00" />
            ) : (
              <>
                <Zap size={20} color="#FF5A00" />
                <Text style={styles.demoButtonText}>Быстрый Демо-вход</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Нет аккаунта? <Text style={styles.linkTextBold}>Зарегистрироваться</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  button: {
    backgroundColor: '#FF5A00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    color: '#8E8E93',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFE0CC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  demoButtonText: {
    color: '#FF5A00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#FF5A00',
    fontWeight: 'bold',
  },
});
