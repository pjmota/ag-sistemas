"use client";

import React from "react";

type Option = Readonly<{ value: number; label: string }>;

type Props = Readonly<{
  value: number | "";
  onChange: (v: number | "") => void;
  options: ReadonlyArray<Option>;
  wrapperClassName?: string;
  selectClassName?: string;
  label?: string;
  disabled?: boolean;
}>;

export default function DestinoSelect({ value, onChange, options, wrapperClassName, selectClassName, label = "Usuário de destino", disabled }: Props) {
  return (
    <label className={wrapperClassName}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? "" : Number(v));
        }}
        className={selectClassName}
        disabled={disabled}
      >
        <option value="">Selecione um usuário</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}