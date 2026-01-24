
// CAMADA DE SERVIÇO PARA USUÁRIOS

import { doc, Firestore, setDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { UserProfile } from "@/types";

/**
 * Cria ou atualiza o documento de perfil de um usuário.
 * @param firestore Instância do Firestore.
 * @param userId O ID do usuário.
 * @param data Os dados a serem atualizados no perfil.
 */
export const updateUserProfile = (firestore: Firestore, userId: string, data: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(firestore, `users/${userId}`);

    // Usamos setDoc com { merge: true } para criar o documento se não existir,
    // ou mesclar os novos dados se ele já existir.
    return setDoc(userDocRef, data, { merge: true })
      .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'write', // 'write' cobre create e update
              requestResourceData: data
          });
          errorEmitter.emit('permission-error', permissionError);
          // Relançamos o erro para que o chamador saiba que a operação falhou
          throw permissionError;
      });
};

    