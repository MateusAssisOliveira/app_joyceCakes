
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader, TrendingUp } from "lucide-react";
import { useFirestore } from "@/firebase";
import { getPriceHistory } from "@/services";
import type { Supply, PriceVariation } from "@/types";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toDate } from '@/lib/timestamp-utils';

type PriceHistoryDialogProps = {
  supply: Supply;
  isOpen: boolean;
  onClose: () => void;
};

export function PriceHistoryDialog({ supply, isOpen, onClose }: PriceHistoryDialogProps) {
  const [history, setHistory] = useState<PriceVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (isOpen && firestore) {
      setIsLoading(true);
      getPriceHistory(firestore, supply.id)
      .then(data => {
        const sortedData = data.sort((a, b) => {
          const ad = toDate(a.date)?.getTime() ?? 0;
          const bd = toDate(b.date)?.getTime() ?? 0;
          return bd - ad;
        });
        setHistory(sortedData);
      })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, firestore, supply.id]);
  
  const getDate = (item: PriceVariation) => {
      const d = toDate(item.date);
      return d ? format(d, "PPP 'às' HH:mm", { locale: ptBR }) : 'Data indisponível';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Preços: {supply.name}</DialogTitle>
          <DialogDescription>
            Variação do custo por unidade de compra ({supply.unit}) ao longo do tempo.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data da Alteração</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Novo Custo/Un.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{getDate(item)}</TableCell>
                    <TableCell>{item.supplier || 'Não informado'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.costPerUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma variação de preço registrada para este item ainda.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
