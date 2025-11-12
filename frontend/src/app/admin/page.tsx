import React from "react";
import AdminIntentionsTab from "../../components/admin/intentions/AdminIntentionsTab";
import UsersTable from "../../components/admin/users/UsersTable";
import PlansTab from "../../components/admin/plans/PlansTab";
import Tabs from "../../components/ui/Tabs";

export const metadata = {
  title: "Área do Administrador",
};

export default function AdminHomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Área do Administrador</h1>
      <Tabs
        items={[
          { key: "intentions", label: "Intenções", content: <AdminIntentionsTab /> },
          { key: "users", label: "Usuários existentes", content: <UsersTable /> },
          { key: "plans", label: "Planos", content: <PlansTab /> },
        ]}
        initialKey="intentions"
      />
    </main>
  );
}