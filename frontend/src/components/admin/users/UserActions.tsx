"use client";

import React from "react";
import { Pencil, Ban, CircleCheckBig } from "lucide-react";
import styles from "./users.module.css";
import { type User } from "../../../lib/api";

type UserRow = User;

export interface UserActionsProps {
  user: UserRow;
  onEdit: (u: UserRow) => void;
  onToggleActive: (u: UserRow) => void;
}

export default function UserActions({ user, onEdit, onToggleActive }: Readonly<UserActionsProps>) {
  const isActive = user.ativo !== false;
  return (
    <div className={styles.actionsRow}>
      <span className={styles.tooltipContainer}>
        <button
          onClick={() => onEdit(user)}
          aria-label="Editar"
          className={`${styles.iconButton} ${styles.invite}`}
        >
          <Pencil size={22} />
        </button>
        <span className={styles.tooltip}>Editar</span>
      </span>
      <span className={styles.tooltipContainer}>
        <button
          onClick={() => onToggleActive(user)}
          aria-label={isActive ? "Inativar" : "Ativar"}
          className={`${styles.iconButton} ${isActive ? styles.reject : styles.approve}`}
        >
          {isActive ? <Ban size={22} /> : <CircleCheckBig size={22} />}
        </button>
        <span className={styles.tooltip}>{isActive ? "Inativar" : "Ativar"}</span>
      </span>
    </div>
  );
}