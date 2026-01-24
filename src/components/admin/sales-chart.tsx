// COMPONENTE DE GRÁFICO DE VENDAS
//
// Propósito:
// Este componente renderiza um gráfico de linha para visualizar o total de vendas
// ao longo dos últimos sete dias.
//
// Responsabilidade:
// - Receber os dados de vendas (`salesData`) como prop.
// - Configurar e renderizar o `LineChart` da biblioteca `recharts`.
// - Formatar os eixos X (data) and Y (valor em R$).
// - Exibir um tooltip com o valor exato ao passar o mouse sobre um ponto no gráfico.

"use client"

import { Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"
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
import Link from "next/link"
import { ArrowRight, Info } from "lucide-react"
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent as UITooltipContent } from "@/components/ui/tooltip"


const chartConfig = {
  Vendas: {
    label: "Vendas",
    color: "hsl(var(--primary))",
  },
}

export function SalesChart({ salesData }: { salesData: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
            <TooltipProvider>
                <UITooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <UITooltipContent>
                        <p className="max-w-xs">Este gráfico exibe o total de vendas diárias (em R$) ao longo dos últimos sete dias, permitindo identificar tendências e picos de faturamento.</p>
                    </UITooltipContent>
                </UITooltip>
            </TooltipProvider>
        </div>
        <CardDescription>Acompanhe o desempenho de vendas da última semana.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            data={salesData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
             <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => `R$${value / 1000}k`}
            />
            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Line
              dataKey="Vendas"
              type="monotone"
              stroke="var(--color-Vendas)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
       <CardFooter className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">
            Ver Relatório Completo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
