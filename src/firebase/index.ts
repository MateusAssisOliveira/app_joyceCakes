// ARQUIVO PRINCIPAL DO FIREBASE (CLIENTE E SERVIDOR)
//
// Propósito:
// Este arquivo agora serve como um ponto de entrada universal para as funções
// de inicialização do Firebase, podendo ser usado tanto no lado do cliente
// (em componentes com 'use client') quanto no lado do servidor (em Server Components).
//
// Responsabilidade:
// - Centralizar a configuração e a inicialização do Firebase.
// - Exportar uma função `getSdks()` que pode ser chamada de qualquer ambiente.
// - Reexportar os hooks e providers que são específicos do cliente.

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Esta função agora pode ser usada tanto no servidor quanto no cliente.
export function getSdks() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}

// Os exports abaixo são para componentes de cliente.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
