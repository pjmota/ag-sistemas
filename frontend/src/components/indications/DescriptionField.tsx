"use client";

import React from "react";

type Props = Readonly<{
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  wrapperClassName?: string;
  textareaClassName?: string;
  label?: string;
}>;

export default function DescricaoField({ value, onChange, rows = 4, placeholder, wrapperClassName, textareaClassName, label = "Descrição da indicação" }: Props) {
  return (
    <label className={wrapperClassName}>
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={textareaClassName}
      />
    </label>
  );
}