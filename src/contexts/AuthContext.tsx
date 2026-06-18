import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '../lib/supabase';
import type { Usuario } from '../types/database.types';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, telefone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Usuario>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUsuario(row: any): Usuario {
  return {
    id: row.id,
    auth_id: row.auth_id ?? undefined,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone ?? undefined,
    tipo_usuario: row.tipo_usuario,
    foto_url: row.foto_url ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function fetchUserProfile(authId: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('tb_usuario')
    .select('*')
    .eq('auth_id', authId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.details?.includes('Result row not found')) {
      return null;
    }
    throw error;
  }

  return data ? normalizeUsuario(data) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.warn('Erro ao obter sessão do Supabase:', error.message);
        }

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) setUser(profile);
        }
      } catch (err) {
        console.warn('Erro ao inicializar auth:', err);
      } finally {
        setLoading(false);
      }

      authSubscription = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      });
    };

    initializeAuth();

    return () => {
      authSubscription?.data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setLoading(false);
      throw new Error(error.message || 'E-mail ou senha inválidos.');
    }

    const authUser = data.session?.user;
    if (!authUser) {
      setLoading(false);
      throw new Error('Não foi possível autenticar. Tente novamente.');
    }

    const profile = await fetchUserProfile(authUser.id);
    if (!profile) {
      setLoading(false);
      throw new Error('Perfil não encontrado. Entre em contato com o suporte.');
    }

    setUser(profile);
    setLoading(false);
  };

  const register = async (nome: string, email: string, telefone: string, password: string) => {
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setLoading(false);
      throw new Error(error.message || 'Não foi possível criar a conta.');
    }

    const authUser = data.user ?? data.session?.user;
    if (!authUser) {
      setLoading(false);
      throw new Error('Conta criada, mas não foi possível iniciar sessão. Verifique seu e-mail.');
    }

    try {
      // Use RPC function to insert user profile with SECURITY DEFINER privileges
      const { data: profile, error: rpcError } = await supabase
        .rpc('register_user', {
          p_auth_id: authUser.id,
          p_nome: nome,
          p_email: normalizedEmail,
          p_telefone: telefone,
          p_tipo_usuario: 'cliente',
        });

      if (rpcError || !profile) {
        setLoading(false);
        throw new Error(rpcError?.message || 'Não foi possível salvar os dados do usuário.');
      }

      // Create a user object from the RPC response
      setUser({
        id: profile.id,
        auth_id: profile.auth_id,
        nome: profile.nome,
        email: profile.email,
        telefone,
        tipo_usuario: 'cliente',
        foto_url: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
    } catch (rpcErr) {
      setLoading(false);
      throw rpcErr;
    }
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const updateUser = async (updates: Partial<Usuario>) => {
    if (!user) return;

    const updatedAt = new Date().toISOString();
    const dbUpdates = {
      nome: updates.nome ?? user.nome,
      telefone: updates.telefone ?? user.telefone,
      foto_url: updates.foto_url ?? user.foto_url,
      updated_at: updatedAt,
    };

    const { data: profile, error } = await supabase
      .from('tb_usuario')
      .update(dbUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error || !profile) {
      throw new Error(error?.message || 'Falha ao atualizar o perfil.');
    }

    setUser(normalizeUsuario(profile));
  };

  const changePassword = async (_currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado.');
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      throw new Error(error.message || 'Falha ao alterar a senha.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
