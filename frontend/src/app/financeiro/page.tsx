"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import FiltersBar from "@/components/financeiro/FiltersBar";
import FeeTable from "@/components/financeiro/FeeTable";
import { useOptionalAuth } from "@/components/providers/AuthProvider";
import {
  listFees,
  generateFees,
  markPaid,
  updateStatus,
  cancelFee,
  totals,
  notifyLate,
  sendReminder,
  type Fee,
  type User,
  listUsers,
} from "@/lib/api";

const statuses = ["pendente", "pago", "atrasado", "cancelado"] as const;

function formatCurrency(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso?: string | Date | null) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("pt-BR");
}

export default function FinanceiroPage() {
  const auth = useOptionalAuth();
  const isMember = auth?.usuario?.role === "membro";
  const loggedUserId = auth?.usuario?.id;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState<string>("");
  const [usuarioId, setUsuarioId] = useState<number | undefined>(undefined);
  const [fees, setFees] = useState<Fee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ totalRecebido: number; totalPendente: number } | null>(null);

  const canFilter = useMemo(() => ({ month, year, status: status || undefined, usuario_id: usuarioId }), [month, year, status, usuarioId]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [list, sum] = await Promise.all([listFees(canFilter), totals(month, year)]);
      console.log('usuários', list)
      setFees(list);
      setSummary(sum);
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Quando for membro, sempre travar o filtro no usuário logado
    if (isMember && typeof loggedUserId === "number") {
      setUsuarioId(loggedUserId);
    }
  }, [isMember, loggedUserId]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, status, usuarioId]);

  // Carrega usuários para listar pessoas com base em usuários
  useEffect(() => {
    // Apenas admin precisa carregar lista de usuários para filtro
    if (!isMember) {
      listUsers()
        .then(setUsers)
        .catch(() => {/* silencioso */});
    }
  }, [isMember]);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await generateFees(month, year, usuarioId);
      setMessage(`Geradas ${res.created} mensalidade(s) para ${usuarioId ? 'usuário selecionado' : 'associações existentes'} em ${month}/${year}.`);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Falha ao gerar mensalidades");
    } finally {
      setLoading(false);
    }
  }

  async function doMarkPaid(id: number) {
    await markPaid(id);
    await refresh();
  }

  async function doCancel(id: number) {
    await cancelFee(id, "cancelado via painel");
    await refresh();
  }

  async function doSetStatus(id: number, s: Fee["status"]) {
    await updateStatus(id, s, s === "atrasado" ? "marcado como atrasado" : undefined);
    await refresh();
  }

  async function doNotifyLate(id: number) {
    await notifyLate(id);
    globalThis.alert?.('Notificação de atraso enviada!');
    await refresh();
  }

  async function doSendReminder(id: number) {
    await sendReminder(id);
    globalThis.alert?.('Lembrete enviado!');
    await refresh();
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Financeiro · Mensalidades</h1>
      {!isMember && (
        <FiltersBar
          month={month}
          year={year}
          status={status}
          usuarioId={usuarioId}
          users={users}
          setMonth={setMonth}
          setYear={setYear}
          setStatus={setStatus}
          setUsuarioId={setUsuarioId}
          onGenerate={onGenerate}
          onRefresh={refresh}
        />
      )}

      {!isMember && summary && (
        <div className={styles.summary}>
          <strong>Totais · {month}/{year}:</strong> Recebido {formatCurrency(summary.totalRecebido)} · A receber {formatCurrency(summary.totalPendente)}
        </div>
      )}

      {error && (
        <div className={styles.error}>Erro: {error}</div>
      )}
      {message && (
        <div className={styles.summary}>{message}</div>
      )}

      <div className={styles.section}>
        {(!isMember || (isMember && fees.length > 0)) && (
          <FeeTable
            fees={fees}
            loading={loading}
            showActions={!isMember}
            onMarkPaid={doMarkPaid}
            onSetStatus={doSetStatus}
            onCancel={doCancel}
            onNotifyLate={doNotifyLate}
            onSendReminder={doSendReminder}
            formatCurrency={(n) => formatCurrency(n)}
            formatDate={(d) => formatDate(d)}
          />
        )}
        {!isMember && fees.length === 0 && !loading && (
          <div className={styles.empty}>Nenhuma mensalidade encontrada para os filtros.</div>
        )}
        {loading && (
          <div className={styles.loading}>Carregando…</div>
        )}
      </div>
    </div>
  );
}