"use client";
import React from "react";
import styles from "../../app/financeiro/page.module.css";
import type { User } from "@/lib/api";

type FiltersBarProps = Readonly<{
  month: number;
  year: number;
  status: string;
  usuarioId?: number;
  users: ReadonlyArray<User>;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
  setStatus: (s: string) => void;
  setUsuarioId: (id: number | undefined) => void;
  onGenerate: () => void;
  onRefresh: () => void;
}>;

export default function FiltersBar(props: FiltersBarProps) {
  const {
    month,
    year,
    status,
    usuarioId,
    users,
    setMonth,
    setYear,
    setStatus,
    setUsuarioId,
    onGenerate,
    onRefresh,
  } = props;

  return (
    <div className={styles.filters}>
      <label className={styles.label}>
        <span>Mês</span>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.label}>
        <span>Ano</span>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={styles.inputYear}
        />
      </label>

      <label className={styles.label}>
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          {(["pendente", "pago", "atrasado", "cancelado"] as const).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.label}>
        <span>Usuário</span>
        <select
          value={typeof usuarioId === "number" ? String(usuarioId) : ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              setUsuarioId(undefined);
              return;
            }
            const userId = Number(val);
            setUsuarioId(userId);
          }}
        >
          <option value="">Todos</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome ?? u.email}
            </option>
          ))}
        </select>
      </label>

      <button onClick={onGenerate} className={styles.button}>
        Gerar mensalidades do mês
      </button>
      <button onClick={onRefresh} className={styles.button}>Atualizar</button>
    </div>
  );
}