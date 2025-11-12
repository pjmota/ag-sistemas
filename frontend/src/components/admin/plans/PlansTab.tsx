"use client";

import React, { useEffect, useState } from "react";
import Button from "../../ui/Button";
import styles from "./plans.module.css";
import userStyles from "../users/users.module.css";
import { Ban, CircleCheckBig } from "lucide-react";
import { type Plan, listPlans, updatePlanActive, createPlan as apiCreatePlan } from "../../../lib/api";

export default function PlansTab() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ nome: string; valor: string; dia_vencimento_padrao: string }>({ nome: "", valor: "", dia_vencimento_padrao: "10" });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPlans();
      setItems(res);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError("Falha ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (p: Plan, ativo: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await updatePlanActive(p.id, ativo);
      await fetchData();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError("Falha ao atualizar status do plano");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    const nome = form.nome.trim();
    const valor = Number(form.valor);
    const dia = Number(form.dia_vencimento_padrao) || 10;
    if (!nome || !Number.isFinite(valor) || valor <= 0) {
      setError("Informe nome e valor válidos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiCreatePlan(nome, valor, dia);
      setForm({ nome: "", valor: "", dia_vencimento_padrao: String(dia) });
      await fetchData();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError("Falha ao criar plano");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <h2>Planos</h2>
        <Button onClick={fetchData} loading={loading}>Recarregar</Button>
      </div>
      {error && (<div className={styles.error}>{error}</div>)}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Nome</th>
              <th className={styles.th}>Valor</th>
              <th className={styles.th}>Dia vencimento</th>
              <th className={styles.th}>Ativo</th>
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td className={styles.td}>{p.id}</td>
                <td className={styles.td}>{p.nome}</td>
                <td className={styles.td}>R$ {Number(p.valor).toFixed(2)}</td>
                <td className={styles.td}>{p.dia_vencimento_padrao ?? 10}</td>
                <td className={styles.td}>{p.ativo ? 'ativo' : 'inativo'}</td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    {(() => {
                      const isActive = !!p.ativo;
                      const aria = isActive ? "Inativar" : "Ativar";
                      return (
                        <span className={userStyles.tooltipContainer}>
                          <button
                            onClick={() => toggleActive(p, !isActive)}
                            aria-label={aria}
                            disabled={loading}
                            className={`${userStyles.iconButton} ${isActive ? userStyles.reject : userStyles.approve}`}
                          >
                            {isActive ? <Ban size={22} /> : <CircleCheckBig size={22} />}
                          </button>
                          <span className={userStyles.tooltip}>{aria}</span>
                        </span>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  {loading ? "Carregando..." : "Nenhum plano cadastrado"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.formRow}>
        <input
          className={styles.input}
          placeholder="Nome do plano"
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
        />
        <input
          className={styles.input}
          placeholder="Valor"
          type="number"
          step="0.01"
          value={form.valor}
          onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
        />
        <input
          className={styles.input}
          placeholder="Dia vencimento"
          type="number"
          value={form.dia_vencimento_padrao}
          onChange={(e) => setForm((f) => ({ ...f, dia_vencimento_padrao: e.target.value }))}
        />
        <Button onClick={handleCreatePlan} loading={loading}>Cadastrar plano</Button>
      </div>
    </div>
  );
}