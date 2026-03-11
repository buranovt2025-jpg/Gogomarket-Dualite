import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AppLoading from '../components/AppLoading';

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  tier: 'buyer' | 'private_seller' | 'business';
  avatar_url: string;
  phone: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            first_name: userData?.user?.user_metadata?.first_name || 'Тест',
            last_name: userData?.user?.user_metadata?.last_name || 'Пользователь',
            tier: 'buyer'
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile);
          return;
        }
      }

      if (data && !error) {
        setProfile(data);
      } else if (!data) {
        setProfile({ id: userId, first_name: 'Пользователь', last_name: '', tier: 'buyer', avatar_url: '', phone: '' });
      }
    } catch (e) {
      console.error('Error in fetchProfile:', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setIsAuthLoaded(true); // Гарантируем, что загрузка завершится
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      setTimeout(async () => {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(), 
      signOut 
    }}>
      {!isAuthLoaded ? <AppLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
