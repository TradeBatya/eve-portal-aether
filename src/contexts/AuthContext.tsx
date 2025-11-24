import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheManager } from '@/services/esi/CacheManager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkAdminRole(session.user.id);
        await updateLastActivity(session.user.id);
        await preloadCharacterData(session.user.id);
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await checkAdminRole(session.user.id);
            await updateLastActivity(session.user.id);
            
            // Preload data on sign in
            if (event === 'SIGNED_IN') {
              await preloadCharacterData(session.user.id);
            }
          } else {
            setIsAdmin(false);
          }
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (error) {
      console.error('Failed to check admin role:', error);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(Boolean(data));
  };

  const updateLastActivity = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  };

  const preloadCharacterData = async (userId: string) => {
    try {
      // Get user's main character
      const { data: characters } = await supabase
        .from('eve_characters')
        .select('character_id, is_main')
        .eq('user_id', userId)
        .order('is_main', { ascending: false })
        .limit(1);

      if (characters && characters.length > 0) {
        const mainCharacter = characters[0];
        console.log(`[AuthContext] Preloading data for character ${mainCharacter.character_id}`);
        
        // Preload critical data in background
        cacheManager.preload(mainCharacter.character_id, [
          'basic',
          'location',
          'ship',
          'wallet',
          'skills',
          'skill_queue',
          'assets',
          'contacts'
        ]).catch(error => {
          console.error('[AuthContext] Preload failed:', error);
        });
      }
    } catch (error) {
      console.error('Failed to preload character data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Регистрация успешна",
        description: "Вы можете войти в систему",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Выход выполнен",
      description: "Вы вышли из системы",
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
