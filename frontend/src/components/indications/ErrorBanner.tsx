"use client";

import React from "react";

type Props = Readonly<{ message: string; className?: string }>;

export default function ErrorBanner({ message, className }: Props) {
  return <p className={className}>{message}</p>;
}