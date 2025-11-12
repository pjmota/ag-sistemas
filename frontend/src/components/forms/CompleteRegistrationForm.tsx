"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../ui/Input";
import Button from "../ui/Button";
import api from "../../lib/api";
import styles from "./forms.module.css";

const schema = z.object({
  nome: z.string().min(2, { error: "Informe seu nome" }),
  email: z.email({ error: "Email inválido" }),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
  bio_area_atuacao: z.string().optional(),
  senha: z.string().min(6, { error: "Senha deve ter ao menos 6 caracteres" }),
});

type FormData = z.infer<typeof schema>;

type Props = { token: string };

export default function CompleteRegistrationForm(props: Readonly<Props>) {
  const { token } = props;
  const router = useRouter();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefillEmpresa, setPrefillEmpresa] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const loadPrefill = async () => {
      setError(null);
      try {
        const res = await api.get(`/convites/${token}/dados`);
        const { nome, email, empresa } = res.data as { nome: string; email: string; empresa?: string | null };
        reset({ nome, email });
        setPrefillEmpresa(empresa ?? null);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Não foi possível carregar dados do convite';
        setError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    };
    if (token) {
      loadPrefill();
    }
  }, [token, reset]);

  // Máscara de telefone (99) 9 9999-9999
  const formatPhoneBR = (value: string): string => {
    const digits = (value || '').replaceAll(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    const area = digits.slice(0, 2);
    const rest = digits.slice(2);
    if (!rest) return `(${area}`;
    if (rest.length <= 1) return `(${area}) ${rest}`;
    if (rest.length <= 5) return `(${area}) ${rest[0]} ${rest.slice(1)}`;
    if (rest.length <= 9) return `(${area}) ${rest[0]} ${rest.slice(1, 5)}-${rest.slice(5)}`;
    return `(${area}) ${rest[0]} ${rest.slice(1, 5)}-${rest.slice(5, 9)}`;
  };

  const onSubmit = async (data: FormData) => {
    setSuccess(null);
    setError(null);
    try {
      const payload = { ...data } as any;
      // usa telefone mascarado do estado local
      if (phone) {
        payload.telefone = phone.trim();
      }
      if (prefillEmpresa) {
        payload.empresa = prefillEmpresa;
      }
      await api.post("/usuarios/cadastro", payload, { params: { token } });
      setSuccess("Cadastro completo realizado com sucesso!");
      reset();
      router.push("/login");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Não foi possível concluir o cadastro");
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className={`${styles.form} ${styles.completeRegistrationVars}`}>
      <div className={styles.gridTwoCols}>
        {/* Linha: Nome - Senha */}
        <Input label="Nome" {...register("nome")} error={errors.nome?.message} />
        <Input label="Senha" type="password" {...register("senha")} error={errors.senha?.message} />

        {/* Linha: Email - Telefone */}
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <div className={styles.field}>
          <label htmlFor="telefone" className={styles.fieldLabel}>Telefone</label>
          <div>
            <input
              id="telefone"
              type="tel"
              placeholder="Seu telefone"
              className={styles.fieldControl}
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              onKeyDown={(e) => {
                const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
                if (allowed.includes(e.key)) return;
                if (e.ctrlKey || e.metaKey) return; // permitir copiar/colar
                if (/^\d$/.test(e.key)) return; // somente números
                e.preventDefault();
              }}
              inputMode="numeric"
              pattern="\\d*"
            />
          </div>
          {errors.telefone?.message && (
            <span className={styles.errorText}>{errors.telefone.message}</span>
          )}
        </div>

        {/* Linha: Empresa - Cargo */}
        {prefillEmpresa && (
          <div className={styles.field}>
            <label htmlFor="empresa" className={styles.fieldLabel}>Empresa (do convite)</label>
            <input id="empresa" readOnly value={prefillEmpresa ?? ''} className={styles.fieldControl} style={{ backgroundColor: "#f9fafb" }} />
          </div>
        )}
        <Input label="Cargo" {...register("cargo")} error={errors.cargo?.message} />

        {/* Bio ocupando duas colunas */}
        <div className={`${styles.field} ${styles.spanTwoCols}`}>
          <label htmlFor="bio_area_atuacao" className={styles.fieldLabel}>Bio / Área de atuação</label>
          <textarea id="bio_area_atuacao" {...register("bio_area_atuacao")} rows={4} className={styles.fieldControl} />
          {errors.bio_area_atuacao?.message && (
            <span className={styles.errorText}>{errors.bio_area_atuacao.message}</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" loading={isSubmitting}>Concluir Cadastro</Button>
      </div>
      {success && <p className={styles.successText}>{success}</p>}
      {error && <p className={styles.errorText}>{error}</p>}
    </form>
  );
}