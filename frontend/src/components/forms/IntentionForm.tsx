"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../ui/Input";
import Button from "../ui/Button";
import api from "../../lib/api";
import Link from "next/link";
import styles from "./forms.module.css";

const schema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  email: z.email({ error: "Email inválido" }),
  empresa: z.string().optional(),
  motivo: z.string().min(10, "Explique seu motivo (mínimo 10 caracteres)"),
});

type FormData = z.infer<typeof schema>;

export default function IntentionForm() {
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSuccess(null);
    await api.post("/intencoes", data);
    setSuccess("Intenção enviada com sucesso. Aguarde aprovação.");
    reset();
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className={`${styles.form} ${styles.intentionVars}`}>
      <Input label="Nome" {...register("nome")} error={errors.nome?.message} />
      <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
      <Input label="Empresa" {...register("empresa")} error={errors.empresa?.message} />
      <Input label="Por que você quer participar?" {...register("motivo")} error={errors.motivo?.message} />
      <p className={styles.hintText}>
        Já possui acesso?{" "}
        <Link href="/login" className={styles.hintLink}>
          Fazer login
        </Link>
      </p>
      <div className={styles.actions}>
        <Button className="px-12" type="submit" loading={isSubmitting}>Enviar Intenção</Button>
      </div>
      {success && <p className={styles.successText}>{success}</p>}
    </form>
  );
}