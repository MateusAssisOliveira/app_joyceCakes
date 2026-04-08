"use client";

import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";
import {
  TooltipProvider,
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent as UITooltipContent,
} from "@/components/ui/tooltip";

const chartConfig = {
  Entradas: {
    label: "Entradas",
    color: "hsl(var(--chart-1))",
  },
  Saidas: {
    label: "Saidas",
    color: "hsl(var(--destructive))",
  },
};

export function CashFlowChart({ cashFlowData }: { cashFlowData: any[] }) {
  const normalizedData = (cashFlowData || []).map((item) => ({
    ...item,
    Saidas: item.Saidas ?? item["Saídas"] ?? item["SaÃ­das"] ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Fluxo de Caixa Diario</CardTitle>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 cursor-pointer text-muted-foreground" />
              </TooltipTrigger>
              <UITooltipContent>
                <p className="max-w-xs">
                  Comparativo diario entre entradas e saidas do caixa.
                </p>
              </UITooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Entradas vs. Saidas nos ultimos 7 dias.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={normalizedData}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis
              tickFormatter={(value) => `R$${value / 1000}k`}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={false} content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="Entradas" fill="var(--color-Entradas)" radius={4} />
            <Bar dataKey="Saidas" fill="var(--color-Saidas)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" size="sm" disabled>
          Ver Relatorio Completo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
