

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, Info } from "lucide-react";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { splitSupplyStockForUX, type SupplyContentUnit } from "@/lib/supply-stock-ux";
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
  supply: Supply | null;
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

function costLabel(u: SupplyContentUnit): string {
  if (u === "g") return "Custo por grama (R$)";
  if (u === "ml") return "Custo por mililitro (R$)";
  return "Custo por unidade (R$)";
}

function minLabel(u: SupplyContentUnit): string {
  if (u === "g") return "Estoque mínimo para alerta (g)";
  if (u === "ml") return "Estoque mínimo para alerta (ml)";
  return "Estoque mínimo para alerta (un)";
}

export function SupplyFormDialog({ isOpen, onClose, onSave, supply, defaultType }: SupplyFormDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentUnit, setContentUnit] = useState<SupplyContentUnit>("g");
  const [minStockInput, setMinStockInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: defaultType,
    costPerUnit: 0,
    sku: "",
    supplier: "",
  });

  const { toast } = useToast();
  const isEdit = !!supply;

  useEffect(() => {
    if (!isOpen) return;

    if (supply) {
      const split = splitSupplyStockForUX(supply);
      setContentUnit(split.contentUnit);
      setMinStockInput(
        split.minStockPurchaseQty > 0 ? String(split.minStockPurchaseQty) : ""
      );
      setFormData({
        name: supply.name || "",
        category: supply.category || "",
        type: supply.type || defaultType,
        costPerUnit: supply.costPerUnit || 0,
        sku: supply.sku || "",
        supplier: supply.supplier || "",
      });
    } else {
      setContentUnit("g");
      setMinStockInput("");
      setFormData({
        name: "",
        category: "",
        type: defaultType,
        costPerUnit: 0,
        sku: "",
        supplier: "",
      });
    }
  }, [supply, isOpen, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório", description: "Informe o nome do insumo." });
      return;
    }
    if (formData.costPerUnit < 0) {
      toast({ variant: "destructive", title: "Custo inválido", description: "O custo não pode ser negativo." });
      return;
    }

    const minStock = Math.max(0, Math.round(parseHumanQty(minStockInput)));
    const stock = supply ? Number(supply.stock) : 0;
    const u = unitForDb(contentUnit);

    const finalData: Omit<Supply, "id" | "createdAt" | "isActive"> = {
      name: formData.name.trim(),
      category: formData.category || "",
      type: formData.type,
      stock,
      minStock,
      unit: u,
      costPerUnit: formData.costPerUnit,
      purchaseFormat: "unidade",
      packageCost: undefined,
      packageQuantity: undefined,
      sku: formData.sku || "",
      supplier: formData.supplier || "",
      lastPurchaseDate: supply?.lastPurchaseDate,
      expirationDate: supply?.expirationDate,
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
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ficha do insumo" : "Nova ficha de insumo"}</DialogTitle>
          <DialogDescription>
            Somente identificação e custo de referência na menor unidade (g, ml ou un). Sem saldo: use{" "}
            <strong>Registrar entrada</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <Alert>
            <AlertDescription className="text-sm">
              Compras por pacote/lata, quantidade no depósito e despesa no caixa:{" "}
              <strong>Ações → Registrar entrada</strong>.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="supply-name">Nome</Label>
              <Input
                id="supply-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isProcessing}
                placeholder="Ex.: Chocolate meio amargo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supply-category">Categoria</Label>
              <Input
                id="supply-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={isProcessing}
                placeholder="Ex.: Secos"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supply-type" className="flex items-center gap-2">
                Tipo
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Ingrediente entra em receitas; embalagem no produto final.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "ingredient" | "packaging") => setFormData({ ...formData, type: value })}
                disabled={isProcessing}
              >
                <SelectTrigger id="supply-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingredient">Ingrediente</SelectItem>
                  <SelectItem value="packaging">Embalagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="content-unit">Unidade do estoque (receitas)</Label>
              <Select
                value={contentUnit}
                onValueChange={(v: SupplyContentUnit) => setContentUnit(v)}
                disabled={isProcessing || isEdit}
              >
                <SelectTrigger id="content-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g (grama)</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="un">un (unidade)</SelectItem>
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-xs text-muted-foreground">Unidade travada na edição para não alterar saldo já lançado.</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supply-cost">{costLabel(contentUnit)}</Label>
              <Input
                id="supply-cost"
                type="number"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                required
                min="0"
                step="any"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="min-stock">{minLabel(contentUnit)}</Label>
            <Input
              id="min-stock"
              inputMode="numeric"
              value={minStockInput}
              onChange={(e) => setMinStockInput(e.target.value)}
              disabled={isProcessing}
              placeholder="Opcional — só alerta, não movimenta"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="supply-supplier">Fornecedor</Label>
              <Input
                id="supply-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supply-sku">SKU / código</Label>
              <Input
                id="supply-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                disabled={isProcessing}
              />
            </div>
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
