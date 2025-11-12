"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from "./layout.module.css";
import { useAuth } from '@/components/providers/AuthProvider';

type NavItem = {
  key: string;
  label: string;
  href?: string;
  external?: boolean;
};

const navItems: NavItem[] = [
  /* { key: 'intencoes_public', label: 'Página de Intenção', href: '/intentions' }, */
  { key: 'admin_area', label: 'Área do Administrador', href: '/admin' },
  /* { key: 'cadastro', label: 'Cadastro Completo', href: '/register' }, */
  { key: 'indicacoes', label: 'Sistema de Indicações', href: '/indications' },
  { key: 'financeiro', label: 'Financeiro', href: '/financeiro' },
  { key: 'dashboard', label: 'Dashboard de Performance', href: '/dashboard' },
  { key: 'docs', label: 'Docs API', href: 'http://localhost:3001/docs', external: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === 'admin';
  const visibleModules = parseVisibleModules();
  const roleAwareVisible = isAdmin
    ? visibleModules
    : visibleModules.filter((key) => key !== 'admin_area' && key !== 'dashboard');
  const itemsToRender = navItems.filter((i) => roleAwareVisible.includes(i.key));
  const activeHref = computeActiveHref(pathname, itemsToRender);
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}>
        <img
          src="/branding/g_logo.png"
          alt="Logo"
          className={styles.logoImg}
        />
      </div>
      <nav>
        <ul className={styles.navList}>
          {itemsToRender.map((item) => {
            const isActive = item.href === activeHref;
            const linkClass = isActive ? styles.navLinkActive : styles.navLink;
            if (!item.href) {
              return (
                <li key={item.label}>
                  <span className={`${styles.navLinkBase} ${linkClass}`}>{item.label}</span>
                </li>
              );
            }
            if (item.external) {
              return (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={`${styles.navLinkBase} ${linkClass}`}>{item.label}</a>
                </li>
              );
            }
            return (
              <li key={item.label}>
                <Link href={item.href} className={`${styles.navLinkBase} ${linkClass}`}>{item.label}</Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function parseVisibleModules(): string[] {
  const raw = process.env.NEXT_PUBLIC_VISIBLE_MODULES?.toLowerCase() ?? '';
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length > 0) return list;
  // padrão: mostrar os módulos principais solicitados (sem Docs)
  return ['intencoes_public', 'admin_area', 'cadastro', 'indicacoes', 'financeiro', 'dashboard'];
}

function computeActiveHref(pathname: string, items: NavItem[]): string | undefined {
  type NavItemWithHref = NavItem & { href: string };
  const candidates: NavItemWithHref[] = items.filter((i): i is NavItemWithHref => !!i.href && !i.external);
  const exact = candidates.find((i) => pathname === i.href);
  if (exact) return exact.href;
  const matches = candidates.filter((i) => isPrefixAtBoundary(pathname, i.href));
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => b.href.length - a.href.length);
  return matches[0].href;
}

function isPrefixAtBoundary(path: string, href: string): boolean {
  if (path === href) return true;
  return path.startsWith(href + '/');
}