"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import styles from "./page.module.css";
import ErrorBanner from "@/components/indications/ErrorBanner";
import DestinationSelect from "@/components/indications/DestinationSelect";
import DescriptionField from "@/components/indications/DescriptionField";
import FormActions from "@/components/indications/FormActions";

type User = { id: number; email: string; role: "admin" | "membro"; nome?: string };

export default function NovaIndicacaoPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [destinoId, setDestinoId] = useState<number | "">("");
  const [descricao, setDescricao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const usersRes = await api.get("/usuarios");
        setUsers(usersRes.data as User[]);
      } catch (e) {
        // Tratar a exceção: registrar e exibir mensagem amigável
        console.error("Erro ao carregar usuários", e);
        setError("Falha ao carregar usuários");
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) {
      setError("É necessário estar autenticado.");
      return;
    }
    if (!destinoId || !descricao.trim()) {
      setError("Selecione o usuário de destino e descreva a indicação.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.post("/indicacoes", {
        usuario_origem_id: usuario.id,
        usuario_destino_id: Number(destinoId),
        descricao: descricao.trim(),
      });
      router.push("/indicacoes");
    } catch (e) {
      // Tratar a exceção: registrar e manter mensagem amigável
      console.error("Erro ao criar indicação", e);
      setError("Falha ao criar indicação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <h1>Nova Indicação</h1>
      <p>Preencha os dados para registrar uma nova indicação.</p>

      {error && <ErrorBanner message={error} className={styles.error} />}

      <form onSubmit={handleSubmit} className={styles.form}>
        <DestinationSelect
          value={destinoId}
          onChange={setDestinoId}
          options={users
            .filter((u) => u.role === "membro")
            .filter((u) => u.email !== usuario?.email)
            .map((u) => ({ value: u.id, label: `${(u as any).nome ?? u.email} (${u.email})` }))}
          wrapperClassName={styles.field}
          selectClassName={styles.input}
        />

        <DescriptionField
          value={descricao}
          onChange={setDescricao}
          rows={4}
          placeholder="Descreva brevemente a oportunidade de negócio, contexto e próximos passos."
          wrapperClassName={styles.field}
          textareaClassName={`${styles.input} ${styles.textarea}`}
        />

        <FormActions
          onCancel={() => router.push("/indicacoes")}
          submitLabel="Criar indicação"
          loading={loading}
          wrapperClassName={styles.actions}
          cancelClassName={styles.button}
          submitClassName={`${styles.button} ${styles.buttonSubmit}`}
        />
      </form>
    </main>
  );
}