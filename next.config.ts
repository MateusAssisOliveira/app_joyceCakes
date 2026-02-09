// ARQUIVO DE CONFIGURAÇÃO DO NEXT.JS
//
// Propósito:
// Este arquivo configura o comportamento do framework Next.js. Ele permite personalizar
// funcionalidades como o sistema de build, roteamento, headers, e otimização de imagens.
//
// Responsabilidade:
// - Definir configurações globais para a aplicação Next.js.
// - Configurar padrões de imagens remotas para o componente <Image>.
// - Ignorar erros de build específicos (TypeScript, ESLint) se necessário.
// - Habilitar ou desabilitar funcionalidades experimentais.

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // TODO: Remover ignoreBuildErrors após corrigir os erros de tipo listados em ERROS_TIPO.md
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO: Remover ignoreDuringBuilds após corrigir ESLint issues
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
