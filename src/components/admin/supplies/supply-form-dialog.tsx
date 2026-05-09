

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Info } from "lucide-react";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { type SupplyContentUnit } from "@/lib/supply-stock-ux";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SupplyFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    formData: Omit<Supply, "id" | "createdAt" | "isActive">,
    financialData: { shouldRegister: boolean; paymentMethod: string; description: string; amount: number }
  ) => void | Promise<void>;
  defaultType: "ingredient" | "packaging";
};

const parseHumanQty = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return 0;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

function unitForDb(u: SupplyContentUnit): Supply["unit"] {
  if (u === "g") return "g";
  if (u === "ml") return "ml";
  return "un";
}

function minLabel(u: SupplyContentUnit): string {
  if (u === "g") return "Estoque mínimo (g)";
  if (u === "ml") return "Estoque mínimo (ml)";
  return "Estoque mínimo (un)";
}

/** Cadastro inicial: sem saldo, sem custo (definidos na primeira entrada). */
export function SupplyFormDialog({ isOpen, onClose, onSave, defaultType }: SupplyFormDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentUnit, setContentUnit] = useState<SupplyContentUnit>("g");
  const [minStockInput, setMinStockInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    type: defaultType,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setContentUnit("g");
    setMinStockInput("");
    setFormData({
      name: "",
      brand: "",
      category: "",
      type: defaultType,
    });
  }, [isOpen, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório" });
      return;
    }

    const minStock = Math.max(0, Math.round(parseHumanQty(minStockInput)));
    const u = unitForDb(contentUnit);

    const finalData: Omit<Supply, "id" | "createdAt" | "isActive"> = {
      name: formData.name.trim(),
      brand: formData.brand.trim() || "",
      category: formData.category.trim() || "Geral",
      type: formData.type,
      stock: 0,
      minStock,
      unit: u,
      costPerUnit: 0,
      purchaseFormat: "unidade",
      packageCost: undefined,
      packageQuantity: undefined,
      sku: "",
      supplier: "",
      lastPurchaseDate: undefined,
      expirationDate: undefined,
    };

    setIsProcessing(true);
    try {
      await Promise.resolve(
        onSave(finalData, {
          shouldRegister: false,
          paymentMethod: "Dinheiro",
          description: "",
          amount: 0,
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Nova ficha de insumo</DialogTitle>
          <DialogDescription>
            Só cadastro. Sem saldo. Depois abra o item e use <strong>Registrar entrada</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="sf-name">Nome</Label>
            <Input
              id="sf-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isProcessing}
              placeholder="Ex.: Leite condensado"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sf-brand">Marca</Label>
            <Input
              id="sf-brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              disabled={isProcessing}
              placeholder="Ex.: Italac"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sf-cat">Categoria</Label>
              <Input
                id="sf-cat"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={isProcessing}
                placeholder="Ex.: Laticínios"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sf-unit">Unidade base</Label>
              <Select
                value={contentUnit}
                onValueChange={(v: SupplyContentUnit) => setContentUnit(v)}
                disabled={isProcessing}
              >
                <SelectTrigger id="sf-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g (grama)</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="un">un</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sf-type" className="flex items-center gap-2">
              Tipo
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Ingrediente em receitas; embalagem no produto final.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: "ingredient" | "packaging") => setFormData({ ...formData, type: value })}
              disabled={isProcessing}
            >
              <SelectTrigger id="sf-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingredient">Ingrediente</SelectItem>
                <SelectItem value="packaging">Embalagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sf-min">{minLabel(contentUnit)}</Label>
            <Input
              id="sf-min"
              inputMode="numeric"
              value={minStockInput}
              onChange={(e) => setMinStockInput(e.target.value)}
              disabled={isProcessing}
              placeholder="Opcional — só alerta"
            />
          </div>

          <DialogFooter className="flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Salvar ficha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
