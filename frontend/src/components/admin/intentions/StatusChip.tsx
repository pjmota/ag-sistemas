import React from "react";
import styles from "./intentions.module.css";

type Props = {
  status: "pendente" | "aprovada" | "recusada";
};

export default function StatusChip({ status }: Readonly<Props>) {
  const variantClass = (() => {
    switch (status) {
      case "aprovada":
        return styles.statusApproved;
      case "recusada":
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  })();

  return <span className={`${styles.statusChip} ${variantClass}`}>{status}</span>;
}