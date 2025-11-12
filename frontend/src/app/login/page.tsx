"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/branding/Logo';
import styles from './page.module.css';
import Card from '@/components/ui/Card';
import ErrorMessage from '@/components/ui/ErrorMessage';
import HintLink from '@/components/ui/HintLink';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, senha);
      let role: 'admin' | 'membro' | undefined;
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('usuario');
        try {
          role = raw ? JSON.parse(raw).role : undefined;
        } catch {}
      }
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/indicacoes');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Falha no login';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <Card>
          <div className={styles.logoWrap}>
            <Logo className={styles.logo} />
          </div>
          <h1 className={styles.title}>Entrar</h1>
          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@exemplo.com" />
            </div>
            <div className={styles.fieldLarge}>
              <label htmlFor="senha">Senha</label>
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" />
            </div>
            {error && (
              <ErrorMessage>{error}</ErrorMessage>
            )}
            <HintLink />
            <div className={styles.actions}>
              <Button className={styles.button} type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </main>
  );
}