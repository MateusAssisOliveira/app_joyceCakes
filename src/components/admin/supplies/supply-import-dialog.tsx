

"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, Upload, Download } from "lucide-react";
import { addSuppliesInBatch } from "@/services";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';

type ImportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType: 'ingredient' | 'packaging';
};

export function SupplyImportDialog({ isOpen, onClose, onSuccess, defaultType }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    const header = "nome,categoria,estoque_atual,unidade,custo_unitario,sku,estoque_minimo,fornecedor,data_ultima_compra,data_validade\n";
    const example = defaultType === 'ingredient'
      ? "Açúcar Refinado,Secos,5000,kg,5.50,SKU-ACUCAR-01,1000,Fornecedor Docesul,2024-07-31,2025-12-31\n"
      : "Caixa para Bolo 20cm,Caixas,100,un,2.50,SKU-CAIXA-20,20,Fornecedor Embalagens,2024-07-30,\n";
    const csvContent = "\uFEFF" + header + example;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `modelo_importacao_${defaultType}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImport = () => {
    if (!selectedFile || !firestore) {
      toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado', description: 'Por favor, escolha um arquivo CSV para importar.' });
      return;
    }
    
    setIsProcessing(true);

    Papa.parse<any>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        encoding: "windows-1252",
        complete: async (results) => {
            const suppliesToImport: Omit<Supply, 'id' | 'createdAt' | 'isActive'>[] = [];
            
            for (const [index, row] of results.data.entries()) {
                if (!row.nome || !row.unidade || !row.estoque_atual || !row.custo_unitario) {
                    toast({ variant: 'destructive', title: `Erro na linha ${index + 2}`, description: 'As colunas "nome", "unidade", "estoque_atual" e "custo_unitario" são obrigatórias.' });
                    setIsProcessing(false);
                    return;
                }

                suppliesToImport.push({
                    name: row.nome,
                    category: row.categoria || "",
                    type: defaultType,
                    stock: parseFloat(row.estoque_atual) || 0,
                    unit: row.unidade as any,
                    costPerUnit: parseFloat(row.custo_unitario.replace(',', '.')) || 0,
                    sku: row.sku || "",
                    minStock: row.estoque_minimo ? parseFloat(row.estoque_minimo.replace(',', '.')) : 0,
                    supplier: row.fornecedor || "",
                    lastPurchaseDate: row.data_ultima_compra ? new Date(row.data_ultima_compra) : undefined,
                    expirationDate: row.data_validade ? new Date(row.data_validade) : undefined,
                });
            }
            
            try {
                await addSuppliesInBatch(firestore, suppliesToImport);
                onSuccess();
            } catch (error: any) {
                console.error("Erro ao importar em massa:", error);
                toast({ variant: 'destructive', title: 'Erro na importação', description: `Ocorreu um erro ao salvar os dados. Detalhe: ${error.message}` });
            } finally {
                setIsProcessing(false);
                setSelectedFile(null);
            }
        },
        error: (error) => {
            console.error("Erro ao parsear CSV:", error);
            toast({ variant: 'destructive', title: 'Erro no arquivo', description: `Não foi possível ler o arquivo CSV. Detalhe: ${error.message}` });
            setIsProcessing(false);
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open && !isProcessing) { onClose(); setSelectedFile(null); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar {defaultType === 'ingredient' ? 'Ingredientes' : 'Embalagens'} em Massa</DialogTitle>
          <DialogDescription>
            Adicione múltiplos itens de uma só vez usando um arquivo CSV.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold">Passo 1: Baixe o modelo</h4>
            <p className="text-sm text-muted-foreground">
              Use nosso modelo para garantir que seu arquivo esteja no formato correto.
            </p>
            <Button onClick={handleDownloadTemplate} variant="secondary" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Baixar Modelo (.csv)
            </Button>
          </div>

          <div className="space-y-2 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold">Passo 2: Escolha o arquivo</h4>
            <p className="text-sm text-muted-foreground">
              Selecione o arquivo CSV que você preencheu.
            </p>
            <Input 
              id="csv-file-input"
              name="csv-file-input"
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={isProcessing}
            />
            {selectedFile && <p className="text-xs text-muted-foreground pt-2">Arquivo selecionado: {selectedFile.name}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setSelectedFile(null); }} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleImport} disabled={!selectedFile || isProcessing}>
              {isProcessing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isProcessing ? 'Processando...' : 'Importar Arquivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
