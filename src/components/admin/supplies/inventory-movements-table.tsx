"use client";

import { useMemo } from "react";
import type { InventoryMovement, SupplyInventoryMovementType } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "lucide-react";

function movementTypeLabel(t: SupplyInventoryMovementType): string {
  switch (t) {
    case "PURCHASE":
      return "Compra / entrada";
    case "ADJUSTMENT":
      return "Ajuste";
    case "SALE_CONSUME":
      return "Baixa (venda)";
    case "PRODUCTION_CONSUME":
      return "Produção (consumo)";
    case "PRODUCTION_OUTPUT":
      return "Produção (saída)";
    default:
      return t;
  }
}

type InventoryMovementsTableProps = {
  movements: InventoryMovement[];
  supplyNames: Record<string, string>;
  isLoading: boolean;
};

export function InventoryMovementsTable({
  movements,
  supplyNames,
  isLoading,
}: InventoryMovementsTableProps) {
  const rows = useMemo(() => movements, [movements]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhuma movimentação registrada ainda. Entradas por cadastro ou reposição aparecem aqui após a
        migração do ledger no Supabase.
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Data</TableHead>
            <TableHead>Insumo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Δ Qtd.</TableHead>
            <TableHead>Un.</TableHead>
            <TableHead>Obs.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => {
            const when = new Date(m.created_at);
            const label = when.toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            });
            const supplyLabel =
              m.supplyId && supplyNames[m.supplyId] ? supplyNames[m.supplyId] : (m.supplyId ?? "—");
            const deltaStr =
              m.quantity_delta >= 0 ? `+${m.quantity_delta}` : `${m.quantity_delta}`;

            return (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{label}</TableCell>
                <TableCell className="font-medium">{supplyLabel}</TableCell>
                <TableCell>{movementTypeLabel(m.movement_type)}</TableCell>
                <TableCell className="text-right tabular-nums">{deltaStr}</TableCell>
                <TableCell>{m.unit}</TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground text-xs">
                  {m.note ?? ""}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
