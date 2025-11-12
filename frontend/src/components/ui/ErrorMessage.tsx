"use client";
import React from 'react';
import styles from './css/ErrorMessage.module.css';

type Props = Readonly<{
  children?: React.ReactNode;
  message?: string;
  className?: string;
}>;

export default function ErrorMessage({ children, message, className }: Props) {
  if (!children && !message) return null;
  return (
    <div role="alert" aria-live="polite" className={`${styles.alert} ${className ?? ''}`}>
      {children ?? message}
    </div>
  );
}