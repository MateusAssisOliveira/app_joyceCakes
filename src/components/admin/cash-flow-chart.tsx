// COMPONENTE DE GRÁFICO DE FLUXO DE CAIXA
//
// Propósito:
// Este componente renderiza um gráfico de barras que compara as entradas e saídas
// financeiras diárias.
//
// Responsabilidade:
// - Receber os dados de fluxo de caixa (`cashFlowData`) como prop.
// - Configurar e renderizar o componente `BarChart` da biblioteca `recharts`.
// - Utilizar os componentes `ChartContainer` e `ChartTooltipContent` para estilização
//   e funcionalidade de tooltip consistentes.
// - Exibir um título, uma descrição e um tooltip informativo sobre o propósito do gráfico.

"use client"

import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { ArrowRight, Info } from "lucide-react"
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent as UITooltipContent } from "@/components/ui/tooltip"

const chartConfig = {
  Entradas: {
    label: "Entradas",
    color: "hsl(var(--chart-1))",
  },
  Saídas: {
    label: "Saídas",
    color: "hsl(var(--destructive))",
  },
}

export function CashFlowChart({ cashFlowData }: { cashFlowData: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <CardTitle>Fluxo de Caixa Diário</CardTitle>
            <TooltipProvider>
                <UITooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <UITooltipContent>
                        <p className="max-w-xs">Comparativo diário entre o total de dinheiro que entrou (vendas, aportes) e o total que saiu (despesas, pagamentos) do caixa.</p>
                    </UITooltipContent>
                </UITooltip>
            </TooltipProvider>
        </div>
        <CardDescription>Entradas vs. Saídas nos últimos 7 dias.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={cashFlowData}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickFormatter={(value) => `R$${value/1000}k`} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={false} content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="Entradas" fill="var(--color-Entradas)" radius={4} />
            <Bar dataKey="Saídas" fill="var(--color-Saídas)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
       <CardFooter className="flex justify-end">
        <Button variant="outline" size="sm" disabled>
          Ver Relatório Completo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
