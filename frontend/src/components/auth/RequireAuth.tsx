"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

type RequireAuthProps = {
  children: React.ReactNode;
};

export default function RequireAuth(props: Readonly<RequireAuthProps>) {
  const { children } = props;
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  if (loading) return null;
  if (!token) return null; // Evita flicker enquanto redireciona

  return <>{children}</>;
}