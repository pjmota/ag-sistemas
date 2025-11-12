"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./css/breadcrumb.module.css";

function labelFor(segment: string) {
  const map: Record<string, string> = {
    "": "Início",
    admin: "Área do Administrador",
    intentions: "Intenções",
    indications: "Sistema de Indicações",
    indicacoes: "Sistema de Indicações",
    dashboard: "Dashboard de Performance",
    login: "Login",
    register: "Cadastro",
    env: "Ambiente",
  };
  if (map[segment]) return map[segment];
  if (/^\d+$/.test(segment)) return `#${segment}`;
  // humanize fallback
  return segment
    .replaceAll("-", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = ["", ...segments];

  return (
    <nav aria-label="breadcrumb" className={styles.nav}>
      {crumbs.map((seg, idx) => {
        const isLast = idx === crumbs.length - 1;
        const href = `/${crumbs.slice(1, idx + 1).join("/")}`;
        const label = labelFor(seg);
        return (
          <span key={`${href}-${label}`}>
            {isLast ? (
              <span className={styles.currentLabel}>{label}</span>
            ) : (
              <Link href={href} className={styles.link}>{label}</Link>
            )}
            {!isLast && <span className={styles.divider}>/</span>}
          </span>
        );
      })}
    </nav>
  );
}