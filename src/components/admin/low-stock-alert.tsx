
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ArrowRight, FlaskConical, Package } from "lucide-react";
import type { Supply } from '@/types';
import { Badge } from '../ui/badge';

type LowStockAlertProps = {
    supplies: Supply[];
};

export function LowStockAlert({ supplies }: LowStockAlertProps) {
    const lowStockItems = useMemo(() => {
        return supplies.filter(supply => 
            supply.isActive && 
            supply.minStock != null && 
            supply.minStock > 0 && 
            supply.stock < supply.minStock
        );
    }, [supplies]);

    if (lowStockItems.length === 0) {
        return (
            <Card className="bg-emerald-50 border border-emerald-200">
                 <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                    <div>
                        <CardTitle className="text-emerald-800">Estoque Sob Controle</CardTitle>
                        <CardDescription className="text-emerald-700">
                           Todos os seus insumos estão acima do nível mínimo.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                    <div>
                        <CardTitle className="text-destructive">Alerta de Estoque Baixo</CardTitle>
                        <CardDescription className="text-destructive/80">
                            Os seguintes itens precisam de reposição urgente.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    {lowStockItems.slice(0, 5).map(item => (
                        <li key={item.id} className="flex justify-between items-center">
                            <span className="font-medium flex items-center gap-2">
                                {item.type === 'packaging' ? <Package className="h-4 w-4 text-muted-foreground" /> : <FlaskConical className="h-4 w-4 text-muted-foreground" />}
                                {item.name}
                            </span>
                            <Badge variant="destructive">
                                {item.stock} / {item.minStock} {item.unit}
                            </Badge>
                        </li>
                    ))}
                </ul>
                {lowStockItems.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground mt-3">
                        e mais {lowStockItems.length - 5} item(ns)...
                    </p>
                )}
            </CardContent>
            <CardFooter>
                 <Button className="w-full" variant="secondary" size="sm" asChild>
                    <Link href="/admin/supplies">
                        Gerenciar Ingredientes
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
