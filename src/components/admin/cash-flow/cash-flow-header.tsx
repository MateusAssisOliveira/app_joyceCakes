
'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { CashRegister } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { closeCashRegister } from '@/services';
import { useToast } from '@/hooks/use-toast';

type CashFlowHeaderProps = {
  register: CashRegister;
};

export function CashFlowHeader({ register }: CashFlowHeaderProps) {
  const [isClosing, setIsClosing] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleCloseRegister = async () => {
    if (!firestore || !user?.uid) return;

    setIsClosing(true);
    try {
      // O saldo final será calculado no backend ou via cloud function no futuro para mais segurança
      // Por agora, o front-end não precisa calcular ou enviar.
      await closeCashRegister(firestore, user.uid, register.id, 0);
      toast({ title: 'Caixa Fechado', description: 'O caixa foi fechado com sucesso.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao fechar o caixa', description: error.message });
    } finally {
      setIsClosing(false);
    }
  };
  
  const openingDate = register.openingDate;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold text-primary">Caixa Aberto</CardTitle>
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isClosing}>
              {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fechar Caixa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza que deseja fechar o caixa?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O caixa será finalizado e um novo precisará ser aberto para continuar as operações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseRegister}>Confirmar Fechamento</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        {openingDate && (
            <p className="text-sm text-muted-foreground">
                Aberto em: <span className="font-semibold">{format(openingDate, "PPP 'às' HH:mm", { locale: ptBR })}</span>
            </p>
        )}
      </CardContent>
    </Card>
  );
}

    