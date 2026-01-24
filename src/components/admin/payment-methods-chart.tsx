// COMPONENTE DE GRÁFICO DE FORMAS DE PAGAMENTO
//
// Propósito:
// Este componente renderiza um gráfico de pizza (PieChart) para mostrar a
// distribuição das vendas por forma de pagamento (ex: Crédito, Débito, PIX).
//
// Responsabilidade:
// - Receber os dados sobre as formas de pagamento como prop.
// - Configurar e renderizar o `PieChart` da biblioteca `recharts`.
// - Utilizar cores e configurações definidas no `chartConfig` para manter
//   a consistência visual.
// - Exibir um tooltip informativo sobre o gráfico.

"use client"

import { Pie, PieChart, Tooltip, Cell } from "recharts"
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
    "Cartão de Crédito": { label: "Crédito" },
    "Cartão de Débito": { label: "Débito" },
    "PIX": { label: "PIX" },
    "Dinheiro": { label: "Dinheiro" },
}

export function PaymentMethodsChart({ paymentMethodsData }: { paymentMethodsData: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <CardTitle>Formas de Pagamento</CardTitle>
            <TooltipProvider>
                <UITooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <UITooltipContent>
                        <p className="max-w-xs">Percentual de vendas distribuído por cada forma de pagamento aceita, mostrando a preferência dos clientes.</p>
                    </UITooltipContent>
                </UITooltip>
            </TooltipProvider>
        </div>
        <CardDescription>Distribuição das vendas por método de pagamento.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="h-[250px] w-full max-w-[250px]">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={paymentMethodsData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2}>
                 {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Pie>
          </PieChart>
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
