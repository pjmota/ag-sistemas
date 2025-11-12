import React from "react";
import IntentionForm from "../../components/forms/IntentionForm";
import Logo from "@/components/branding/Logo";
import styles from './page.module.css';
import Card from '@/components/ui/Card';

export const metadata = {
  title: "Intenções",
};

export default function IntentionsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <Card>
          <div className={styles.logoWrap}>
            <Logo className={styles.logo} />
          </div>
          <p className={styles.subtitle}>Preencha o formulário abaixo para participar.</p>
          <div className={styles.formWrap}>
            <IntentionForm />
          </div>
        </Card>
      </section>
    </main>
  );
}