"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../../lib/api";
import { useAuth } from "../providers/AuthProvider";
import styles from "./dashboardPerformance.module.css";

type KpisResponse = {
  totalMembrosAtivos: number;
  totalIndicacoesMes: number;
  totalObrigadosMes: number;
};

export default function DashboardPerformance() {
  const { usuario } = useAuth();
  const [kpis, setKpis] = useState<KpisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!usuario) return;
        const res = await api.get("/dashboard/kpis");
        setKpis(res.data as KpisResponse);
      } catch (e) {
        let message: string;
        if (axios.isAxiosError(e)) {
          message = e.response?.data?.message || e.message;
        } else if (e instanceof Error) {
          message = e.message;
        } else {
          message = "Falha ao carregar KPIs do dashboard";
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [usuario]);

  if (!usuario) {
    return <p>Faça login para acessar o dashboard de performance.</p>;
  }

  let errorEl: React.ReactNode = null;
  if (error) {
    errorEl = <ErrorText message={error} />;
  }

  let loadingEl: React.ReactNode = null;
  if (loading) {
    loadingEl = <LoadingText />;
  }

  let kpisEl: React.ReactNode = null;
  if (kpis) {
    kpisEl = <KpiGrid kpis={kpis} />;
  }

  return (
    <div>
      {errorEl}
      {loadingEl}
      {kpisEl}
    </div>
  );
}

function KpiCard(props: Readonly<{ title: string; value: number }>) {
  const { title, value } = props;
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiTitle}>{title}</div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}

function ErrorText(props: Readonly<{ message: string }>) {
  return <p className={styles.errorText}>{props.message}</p>;
}

function LoadingText() {
  return <p>Carregando KPIs...</p>;
}

function KpiGrid(props: Readonly<{ kpis: KpisResponse }>) {
  const { kpis } = props;
  return (
    <div className={styles.kpiGrid}>
      <KpiCard title="Membros ativos" value={kpis.totalMembrosAtivos} />
      <KpiCard title="Indicações no mês" value={kpis.totalIndicacoesMes} />
      <KpiCard title="Obrigados no mês" value={kpis.totalObrigadosMes} />
    </div>
  );
}