"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CompleteRegistrationForm from "@/components/forms/CompleteRegistrationForm";
import Card from "@/components/ui/Card";
import styles from "./page.module.css";

export default function CompleteRegistrationPage() {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <Card>
          <h1 className={styles.title}>Cadastro Completo</h1>
          <p className={styles.subtitle}>Finalize seu cadastro usando o link recebido.</p>
          <div className={styles.contentWrap}>
            <Suspense fallback={<div className={styles.loading}>Carregando...</div>}>
              <RegisterContent />
            </Suspense>
          </div>
        </Card>
      </section>
    </main>
  );
}

function RegisterContent() {
  const search = useSearchParams();
  const token = search.get("token");

  if (!token) {
    return (
      <div className={styles.error}>
        Token ausente ou inválido. Verifique o link do convite.
      </div>
    );
  }

  return (
    <div className={styles.formWrap}>
      <CompleteRegistrationForm token={token} />
    </div>
  );
}