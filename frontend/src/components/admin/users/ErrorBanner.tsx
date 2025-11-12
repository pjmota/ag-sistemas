"use client";

import React from "react";
import styles from "./users.module.css";

export interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: Readonly<ErrorBannerProps>) {
  if (!message) return null;
  return <div className={styles.error}>{message}</div>;
}