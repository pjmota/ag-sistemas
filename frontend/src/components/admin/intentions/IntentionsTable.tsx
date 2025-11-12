"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import Button from "../../ui/Button";
import styles from "./intentions.module.css";
import StatusChip from "./StatusChip";
import IntentionActions from "./IntentionsActions";
import { generateInviteAction } from "../../../functions/generateInvite";

export type Intention = {
  id: number;
  nome: string;
  email: string;
  empresa?: string;
  motivo: string;
  status: "pendente" | "aprovada" | "recusada";
  data: string | Date;
  convite_gerado?: boolean;
};

type Props = {
  onInviteGenerated?: (token: string) => void;
};

export default function IntentionsTable({ onInviteGenerated }: Readonly<Props>) {
  const [items, setItems] = useState<Intention[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A flag de convite_gerado vem do backend e é usada para desabilitar o botão

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Intention[]>("/intencoes");
      setItems(res.data);
    } catch (error_: any) {
      setError(
        error_?.response?.status === 401
          ? "Seu usuário não tem permissão. Faça login como admin."
          : "Erro ao carregar intenções"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasAdmin = useMemo(() => error == null, [error]);

  const updateStatus = async (id: number, status: "aprovada" | "recusada") => {
    const prev = [...items];
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      await api.patch(`/intencoes/${id}/status`, { status });
    } catch (error_) {
      setItems(prev);
      setError("Falha ao atualizar status");
      // eslint-disable-next-line no-console
      console.error(error_);
    }
  };

  const generateInvite = async (id: number) => {
    await generateInviteAction(id, {
      setItems,
      onInviteGenerated,
      alertFn: alert,
      windowObj: globalThis.window,
      baseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL,
    });
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <h2>Intenções</h2>
        <Button onClick={fetchData} loading={loading}>
          Recarregar
        </Button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>
                Nome
              </th>
              <th className={styles.th}>
                Email
              </th>
              <th className={styles.th}>
                Empresa
              </th>
              <th className={styles.th}>
                Motivo
              </th>
              <th className={styles.th}>
                Status
              </th>
              <th className={styles.th}>
                Data
              </th>
              <th className={styles.th}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              return (
              <tr key={i.id}>
                <td className={styles.td}>{i.nome}</td>
                <td className={styles.td}>{i.email}</td>
                <td className={styles.td}>{i.empresa || "-"}</td>
                <td className={styles.td}>{i.motivo}</td>
                <td className={styles.td}>
                  <StatusChip status={i.status} />
                </td>
                <td className={styles.td}>
                  {new Date(i.data).toLocaleString()}
                </td>
                <td className={styles.td}>
                  {hasAdmin && (
                    <IntentionActions
                      status={i.status}
                      convite_gerado={i.convite_gerado}
                      onApprove={() => updateStatus(i.id, "aprovada")}
                      onReject={() => updateStatus(i.id, "recusada")}
                      onInvite={() => generateInvite(i.id)}
                    />
                  )}
                </td>
              </tr>
            )})}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  {loading ? "Carregando..." : "Nenhuma intenção encontrada"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}