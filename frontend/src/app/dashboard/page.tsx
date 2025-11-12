import React from "react";
import DashboardPerformance from "../../components/modules/DashboardPerformance";
import RequireAuth from "../../components/auth/RequireAuth";

export const metadata = {
  title: "Dashboard de Performance",
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <main style={{ padding: 24 }}>
        <h1>Dashboard de Performance</h1>
        <p>Visão geral do desempenho do grupo neste mês.</p>
        <div style={{ marginTop: 16 }}>
          <DashboardPerformance />
        </div>
      </main>
    </RequireAuth>
  );
}