import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export const metadata = {
  title: "Sistema de Indicações",
};

export default async function IndicacoesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const hdrs = await headers();
  const cookie = hdrs.get("cookie") || "";
  const hasToken = /token=/.test(cookie);
  if (!hasToken) {
    redirect("/login");
  }

  return <>{children}</>;
}