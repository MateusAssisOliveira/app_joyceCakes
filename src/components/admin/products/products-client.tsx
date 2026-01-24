"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useUser, useCollection, useFirestore, useAuth } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Search, Loader, Pencil, ArchiveRestore, Link as LinkIcon, Link2Off } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { addProduct, updateProduct, inactivateProduct, reactivateProduct } from "@/services";
import type { Product, TechnicalSheet } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ProductsClient() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const productsCollection = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'));
  }, [firestore, user]);

  const technicalSheetsCollection = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'technical_sheets'));
  }, [firestore, user]);

  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsCollection);
  const { data: technicalSheets, isLoading: areSheetsLoading } = useCollection<TechnicalSheet>(technicalSheetsCollection);
  
  const activeSheets = useMemo(() => technicalSheets?.filter(r => r.isActive !== false && r.type === 'final') || [], [technicalSheets]);

  const filteredProducts = useMemo(() => {
    if (!products) {
       return [];
    }
    const result = products.filter(p => {
        const isItemActive = p.isActive !== false;
        const matchesViewMode = viewMode === 'active' ? isItemActive : !isItemActive;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesViewMode && matchesSearch;
    });
    return result;
  }, [products, searchTerm, viewMode]);

  const selectedProduct = useMemo(() => {
    return products?.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);
  
  useEffect(() => {
    setSelectedProductId(null);
  }, [viewMode]);


  const handleOpenFormDialog = (product: Product | null) => {
    setProductToEdit(product);
    setIsFormDialogOpen(true);
  }

  const handleCloseFormDialog = () => {
    setProductToEdit(null);
    setIsFormDialogOpen(false);
  }
  
  const handleSaveProduct = (formData: Omit<Product, 'id' | 'createdAt' | 'isActive'>) => {
    if (!firestore) return;
    try {
        if (productToEdit) {
            updateProduct(firestore, productToEdit.id, formData);
            toast({ title: "Produto Atualizado!" });
        } else {
            addProduct(firestore, formData);
            toast({ title: "Produto Adicionado!" });
        }
        handleCloseFormDialog();
    } catch(e: any) {
        toast({ variant: "destructive", title: "Erro ao salvar", description: e.message });
        throw e; // Propagate error to form
    }
  };
  
  const handleConfirmAction = useCallback(() => {
    if (!selectedProduct || !firestore) return;

    if (viewMode === 'active') {
      inactivateProduct(firestore, selectedProduct.id);
      toast({ title: "Produto Arquivado" });
    } else {
      reactivateProduct(firestore, selectedProduct.id);
      toast({ title: "Produto Reativado" });
    }
    setSelectedProductId(null);
    setIsConfirmDialogOpen(false);
  }, [selectedProduct, firestore, viewMode, toast]);

  const showLoading = isUserLoading || (areProductsLoading && !products) || (areSheetsLoading && !technicalSheets);

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="w-full flex-1 flex flex-col min-h-0">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <CardTitle>Catálogo de Produtos</CardTitle>
                  <CardDescription>Clique na linha para selecionar e gerenciar seus produtos.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Button onClick={() => handleOpenFormDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Adicionar</Button>
                <Button variant="outline" onClick={() => selectedProduct && handleOpenFormDialog(selectedProduct)} disabled={!selectedProduct} className="w-full sm:w-auto"><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsConfirmDialogOpen(true)}
                  disabled={!selectedProduct} 
                  className="w-full sm:w-auto"
                >
                  {viewMode === 'active' ? <><Trash2 className="mr-2 h-4 w-4" />Arquivar</> : <><ArchiveRestore className="mr-2 h-4 w-4" />Reativar</>}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="product-search"
                        name="product-search"
                        placeholder="Buscar produto..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={viewMode} onValueChange={(value: "active" | "archived") => setViewMode(value)}>
                    <SelectTrigger id="product-view-mode" name="product-view-mode" className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Ver status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Ver Ativos</SelectItem>
                        <SelectItem value="archived">Ver Arquivados</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {showLoading ? (
               <div className="flex flex-1 items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
             <div className="flex-1 overflow-auto min-h-0">
              <div className="relative w-full h-full overflow-auto">
                <Table className="w-full table-auto">
                  <TableHeader>
                      <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Custo</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredProducts.map((product) => (
                          <TableRow 
                            key={product.id} 
                            data-state={selectedProductId === product.id ? 'selected' : ''}
                            onClick={() => setSelectedProductId(product.id)}
                            onDoubleClick={() => handleOpenFormDialog(product)}
                            className="cursor-pointer"
                          >
                              <TableCell className="font-medium flex items-center gap-2">
                                {product.technicalSheetId ? <LinkIcon className="h-4 w-4 text-primary" title="Vinculado a uma ficha técnica"/> : <Link2Off className="h-4 w-4 text-muted-foreground" title="Não vinculado a uma ficha técnica"/>}
                                {product.name}
                              </TableCell>
                              <TableCell>
                                  <Badge variant="secondary">{product.category}</Badge>
                              </TableCell>
                               <TableCell>
                                  {product.costPrice ? product.costPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : '---'}
                              </TableCell>
                              <TableCell>
                                  {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={product.isActive !== false ? "default" : "outline"} className={cn(product.isActive !== false && "bg-emerald-500 hover:bg-emerald-600")}>
                                    {product.isActive !== false ? "Ativo" : "Arquivado"}
                                </Badge>
                              </TableCell>
                          </TableRow>
                      ))}
                      {filteredProducts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum produto encontrado.</TableCell></TableRow>}
                  </TableBody>
              </Table>
             </div>
            </div>
            )}
          </CardContent>
      </Card>
      
      <ProductFormDialog 
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSave={handleSaveProduct}
        product={productToEdit}
        technicalSheets={activeSheets}
      />

       <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                {viewMode === 'active' 
                ? `Isso irá arquivar o produto "${selectedProduct?.name}". Ele não aparecerá mais no Ponto de Venda.`
                : `Isso irá reativar o produto "${selectedProduct?.name}".`}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
                Confirmar
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Componente de formulário separado ---
type ProductFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Omit<Product, 'id' | 'createdAt' | 'isActive'>) => void;
  product: Product | null;
  technicalSheets: TechnicalSheet[];
};

function ProductFormDialog({ isOpen, onClose, onSave, product, technicalSheets }: ProductFormDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    costPrice: 0,
    category: "",
    imageUrlId: "product-desserts-1", 
    stock_quantity: 0,
    technicalSheetId: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        costPrice: product.costPrice || 0,
        category: product.category,
        imageUrlId: product.imageUrlId,
        stock_quantity: product.stock_quantity,
        technicalSheetId: product.technicalSheetId || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        costPrice: 0,
        category: "",
        imageUrlId: "product-desserts-1",
        stock_quantity: 0,
        technicalSheetId: "",
      });
    }
  }, [product, isOpen]);

  const handleSheetChange = (sheetId: string) => {
    const isNone = sheetId === 'none';
    const selectedSheet = isNone ? null : technicalSheets.find(r => r.id === sheetId);

    if (selectedSheet) {
      setFormData(prev => ({
        ...prev,
        technicalSheetId: selectedSheet.id,
        costPrice: selectedSheet.totalCost,
        price: selectedSheet.suggestedPrice,
      }));
    } else {
      // Se desvincular (ou selecionar 'none'), limpa os campos relacionados
      setFormData(prev => ({ ...prev, technicalSheetId: "", costPrice: 0 }));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.name && formData.category && formData.price > 0) {
      setIsProcessing(true);
      try {
        const dataToSave = { ...formData };
        if(dataToSave.technicalSheetId === 'none') {
          dataToSave.technicalSheetId = '';
        }
        onSave(dataToSave);
      } catch (error) {
        // Error is handled by the service and the global error handler
      } finally {
        setIsProcessing(false);
      }
    } else {
        toast({ variant: "destructive", title: "Campos inválidos", description: "Por favor, preencha nome, categoria e um preço válido."})
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sheet-link">Ficha Técnica de Montagem (Vincular)</Label>
            <Select name="sheet-link" value={formData.technicalSheetId || 'none'} onValueChange={handleSheetChange} disabled={isProcessing}>
                <SelectTrigger id="sheet-link">
                    <SelectValue placeholder="Selecione uma ficha para vincular..."/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Nenhuma (custo e preço manual)</SelectItem>
                    {technicalSheets.map(sheet => (
                        <SelectItem key={sheet.id} value={sheet.id}>{sheet.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-name">Nome do Produto</Label>
            <Input
              id="product-name"
              name="product-name"
              placeholder="Ex: Bolo de Chocolate"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isProcessing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-description">Descrição</Label>
            <Textarea
              id="product-description"
              name="product-description"
              placeholder="Descreva o produto..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isProcessing}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="product-cost-price">Preço de Custo</Label>
                <Input
                  id="product-cost-price"
                  name="product-cost-price"
                  type="number"
                  placeholder="R$ 0,00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  readOnly={!!formData.technicalSheetId} 
                  className={cn(formData.technicalSheetId && "bg-muted cursor-not-allowed")}
                  step="0.01"
                  disabled={isProcessing}
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Preço de Venda</Label>
              <Input
                id="product-price"
                name="product-price"
                type="number"
                placeholder="R$ 0,00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                step="0.01"
                disabled={isProcessing}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-category">Categoria</Label>
              <Input
                id="product-category"
                name="product-category"
                placeholder="Ex: Bolos"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                disabled={isProcessing}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="product-stock">Estoque (Venda Direta)</Label>
              <Input
                id="product-stock"
                name="product-stock"
                type="number"
                placeholder="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                disabled={isProcessing}
              />
            </div>
          </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
