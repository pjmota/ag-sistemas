"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import styles from "./layout.module.css";

export default function Header() {
  const { usuario, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const controls = (() => {
    if (loading) {
      return <span className={styles.loading}>carregando...</span>;
    }
    if (usuario) {
      return (
        <>
          <span className={styles.userEmail}>{usuario.nome}</span>
          <button onClick={handleLogout} className={styles.button}>
            Sair
          </button>
        </>
      );
    }
    return (
      <button onClick={() => router.push("/login")} className={styles.button}>
        Login
      </button>
    );
  })();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span style={{ fontWeight: 600 }}>Plataforma de Networking</span>
      </div>
      <div className={styles.controls}>{controls}</div>
    </header>
  );
}