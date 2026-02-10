
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  Upload,
  Trash2,
  ArchiveRestore,
  Pencil,
  ChevronDown,
  Download,
} from "lucide-react";

type SupplyActionsProps = {
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onEdit: () => void;
  onArchive: () => void;
  isEditDisabled: boolean;
  isArchiveActionDisabled: boolean;
  archiveButtonLabel: "Arquivar" | "Reativar";
};

export function SupplyActions({
  onAdd,
  onImport,
  onExport,
  onEdit,
  onArchive,
  isEditDisabled,
  isArchiveActionDisabled,
  archiveButtonLabel,
}: SupplyActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            Ações
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Item
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} disabled={isEditDisabled}>
            <Pencil className="mr-2 h-4 w-4" />
            Repor Estoque
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onArchive}
            disabled={isArchiveActionDisabled}
            className="text-destructive focus:text-destructive"
          >
            {archiveButtonLabel === "Arquivar" ? (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Arquivar</span>
              </>
            ) : (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                <span>Reativar</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            Consultas
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onImport}>
            <Upload className="mr-2 h-4 w-4" />
            Importar via CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar para Excel (CSV)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
