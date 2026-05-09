

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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
    stockPurchaseQty: "",
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

  const [financialData, setFinancialData] = useState({
      shouldRegister: false,
      paymentMethod: 'Dinheiro',
      description: '',
      amount: 0,
  });

  const { toast } = useToast();

  const pkgQtyForCost = (() => {
    if (formData.purchaseFormat === "unidade") return undefined;
    const per = parseHumanQty(humanQty.contentPerPurchase);
    return per > 0 ? per : undefined;
  })();

  const isPackageCalculation =
    (formData.packageCost ?? 0) > 0 && pkgQtyForCost !== undefined && pkgQtyForCost > 0;
  const isEditing = !!supply;

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

  // Atualiza os dados financeiros quando o custo do pacote muda
  useEffect(() => {
      setFinancialData(prev => ({ ...prev, amount: formData.packageCost || formData.costPerUnit || 0 }));
  }, [formData.packageCost, formData.costPerUnit]);


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
          stockPurchaseQty: String(split.stockPurchaseQty),
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
        setFinancialData({
          shouldRegister: false,
          paymentMethod: "Dinheiro",
          description: "",
          amount: 0,
        });
      } else {
        setHumanQty({
          contentUnit: "g",
          contentPerPurchase: "",
          stockPurchaseQty: "",
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
          lastPurchaseDate: new Date(),
          expirationDate: undefined,
        });
        setFinancialData({
          shouldRegister: false,
          paymentMethod: "Dinheiro",
          description: "",
          amount: 0,
        });
      }
    }
  }, [supply, isOpen, defaultType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const derived = deriveSupplyQuantitiesForSave({
      purchaseFormat: formData.purchaseFormat,
      contentUnit: humanQty.contentUnit,
      contentPerPurchase: parseHumanQty(humanQty.contentPerPurchase),
      stockPurchaseQty: parseHumanQty(humanQty.stockPurchaseQty),
      minStockPurchaseQty: parseHumanQty(humanQty.minStockPurchaseQty),
    });

    if ("error" in derived) {
      toast({ variant: "destructive", title: "Estoque inválido", description: derived.error });
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

      const descriptionForFinancial = `Compra de insumo: ${finalData.name}`;

      onSave(finalData, { ...financialData, description: descriptionForFinancial });
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
    stockPurchaseQty: parseHumanQty(humanQty.stockPurchaseQty),
    minStockPurchaseQty: parseHumanQty(humanQty.minStockPurchaseQty),
  });
  const stockPreviewText =
    "error" in stockPreviewDerived
      ? "—"
      : `${formatBaseStockHint(stockPreviewDerived.unit, stockPreviewDerived.stock)} no sistema · mín. ${formatBaseStockHint(stockPreviewDerived.unit, stockPreviewDerived.minStock)}`;


  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supply ? 'Editar Item' : 'Adicionar Novo Item'}</DialogTitle>
          {isEditing && (
            <DialogDescription>Ajuste o estoque ou outros detalhes. Para registrar uma nova compra com custo diferente, use o botão "Adicionar".</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[80vh] overflow-y-auto pr-2 sm:pr-4">
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
                <Label className="text-base font-semibold">Estoque (como você compra)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        Menor unidade no sistema
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Você informa pacotes, latas ou caixas. O app converte para{" "}
                        <strong>gramas</strong>, <strong>mililitros</strong> ou <strong>unidades</strong> para custo e receitas.
                        Itens antigos em kg/L continuam editáveis e são normalizados ao salvar.
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="stock-human">
                    {formData.purchaseFormat === "unidade"
                      ? humanQty.contentUnit === "un"
                        ? "Quantidade em estoque (unidades)"
                        : `Quantidade em estoque (${humanQty.contentUnit})`
                      : `Quantidade em estoque (${purchaseFormatLabel(formData.purchaseFormat)}s)`}
                  </Label>
                  <Input
                    id="stock-human"
                    inputMode="decimal"
                    placeholder={formData.purchaseFormat === "unidade" ? "Ex.: 10" : "Ex.: 1"}
                    value={humanQty.stockPurchaseQty}
                    onChange={(e) => setHumanQty((prev) => ({ ...prev, stockPurchaseQty: e.target.value }))}
                    disabled={isProcessing}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="min-stock-human">
                    {formData.purchaseFormat === "unidade"
                      ? humanQty.contentUnit === "un"
                        ? "Estoque mínimo (unidades)"
                        : `Estoque mínimo (${humanQty.contentUnit})`
                      : `Estoque mínimo (${purchaseFormatLabel(formData.purchaseFormat)}s)`}
                  </Label>
                  <Input
                    id="min-stock-human"
                    inputMode="decimal"
                    placeholder="Ex.: 2"
                    value={humanQty.minStockPurchaseQty}
                    onChange={(e) => setHumanQty((prev) => ({ ...prev, minStockPurchaseQty: e.target.value }))}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">No sistema:</span> {stockPreviewText}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <Label className="text-base font-semibold">Custo desta compra</Label>
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
                    <Label htmlFor="last-purchase-date">Data da Compra</Label>
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

            <Separator />
            
            <div className="space-y-4 p-4 border rounded-md bg-background">
                 <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="register-expense"
                        checked={financialData.shouldRegister}
                        onCheckedChange={(checked) => setFinancialData(prev => ({...prev, shouldRegister: !!checked}))}
                        disabled={isProcessing || financialData.amount <= 0}
                    />
                    <label htmlFor="register-expense" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Registrar esta compra no Fluxo de Caixa
                    </label>
                </div>

                {financialData.shouldRegister && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in fade-in-0">
                        <div className="grid gap-2">
                            <Label htmlFor="payment-method">Método de Pagamento</Label>
                            <Select name="payment-method" value={financialData.paymentMethod} onValueChange={(value) => setFinancialData(prev => ({...prev, paymentMethod: value}))}>
                                <SelectTrigger id="payment-method"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="PIX">PIX</SelectItem>
                                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                    <SelectItem value="Transferência">Transferência</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="expense-amount">Valor da Despesa</Label>
                            <Input id="expense-amount" name="expense-amount" type="number" value={financialData.amount} disabled readOnly className="font-semibold" />
                        </div>
                    </div>
                )}
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

