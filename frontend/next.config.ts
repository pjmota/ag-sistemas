import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /* config options here */
  async redirects() {
    return [
      {
        source: '/intencoes',
        destination: '/intentions',
        permanent: true,
      },
      {
        source: '/admin/intencoes',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/admin/intentions',
        destination: '/admin',
        permanent: true,
      },
      // Alinha rotas pt-BR para o módulo de Indicações
      {
        source: '/indicacoes',
        destination: '/indications',
        permanent: true,
      },
      {
        source: '/indicacoes/:path*',
        destination: '/indications/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
