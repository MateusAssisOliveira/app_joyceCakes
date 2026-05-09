"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "lucide-react";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { applySupplyLedgerAbsoluteAdjust } from "@/services";

type SupplyAdjustmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supply: Supply | null;
  tenantId: string | undefined;
  onSuccess?: () => void;
};

const parseQty = (v: string) => {
  const n = Number(v.replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
};

export function SupplyAdjustmentDialog({
  open,
  onOpenChange,
  supply,
  tenantId,
  onSuccess,
}: SupplyAdjustmentDialogProps) {
  const [targetStock, setTargetStock] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && supply) {
      setTargetStock(String(Math.round(Number(supply.stock) || 0)));
      setNote("");
    }
  }, [open, supply]);

  if (!supply) return null;

  const unit = supply.unit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = parseQty(targetStock);
    if (!Number.isFinite(next) || next < 0) {
      toast({ variant: "destructive", title: "Quantidade inválida" });
      return;
    }
    if (!note.trim()) {
      toast({ variant: "destructive", title: "Informe o motivo do ajuste" });
      return;
    }
    if (!tenantId) {
      toast({ variant: "destructive", title: "Tenant inválido" });
      return;
    }

    setBusy(true);
    try {
      await applySupplyLedgerAbsoluteAdjust(null, supply.id, next, note.trim(), tenantId);
      toast({ title: "Ajuste registrado", description: "Saldo atualizado no histórico." });
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao ajustar";
      toast({ variant: "destructive", title: "Não foi possível ajustar", description: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste de estoque</DialogTitle>
          <DialogDescription>
            Corrige o saldo para o valor contado. Gera movimentação <strong>AJUSTE</strong> no histórico (não é compra).
            Unidade: <strong>{unit}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="adj-target">Saldo após ajuste ({unit})</Label>
            <Input
              id="adj-target"
              inputMode="decimal"
              value={targetStock}
              onChange={(e) => setTargetStock(e.target.value)}
              disabled={busy}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="adj-note">Motivo (obrigatório)</Label>
            <Textarea
              id="adj-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
              placeholder="Ex.: Inventário físico 09/05; divergência de balança"
              rows={3}
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
