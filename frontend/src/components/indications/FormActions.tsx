"use client";

import React from "react";

type Props = Readonly<{
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  wrapperClassName?: string;
  cancelClassName?: string;
  submitClassName?: string;
}>;

export default function FormActions({ onCancel, submitLabel, loading, wrapperClassName, cancelClassName, submitClassName }: Props) {
  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        onClick={onCancel}
        className={cancelClassName}
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={!!loading}
        className={submitClassName}
      >
        {loading ? "Enviando..." : submitLabel}
      </button>
    </div>
  );
}