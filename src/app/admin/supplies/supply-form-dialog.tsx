
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
import { Timestamp } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
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

export function SupplyFormDialog({ isOpen, onClose, onSave, supply, defaultType }: SupplyFormDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: defaultType,
    stock: 0,
    unit: "un" as "kg" | "g" | "L" | "ml" | "un",
    costPerUnit: 0,
    packageCost: undefined as number | undefined,
    packageQuantity: undefined as number | undefined,
    sku: "",
    supplier: "",
    minStock: 0,
    lastPurchaseDate: undefined as string | undefined, // Alterado para string
    expirationDate: undefined as string | undefined, // Alterado para string
  });

  const [financialData, setFinancialData] = useState({
      shouldRegister: false,
      paymentMethod: 'Dinheiro',
      description: '',
      amount: 0,
  });

  const { toast } = useToast();
  
  const isPackageCalculation = (formData.packageCost ?? 0) > 0 && (formData.packageQuantity ?? 0) > 0;
  const isEditing = !!supply;

  // Recalcula o custo unitário sempre que o custo do pacote ou a quantidade mudam.
  useEffect(() => {
    if (isPackageCalculation) {
      const unitCost = (formData.packageCost ?? 0) / (formData.packageQuantity ?? 1);
      setFormData(prev => ({...prev, costPerUnit: unitCost }));
    }
  }, [formData.packageCost, formData.packageQuantity, isPackageCalculation]);

  // Atualiza os dados financeiros quando o custo do pacote muda
  useEffect(() => {
      setFinancialData(prev => ({ ...prev, amount: formData.packageCost || formData.costPerUnit || 0 }));
  }, [formData.packageCost, formData.costPerUnit]);


  useEffect(() => {
    if (isOpen) {
      if (supply) {
        setFormData({
          name: supply.name || "",
          category: supply.category || "",
          type: supply.type || defaultType,
          stock: supply.stock || 0,
          unit: supply.unit || "un",
          costPerUnit: supply.costPerUnit || 0,
          packageCost: supply.packageCost,
          packageQuantity: supply.packageQuantity,
          sku: supply.sku || "",
          supplier: supply.supplier || "",
          minStock: supply.minStock || 0,
          lastPurchaseDate: supply.lastPurchaseDate,
          expirationDate: supply.expirationDate,
        });
         // Ao editar, desabilitar por padrão o registro financeiro para evitar duplicatas.
         setFinancialData({
            shouldRegister: false,
            paymentMethod: 'Dinheiro',
            description: '',
            amount: 0,
        });
      } else {
        setFormData({
          name: "",
          category: "",
          type: defaultType,
          stock: 0,
          unit: "un",
          costPerUnit: 0,
          packageCost: undefined,
          packageQuantity: undefined,
          sku: "",
          supplier: "",
          minStock: 0,
          lastPurchaseDate: new Date().toISOString(),
          expirationDate: undefined,
        });
        setFinancialData({
            shouldRegister: false,
            paymentMethod: 'Dinheiro',
            description: '',
            amount: 0,
        });
      }
    }
  }, [supply, isOpen, defaultType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if(formData.name && formData.unit && formData.costPerUnit >= 0 && formData.stock >= 0) {
      setIsProcessing(true);
      try {
        const finalData = { ...formData };
        if ((finalData.packageCost ?? 0) === 0 || (finalData.packageQuantity ?? 0) === 0) {
            finalData.packageCost = undefined;
            finalData.packageQuantity = undefined;
        }

        const descriptionForFinancial = `Compra de insumo: ${finalData.name}`;

        onSave(finalData, { ...financialData, description: descriptionForFinancial });
      } catch (error) {
        // Error is handled by the service and the global error handler
      } finally {
        setIsProcessing(false);
      }
    } else {
        toast({variant: "destructive", title: "Campos inválidos", description: "Por favor, preencha nome, unidade, custo e estoque com valores válidos."})
    }
  };
  
  const getPurchaseCostLabel = () => {
    switch (formData.unit) {
      case 'kg': return 'Custo por Unidade (kg)';
      case 'g': return 'Custo por Unidade (g)';
      case 'L': return 'Custo por Unidade (L)';
      case 'ml': return 'Custo por Unidade (ml)';
      case 'un': return 'Custo por Unidade (un)';
      default: return 'Custo por Unidade';
    }
  }

  const parseDate = (dateString?: string) => dateString ? new Date(dateString) : undefined;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supply ? 'Editar Item' : 'Adicionar Novo Item'}</DialogTitle>
          {isEditing && (
            <DialogDescription>Ajuste o estoque ou outros detalhes. Para registrar uma nova compra com custo diferente, use o botão "Adicionar".</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[80vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
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
          
            <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="supply-stock">Estoque Atual</Label>
                    <Input id="supply-stock" name="supply-stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })} required min="0" step="any" disabled={isProcessing}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="supply-minStock">Estoque Mínimo</Label>
                    <Input id="supply-minStock" name="supply-minStock" type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })} min="0" step="any" disabled={isProcessing}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="supply-unit">Unidade de Medida</Label>
                     <Select name="supply-unit" value={formData.unit} onValueChange={(value: any) => setFormData({ ...formData, unit: value })} disabled={isProcessing}>
                        <SelectTrigger id="supply-unit">
                            <SelectValue placeholder="Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="un">un (unidade)</SelectItem>
                            <SelectItem value="kg">kg (kilograma)</SelectItem>
                             <SelectItem value="g">g (grama)</SelectItem>
                            <SelectItem value="L">L (litro)</SelectItem>
                             <SelectItem value="ml">ml (mililitro)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* Custo Unitário ou por Pacote */}
            <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                 <Label className="flex items-center gap-2 font-semibold">
                    Cálculo de Custo da Compra
                </Label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="package-cost">Custo Total da Compra</Label>
                        <Input id="package-cost" name="package-cost" type="number" placeholder="Ex: 50.00" value={formData.packageCost || ''} onChange={(e) => setFormData({...formData, packageCost: parseFloat(e.target.value) || undefined})} step="0.01" min="0" disabled={isProcessing}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="package-quantity">Unidades Compradas</Label>
                        <Input id="package-quantity" name="package-quantity" type="number" placeholder="Ex: 100" value={formData.packageQuantity || ''} onChange={(e) => setFormData({...formData, packageQuantity: parseInt(e.target.value) || undefined})} min="1" disabled={isProcessing}/>
                    </div>
                </div>

                 <div className="grid gap-2">
                    <Label htmlFor="supply-cost" className={cn("flex items-center gap-1", isPackageCalculation && "text-primary font-bold")}>
                        {getPurchaseCostLabel()}
                        {isPackageCalculation && <span className="text-xs font-normal">(Calculado)</span>}
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
                      className={cn(isPackageCalculation && "border-dashed bg-muted/80 cursor-not-allowed")}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="supply-supplier">Fornecedor</Label>
                    <Input id="supply-supplier" name="supply-supplier" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} disabled={isProcessing}/>
                </div>
                 <div className="grid gap-2">
                     <Label htmlFor="supply-sku">SKU / Código Interno</Label>
                     <Input id="supply-sku" name="supply-sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} disabled={isProcessing}/>
                 </div>
            </div>
            
             <div className="grid grid-cols-2 gap-4">
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
                          {formData.lastPurchaseDate ? format(parseDate(formData.lastPurchaseDate)!, "PPP") : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={parseDate(formData.lastPurchaseDate)}
                          onSelect={(date) => date && setFormData({...formData, lastPurchaseDate: date.toISOString()})}
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
                          {formData.expirationDate ? format(parseDate(formData.expirationDate)!, "PPP") : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={parseDate(formData.expirationDate)}
                          onSelect={(date) => date && setFormData({...formData, expirationDate: date.toISOString()})}
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
                    <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in-0">
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
            
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
