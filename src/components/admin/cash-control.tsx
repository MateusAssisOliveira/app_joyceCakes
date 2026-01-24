// COMPONENTE DE CONTROLE DE CAIXA
//
// Propósito:
// Este componente foi simplificado. Agora, ele apenas direciona o usuário
// para a página dedicada de Fluxo de Caixa, centralizando a gestão em um único local.
//
// Responsabilidade:
// - Renderizar um Card com um botão que leva o usuário para '/admin/cash-flow'.

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info, DollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

export function CashControl() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <CardTitle>Controle de Caixa</CardTitle>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs">Gerencie o fluxo do seu caixa. Registre entradas (vendas manuais, aportes) e saídas (pagamentos, despesas) de forma rápida.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <CardDescription>Abertura, fechamento e registro de movimentações.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button className="w-full" asChild>
            <Link href="/admin/cash-flow">
                <DollarSign className="mr-2 h-4 w-4" />
                Acessar Fluxo de Caixa
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
