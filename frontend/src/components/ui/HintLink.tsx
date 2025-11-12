"use client";
import React from 'react';
import Link from 'next/link';
import styles from './css/HintLink.module.css';

type Props = Readonly<{
  className?: string;
}>;

export default function HintLink({ className }: Props) {
  return (
    <p className={`${styles.hint} ${className ?? ''}`}>
      Não tem acesso? Crie sua intenção em:{' '}
      <Link href="/intentions" className={styles.hintLink}>
        Intenções
      </Link>
    </p>
  );
}