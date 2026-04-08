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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader, TrendingUp } from "lucide-react";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { updateSupply, getPriceHistory } from "@/services";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActiveTenant } from "@/hooks/use-active-tenant";

type SupplyQuickAddDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  supply: Supply;
  onSuccess?: () => void;
};

const parseNumericInput = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function SupplyQuickAddDialog({
  isOpen,
  onClose,
  supply,
  onSuccess,
}: SupplyQuickAddDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [supplyName, setSupplyName] = useState(supply?.name || "");
  const [quantityToAdd, setQuantityToAdd] = useState<string>("");
  const [newCostPerUnit, setNewCostPerUnit] = useState<string>(
    supply?.costPerUnit?.toString() || "0"
  );
  const [quantityInputMode, setQuantityInputMode] = useState<"unit" | "package">("unit");
  const [packageCountInput, setPackageCountInput] = useState<string>("");
  const [priceMode, setPriceMode] = useState<"unit" | "package">("unit");
  const [isInferredPackageMode, setIsInferredPackageMode] = useState(false);
  const [packageQuantityRef, setPackageQuantityRef] = useState<string>(
    supply?.packageQuantity?.toString() || ""
  );
  const [priceChanged, setPriceChanged] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [shouldRegisterExpense, setShouldRegisterExpense] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminStockOverrideInput, setAdminStockOverrideInput] = useState("");
  const [adminData, setAdminData] = useState({
    sku: supply.sku || "",
    category: supply.category || "",
    type: supply.type,
    unit: supply.unit,
    minStock: supply.minStock ?? 0,
    supplier: supply.supplier || "",
    purchaseFormat: supply.purchaseFormat || "pacote",
  });

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { activeTenantId } = useActiveTenant();

  useEffect(() => {
    if (isOpen) {
      setSupplyName(supply?.name || "");
      setQuantityToAdd("");
      setAdminPasswordInput("");
      setAdminUnlocked(false);
      setAdminStockOverrideInput("");
      setAdminData({
        sku: supply.sku || "",
        category: supply.category || "",
        type: supply.type,
        unit: supply.unit,
        minStock: supply.minStock ?? 0,
        supplier: supply.supplier || "",
        purchaseFormat: supply.purchaseFormat || "pacote",
      });
      const hasPurchaseFormat = !!supply?.purchaseFormat && supply.purchaseFormat !== "unidade";
      const shouldInferPackageMode =
        !hasPurchaseFormat && (supply?.unit === "g" || supply?.unit === "ml");
      const defaultMode: "unit" | "package" =
        hasPurchaseFormat || shouldInferPackageMode ? "package" : "unit";
      const inferredPackageQuantity =
        supply?.unit === "g" || supply?.unit === "ml" ? 1000 : 1;
      const defaultRef =
        supply?.packageQuantity && supply.packageQuantity > 0
          ? supply.packageQuantity
          : defaultMode === "package"
            ? inferredPackageQuantity
            : 1;
      setPackageQuantityRef(String(defaultRef));
      setQuantityInputMode(defaultMode);
      setPackageCountInput("");
      setPriceMode(defaultMode);
      setIsInferredPackageMode(shouldInferPackageMode);
      if (defaultMode === "package") {
        const initialPackageCost =
          supply?.packageCost && supply.packageCost > 0
            ? supply.packageCost
            : (supply?.costPerUnit || 0) * defaultRef;
        setNewCostPerUnit(initialPackageCost.toString());
      } else {
        setNewCostPerUnit(supply?.costPerUnit?.toString() || "0");
      }
    }
  }, [
    isOpen,
    supply?.name,
    supply?.costPerUnit,
    supply?.packageCost,
    supply?.packageQuantity,
    supply?.purchaseFormat,
    supply?.unit,
  ]);

  useEffect(() => {
    if (isOpen && firestore && supply?.id) {
      getPriceHistory(firestore, supply.id, activeTenantId || undefined)
        .then((history) => {
          if (history.length > 0) {
            setLastPrice(history[0].costPerUnit);
          }
        })
        .catch((err) => console.error("Erro ao carregar historico de preco:", err));
    }
  }, [isOpen, firestore, supply?.id, activeTenantId]);

  useEffect(() => {
    const newPrice = parseNumericInput(newCostPerUnit);
    const quantityRef = parseNumericInput(packageQuantityRef);
    const comparableUnitPrice =
      priceMode === "package" && quantityRef > 0 ? newPrice / quantityRef : newPrice;
    const changed = lastPrice ? Math.abs(comparableUnitPrice - lastPrice) > 0.01 : false;
    setPriceChanged(changed);
  }, [newCostPerUnit, lastPrice, priceMode, packageQuantityRef]);

  const manualQuantityNum = parseNumericInput(quantityToAdd);
  const packageCountNum = parseNumericInput(packageCountInput);
  const newCostNum = parseNumericInput(newCostPerUnit);
  const adminStockOverrideNum = parseNumericInput(adminStockOverrideInput);
  const activeUnit = adminUnlocked ? adminData.unit : supply.unit;
  const activePurchaseFormat = adminUnlocked
    ? adminData.purchaseFormat || "pacote"
    : supply.purchaseFormat || "pacote";
  const packageQtyNum = parseNumericInput(packageQuantityRef);
  const quantityNum =
    quantityInputMode === "package" ? packageCountNum * packageQtyNum : manualQuantityNum;
  const effectiveCostPerUnit =
    priceMode === "package" && packageQtyNum > 0 ? newCostNum / packageQtyNum : newCostNum;
  const isUsingPackageData = quantityInputMode === "package" || priceMode === "package";
  const calculatedStockPreview = (supply?.stock || 0) + quantityNum;
  const newStockPreview =
    adminUnlocked && adminStockOverrideInput.trim().length > 0
      ? adminStockOverrideNum
      : calculatedStockPreview;
  const totalPurchaseCost = quantityNum * effectiveCostPerUnit;
  const priceIncrease = lastPrice ? effectiveCostPerUnit - lastPrice : 0;
  const priceChangePercent = lastPrice
    ? ((priceIncrease / lastPrice) * 100).toFixed(1)
    : "0";
  const baseUnitCost =
    activeUnit === "kg" || activeUnit === "L" ? effectiveCostPerUnit / 1000 : effectiveCostPerUnit;
  const baseUnit =
    activeUnit === "kg" ? "g" : activeUnit === "L" ? "ml" : activeUnit;
  const baseCostLabel =
    activeUnit === "kg" || activeUnit === "g" ? "Valor por grama" : "Valor por unidade base";
  const purchaseFormatLabel = activePurchaseFormat;

  const handleUnlockAdmin = () => {
    const configuredPassword = process.env.NEXT_PUBLIC_ADMIN_EDIT_PASSWORD?.trim();
    if (!configuredPassword) {
      toast({
        variant: "destructive",
        title: "Senha administrativa nao configurada",
        description: "Defina NEXT_PUBLIC_ADMIN_EDIT_PASSWORD no ambiente para habilitar este recurso.",
      });
      return;
    }
    if (adminPasswordInput !== configuredPassword) {
      toast({
        variant: "destructive",
        title: "Senha invalida",
        description: "A senha de administrador informada esta incorreta.",
      });
      return;
    }
    setAdminUnlocked(true);
    setAdminPasswordInput("");
    toast({ title: "Modo administrador ativado" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!supplyName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome invalido",
        description: "Informe um nome para o item.",
      });
      return;
    }

    if (quantityInputMode === "package" && packageCountNum <= 0) {
      toast({
        variant: "destructive",
        title: `Quantidade de ${purchaseFormatLabel} invalida`,
        description: `Informe quantos ${purchaseFormatLabel}(s) foram comprados.`,
      });
      return;
    }

    if (quantityInputMode === "package" && packageQtyNum <= 0) {
      toast({
        variant: "destructive",
        title: `Conteudo por ${purchaseFormatLabel} invalido`,
        description: `Informe a quantidade de ${activeUnit} em cada ${purchaseFormatLabel}.`,
      });
      return;
    }

    if (quantityNum <= 0) {
      toast({
        variant: "destructive",
        title: "Quantidade invalida",
        description: "A quantidade a adicionar deve ser maior que 0.",
      });
      return;
    }

    if (newCostNum < 0) {
      toast({
        variant: "destructive",
        title: "Preco invalido",
        description: "O preco nao pode ser negativo.",
      });
      return;
    }

    if (priceMode === "package" && packageQtyNum <= 0) {
      toast({
        variant: "destructive",
        title: `Quantidade por ${purchaseFormatLabel} invalida`,
        description: `Informe a quantidade de ${activeUnit} por ${purchaseFormatLabel}.`,
      });
      return;
    }

    if (adminUnlocked && adminStockOverrideInput.trim().length > 0 && newStockPreview < 0) {
      toast({
        variant: "destructive",
        title: "Estoque final invalido",
        description: "O estoque final nao pode ser negativo.",
      });
      return;
    }

    if (shouldRegisterExpense && !user?.uid) {
      toast({
        variant: "destructive",
        title: "Usuario nao identificado",
        description: "Faca login novamente para registrar a despesa no caixa.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const nextPackageQuantity =
        isUsingPackageData && packageQtyNum > 0 ? packageQtyNum : supply.packageQuantity;
      const nextPurchaseFormat =
        isUsingPackageData
          ? activePurchaseFormat && activePurchaseFormat !== "unidade"
            ? activePurchaseFormat
            : "pacote"
          : activePurchaseFormat;

      const updateData: Omit<Supply, "id" | "createdAt" | "isActive"> = {
        name: supplyName.trim(),
        sku: adminUnlocked ? adminData.sku : supply.sku || "",
        category: adminUnlocked ? adminData.category : supply.category || "",
        type: adminUnlocked ? adminData.type : supply.type,
        stock: newStockPreview,
        unit: activeUnit,
        costPerUnit: effectiveCostPerUnit,
        purchaseFormat: nextPurchaseFormat,
        packageQuantity: nextPackageQuantity,
        packageCost: priceMode === "package" ? newCostNum : supply.packageCost,
        supplier: adminUnlocked ? adminData.supplier : supply.supplier || "",
        lastPurchaseDate: new Date(),
        expirationDate: supply.expirationDate,
        minStock: adminUnlocked ? adminData.minStock : supply.minStock ?? 0,
      };

      const financialData = {
        shouldRegister: shouldRegisterExpense && effectiveCostPerUnit > 0,
        userId: user?.uid || "",
        tenantId: activeTenantId || undefined,
        paymentMethod,
        description: `Reposicao de estoque: ${supplyName.trim()}`,
        amount: totalPurchaseCost,
      };

      await updateSupply(firestore, supply.id, updateData, financialData, activeTenantId || undefined);

      toast({ title: "Estoque atualizado com sucesso!" });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!supply) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Repor Estoque: {supply.name}</DialogTitle>
          <DialogDescription>
            Estoque atual:{" "}
            <span className="font-semibold">
              {supply.stock} {activeUnit}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 py-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <Label className="text-base font-semibold">Acesso Administrativo</Label>
            {!adminUnlocked ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  type="password"
                  placeholder="Senha de acesso"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  disabled={isProcessing}
                  className="sm:col-span-2"
                />
                <Button type="button" variant="outline" onClick={handleUnlockAdmin} disabled={isProcessing}>
                  Desbloquear
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertDescription>Modo administrador ativo: edicao completa liberada.</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supply-name">Nome do Item</Label>
            <Input
              id="supply-name"
              name="supply-name"
              value={supplyName}
              onChange={(e) => setSupplyName(e.target.value)}
              disabled={isProcessing}
              required
            />
          </div>

          {adminUnlocked && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <Label className="text-base font-semibold">Edicao Completa do Item</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-2 text-sm">SKU</Label>
                  <Input value={adminData.sku} onChange={(e) => setAdminData((prev) => ({ ...prev, sku: e.target.value }))} />
                </div>
                <div>
                  <Label className="mb-2 text-sm">Categoria</Label>
                  <Input value={adminData.category} onChange={(e) => setAdminData((prev) => ({ ...prev, category: e.target.value }))} />
                </div>
                <div>
                  <Label className="mb-2 text-sm">Tipo</Label>
                  <Select
                    value={adminData.type}
                    onValueChange={(value: "ingredient" | "packaging") => setAdminData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingredient">Ingrediente</SelectItem>
                      <SelectItem value="packaging">Embalagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 text-sm">Unidade</Label>
                  <Select
                    value={adminData.unit}
                    onValueChange={(value: "kg" | "g" | "L" | "ml" | "un") => setAdminData((prev) => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">un</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 text-sm">Formato de compra</Label>
                  <Select
                    value={adminData.purchaseFormat}
                    onValueChange={(value: "unidade" | "pacote" | "caixa" | "garrafa" | "saco" | "lata" | "frasco") =>
                      setAdminData((prev) => ({ ...prev, purchaseFormat: value }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidade">unidade</SelectItem>
                      <SelectItem value="pacote">pacote</SelectItem>
                      <SelectItem value="caixa">caixa</SelectItem>
                      <SelectItem value="garrafa">garrafa</SelectItem>
                      <SelectItem value="saco">saco</SelectItem>
                      <SelectItem value="lata">lata</SelectItem>
                      <SelectItem value="frasco">frasco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 text-sm">Estoque minimo</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={adminData.minStock}
                    onChange={(e) => setAdminData((prev) => ({ ...prev, minStock: parseNumericInput(e.target.value) }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-2 text-sm">Fornecedor</Label>
                  <Input value={adminData.supplier} onChange={(e) => setAdminData((prev) => ({ ...prev, supplier: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-2 text-sm">Estoque final manual (opcional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Se preencher, substitui o calculo da reposicao"
                    value={adminStockOverrideInput}
                    onChange={(e) => setAdminStockOverrideInput(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <Label className="text-base font-semibold">Adicionar Quantidade</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="quantity-mode" className="text-sm text-muted-foreground">
                  Como informar a reposicao
                </Label>
                <Select
                  value={quantityInputMode}
                  onValueChange={(value: "unit" | "package") => setQuantityInputMode(value)}
                  disabled={isProcessing}
                >
                  <SelectTrigger id="quantity-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Por {activeUnit}</SelectItem>
                    <SelectItem value="package">Por {purchaseFormatLabel}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {quantityInputMode === "unit" ? (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="quantity-to-add" className="mb-2 text-sm">
                    Quantidade a adicionar
                  </Label>
                  <Input
                    id="quantity-to-add"
                    name="quantity-to-add"
                    type="number"
                    placeholder="Ex: 50"
                    value={quantityToAdd}
                    onChange={(e) => setQuantityToAdd(e.target.value)}
                    step="any"
                    min="0"
                    disabled={isProcessing}
                    required
                    className="font-semibold"
                  />
                </div>
                <div className="text-sm font-medium text-muted-foreground">{activeUnit}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="package-count" className="mb-2 text-sm">
                    Quantidade de {purchaseFormatLabel}(s)
                  </Label>
                  <Input
                    id="package-count"
                    name="package-count"
                    type="number"
                    placeholder="Ex: 3"
                    value={packageCountInput}
                    onChange={(e) => setPackageCountInput(e.target.value)}
                    min="0"
                    step="any"
                    disabled={isProcessing}
                    required
                    className="font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="package-qty-ref-add" className="mb-2 text-sm">
                    Conteudo por {purchaseFormatLabel} ({activeUnit})
                  </Label>
                  <Input
                    id="package-qty-ref-add"
                    name="package-qty-ref-add"
                    type="number"
                    value={packageQuantityRef}
                    onChange={(e) => setPackageQuantityRef(e.target.value)}
                    min="0.000001"
                    step="any"
                    disabled={isProcessing}
                    required
                    className="font-semibold"
                  />
                </div>
              </div>
            )}
            {quantityInputMode === "package" && (
              <div className="rounded border bg-background p-2 text-xs text-muted-foreground">
                Conversao da reposicao: {packageCountNum || 0} {purchaseFormatLabel}(s) x{" "}
                {packageQtyNum || 0} {activeUnit} ={" "}
                <span className="font-semibold text-foreground">
                  {quantityNum.toFixed(2)} {activeUnit}
                </span>
                .
              </div>
            )}
            <div className="rounded bg-background p-2 pt-2 text-xs text-muted-foreground">
              Novo total:{" "}
              <span className="font-semibold text-foreground">
                {newStockPreview.toFixed(2)} {activeUnit}
              </span>
            </div>
            <div className="rounded border bg-background p-2 text-xs text-muted-foreground">
              Resumo da operacao: +{" "}
              <span className="font-semibold text-foreground">
                {quantityNum.toFixed(2)} {activeUnit}
              </span>{" "}
              com custo total estimado de{" "}
              <span className="font-semibold text-foreground">
                {totalPurchaseCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              .
            </div>
          </div>

          <Separator />

          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <Label className="flex items-center gap-2 text-base font-semibold">
              Custo por Unidade
              {priceChanged && (
                <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
                  Alterado
                </span>
              )}
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="last-price" className="text-sm text-muted-foreground">
                  Ultimo custo
                </Label>
                <Input
                  id="last-price"
                  type="number"
                  value={lastPrice || supply.costPerUnit || 0}
                  disabled
                  readOnly
                  className="cursor-not-allowed bg-muted"
                />
              </div>
              <div>
                  <Label htmlFor="new-price" className="text-sm text-muted-foreground">
                  Novo custo ({priceMode === "package" ? purchaseFormatLabel : activeUnit})
                </Label>
                <Input
                  id="new-price"
                  name="new-price"
                  type="number"
                  placeholder="0.00"
                  value={newCostPerUnit}
                  onChange={(e) => setNewCostPerUnit(e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={isProcessing}
                  required
                  className="font-semibold"
                />
              </div>
            </div>
            {isInferredPackageMode && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-900">
                  Este item usa unidade {supply.unit}. Para evitar preco irreal por {supply.unit},
                  assumimos por padrao compra por pacote de 1000 {supply.unit}. Ajuste se precisar.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="price-mode" className="text-sm text-muted-foreground">
                  Modo do preco informado
                </Label>
                <Select value={priceMode} onValueChange={(value: "unit" | "package") => setPriceMode(value)} disabled={isProcessing}>
                  <SelectTrigger id="price-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Preco por {activeUnit}</SelectItem>
                    <SelectItem value="package">Preco por {purchaseFormatLabel}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {priceMode === "package" && (
                <div>
                  <Label htmlFor="package-qty-ref" className="text-sm text-muted-foreground">
                    Quantidade por {purchaseFormatLabel} ({activeUnit})
                  </Label>
                  <Input
                    id="package-qty-ref"
                    name="package-qty-ref"
                    type="number"
                    value={packageQuantityRef}
                    onChange={(e) => setPackageQuantityRef(e.target.value)}
                    min="0.000001"
                    step="any"
                    disabled={isProcessing}
                  />
                </div>
              )}
            </div>
            <div className="rounded border bg-background p-2 text-xs text-muted-foreground">
              Impacto no custo tecnico: o custo por unidade deste insumo passa para{" "}
              <span className="font-semibold text-foreground">
                {effectiveCostPerUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              {" "}/ {activeUnit}.
            </div>
            {priceMode === "package" && (
              <div className="rounded border bg-background p-2 text-xs text-muted-foreground">
                Conversao aplicada:{" "}
                <span className="font-semibold text-foreground">
                  {newCostNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>{" "}
                por {purchaseFormatLabel} / {packageQtyNum || 0} {activeUnit} ={" "}
                <span className="font-semibold text-foreground">
                  {effectiveCostPerUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>{" "}
                / {activeUnit}.
              </div>
            )}
            <div className="rounded border bg-background p-2 text-xs text-muted-foreground">
              {baseCostLabel}:{" "}
              <span className="font-semibold text-foreground">
                {baseUnitCost.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 6,
                })}{" "}
                / {baseUnit}
              </span>
              .
            </div>

            {priceChanged && (
              <Alert className="border-amber-200 bg-amber-50">
                <TrendingUp className="h-4 w-4 text-amber-700" />
                <AlertDescription className="text-amber-900">
                  Preco {priceIncrease > 0 ? "aumentou" : "diminuiu"} em{" "}
                  <span className="font-semibold">
                    {Math.abs(priceIncrease).toFixed(2)} ({priceChangePercent}%)
                  </span>
                  . Um novo registro sera adicionado ao historico de precos.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <Alert>
              <AlertDescription className="text-sm">
                Separacao importante: repor estoque sempre atualiza <strong>custo tecnico</strong>.
                O <strong>fluxo de caixa</strong> so muda se voce marcar a opcao abaixo.
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="register-expense"
                checked={shouldRegisterExpense}
                onCheckedChange={(checked) => setShouldRegisterExpense(!!checked)}
                disabled={isProcessing}
              />
              <label htmlFor="register-expense" className="cursor-pointer text-sm font-medium">
                Registrar saida no Fluxo de Caixa agora
              </label>
            </div>

            {shouldRegisterExpense && (
              <div className="animate-in space-y-3 fade-in-0 pl-6 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="payment-method" className="text-sm">
                    Metodo de Pagamento
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartao de Credito">Cartao de Credito</SelectItem>
                      <SelectItem value="Cartao de Debito">Cartao de Debito</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded border bg-background p-3 text-sm">
                  <div className="mb-2 flex justify-between text-muted-foreground">
                    <span>Custo total:</span>
                    <span className="font-semibold text-foreground">
                      {totalPurchaseCost.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sera registrado como despesa no caixa ativo com a descricao desta reposicao.
                  </p>
                </div>
              </div>
            )}

            {!shouldRegisterExpense && (
              <div className="rounded border bg-background p-3 text-sm text-muted-foreground">
                Nenhuma saida sera criada no caixa. Apenas estoque e custo tecnico serao atualizados.
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="flex-col border-t pt-4 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Atualizando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
