
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { FinancialMovement } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RecentMovementsTableProps = {
  movements: FinancialMovement[];
};

export function RecentMovementsTable({ movements }: RecentMovementsTableProps) {

  const getMovementDate = (movement: FinancialMovement): Date => {
    const date = movement.movementDate;
    if (date instanceof Date) {
      return date;
    }
    // Fallback para Timestamps para dados antigos, embora o hook já converta.
    if (date && typeof (date as any).toDate === 'function') {
      return (date as any).toDate();
    }
    return new Date(); // Retorna data atual como fallback final
  }


  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="hidden sm:table-cell">Categoria</TableHead>
            <TableHead className="hidden md:table-cell">Método</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                Nenhuma movimentação registrada neste caixa ainda.
              </TableCell>
            </TableRow>
          )}
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                <div className="font-medium">{movement.description}</div>
                <div className="text-xs text-muted-foreground">
                  {format(getMovementDate(movement), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary">{movement.category}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">{movement.paymentMethod}</TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium",
                  movement.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {movement.type === 'income' ? '+' : '-'} {movement.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

    