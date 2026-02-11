"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getSyncStatusSnapshot,
  subscribeSyncStatus,
  type SyncStatusSnapshot,
} from "@/lib/sync-status-store";

export function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatusSnapshot>(getSyncStatusSnapshot());
  const [showSyncing, setShowSyncing] = useState(false);
  const showDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return subscribeSyncStatus(setStatus);
  }, []);

  useEffect(() => {
    if (showDelayRef.current) {
      clearTimeout(showDelayRef.current);
      showDelayRef.current = null;
    }
    if (hideDelayRef.current) {
      clearTimeout(hideDelayRef.current);
      hideDelayRef.current = null;
    }

    if (status.health === "syncing") {
      // Evita "piscar" para sincronizações rápidas.
      showDelayRef.current = setTimeout(() => {
        setShowSyncing(true);
      }, 1800);
      return;
    }

    // Pequena folga para transição visual suave ao sair de syncing.
    hideDelayRef.current = setTimeout(() => {
      setShowSyncing(false);
    }, 400);
  }, [status.health]);

  useEffect(() => {
    return () => {
      if (showDelayRef.current) clearTimeout(showDelayRef.current);
      if (hideDelayRef.current) clearTimeout(hideDelayRef.current);
    };
  }, []);

  const { label, className, Icon, title } = useMemo(() => {
    if (status.health === "syncing" && showSyncing) {
      return {
        label: "Sincronizando",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        Icon: RefreshCw,
        title: status.currentOperation || "Operação em andamento",
      };
    }
    if (status.health === "warning") {
      return {
        label: "Com Divergência",
        className: "bg-amber-100 text-amber-800 border-amber-200",
        Icon: AlertTriangle,
        title: status.lastErrorMessage || "Reconciliação encontrou divergência",
      };
    }
    if (status.health === "error") {
      return {
        label: "Offline/Erro",
        className: "bg-red-100 text-red-800 border-red-200",
        Icon: WifiOff,
        title: status.lastErrorMessage || "Falha de sincronização",
      };
    }
    return {
      label: "Aguardando",
      className: "bg-slate-100 text-slate-800 border-slate-200",
      Icon: RefreshCw,
      title: "Sync ainda não iniciou",
    };
  }, [status, showSyncing]);

  // Mantém o cabeçalho limpo: mostra apenas erros/alertas e syncing prolongado.
  const shouldRender =
    status.health === "warning" ||
    status.health === "error" ||
    (status.health === "syncing" && showSyncing);

  if (!shouldRender) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={`hidden md:flex items-center gap-2 px-3 py-1 text-xs ${className}`}
      title={title}
    >
      <Icon className={`h-3.5 w-3.5 ${status.health === "syncing" ? "animate-spin" : ""}`} />
      {label}
    </Badge>
  );
}
