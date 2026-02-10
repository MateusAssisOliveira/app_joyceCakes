"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProductWithMargin extends Product {
  marginPercentage: number;
  profitPerUnit: number;
  marginStatus: "high" | "medium" | "low";
}

type MarginAnalysisProps = {
  products: Product[];
};

export function MarginAnalysis({ products }: MarginAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Calcular margen e lucro por produto
  const productsWithMargin = useMemo(() => {
    return products
      .filter((p) => p.isActive !== false && p.price && p.costPrice)
      .map((product) => {
        const profitPerUnit = product.price - (product.costPrice || 0);
        const marginPercentage = (profitPerUnit / product.price) * 100;

        // Definir status baseado na margem
        let marginStatus: "high" | "medium" | "low";
        if (marginPercentage >= 50) {
          marginStatus = "high";
        } else if (marginPercentage >= 30) {
          marginStatus = "medium";
        } else {
          marginStatus = "low";
        }

        return {
          ...product,
          marginPercentage,
          profitPerUnit,
          marginStatus,
        };
      })
      .sort((a, b) => b.marginPercentage - a.marginPercentage);
  }, [products]);

  // Filtrar por categoria
  const categories = useMemo(
    () => ["all", ...new Set(productsWithMargin.map((p) => p.category))],
    [productsWithMargin]
  );

  const filteredProducts = useMemo(
    () =>
      selectedCategory === "all"
        ? productsWithMargin
        : productsWithMargin.filter((p) => p.category === selectedCategory),
    [productsWithMargin, selectedCategory]
  );

  // Dados para gráfico
  const chartData = useMemo(
    () =>
      filteredProducts.slice(0, 10).map((p) => ({
        name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
        margem: Math.round(p.marginPercentage * 10) / 10,
        lucro: Math.round(p.profitPerUnit * 100) / 100,
      })),
    [filteredProducts]
  );

  // Estatísticas gerais
  const stats = useMemo(() => {
    if (filteredProducts.length === 0) {
      return {
        avgMargin: 0,
        highMarginCount: 0,
        lowMarginCount: 0,
        totalProducts: 0,
      };
    }

    const avgMargin =
      filteredProducts.reduce((acc, p) => acc + p.marginPercentage, 0) /
      filteredProducts.length;
    const highMarginCount = filteredProducts.filter(
      (p) => p.marginStatus === "high"
    ).length;
    const lowMarginCount = filteredProducts.filter(
      (p) => p.marginStatus === "low"
    ).length;

    return {
      avgMargin: Math.round(avgMargin * 10) / 10,
      highMarginCount,
      lowMarginCount,
      totalProducts: filteredProducts.length,
    };
  }, [filteredProducts]);

  const getMarginStatusColor = (status: "high" | "medium" | "low") => {
    switch (status) {
      case "high":
        return "bg-emerald-100 text-emerald-900";
      case "medium":
        return "bg-amber-100 text-amber-900";
      case "low":
        return "bg-red-100 text-red-900";
    }
  };

  const getMarginStatusLabel = (status: "high" | "medium" | "low") => {
    switch (status) {
      case "high":
        return "Ótima Margem";
      case "medium":
        return "Margem Média";
      case "low":
        return "Margem Baixa";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.avgMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De {stats.totalProducts} produtos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Ótima Margem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.highMarginCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≥ 50% de lucro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700">
              Margem Baixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.lowMarginCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              &lt; 30% de lucro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta se há produtos com margem baixa */}
      {stats.lowMarginCount > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-900">
            Você tem <strong>{stats.lowMarginCount}</strong> produto(s) com
            margem baixa (&lt;30%). Considere aumentar o preço ou reduzir
            custos.
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle>Margem de Lucro por Produto (Top 10)</CardTitle>
          <CardDescription>
            Percentual de lucro sobre o preço de venda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer
              config={{
                margem: {
                  label: "Margem %",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar
                    dataKey="margem"
                    fill="hsl(var(--chart-1))"
                    name="Margem %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtro e Tabela Detalhada */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Análise Detalhada de Margens</CardTitle>
              <CardDescription>
                Visualize o preço, custo e lucro de cada produto
              </CardDescription>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "Todas Categorias" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro/Un.</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">
                      {product.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {(product.costPrice || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.profitPerUnit.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-primary">
                          {product.marginPercentage.toFixed(1)}%
                        </span>
                        {product.marginPercentage >= 50 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : product.marginPercentage >= 30 ? (
                          <TrendingDown className="h-4 w-4 text-amber-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getMarginStatusColor(product.marginStatus)}>
                        {getMarginStatusLabel(product.marginStatus)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              Nenhum produto com dados de margem
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Mostrando {filteredProducts.length} de {productsWithMargin.length}{" "}
          produtos
        </CardFooter>
      </Card>

      {/* Recomendações */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2 text-sm">
          <p>
            ✅ <strong>Produtos com margem alta (&gt;50%):</strong> Mantenha-os
            com estoque e destaque-os na vitrine.
          </p>
          <p>
            ⚠️ <strong>Produtos com margem baixa (&lt;30%):</strong> Considere
            aumentar o preço ou reduzir custos com fornecedores.
          </p>
          <p>
            📊 <strong>Análise regular:</strong> Compare margens mensalmente
            para acompanhar mudanças de custos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
