
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
import { formatDate } from '@/lib/timestamp-utils';
import { closeCashRegister } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActiveTenant } from '@/hooks/use-active-tenant';

type CashFlowHeaderProps = {
  register: CashRegister;
  finalBalance: number;
};

export function CashFlowHeader({ register, finalBalance }: CashFlowHeaderProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [countedBalanceInput, setCountedBalanceInput] = useState(finalBalance.toFixed(2));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { activeTenantId } = useActiveTenant();
  const { toast } = useToast();

  const parsedCountedBalance = Number(countedBalanceInput.replace(",", "."));
  const safeCountedBalance = Number.isFinite(parsedCountedBalance) ? parsedCountedBalance : 0;
  const closingDifference = safeCountedBalance - finalBalance;

  const handleCloseRegister = async () => {
    if (!firestore || !user?.uid) return;

    setIsClosing(true);
    try {
      await closeCashRegister(firestore, user.uid, register.id, safeCountedBalance, activeTenantId || undefined);
      toast({
        title: 'Caixa Fechado',
        description: `Fechado com saldo informado: ${safeCountedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      });
      setIsConfirmOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao fechar o caixa', description: error.message });
    } finally {
      setIsClosing(false);
    }
  };
  
  const openingDate = register.openingDate;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-2xl font-bold text-primary">Caixa Aberto</CardTitle>
         <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full sm:w-auto"
              variant="destructive"
              disabled={isClosing}
              onClick={() => setCountedBalanceInput(finalBalance.toFixed(2))}
            >
              {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fechar Caixa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza que deseja fechar o caixa?</AlertDialogTitle>
              <AlertDialogDescription>
                Confira os valores antes de fechar. Depois, um novo caixa precisará ser aberto para continuar as operações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3">
              <div className="rounded border p-3 text-sm">
                <p className="text-muted-foreground">Saldo calculado pelo sistema</p>
                <p className="font-semibold">
                  {finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="counted-balance">Saldo contado no caixa</Label>
                <Input
                  id="counted-balance"
                  type="number"
                  step="0.01"
                  value={countedBalanceInput}
                  onChange={(event) => setCountedBalanceInput(event.target.value)}
                  disabled={isClosing}
                />
              </div>
              <div className="rounded border p-3 text-sm">
                <p className="text-muted-foreground">Diferença (contado - calculado)</p>
                <p className="font-semibold">
                  {closingDifference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <Alert>
                <AlertDescription>
                  Se houver diferença, registre depois uma movimentação de ajuste no próximo caixa para manter rastreabilidade.
                </AlertDescription>
              </Alert>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseRegister} disabled={isClosing}>
                Confirmar Fechamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        {openingDate && (
          <p className="text-sm text-muted-foreground">
            Aberto em: <span className="font-semibold">{formatDate(openingDate)}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

    
