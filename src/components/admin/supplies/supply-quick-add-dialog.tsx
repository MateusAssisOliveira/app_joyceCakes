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
import { Loader, AlertCircle, TrendingUp } from "lucide-react";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { updateSupply, getPriceHistory } from "@/services";
import { format } from "date-fns";
import { toDate } from "@/lib/timestamp-utils";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

type SupplyQuickAddDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  supply: Supply;
  onSuccess?: () => void;
};

export function SupplyQuickAddDialog({
  isOpen,
  onClose,
  supply,
  onSuccess,
}: SupplyQuickAddDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState<string>("");
  const [newCostPerUnit, setNewCostPerUnit] = useState<string>(
    supply?.costPerUnit?.toString() || "0"
  );
  const [priceChanged, setPriceChanged] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [shouldRegisterExpense, setShouldRegisterExpense] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");

  const { toast } = useToast();
  const firestore = useFirestore();

  // Ao abrir, buscar o último preço registrado
  useEffect(() => {
    if (isOpen && firestore && supply?.id) {
      getPriceHistory(firestore, supply.id)
        .then((history) => {
          if (history.length > 0) {
            setLastPrice(history[0].costPerUnit);
          }
        })
        .catch((err) => console.error("Erro ao carregar histórico de preço:", err));
    }
  }, [isOpen, firestore, supply?.id]);

  // Detectar mudança de preço
  useEffect(() => {
    const newPrice = parseFloat(newCostPerUnit) || 0;
    const changed = lastPrice ? Math.abs(newPrice - lastPrice) > 0.01 : false;
    setPriceChanged(changed);
  }, [newCostPerUnit, lastPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firestore) return;

    const quantityNum = parseFloat(quantityToAdd) || 0;
    const newCost = parseFloat(newCostPerUnit) || 0;

    if (quantityNum <= 0) {
      toast({
        variant: "destructive",
        title: "Quantidade inválida",
        description: "A quantidade a adicionar deve ser maior que 0.",
      });
      return;
    }

    if (newCost < 0) {
      toast({
        variant: "destructive",
        title: "Preço inválido",
        description: "O preço não pode ser negativo.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const newStock = (supply.stock || 0) + quantityNum;

      const updateData: Omit<Supply, "id" | "createdAt" | "isActive"> = {
        ...supply,
        stock: newStock,
        costPerUnit: newCost,
      };

      // Prepare financial data if needed
      const financialData = {
        shouldRegister:
          shouldRegisterExpense && (shouldRegisterExpense || newCost > 0),
        userId: "", // Será preenchido no serviço
        paymentMethod,
        description: `Reposição de estoque: ${supply.name}`,
        amount: newCost * quantityNum,
      };

      // A função updateSupply já cuida de adicionar ao histórico de preço se mudou
      await updateSupply(firestore, supply.id, updateData, financialData);

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

  const priceIncrease = lastPrice ? parseFloat(newCostPerUnit) - lastPrice : 0;
  const priceChangePercent = lastPrice
    ? ((priceIncrease / lastPrice) * 100).toFixed(1)
    : "0";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repor Estoque: {supply.name}</DialogTitle>
          <DialogDescription>
            Estoque atual: <span className="font-semibold">{supply.stock} {supply.unit}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          {/* Seção: Quantidade */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold">Adicionar Quantidade</Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="quantity-to-add" className="text-sm mb-2">
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
              <div className="text-sm text-muted-foreground font-medium">
                {supply.unit}
              </div>
            </div>
            <div className="text-xs text-muted-foreground pt-2 bg-background rounded p-2">
              Novo total: <span className="font-semibold text-foreground">
                {((supply.stock || 0) + (parseFloat(quantityToAdd) || 0)).toFixed(2)} {supply.unit}
              </span>
            </div>
          </div>

          <Separator />

          {/* Seção: Preço */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold flex items-center gap-2">
              Custo por Unidade
              {priceChanged && (
                <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded">
                  Alterado
                </span>
              )}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="last-price" className="text-sm text-muted-foreground">
                  Último custo
                </Label>
                <Input
                  id="last-price"
                  type="number"
                  value={lastPrice || supply.costPerUnit || 0}
                  disabled
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="new-price" className="text-sm text-muted-foreground">
                  Novo custo
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

            {priceChanged && (
              <Alert className="bg-amber-50 border-amber-200">
                <TrendingUp className="h-4 w-4 text-amber-700" />
                <AlertDescription className="text-amber-900">
                  Preço {priceIncrease > 0 ? "aumentou" : "diminuiu"} em{" "}
                  <span className="font-semibold">
                    {Math.abs(priceIncrease).toFixed(2)} ({priceChangePercent}%)
                  </span>
                  . Um novo registro será adicionado ao histórico de preços.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Seção: Financeiro */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="register-expense"
                checked={shouldRegisterExpense}
                onCheckedChange={(checked) =>
                  setShouldRegisterExpense(!!checked)
                }
                disabled={isProcessing}
              />
              <label
                htmlFor="register-expense"
                className="text-sm font-medium cursor-pointer"
              >
                Registrar custo no Fluxo de Caixa
              </label>
            </div>

            {shouldRegisterExpense && (
              <div className="space-y-3 pt-2 pl-6 animate-in fade-in-0">
                <div className="grid gap-2">
                  <Label htmlFor="payment-method" className="text-sm">
                    Método de Pagamento
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
                      <SelectItem value="Cartão de Crédito">
                        Cartão de Crédito
                      </SelectItem>
                      <SelectItem value="Cartão de Débito">
                        Cartão de Débito
                      </SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-background rounded border text-sm">
                  <div className="flex justify-between text-muted-foreground mb-2">
                    <span>Custo total:</span>
                    <span className="font-semibold text-foreground">
                      {(
                        (parseFloat(quantityToAdd) || 0) *
                        (parseFloat(newCostPerUnit) || 0)
                      ).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Atualizando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
