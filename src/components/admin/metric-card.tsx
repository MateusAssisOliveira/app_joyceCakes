// COMPONENTE DE CARD DE MÉTRICA
//
// Propósito:
// Este componente exibe uma métrica individual no dashboard, como "Vendas Hoje"
// ou "Ticket Médio".
//
// Responsabilidade:
// - Receber as propriedades de uma métrica (título, valor, tendência, etc.) via props.
// - Renderizar um `Card` com as informações formatadas.
// - Exibir um ícone de seta para cima ou para baixo para indicar a direção da tendência
//   (positiva ou negativa).
// - Apresentar um `Tooltip` com a descrição da métrica quando o usuário passa o mouse
//   sobre o ícone de informação.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardMetric } from "@/types";
import { ArrowDown, ArrowUp, Info } from "lucide-react";

export function MetricCard({ title, value, trend, trendDirection, description, icon: Icon, color }: DashboardMetric) {
  return (
    <Card className="border-l-4" style={{ borderColor: color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" style={{ color }} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
         {description && (
             <p className="text-xs text-muted-foreground pt-1">{description}</p>
          )}
      </CardContent>
    </Card>
  );
}
