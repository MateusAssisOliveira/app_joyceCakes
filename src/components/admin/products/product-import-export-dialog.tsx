"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { bulkImportProducts } from "@/services";
import {
  PRODUCT_CSV_COLUMN_DOCS,
  downloadTextFile,
  parseProductsCsv,
  serializeProductCsvTemplate,
  serializeProductsToCsv,
} from "@/lib/product-csv";
import type { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type ProductImportExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[] | null | undefined;
  tenantId: string | null | undefined;
};

export function ProductImportExportDialog({
  open,
  onOpenChange,
  products,
  tenantId,
}: ProductImportExportDialogProps) {
  const { toast } = useToast();
  const [importText, setImportText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [parsePreview, setParsePreview] = useState<string[] | null>(null);

  const resetImportState = useCallback(() => {
    setImportText("");
    setFileName(null);
    setParsePreview(null);
  }, []);

  useEffect(() => {
    setParsePreview(null);
  }, [importText]);

  const handleDownloadCurrent = () => {
    const list = products ?? [];
    const csv = serializeProductsToCsv(list);
    downloadTextFile(`produtos-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({ title: "CSV gerado", description: `${list.length} produto(s) no arquivo.` });
  };

  const handleDownloadTemplate = () => {
    const csv = serializeProductCsvTemplate();
    downloadTextFile("produtos-modelo.csv", csv);
    toast({ title: "Modelo baixado", description: "Preencha as colunas e importe na aba Importar." });
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setImportText(text);
  };

  const validateImport = useCallback(() => {
    const result = parseProductsCsv(importText);
    if (!result.ok) {
      setParsePreview(result.errors);
      return;
    }
    setParsePreview(null);
    toast({
      title: "Arquivo válido",
      description: `${result.rows.length} linha(s) pronta(s) para importar.`,
    });
  }, [importText, toast]);

  const runImport = async () => {
    if (!tenantId) {
      toast({ variant: "destructive", title: "Tenant ausente", description: "Selecione uma loja e tente novamente." });
      return;
    }
    const result = parseProductsCsv(importText);
    if (!result.ok) {
      setParsePreview(result.errors);
      toast({ variant: "destructive", title: "Corrija o CSV", description: "Há erros de validação nas linhas." });
      return;
    }
    if (result.rows.length === 0) {
      toast({ variant: "destructive", title: "Nada para importar", description: "O arquivo não tem linhas de dados." });
      return;
    }
    setBusy(true);
    try {
      const { inserted, updated } = await bulkImportProducts(result.rows, tenantId);
      toast({
        title: "Importação concluída",
        description: `${inserted} novo(s), ${updated} atualizado(s).`,
      });
      resetImportState();
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast({
        variant: "destructive",
        title: "Falha na importação",
        description: message,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetImportState();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar e exportar produtos</DialogTitle>
          <DialogDescription>
            Use CSV com as colunas da tabela <span className="font-mono text-xs">products</span>. O arquivo segue o
            modelo gerado aqui para evitar erros de cabeçalho.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="flex-1 flex flex-col gap-3 mt-4 min-h-0">
            <p className="text-sm text-muted-foreground">
              Exporta todos os produtos do tenant atual (ativos e arquivados), no mesmo formato aceito na importação.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="default" className="sm:flex-1" onClick={handleDownloadCurrent}>
                Baixar produtos atuais
              </Button>
              <Button type="button" variant="outline" className="sm:flex-1" onClick={handleDownloadTemplate}>
                Baixar modelo vazio
              </Button>
            </div>

            <Accordion type="single" collapsible className="border rounded-md px-3">
              <AccordionItem value="cols" className="border-0">
                <AccordionTrigger className="text-sm py-3">Colunas do CSV (tabela products)</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="max-h-[40vh] pr-3">
                    <ul className="text-xs space-y-2 text-muted-foreground">
                      {PRODUCT_CSV_COLUMN_DOCS.map((d) => (
                        <li key={d.key}>
                          <span className="font-mono text-foreground">{d.key}</span>
                          {d.required ? (
                            <span className="text-destructive"> *</span>
                          ) : null}
                          {" → "}
                          <span className="font-mono">{d.dbColumn}</span>
                          <div className="mt-0.5">{d.notes}</div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="import" className="flex-1 flex flex-col gap-3 mt-4 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="product-csv-file">Arquivo CSV</Label>
              <Input
                id="product-csv-file"
                name="product-csv-file"
                type="file"
                accept=".csv,text/csv"
                disabled={busy}
                onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
              />
              {fileName ? <p className="text-xs text-muted-foreground">Selecionado: {fileName}</p> : null}
            </div>

            <div className="space-y-2 flex-1 min-h-0 flex flex-col">
              <Label htmlFor="product-csv-paste">Ou cole o conteúdo</Label>
              <textarea
                id="product-csv-paste"
                name="product-csv-paste"
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={importText}
                disabled={busy}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Cole aqui as linhas do CSV..."
              />
            </div>

            {parsePreview ? (
              <ScrollArea className="max-h-32 rounded-md border p-2 text-xs text-destructive">
                <ul className="space-y-1">
                  {parsePreview.map((line, idx) => (
                    <li key={`${idx}-${line.slice(0, 80)}`}>{line}</li>
                  ))}
                </ul>
              </ScrollArea>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button type="button" variant="outline" className="sm:flex-1" disabled={busy || !importText.trim()} onClick={validateImport}>
                Validar
              </Button>
              <Button type="button" className="sm:flex-1" disabled={busy || !importText.trim()} onClick={() => void runImport()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Importar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Linhas com <span className="font-mono">id</span> vazio viram produtos novos. IDs existentes no seu tenant são
              atualizados; o tenant nunca é alterado pelo arquivo.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
