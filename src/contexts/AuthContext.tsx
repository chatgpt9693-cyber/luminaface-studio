import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type Role = 'MASTER' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  telegramChatId?: string;
  avatarInitials: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: Role, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => void;
  currentRole: Role;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('MASTER');
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase не настроен. Проверьте переменные окружения.');
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    if (!supabase) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        setLoading(false);
        return;
      }

      if (!profile) {
        // Profile doesn't exist, create it
        const newProfile = {
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || 'Новый пользователь',
          role: (authUser.user_metadata?.role || 'CLIENT') as Role,
          telegram_chat_id: null,
          avatar_url: null,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          setLoading(false);
          return;
        }

        const userData: User = {
          id: createdProfile.id,
          email: createdProfile.email,
          name: createdProfile.full_name,
          role: createdProfile.role as Role,
          telegramChatId: createdProfile.telegram_chat_id || undefined,
          avatarInitials: getInitials(createdProfile.full_name),
        };

        setUser(userData);
        setCurrentRole(userData.role);
      } else {
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          role: profile.role as Role,
          telegramChatId: profile.telegram_chat_id || undefined,
          avatarInitials: getInitials(profile.full_name),
        };

        setUser(userData);
        setCurrentRole(userData.role);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase не настроен. Проверьте переменные окружения.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Translate Supabase errors to Russian
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Неверный email или пароль');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Подтвердите email перед входом');
      }
      throw new Error(error.message);
    }
    
    if (data.user) {
      await loadUserProfile(data.user);
    }
  };

  const register = async (email: string, password: string, fullName: string, role: Role, phone?: string) => {
    if (!supabase) {
      throw new Error('Supabase не настроен. Проверьте переменные окружения.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone || '',
        },
      },
    });

    if (error) {
      // Translate Supabase errors to Russian
      if (error.message.includes('User already registered')) {
        throw new Error('Пользователь с таким email уже зарегистрирован');
      }
      if (error.message.includes('Password should be at least')) {
        throw new Error('Пароль должен содержать минимум 6 символов');
      }
      if (error.message.includes('email rate limit exceeded') || error.message.includes('Email rate limit exceeded')) {
        throw new Error('Превышен лимит регистраций. Попробуйте через несколько минут.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Слишком много попыток. Подождите немного.');
      }
      throw new Error(error.message);
    }
    
    // Profile will be created automatically by database trigger or in loadUserProfile
    if (data.user) {
      await loadUserProfile(data.user);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setCurrentRole('MASTER');
  };

  const switchRole = (role: Role) => {
    setCurrentRole(role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loading,
      login, 
      register,
      logout, 
      switchRole, 
      currentRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
