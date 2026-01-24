

"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Supply } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";
import { PriceHistoryDialog } from "./price-history-dialog";

type SupplyDetailsSheetProps = {
  supply: Supply | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// Função auxiliar para calcular e formatar o custo para receita
const getRecipeCost = (supply: Supply) => {
    if (!supply.costPerUnit || supply.costPerUnit === 0) {
        return 'R$ 0,00';
    }
    
    let costPerBaseUnit = supply.costPerUnit;
    let baseUnit = supply.unit;

    if (supply.unit === 'kg') {
        costPerBaseUnit /= 1000;
        baseUnit = 'g';
    } else if (supply.unit === 'L') {
        costPerBaseUnit /= 1000;
        baseUnit = 'ml';
    }

    return `${costPerBaseUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4, maximumFractionDigits: 5 })} / ${baseUnit}`;
}

export function SupplyDetailsSheet({ supply, isOpen, onOpenChange }: SupplyDetailsSheetProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!supply) return null;
  
  const purchaseCostLabel = `Preço de Compra (por ${supply.unit})`;

  const getDate = (date: any): string => {
    if (!date) return "Não informada";
    if (date instanceof Date) return format(date, "dd/MM/yyyy");
    // Fallback para Timestamps
    if (typeof date.toDate === 'function') return format(date.toDate(), "dd/MM/yyyy");
    // Fallback para string (se aplicável)
    if(typeof date === 'string') return format(new Date(date), "dd/MM/yyyy");
    return "Data inválida";
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{supply.name}</SheetTitle>
            <SheetDescription>
              Detalhes completos do insumo. SKU: {supply.sku || "Não informado"}
            </SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={supply.isActive !== false ? "default" : "outline"} className={cn(supply.isActive !== false && "bg-emerald-500 hover:bg-emerald-600")}>
                {supply.isActive !== false ? "Ativo" : "Arquivado"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fornecedor</span>
              <span className="font-medium">{supply.supplier || "Não informado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última Compra</span>
              <span className="font-medium">
                {getDate(supply.lastPurchaseDate)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estoque Atual</span>
              <span className="font-medium">{supply.stock} {supply.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estoque Mínimo</span>
              <span className="font-medium">{supply.minStock != null ? `${supply.minStock} ${supply.unit}` : 'Não definido'}</span>
            </div>
            <Separator />
            {supply.packageCost && supply.packageQuantity && (
              <div className="p-2 rounded-md border bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Custo do Pacote</span>
                  <span className="font-medium text-xs">{supply.packageCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground text-xs">Unidades por Pacote</span>
                  <span className="font-medium text-xs">{supply.packageQuantity}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{purchaseCostLabel}</span>
              <span className="font-semibold text-base">{supply.costPerUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-2">
              <span className="text-muted-foreground font-bold">Custo por Unidade de Medida</span>
              <span className="font-bold text-lg text-primary">{getRecipeCost(supply)}</span>
            </div>
          </div>
          <SheetFooter className="mt-6 flex-row justify-between sm:justify-between w-full">
            <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              Ver Histórico de Preços
            </Button>
            <SheetClose asChild>
              <Button type="submit" variant="outline">Fechar</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <PriceHistoryDialog
        supply={supply}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
}
