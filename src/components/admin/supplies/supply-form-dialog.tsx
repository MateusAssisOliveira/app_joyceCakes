

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader, Calendar as CalendarIcon, Info } from "lucide-react";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toDate } from "@/lib/timestamp-utils";
import {
  deriveSupplyQuantitiesForSave,
  formatBaseStockHint,
  purchaseFormatLabel,
  splitSupplyStockForUX,
  type SupplyContentUnit,
} from "@/lib/supply-stock-ux";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SupplyFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    formData: Omit<Supply, 'id' | 'createdAt' | 'isActive'>,
    financialData: { shouldRegister: boolean; paymentMethod: string; description: string; amount: number; }
    ) => void;
  supply: Supply | null;
  defaultType: 'ingredient' | 'packaging';
};

const parseHumanQty = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return 0;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

export function SupplyFormDialog({ isOpen, onClose, onSave, supply, defaultType }: SupplyFormDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [humanQty, setHumanQty] = useState({
    contentUnit: "g" as SupplyContentUnit,
    contentPerPurchase: "",
    minStockPurchaseQty: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: defaultType,
    stock: 0,
    unit: "g" as "kg" | "g" | "L" | "ml" | "un",
    costPerUnit: 0,
    purchaseFormat: "pacote" as "unidade" | "pacote" | "caixa" | "garrafa" | "saco" | "lata" | "frasco",
    packageCost: undefined as number | undefined,
    packageQuantity: undefined as number | undefined,
    sku: "",
    supplier: "",
    minStock: 0,
    lastPurchaseDate: undefined as Date | undefined,
    expirationDate: undefined as Date | undefined,
  });

  const { toast } = useToast();

  const pkgQtyForCost = (() => {
    if (formData.purchaseFormat === "unidade") return undefined;
    const per = parseHumanQty(humanQty.contentPerPurchase);
    return per > 0 ? per : undefined;
  })();

  const isPackageCalculation =
    (formData.packageCost ?? 0) > 0 && pkgQtyForCost !== undefined && pkgQtyForCost > 0;

  useEffect(() => {
    if (formData.purchaseFormat === "unidade") {
      setFormData((prev) =>
        prev.packageQuantity === undefined ? prev : { ...prev, packageQuantity: undefined }
      );
    }
  }, [formData.purchaseFormat]);

  useEffect(() => {
    if (isPackageCalculation && pkgQtyForCost) {
      const unitCost = (formData.packageCost ?? 0) / pkgQtyForCost;
      setFormData((prev) => ({ ...prev, costPerUnit: unitCost, packageQuantity: pkgQtyForCost }));
    }
  }, [formData.packageCost, pkgQtyForCost, isPackageCalculation]);

  useEffect(() => {
    if (isOpen) {
      if (supply) {
        const split = splitSupplyStockForUX(supply);
        setHumanQty({
          contentUnit: split.contentUnit,
          contentPerPurchase:
            split.purchaseFormat !== "unidade" && split.contentPerPurchase > 0
              ? String(split.contentPerPurchase)
              : "",
          minStockPurchaseQty: String(split.minStockPurchaseQty),
        });
        setFormData({
          name: supply.name || "",
          category: supply.category || "",
          type: supply.type || defaultType,
          stock: supply.stock || 0,
          unit: split.contentUnit,
          costPerUnit: supply.costPerUnit || 0,
          purchaseFormat: split.purchaseFormat,
          packageCost: supply.packageCost,
          packageQuantity: supply.packageQuantity,
          sku: supply.sku || "",
          supplier: supply.supplier || "",
          minStock: supply.minStock || 0,
          lastPurchaseDate: toDate(supply.lastPurchaseDate) ?? undefined,
          expirationDate: toDate(supply.expirationDate) ?? undefined,
        });
      } else {
        setHumanQty({
          contentUnit: "g",
          contentPerPurchase: "",
          minStockPurchaseQty: "",
        });
        setFormData({
          name: "",
          category: "",
          type: defaultType,
          stock: 0,
          unit: "g",
          costPerUnit: 0,
          purchaseFormat: "pacote",
          packageCost: undefined,
          packageQuantity: undefined,
          sku: "",
          supplier: "",
          minStock: 0,
          lastPurchaseDate: undefined,
          expirationDate: undefined,
        });
      }
    }
  }, [supply, isOpen, defaultType]);

  const stockPurchaseQtyForDerived = supply
    ? splitSupplyStockForUX(supply).stockPurchaseQty
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const derived = deriveSupplyQuantitiesForSave({
      purchaseFormat: formData.purchaseFormat,
      contentUnit: humanQty.contentUnit,
      contentPerPurchase: parseHumanQty(humanQty.contentPerPurchase),
      stockPurchaseQty: stockPurchaseQtyForDerived,
      minStockPurchaseQty: parseHumanQty(humanQty.minStockPurchaseQty),
    });

    if ("error" in derived) {
      toast({ variant: "destructive", title: "Dados inválidos", description: derived.error });
      return;
    }

    if (!formData.name?.trim()) {
      toast({ variant: "destructive", title: "Campos inválidos", description: "Informe o nome do item." });
      return;
    }

    if (formData.costPerUnit < 0) {
      toast({ variant: "destructive", title: "Campos inválidos", description: "O custo não pode ser negativo." });
      return;
    }

    setIsProcessing(true);
    try {
      const finalData = {
        ...formData,
        stock: derived.stock,
        minStock: derived.minStock,
        unit: derived.unit,
        packageQuantity: derived.packageQuantity,
      };
      if ((finalData.packageCost ?? 0) === 0 || (finalData.packageQuantity ?? 0) === 0) {
        finalData.packageCost = undefined;
        finalData.packageQuantity = undefined;
      }

      onSave(finalData, {
        shouldRegister: false,
        paymentMethod: "Dinheiro",
        description: "",
        amount: 0,
      });
    } catch {
      // O erro ja e tratado pelo servico e pelo handler global
    } finally {
      setIsProcessing(false);
    }
  };

  const getPurchaseCostLabel = () => {
    switch (humanQty.contentUnit) {
      case "g":
        return "Custo por grama (g)";
      case "ml":
        return "Custo por mililitro (ml)";
      case "un":
        return "Custo por unidade (un)";
      default:
        return "Custo por unidade interna";
    }
  };

  const stockPreviewDerived = deriveSupplyQuantitiesForSave({
    purchaseFormat: formData.purchaseFormat,
    contentUnit: humanQty.contentUnit,
    contentPerPurchase: parseHumanQty(humanQty.contentPerPurchase),
    stockPurchaseQty: stockPurchaseQtyForDerived,
    minStockPurchaseQty: parseHumanQty(humanQty.minStockPurchaseQty),
  });
  const minPreviewText =
    "error" in stockPreviewDerived
      ? "—"
      : `${formatBaseStockHint(stockPreviewDerived.unit, stockPreviewDerived.minStock)} (alerta de reposição)`;


  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supply ? "Editar ficha do insumo" : "Cadastrar insumo"}</DialogTitle>
          <DialogDescription>
            {supply
              ? "Altere nome, custo de referência e alertas. Quantidade física e compras entram em Registrar entrada."
              : "Apenas a ficha do item (sem saldo). Depois use Registrar entrada para compras, estoque físico e despesa no caixa."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[80vh] overflow-y-auto pr-2 sm:pr-4">
            <Alert>
              <AlertTitle>Cadastro ≠ movimentação</AlertTitle>
              <AlertDescription>
                Este formulário <strong>não</strong> altera quantidade em depósito. Novos insumos começam com saldo{" "}
                <strong>zero</strong>; use <strong>Ações → Registrar entrada</strong> para dar entrada, atualizar custo da compra e
                (opcional) lançar no caixa.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="supply-name">Nome do Item</Label>
                    <Input id="supply-name" name="supply-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={isProcessing}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="supply-category">Categoria</Label>
                    <Input id="supply-category" name="supply-category" placeholder="Ex: Secos, Laticínios" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={isProcessing}/>
                </div>
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="supply-type" className="flex items-center gap-2">
                    Tipo de Item
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                - **Ingrediente:** Matéria-prima usada em receitas.<br/>
                                - **Embalagem:** Itens para apresentação do produto final.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </Label>
                <Select name="supply-type" value={formData.type} onValueChange={(value: "ingredient" | "packaging") => setFormData({ ...formData, type: value })} disabled={isProcessing}>
                    <SelectTrigger id="supply-type">
                        <SelectValue placeholder="Tipo"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ingredient">Ingrediente (para receitas)</SelectItem>
                        <SelectItem value="packaging">Embalagem (para produto final)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          
            <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-base font-semibold">Como você compra (ficha)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        Unidade usada em receitas
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Define embalagem e conteúdo para calcular <strong>custo na menor unidade</strong> (g, ml ou un). Não é
                        quantidade em estoque — isso é só em Registrar entrada.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="purchase-format">Formato da compra</Label>
                  <Select
                    name="purchase-format"
                    value={formData.purchaseFormat}
                    onValueChange={(value: "unidade" | "pacote" | "caixa" | "garrafa" | "saco" | "lata" | "frasco") =>
                      setFormData({ ...formData, purchaseFormat: value })
                    }
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="purchase-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidade">Unidade (contagem simples)</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                      <SelectItem value="lata">Lata</SelectItem>
                      <SelectItem value="garrafa">Garrafa</SelectItem>
                      <SelectItem value="saco">Saco</SelectItem>
                      <SelectItem value="frasco">Frasco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content-unit" className="flex items-center gap-2">
                    Unidade do conteúdo (interna)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>É como o estoque será guardado e como a receita vai consumir (g, ml ou un).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select
                    value={humanQty.contentUnit}
                    onValueChange={(value: SupplyContentUnit) => setHumanQty((prev) => ({ ...prev, contentUnit: value }))}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="content-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g (grama)</SelectItem>
                      <SelectItem value="ml">ml (mililitro)</SelectItem>
                      <SelectItem value="un">un (unidade)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.purchaseFormat !== "unidade" && (
                <div className="grid gap-2">
                  <Label htmlFor="content-per-purchase">
                    Conteúdo por {purchaseFormatLabel(formData.purchaseFormat)} ({humanQty.contentUnit})
                  </Label>
                  <Input
                    id="content-per-purchase"
                    inputMode="decimal"
                    placeholder={
                      humanQty.contentUnit === "g"
                        ? "Ex.: 395"
                        : humanQty.contentUnit === "ml"
                          ? "Ex.: 1000"
                          : "Ex.: 12"
                    }
                    value={humanQty.contentPerPurchase}
                    onChange={(e) => setHumanQty((prev) => ({ ...prev, contentPerPurchase: e.target.value }))}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex.: 1 lata → 395 se cada lata tem 395 g líquidos.
                  </p>
                </div>
              )}

              <div className="grid gap-2 sm:max-w-md">
                <Label htmlFor="min-stock-human">
                  {formData.purchaseFormat === "unidade"
                    ? humanQty.contentUnit === "un"
                      ? "Alerta: estoque mínimo (unidades)"
                      : `Alerta: estoque mínimo (${humanQty.contentUnit})`
                    : `Alerta: estoque mínimo (${purchaseFormatLabel(formData.purchaseFormat)}s)`}
                </Label>
                <Input
                  id="min-stock-human"
                  inputMode="decimal"
                  placeholder="Ex.: 2 (opcional)"
                  value={humanQty.minStockPurchaseQty}
                  onChange={(e) => setHumanQty((prev) => ({ ...prev, minStockPurchaseQty: e.target.value }))}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Valor só para aviso de reposição; não movimenta estoque.
                </p>
              </div>

              <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Mínimo convertido:</span> {minPreviewText}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <Label className="text-base font-semibold">Custo de referência</Label>
              <div className="grid gap-2">
                <Label htmlFor="package-cost">Valor total pago (opcional)</Label>
                <Input
                  id="package-cost"
                  name="package-cost"
                  type="number"
                  placeholder="Ex.: 6.00"
                  value={formData.packageCost ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, packageCost: parseFloat(e.target.value) || undefined })
                  }
                  step="0.01"
                  min="0"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Se informar o total, dividimos pelo conteúdo de cada {purchaseFormatLabel(formData.purchaseFormat)} (
                  em {humanQty.contentUnit}) para obter o custo na menor unidade (receitas / CMV).
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supply-cost" className={cn("flex items-center gap-1", isPackageCalculation && "font-bold text-primary")}>
                  {getPurchaseCostLabel()}
                  {isPackageCalculation && <span className="text-xs font-normal">(calculado)</span>}
                </Label>
                <Input
                  id="supply-cost"
                  name="supply-cost"
                  type="number"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                  required
                  step="any"
                  min="0"
                  disabled={isProcessing}
                  readOnly={isPackageCalculation}
                  className={cn(isPackageCalculation && "cursor-not-allowed border-dashed bg-muted/80")}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="supply-supplier">Fornecedor</Label>
                    <Input id="supply-supplier" name="supply-supplier" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} disabled={isProcessing}/>
                </div>
                 <div className="grid gap-2">
                     <Label htmlFor="supply-sku">SKU / Código Interno</Label>
                     <Input id="supply-sku" name="supply-sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} disabled={isProcessing}/>
                 </div>
            </div>
            
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="last-purchase-date">Última compra (opcional, referência)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="last-purchase-date"
                          name="last-purchase-date"
                          variant={"outline"}
                          className={cn("justify-start text-left font-normal", !formData.lastPurchaseDate && "text-muted-foreground")}
                          disabled={isProcessing}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.lastPurchaseDate ? format(formData.lastPurchaseDate, "PPP") : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.lastPurchaseDate}
                          onSelect={(date) => date && setFormData({...formData, lastPurchaseDate: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="expiration-date">Data de Validade</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="expiration-date"
                          name="expiration-date"
                          variant={"outline"}
                          className={cn("justify-start text-left font-normal", !formData.expirationDate && "text-muted-foreground")}
                          disabled={isProcessing}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expirationDate ? format(formData.expirationDate, "PPP") : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.expirationDate}
                          onSelect={(date) => date && setFormData({...formData, expirationDate: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                </div>
            </div>

        <DialogFooter className="pt-4 border-t flex-col sm:flex-row">
          <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
          <Button className="w-full sm:w-auto" type="submit" disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

