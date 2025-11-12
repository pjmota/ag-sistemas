"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';

type Usuario = {
  id: number;
  email: string;
  role: 'admin' | 'membro';
  nome?: string;
};

type AuthContextValue = {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hidratar: token via cookie, usuario via localStorage
    if (globalThis.document === undefined) return;
    const cookie = document.cookie || '';
    const t = cookie
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('token='))
      ?.split('=')[1] || null;
    const uRaw = globalThis.window === undefined ? null : localStorage.getItem('usuario');
    setToken(t);
    setUsuario(uRaw ? JSON.parse(uRaw) : null);
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await api.post('/auth/login', { email, senha });
    const { token: tk, usuario: u } = res.data as { token: string; usuario: Usuario };
    if (globalThis.window !== undefined) {
      localStorage.setItem('usuario', JSON.stringify(u));
      // Também grava cookie para middleware server-side
      // Validade: 7 dias
      const maxAge = 7 * 24 * 60 * 60; // segundos
      document.cookie = `token=${tk}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    }
    setToken(tk);
    setUsuario(u);
  };

  const logout = () => {
    if (globalThis.window !== undefined) {
      localStorage.removeItem('usuario');
      // Remove cookie
      document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
    }
    setToken(null);
    setUsuario(null);
  };

  const value = useMemo(
    () => ({ usuario, token, loading, login, logout }),
    [usuario, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  throw new Error('useAuth deve ser usado dentro de AuthProvider');
}

// Versão opcional para consumo em páginas que podem ser renderizadas sem provider em testes
// Retorna undefined quando não há provider, evitando throw.
export function useOptionalAuth() {
  return useContext(AuthContext);
}