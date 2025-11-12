"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import styles from "./layout.module.css";

export default function AppShell(props: Readonly<{ children: React.ReactNode }>) {
  const { children } = props;
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";
  const isPublicIntentions = pathname === "/intentions";
  const isRegisterPage = pathname === "/register";

  if (isAuthPage || isPublicIntentions || isRegisterPage) {
    return (
      <div>
        {children}
      </div>
    );
  }

  return (
    <div className={styles.appShell}>
      <Sidebar />
      <main className={styles.main}>
        <Header />
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
}