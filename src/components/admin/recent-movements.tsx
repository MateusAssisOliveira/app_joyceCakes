
"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";
import type { FinancialMovement } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent as UITooltipContent } from "@/components/ui/tooltip";


export function RecentMovements({ movements }: { movements: FinancialMovement[] }) {
  const [selectedMovement, setSelectedMovement] = useState<FinancialMovement | null>(null);

  const getMovementDate = (movement: FinancialMovement): Date => {
    const date = movement.movementDate;
    // O hook já deve ter convertido para Date
    if (date instanceof Date) {
      return date;
    }
    // Fallback para Timestamps, se houver dados antigos
    if (date && typeof (date as any).toDate === 'function') {
      return (date as any).toDate();
    }
    return new Date(); // Fallback final
  }

  const filteredMovements = useMemo(() => {
    return movements;
  }, [movements]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Movimentações Recentes</CardTitle>
             <TooltipProvider>
                <UITooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <UITooltipContent>
                        <p className="max-w-xs">Histórico de todas as entradas e saídas financeiras registradas no caixa, com filtros por data e descrição.</p>
                    </UITooltipContent>
                </UITooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Últimas movimentações financeiras registradas no caixa ativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length > 0 ? (
                  filteredMovements.map((movement) => (
                  <TableRow 
                    key={movement.id} 
                    onDoubleClick={() => setSelectedMovement(movement)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{movement.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {getMovementDate(movement).toLocaleDateString("pt-BR")} - {" "}
                        {getMovementDate(movement).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        - {movement.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={movement.type === "income" ? "default" : "destructive"}
                        className={cn(
                          "capitalize",
                          movement.type === "income" &&
                            "bg-emerald-500/80 text-white border-transparent hover:bg-emerald-500",
                          movement.type === "expense" &&
                            "bg-red-500/80 text-white border-transparent hover:bg-red-500"
                        )}
                      >
                        {movement.category}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        movement.type === "income"
                          ? "text-emerald-600"
                          : "text-red-600"
                      )}
                    >
                      {movement.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Nenhuma movimentação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            Ver Relatório Completo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={!!selectedMovement} onOpenChange={(isOpen) => !isOpen && setSelectedMovement(null)}>
        {selectedMovement && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Movimentação</DialogTitle>
              <DialogDescription>ID: {selectedMovement.id}</DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="grid gap-4 py-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Data e Hora:</span>
                    <span className="font-medium">{getMovementDate(selectedMovement).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium text-right">{selectedMovement.description}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                     <Badge
                        variant={selectedMovement.type === "income" ? "default" : "destructive"}
                        className={cn(
                          "capitalize",
                          selectedMovement.type === "income" && "bg-emerald-500/80 text-white border-transparent hover:bg-emerald-500",
                          selectedMovement.type === "expense" && "bg-red-500/80 text-white border-transparent hover:bg-red-500"
                        )}
                      >
                       {selectedMovement.type === 'income' ? 'Entrada' : 'Saída'}
                      </Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span className="font-medium">{selectedMovement.category}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-medium">{selectedMovement.paymentMethod}</span>
                </div>
                 <Separator />
                 <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Valor:</span>
                    <span className={cn(
                      "text-lg font-bold",
                      selectedMovement.type === "income" ? "text-emerald-600" : "text-red-600"
                    )}>
                      {selectedMovement.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Fechar</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
