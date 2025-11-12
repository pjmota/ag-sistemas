"use client";

import React from "react";
import Button from "../../ui/Button";
import styles from "./users.module.css";

export interface UsersToolbarProps {
  title?: string;
  loading?: boolean;
  onReload: () => void;
}

export default function UsersToolbar({ title = "Usuários existentes", loading, onReload }: Readonly<UsersToolbarProps>) {
  return (
    <div className={styles.toolbar}>
      <h2>{title}</h2>
      <Button onClick={onReload} loading={!!loading}>Recarregar</Button>
    </div>
  );
}