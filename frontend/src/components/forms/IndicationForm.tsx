"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../ui/Input";
import Button from "../ui/Button";
import api from "../../lib/api";
import { useAuth } from "../providers/AuthProvider";
import styles from "./forms.module.css";

const schema = z.object({
  usuario_destino_id: z.string().min(1, "Selecione o usuário indicado"),
  empresa_contato: z.string().min(2, "Informe a empresa/contato"),
  descricao: z.string().min(5, "Descreva a oportunidade"),
});

type FormData = z.infer<typeof schema>;

type User = { id: number; email: string; role: "admin" | "membro"; nome?: string };

export default function IndicationForm() {
  const { usuario } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true);
      try {
        if (!usuario) {
          return;
        }
        const usersRes = await api.get("/usuarios");
        setUsers(usersRes.data as User[]);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Falha ao carregar usuários/membros";
        setError(Array.isArray(msg) ? msg.join(", ") : msg);
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [usuario]);

  const userOptions = useMemo(() => {
    return users
      .filter((u) => u.role === "membro")
      .filter((u) => u.email !== usuario?.email) // evita auto-seleção
      .map((u) => ({ value: String(u.id), label: `${u.nome ?? u.email} (${u.email})` }));
  }, [users, usuario?.email]);

  const onSubmit = async (data: FormData) => {
    setSuccess(null);
    setError(null);
    try {
      if (!usuario) {
        setError("Faça login para criar indicações.");
        return;
      }
      const payload = {
        usuario_origem_id: usuario.id,
        usuario_destino_id: Number(data.usuario_destino_id),
        descricao: `${data.empresa_contato}\n\n${data.descricao}`,
      };
      await api.post("/indicacoes", payload);
      setSuccess("Indicação criada com sucesso.");
      reset();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao criar indicação");
    }
  };

  if (!usuario) {
    return (
      <div className={`${styles.form} ${styles.indicationVars}`}>
        <p>Faça login para criar indicações.</p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className={`${styles.form} ${styles.indicationVars}`}>
      <div className={styles.field}>
        <label htmlFor="usuario_destino_id" className={styles.fieldLabel}>Usuário indicado</label>
        <select
          id="usuario_destino_id"
          {...register("usuario_destino_id")}
          className={styles.fieldControl}
          disabled={loadingUsers}
        >
          <option value="">Selecione um usuário</option>
          {userOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.usuario_destino_id?.message && (
          <span className={styles.errorText}>{errors.usuario_destino_id.message}</span>
        )}
      </div>

      <Input label="Empresa/contato indicado" {...register("empresa_contato")} error={errors.empresa_contato?.message} />
      <div className={styles.field}>
        <label htmlFor="descricao" className={styles.fieldLabel}>Descrição da oportunidade</label>
        <textarea
          id="descricao"
          {...register("descricao")}
          rows={4}
          className={styles.fieldControl}
        />
        {errors.descricao?.message && (
          <span className={styles.errorText}>{errors.descricao.message}</span>
        )}
      </div>

      <Button type="submit" loading={isSubmitting}>
        Criar Indicação
      </Button>
      {success && <p className={styles.successText}>{success}</p>}
      {error && <p className={styles.errorText}>{error}</p>}
    </form>
  );
}