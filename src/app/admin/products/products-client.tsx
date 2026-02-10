
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useUser, useFirestore, useCollection } from '@/firebase';
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
import { PlusCircle, Trash2, Search, Loader, Pencil, ArchiveRestore, Link as LinkIcon, Link2Off, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { inactivateProduct, reactivateProduct } from "@/services";
import type { Product, TechnicalSheet, Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ProductForm } from "@/components/admin/products/product-form";
import Link from "next/link";
import { collection, query } from 'firebase/firestore';


export function ProductsClient() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user } = useUser();
  
  const productsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'));
  }, [firestore, user]);
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const suppliesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'supplies'));
  }, [firestore, user]);
  const { data: supplies, isLoading: areSuppliesLoading } = useCollection<Supply>(suppliesQuery);

  const sheetsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'technical_sheets'));
  }, [firestore, user]);
  const { data: technicalSheets, isLoading: areSheetsLoading } = useCollection<TechnicalSheet>(sheetsQuery);

  const isLoading = areProductsLoading || areSuppliesLoading || areSheetsLoading;

  const baseSheets = useMemo(() => technicalSheets?.filter(r => r.type === 'base') || [], [technicalSheets]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
        const isItemActive = p.isActive !== false;
        const matchesViewMode = viewMode === 'active' ? isItemActive : !isItemActive;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesViewMode && matchesSearch;
    });
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
  
  const handleSaveSuccess = async () => {
    handleCloseFormDialog();
    // A re-fetch não é mais necessária, o useCollection cuida disso.
  }
  
  const handleConfirmAction = useCallback(async () => {
    if (!selectedProduct || !firestore) return;

    const actionPromise = viewMode === 'active' 
        ? inactivateProduct(firestore, selectedProduct.id) 
        : reactivateProduct(firestore, selectedProduct.id);

    try {
        await actionPromise;
        toast({ title: viewMode === 'active' ? "Produto Arquivado" : "Produto Reativado" });
        setSelectedProductId(null);
        setIsConfirmDialogOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  }, [selectedProduct, firestore, viewMode, toast]);

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="w-full flex-1 flex flex-col min-h-0">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <CardTitle>Catálogo de Produtos Finais</CardTitle>
                  <CardDescription>Clique em um produto para selecionar ou clique em Adicionar para montar um novo item de venda.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Button onClick={() => handleOpenFormDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Adicionar</Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/admin/products/margin-analysis">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Análise de Margens
                  </Link>
                </Button>
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
            {isLoading ? (
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
                                {product.components && product.components.length > 0 ? <LinkIcon className="h-4 w-4 text-primary" aria-label="Produto montado com componentes"/> : <Link2Off className="h-4 w-4 text-muted-foreground" aria-label="Produto de venda direta"/>}
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
      
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>{productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto (Montagem)'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ProductForm
              product={productToEdit}
              supplies={supplies || []}
              baseSheets={baseSheets}
              onSaveSuccess={handleSaveSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>

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
