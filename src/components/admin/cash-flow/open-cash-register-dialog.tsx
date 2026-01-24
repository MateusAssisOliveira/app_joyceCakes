
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { openCashRegister } from '@/services';
import type { User } from 'firebase/auth';

type OpenCashRegisterDialogProps = {
  user: User | null;
};

export function OpenCashRegisterDialog({ user }: OpenCashRegisterDialogProps) {
  const [initialBalance, setInitialBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleOpenRegister = async () => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário ou conexão não encontrados.' });
      return;
    }
    
    setIsProcessing(true);
    try {
      await openCashRegister(firestore, user.uid, initialBalance);
      toast({ title: 'Caixa Aberto!', description: 'Você já pode começar a registrar suas movimentações.' });
      // A UI irá re-renderizar automaticamente quando o novo caixa for detectado pelo `useDoc`
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Abrir Caixa', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
          <DialogDescription>
            Para começar o dia, você precisa abrir o caixa. Insira o valor inicial (saldo de troco).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="initial-balance">Valor Inicial (Troco)</Label>
            <Input
              id="initial-balance"
              name="initial-balance"
              type="number"
              placeholder="R$ 0,00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
              disabled={isProcessing}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleOpenRegister} disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Abrindo...' : 'Abrir Caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
