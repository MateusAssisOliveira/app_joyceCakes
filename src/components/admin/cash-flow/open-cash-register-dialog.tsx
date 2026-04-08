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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActiveTenant } from '@/hooks/use-active-tenant';

type OpenCashRegisterDialogProps = {
  user: User | null;
};

export function OpenCashRegisterDialog({ user }: OpenCashRegisterDialogProps) {
  const [initialBalance, setInitialBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { activeTenantId } = useActiveTenant();

  const handleOpenRegister = async () => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuario ou conexao nao encontrados.' });
      return;
    }

    setIsProcessing(true);
    try {
      await openCashRegister(firestore, user.uid, initialBalance, activeTenantId || undefined);
      toast({ title: 'Caixa aberto', description: 'Voce ja pode registrar movimentacoes.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao abrir caixa', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="w-[95vw] max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Abrir caixa</DialogTitle>
          <DialogDescription>
            Informe o valor inicial de troco para iniciar o caixa do dia.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Alert>
            <AlertDescription>
              Esta acao define o <strong>saldo inicial do caixa</strong>. Nao altera custo tecnico de receitas/produtos.
            </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <Label htmlFor="initial-balance">Valor inicial (troco)</Label>
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
            <p className="text-xs text-muted-foreground">
              Dica: use apenas o valor fisico disponivel para troco no inicio do expediente.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row">
          <Button className="w-full sm:w-auto" onClick={handleOpenRegister} disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Abrindo...' : 'Abrir caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
