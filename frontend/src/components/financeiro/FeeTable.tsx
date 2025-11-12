"use client";
import React from "react";
import styles from "../../app/financeiro/page.module.css";
import type { Fee } from "@/lib/api";

type FeeStatus = "pendente" | "pago" | "atrasado" | "cancelado";

type FeeTableProps = Readonly<{
  fees: ReadonlyArray<Fee>;
  loading: boolean;
  showActions?: boolean;
  onMarkPaid: (id: number) => void | Promise<void>;
  onSetStatus: (id: number, status: FeeStatus) => void | Promise<void>;
  onCancel: (id: number) => void | Promise<void>;
  onNotifyLate: (id: number) => void | Promise<void>;
  onSendReminder: (id: number) => void | Promise<void>;
  formatCurrency: (n: number) => string;
  formatDate: (d?: string | Date | null) => string;
}>; 

export default function FeeTable(props: FeeTableProps) {
  const { fees, showActions = true, onMarkPaid, onSetStatus, onCancel, onNotifyLate, onSendReminder, formatCurrency, formatDate } = props;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Usuário</th>
          <th>Valor</th>
          <th>Vencimento</th>
          <th>Status</th>
          <th>Pagamento</th>
          {showActions && (<th>Ações</th>)}
        </tr>
      </thead>
      <tbody>
        {fees.map((f) => (
          <tr key={f.id}>
            <td className={styles.cellId}>{f.id}</td>
            <td>{f.nome}</td>
            <td>{formatCurrency(Number(f.valor))}</td>
            <td>{formatDate(f.vencimento)}</td>
            <td>{f.status}</td>
            <td>{f.data_pagamento ? formatDate(f.data_pagamento) : "—"}</td>
            {showActions && (
              <td className={styles.actions}>
                <button onClick={() => onMarkPaid(f.id)} className={styles.actionButton}>Marcar pago</button>
                <button onClick={() => onSetStatus(f.id, "pendente")} className={styles.actionButton}>Pendente</button>
                <button onClick={() => onSetStatus(f.id, "atrasado")} className={styles.actionButton}>Atrasado</button>
                <button onClick={() => onCancel(f.id)} className={styles.actionButton}>Cancelar</button>
                <button onClick={() => onNotifyLate(f.id)} className={styles.actionButton}>Notificar atraso</button>
                <button onClick={() => onSendReminder(f.id)} className={styles.actionButton}>Enviar lembrete</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}