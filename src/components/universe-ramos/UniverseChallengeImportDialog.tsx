import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  isReadyForDraft,
  parseMasterRows,
  prepareChallengeImport,
  type PreparedChallengeImport,
} from "@/lib/universeChallengeImport";
import type { Collaborator } from "@/types/collaborator";
import type { Client } from "@/types/client";
import type { ChallengeDraftImportInput } from "@/types/challenge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Client[];
  collaborators: Collaborator[];
  onImport: (drafts: ChallengeDraftImportInput[]) => Promise<Array<{ importKey: string; challengeId?: string; error?: string }>>;
}

export function UniverseChallengeImportDialog({ open, onOpenChange, units, collaborators, onImport }: Props) {
  const [prepared, setPrepared] = useState<PreparedChallengeImport[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);
  const [resultRows, setResultRows] = useState<Array<{ masterId: string; title: string; error?: string }>>([]);

  const eligible = useMemo(() => prepared.filter((item) => item.issues.length === 0), [prepared]);
  const blocked = useMemo(() => prepared.filter((item) => item.issues.length > 0), [prepared]);

  const reset = () => {
    setPrepared([]);
    setFileName("");
    setParseError(null);
    setResult(null);
    setResultRows([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFile = async (file: File | undefined) => {
    reset();
    if (!file) return;
    setFileName(file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
      const sheet = workbook.Sheets["Banco Mestre"] ?? workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("A planilha não possui uma aba para leitura.");
      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const masterRows = parseMasterRows(records).filter(isReadyForDraft);
      if (!masterRows.length) throw new Error("Nenhuma linha está marcada como “Pronto para rascunho” e “Não enviado”.");
      setPrepared(masterRows.map((row) => prepareChallengeImport(row, units, collaborators)));
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Não foi possível ler a planilha.");
    }
  };

  const handleImport = async () => {
    if (!eligible.length) return;
    setIsImporting(true);
    const drafts: ChallengeDraftImportInput[] = eligible.map((item) => ({
      importKey: `universe-ramos:${item.row.masterId}`,
      title: item.row.title,
      description: item.row.description,
      successCriteria: item.row.successCriteria,
      clientId: item.unit?.id ?? null,
      kind: item.kind,
      expectedDeliverable: item.row.expectedDeliverable,
      evidenceRequirements: item.row.evidenceRequirements,
      participantIds: item.collaborator ? [item.collaborator.id] : [],
      conditions: item.conditions,
    }));
    const importResult = await onImport(drafts);
    const failed = importResult.filter((item) => item.error).length;
    setResultRows(importResult.map((item) => {
      const preparedItem = eligible.find((candidate) => `universe-ramos:${candidate.row.masterId}` === item.importKey);
      return {
        masterId: preparedItem?.row.masterId ?? item.importKey,
        title: preparedItem?.row.title ?? "Desafio importado",
        error: item.error,
      };
    }));
    setResult({ imported: importResult.length - failed, failed });
    setIsImporting(false);
  };

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Importar rascunhos do Banco Mestre</DialogTitle>
        <p className="text-sm text-muted-foreground">A carga cria somente desafios em rascunho. Ela não publica no mural, não notifica a equipe e não define estrelas, penalidades ou prazos.</p>
      </DialogHeader>

      {!prepared.length && !result && <label className="grid min-h-44 cursor-pointer place-items-center border-2 border-dashed border-cyan-200 bg-cyan-50/40 p-6 text-center hover:bg-cyan-50">
        <input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void handleFile(event.target.files?.[0])} />
        <FileSpreadsheet className="h-9 w-9 text-cyan-700" />
        <span className="mt-3 font-medium">Selecionar Banco Mestre</span>
        <span className="mt-1 text-xs text-muted-foreground">Use a aba “Banco Mestre”. Só entram linhas prontas para rascunho e ainda não enviadas.</span>
      </label>}

      {parseError && <div className="flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertTriangle className="h-4 w-4 shrink-0" />{parseError}</div>}

      {prepared.length > 0 && !result && <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border bg-muted/30 p-3">
          <div><p className="font-medium">{fileName}</p><p className="text-xs text-muted-foreground">{prepared.length} linha(s) elegíveis na planilha: {eligible.length} pronta(s) e {blocked.length} bloqueada(s) por validação.</p></div>
          <label><input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void handleFile(event.target.files?.[0])} /><Button type="button" variant="outline" size="sm" asChild><span><Upload className="h-4 w-4" />Trocar arquivo</span></Button></label>
        </div>
        <div className="overflow-x-auto border"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr><th className="p-3">ID</th><th className="p-3">Desafio</th><th className="p-3">Origem</th><th className="p-3">Responsável</th><th className="p-3">Tipo</th><th className="p-3">Resultado da validação</th></tr></thead><tbody>{prepared.map((item) => <tr key={item.row.masterId} className="border-t align-top"><td className="p-3 font-mono text-xs">{item.row.masterId}</td><td className="p-3 font-medium">{item.row.title}</td><td className="p-3 text-xs">{item.unit?.name ?? item.row.unitName}</td><td className="p-3 text-xs">{item.collaborator?.name ?? (item.row.suggestedResponsible || "Em aberto")}</td><td className="p-3 text-xs">{item.kind}</td><td className="p-3 text-xs">{item.issues.length ? <ul className="space-y-1 text-red-700">{item.issues.map((issue, index) => <li key={`${issue.field}-${index}`}>{issue.message}</li>)}</ul> : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" />Pronto para criar rascunho</span>}</td></tr>)}</tbody></table></div>
      </div>}

      {result && <div className="space-y-3">
        <div className="border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />Importação concluída</div><p className="mt-2">{result.imported} rascunho(s) criado(s) ou atualizado(s) sem duplicidade.{result.failed ? ` ${result.failed} item(ns) precisam de nova tentativa.` : ""}</p><p className="mt-2 text-xs">Abra a Biblioteca, filtre por “Rascunho” e configure cada desafio antes de publicá-lo.</p></div>
        <div className="overflow-x-auto border"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr><th className="p-3">ID</th><th className="p-3">Desafio</th><th className="p-3">Resultado</th></tr></thead><tbody>{resultRows.map((item) => <tr key={item.masterId} className="border-t"><td className="p-3 font-mono text-xs">{item.masterId}</td><td className="p-3">{item.title}</td><td className={`p-3 text-xs ${item.error ? "text-red-700" : "text-emerald-700"}`}>{item.error ?? "Rascunho criado ou atualizado"}</td></tr>)}</tbody></table></div>
      </div>}

      <DialogFooter>
        <Button variant="outline" onClick={() => handleOpenChange(false)}>{result ? "Fechar" : "Cancelar"}</Button>
        {prepared.length > 0 && !result && <Button disabled={!eligible.length || isImporting} onClick={() => void handleImport()}>{isImporting ? "Criando rascunhos..." : `Criar ${eligible.length} rascunho(s)`}</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
