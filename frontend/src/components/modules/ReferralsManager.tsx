"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api, { type User } from "../../lib/api";
import { useAuth } from "../providers/AuthProvider";
import { Pencil } from "lucide-react";
import styles from "./referralsManager.module.css";

type Referral = {
  id: number;
  usuario_origem_id: number;
  usuario_destino_id: number;
  descricao: string;
  status: "nova" | "em contato" | "fechada" | "recusada";
  agradecimentos_publicos?: string;
};

// Rótulos dependem do contexto
const sentStatusLabels: Record<Referral["status"], string> = {
  "nova": "Enviada",
  "em contato": "Em negociação",
  "fechada": "Fechada",
  "recusada": "Recusada",
};
const receivedStatusLabels: Record<Referral["status"], string> = {
  "nova": "Recebida",
  "em contato": "Em negociação",
  "fechada": "Fechada",
  "recusada": "Recusada",
};

// Para Indicações Recebidas, os status disponíveis devem ser: Recebida, Em negociação, Fechada
const receivedStatusOptions: Referral["status"][] = ["nova", "em contato", "fechada"];
// Para Enviadas, alinhar com Recebidas (mesmos status; rótulo difere)
const sentStatusOptions: Referral["status"][] = ["nova", "em contato", "fechada"];

export default function ReferralsManager() {
  const { usuario } = useAuth();
  const [sent, setSent] = useState<Referral[]>([]);
  const [received, setReceived] = useState<Referral[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // removido updatingId por não ser utilizado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<number | null>(null);
  const [modalStatus, setModalStatus] = useState<Referral["status"]>("nova");
  const [thanksText, setThanksText] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!usuario) return;
        const [sentRes, receivedRes, usersRes] = await Promise.all([
          api.get(`/indicacoes/usuario/${usuario.id}/enviadas`),
          api.get(`/indicacoes/usuario/${usuario.id}/recebidas`),
          api.get(`/usuarios`),
        ]);
        setSent(sentRes.data as Referral[]);
        setReceived(receivedRes.data as Referral[]);
        setUsers(usersRes.data as User[]);
      } catch (e) {
        let message = "Falha ao carregar indicações";
        if (typeof e === "object" && e && "message" in e) {
          message = (e as any).message ?? message;
        }
        console.error("Erro ao carregar indicações", e);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [usuario]);

  const userMap = useMemo(() => {
    const map = new Map<number, User>();
    for (const u of users) {
      map.set(u.id, u);
    }
    return map;
  }, [users]);

  const changeStatus = async (id: number, status: Referral["status"], agradecimentos_publicos?: string) => {
    try {
      await api.patch(`/indicacoes/${id}/status`, { status, agradecimentos_publicos });
      setSent((curr) => curr.map((r) => (r.id === id ? { ...r, status, agradecimentos_publicos } : r)));
      setReceived((curr) => curr.map((r) => (r.id === id ? { ...r, status, agradecimentos_publicos } : r)));
    } catch (e) {
      // trata exceção com detalhe
      let message = "Falha ao atualizar status";
      if (typeof e === "object" && e && "message" in e) {
        message = (e as any).message ?? message;
      }
      console.error("Erro ao atualizar status da indicação", e);
      setError(message);
    }
  };

  if (!usuario) {
    return <p>Faça login para ver e gerenciar suas indicações.</p>;
  }

  return (
    <div>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>Minhas Indicações</h2>
        <Link href="/indicacoes/nova" prefetch>
          <button className={`${styles.button} ${styles.buttonPrimary}`}>
            Fazer indicação
          </button>
        </Link>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p>Carregando...</p>}

      <section className={styles.section}>
        <h3>Indicações Recebidas</h3>
        {received.length === 0 ? (
          <p>Nenhuma indicação recebida.</p>
        ) : (
          <table className={styles.table}>
            <colgroup>
              <col className={styles.col30} />
              <col className={styles.col50} />
              <col className={styles.col20} />
            </colgroup>
            <thead>
              <tr>
                <th className={styles.thLeft}>De</th>
                <th className={styles.thLeft}>Descrição</th>
                <th className={styles.thLeft}>Status</th>
              </tr>
            </thead>
            <tbody>
              {received.map((r) => {
                const u = userMap.get(r.usuario_origem_id);
                return (
                  <tr key={r.id}>
                    <td className={styles.cell}>
                      {u ? `${(u as any).nome ?? u.email} (${u.email})` : `Usuário #${r.usuario_origem_id}`}
                    </td>
                    <td className={`${styles.cell} ${styles.cellWrap}`}>{r.descricao}</td>
                    <td className={`${styles.cell} ${styles.statusCell}`}>
                      <span>{receivedStatusLabels[r.status]}</span>
                      <button
                        disabled={(r.status ?? "").toLowerCase() === "fechada"}
                        onClick={() => {
                          if ((r.status ?? "").toLowerCase() === "fechada") return;
                          setEditingReferralId(r.id);
                          setModalStatus(r.status);
                          setThanksText("");
                          setIsModalOpen(true);
                        }}
                        aria-label="Editar status"
                        title={(r.status ?? "").toLowerCase() === "fechada" ? "Indicação fechada" : "Editar status"}
                        className={styles.iconButton}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3>Indicações Enviadas</h3>
        {sent.length === 0 ? (
          <p>Nenhuma indicação enviada.</p>
        ) : (
          <table className={styles.table}>
            <colgroup>
              <col className={styles.col25} />
              <col className={styles.col40} />
              <col className={styles.col15} />
              <col className={styles.col20} />
            </colgroup>
            <thead>
              <tr>
                <th className={styles.thLeft}>Para</th>
                <th className={styles.thLeft}>Descrição</th>
                <th className={styles.thLeft}>Agradecimento</th>
                <th className={styles.thLeft}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sent.map((r) => {
                const u = userMap.get(r.usuario_destino_id);
                return (
                  <tr key={r.id}>
                    <td className={styles.cell}>
                      {u ? `${(u as any).nome ?? u.email} (${u.email})` : `Usuário #${r.usuario_destino_id}`}
                    </td>
                    <td className={`${styles.cell} ${styles.cellWrap}`}>{r.descricao}</td>
                    <td className={`${styles.cell} ${styles.cellWrap}`}>
                      {r.status === "fechada" && r.agradecimentos_publicos ? r.agradecimentos_publicos : "-"}
                    </td>
                    <td className={styles.cell}>
                      <span>{sentStatusLabels[r.status]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      {/* Modal mount */}
      <EditStatusModal
        open={isModalOpen}
        status={modalStatus}
        onClose={() => setIsModalOpen(false)}
        onSave={(newStatus, thanks) => {
          if (editingReferralId == null) return;
          // Atualiza status via API e fecha modal
          setModalStatus(newStatus);
          changeStatus(editingReferralId, newStatus, thanks);
          setIsModalOpen(false);
          setEditingReferralId(null);
        }}
        onStatusChange={setModalStatus}
        thanksText={thanksText}
        onThanksTextChange={setThanksText}
      />
    </div>
  );
}

// Modal simples para edição de status em Indicações Recebidas
function EditStatusModal(props: Readonly<{
  open: boolean;
  status: Referral["status"];
  onClose: () => void;
  onSave: (newStatus: Referral["status"], thanksText?: string) => void;
  onStatusChange: (newStatus: Referral["status"]) => void;
  thanksText: string;
  onThanksTextChange: (text: string) => void;
}>) {
  const { open, status, onClose, onSave, onStatusChange, thanksText, onThanksTextChange } = props;
  if (!open) return null;
  return (
    <dialog open className={styles.modalDialog} aria-modal="true">
      <div className={styles.modalCard}>
        <h4 className={styles.modalTitle}>Editar status</h4>
        <div className={styles.formFields}>
          <label className={styles.field}>
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as Referral["status"])}
              className={styles.select}
            >
              {receivedStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {receivedStatusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Agradecimentos públicos por negócios fechados (opcional)</span>
            <textarea
              value={thanksText}
              onChange={(e) => onThanksTextChange(e.target.value)}
              rows={3}
              placeholder="Ex.: Obrigado ao parceiro X pela parceria neste negócio."
              className={styles.textarea}
            />
          </label>
        </div>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={`${styles.button} ${styles.buttonSecondary}`}>Cancelar</button>
          <button
            onClick={() => onSave(status, thanksText)}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Salvar
          </button>
        </div>
      </div>
    </dialog>
  );
}