"use client";

import React, { useEffect, useMemo, useState } from "react";
import api, { type User, updateUser, setUserActive } from "../../../lib/api";
import styles from "./users.module.css";
import UsersToolbar from "./UsersToolbar";
import ErrorBanner from "./ErrorBanner";
import UserActions from "./UserActions";
import EditUserModal from "./EditUserModal";

type UserRow = User;

export default function UsersTable() {
  const logError = (...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  };
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAdmin = useMemo(() => !error, [error]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form, setForm] = useState<{
    nome?: string;
    empresa?: string;
    telefone?: string;
    cargo?: string;
    bio_area_atuacao?: string;
    role?: 'admin' | 'membro';
  }>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRes = await api.get<UserRow[]>("/usuarios");
      setItems(usersRes.data);
    } catch (e: any) {
      const msg = e?.response?.status === 401 || e?.response?.status === 403
        ? "Seu usuário não tem permissão. Faça login como admin."
        : "Erro ao carregar usuários";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startEdit = (u: UserRow) => {
    setEditingId(u.id);
    setForm({
      nome: u.nome || "",
      empresa: u.empresa || "",
      telefone: (u as any).telefone || "",
      cargo: (u as any).cargo || "",
      bio_area_atuacao: (u as any).bio_area_atuacao || "",
      role: u.role,
    });
    setIsEditModalOpen(true);
  };

  const cancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      await updateUser(editingId, form);
      await fetchData();
      setIsEditModalOpen(false);
      setEditingId(null);
    } catch (e) {
      logError(e);
      setError("Falha ao salvar alterações");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (u: UserRow) => {
    const isActive = u.ativo !== false;
    setLoading(true);
    try {
      await setUserActive(u.id, !isActive);
      await fetchData();
    } catch (e) {
      logError(e);
      setError("Falha ao alterar status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <UsersToolbar loading={loading} onReload={fetchData} />
      {error && (<ErrorBanner message={error} />)}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Nome</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Perfil</th>
              <th className={styles.th}>Empresa</th>
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              return (
                <tr key={u.id}>
                  <td className={styles.td}>{u.id}</td>
                  <td className={styles.td}>
                    {u.nome ?? "—"}
                  </td>
                  <td className={styles.td}>{u.email}</td>
                  <td className={styles.td}>
                    {u.role}
                  </td>
                  <td className={styles.td}>
                    {u.empresa ?? "—"}
                  </td>
                  <td className={styles.td}>
                    {hasAdmin && (
                      <UserActions user={u} onEdit={startEdit} onToggleActive={toggleActive} />
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  {loading ? "Carregando..." : "Nenhum usuário encontrado"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <EditUserModal
          open={isEditModalOpen}
          user={items.find((it) => it.id === editingId) || null}
          form={form}
          onClose={cancelEdit}
          onChange={setForm}
          onSave={saveEdit}
        />
      </div>
    </div>
  );
}