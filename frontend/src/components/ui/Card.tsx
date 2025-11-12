"use client";
import React from 'react';
import styles from './css/Card.module.css';

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export default function Card({ children, className }: Props) {
  return <div className={`${styles.card} ${className ?? ''}`}>{children}</div>;
}