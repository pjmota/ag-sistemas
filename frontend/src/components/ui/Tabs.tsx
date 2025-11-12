"use client";
import React, { useState } from "react";
import styles from "./css/tabs.module.css";

type TabItem = {
  key: string;
  label: string;
  content: React.ReactNode;
};

type Props = Readonly<{
  items: TabItem[];
  initialKey?: string;
}>;

export default function Tabs({ items, initialKey }: Props) {
  const [active, setActive] = useState<string>(initialKey ?? items[0]?.key);

  return (
    <div>
      <div className={styles.tabHeader}>
        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <button
              key={it.key}
              onClick={() => setActive(it.key)}
              className={`${styles.tabButton} ${isActive ? styles.active : ""}`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      <div className={styles.tabContent}>
        {items.find((i) => i.key === active)?.content}
      </div>
    </div>
  );
}