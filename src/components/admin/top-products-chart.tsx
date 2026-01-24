// COMPONENTE DE GRÁFICO DE PRODUTOS MAIS VENDIDOS
//
// Propósito:
// Este componente renderiza um gráfico de barras horizontal para mostrar um ranking
// dos produtos mais vendidos com base na quantidade.
//
// Responsabilidade:
// - Receber os dados dos produtos (`productsData`) como prop.
// - Configurar e renderizar o `BarChart` da biblioteca `recharts` com layout vertical.
// - Exibir os nomes dos produtos no eixo Y e as barras de vendas no eixo X.
// - Mostrar um tooltip com os detalhes ao passar o mouse sobre uma barra.

"use client"

import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts"
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
  vendas: {
    label: "Vendas",
    color: "hsl(var(--chart-2))",
  },
}

export function TopProductsChart({ productsData }: { productsData: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <TooltipProvider>
                <UITooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <UITooltipContent>
                        <p className="max-w-xs">Ranking dos produtos mais populares com base na quantidade total de unidades vendidas.</p>
                    </UITooltipContent>
                </UITooltip>
            </TooltipProvider>
        </div>
        <CardDescription>Ranking de produtos por quantidade vendida.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={productsData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={5}
              width={110}
              fontSize={12}
            />
            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="vendas" fill="var(--color-vendas)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">
            Ver Relatório Completo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
