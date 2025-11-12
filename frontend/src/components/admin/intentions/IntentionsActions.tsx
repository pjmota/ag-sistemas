import React from "react";
import { ThumbsUp, ThumbsDown, Mail } from "lucide-react";
import styles from "./intentions.module.css";

type Props = {
  status: "pendente" | "aprovada" | "recusada";
  convite_gerado?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onInvite: () => void;
};

export default function IntentionActions({ status, convite_gerado, onApprove, onReject, onInvite }: Readonly<Props>) {
  const approveDisabled = status === "aprovada" || status === "recusada";
  const inviteDisabled = convite_gerado === true || status === "recusada" || status === "pendente";

  const approveTooltip = (() => {
    if (status === "aprovada") return "Aprovada";
    if (status === "recusada") return "Indisponível após recusada";
    return "Aprovar";
  })();

  const inviteTooltip = (() => {
    if (convite_gerado) return "Convite já enviado";
    if (status === "aprovada") return "Gerar Convite";
    return "Indisponível após recusada";
  })();

  return (
    <div className={styles.actionsRow}>
      <span className={styles.tooltipContainer}>
        <button
          onClick={onApprove}
          disabled={approveDisabled}
          aria-label="Aprovar"
          className={`${styles.iconButton} ${styles.approve}`}
        >
          <ThumbsUp size={22} />
        </button>
        <span className={styles.tooltip}>{approveTooltip}</span>
      </span>
      <span className={styles.tooltipContainer}>
        <button
          onClick={onReject}
          disabled={status === "recusada"}
          aria-label="Recusar"
          className={`${styles.iconButton} ${styles.reject}`}
        >
          <ThumbsDown size={22} />
        </button>
        <span className={styles.tooltip}>Recusar</span>
      </span>
      <span className={styles.tooltipContainer}>
        <button
          onClick={onInvite}
          disabled={inviteDisabled}
          aria-label="Gerar Convite"
          className={`${styles.iconButton} ${styles.invite}`}
        >
          <Mail size={22} />
        </button>
        <span className={styles.tooltip}>{inviteTooltip}</span>
      </span>
    </div>
  );
}