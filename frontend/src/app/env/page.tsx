"use client";

import React from "react";

export default function EnvPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  return (
    <main style={{ padding: 24 }}>
      <h1>Ambiente</h1>
      <p>
        NEXT_PUBLIC_API_URL: <strong>{apiUrl || "(não definido)"}</strong>
      </p>
      <p>
        Edite <code>.env.local</code> para ajustar a URL da API.
      </p>
    </main>
  );
}