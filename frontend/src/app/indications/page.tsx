import React from "react";
import ReferralsManager from "@/components/modules/ReferralsManager";

export const metadata = {
  title: "Sistema de Indicações",
};

export default function IndicacoesPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Sistema de Indicações</h1>
      <p>Veja e gerencie suas indicações recebidas e enviadas.</p>
      <div style={{ marginTop: 16 }}>
        <ReferralsManager />
      </div>
    </main>
  );
}