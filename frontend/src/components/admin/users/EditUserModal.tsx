"use client";

import React from "react";
import Button from "../../ui/Button";
import userStyles from "./users.module.css";
import { type User, type Plan, listPlans, assignPlan } from "../../../lib/api";

type UserRow = User;

export type EditUserForm = {
  nome?: string;
  empresa?: string;
  telefone?: string;
  cargo?: string;
  bio_area_atuacao?: string;
  role?: 'admin' | 'membro';
};

export interface EditUserModalProps {
  open: boolean;
  user: UserRow | null;
  form: EditUserForm;
  onClose: () => void;
  onChange: (updater: any) => void;
  onSave: () => void;
}

export default function EditUserModal(props: Readonly<EditUserModalProps>) {
  const { open, user, form, onClose, onChange, onSave } = props;
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = React.useState<number | "">("");
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [assignMsg, setAssignMsg] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  React.useEffect(() => {
    if (!open) return;
    // Carrega lista de planos ao abrir o modal
    (async () => {
      try {
        const ps = await listPlans();
        // Exibe apenas planos ativos (considera undefined como ativo por compatibilidade)
        setPlans(ps.filter((p) => p.ativo !== false));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
  }, [open]);
  if (!open || !user) return null;
  return (
    <dialog open className={userStyles.dialogModal} aria-modal="true" aria-labelledby="editUserTitle">
      <h4 id="editUserTitle" className={userStyles.title}>Editar usuário #{user.id}</h4>
      <div className={userStyles.formGrid}>
        <label className={userStyles.field}>
          <span>Nome</span>
          <input
            value={form.nome || ""}
            onChange={(e) => onChange((f: any) => ({ ...f, nome: e.target.value }))}
            placeholder="Nome"
            className={userStyles.input}
          />
        </label>
        <label className={userStyles.field}>
          <span>Email</span>
          <input value={user.email} readOnly className={userStyles.inputReadOnly} />
        </label>
        <label className={userStyles.field}>
          <span>Empresa</span>
          <input
            value={form.empresa || ""}
            onChange={(e) => onChange((f: any) => ({ ...f, empresa: e.target.value }))}
            placeholder="Empresa"
            className={userStyles.input}
          />
        </label>
        <label className={userStyles.field}>
          <span>Perfil</span>
          <select
            value={form.role || "membro"}
            onChange={(e) => onChange((f: any) => ({ ...f, role: e.target.value }))}
            className={userStyles.select}
          >
            <option value="membro">membro</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label className={userStyles.field}>
          <span>Telefone</span>
          <input
            value={form.telefone || ""}
            onChange={(e) => onChange((f: any) => ({ ...f, telefone: e.target.value }))}
            placeholder="Telefone"
            className={userStyles.input}
          />
        </label>
        <label className={userStyles.field}>
          <span>Cargo</span>
          <input
            value={form.cargo || ""}
            onChange={(e) => onChange((f: any) => ({ ...f, cargo: e.target.value }))}
            placeholder="Cargo"
            className={userStyles.input}
          />
        </label>
        <label className={`${userStyles.field} ${userStyles.fullWidth}`}>
          <span>Bio/Área de atuação</span>
          <textarea
            value={form.bio_area_atuacao || ""}
            onChange={(e) => onChange((f: any) => ({ ...f, bio_area_atuacao: e.target.value }))}
            placeholder="Bio/Área de atuação"
            className={userStyles.textarea}
          />
        </label>
        <label className={`${userStyles.field} ${userStyles.fullWidth}`}>
          <span>Atribuir plano</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedPlanId === "" ? "" : String(selectedPlanId)}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedPlanId(v ? parseInt(v, 10) : "");
              }}
              className={userStyles.select}
              aria-label="Plano"
            >
              <option value="">Selecione um plano</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — R$ {Number(p.valor).toFixed(2)}</option>
              ))}
            </select>
            <Button
              onClick={async () => {
                if (selectedPlanId === "" || !user) return;
                setAssignLoading(true);
                setAssignMsg(null);
                try {
                  await assignPlan(user.id, Number(selectedPlanId));
                  setAssignMsg("Plano atribuído com sucesso.");
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error(e);
                  setAssignMsg("Falha ao atribuir plano.");
                } finally {
                  setAssignLoading(false);
                }
              }}
              loading={assignLoading}
            >
              Atribuir
            </Button>
          </div>
          {assignMsg && (
            <small style={{ marginTop: 6 }}>{assignMsg}</small>
          )}
        </label>
      </div>
      <div className={userStyles.footer}>
        <Button onClick={onClose} className={userStyles.cancelButton}>Cancelar</Button>
        <Button onClick={onSave}>Salvar</Button>
      </div>
    </dialog>
  );
}