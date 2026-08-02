import { describe, expect, it } from "vitest";
import { isReadyForDraft, parseMasterRows, parseUniverseChallengeCsv, prepareChallengeImport, splitCompletionConditions } from "./universeChallengeImport";

const units = [{ id: "marketing", name: "Marketing", universeCategory: "SETOR" }] as any;
const collaborators = [{ id: "ana", name: "Ana Silva" }] as any;
const header = "titulo,origem_nome,origem_categoria,tipo,descricao,condicoes_conclusao,entregavel_esperado,evidencia_necessaria,responsavel_inicial,participantes,prazo,recompensa_estrelas,recompensa_super_estrelas,penalidade_estrelas,status_inicial,observacoes_administrador";

describe("parseUniverseChallengeCsv", () => {
  it("resolves a valid open internal challenge", () => {
    const rows = parseUniverseChallengeCsv(`${header}\nOrganizar brindes,Marketing,SETOR,sector,Contexto,Itens separados,Kit,Foto,,,2026-08-10,0,2,0,open,`, units, collaborators);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].clientId).toBe("marketing");
    expect(rows[0].participantIds).toEqual([]);
  });

  it("reports invalid origin and collaborator before import", () => {
    const rows = parseUniverseChallengeCsv(`${header}\nTreinamento,Inexistente,SETOR,sector,,Concluir,Material,,Pessoa Ausente,,x,0,0,-1,open,`, units, collaborators);
    expect(rows[0].errors).toContain("Origem inexistente");
    expect(rows[0].errors).toContain("Colaborador não encontrado");
    expect(rows[0].errors).toContain("Prazo inválido");
  });
});

describe("Banco Mestre", () => {
  const masterRecord = {
    "ID mestre": "UR-090",
    "Unidade/Setor": "Marketing",
    "Responsável sugerido": "",
    "Título": "Criar a Biblioteca de Treinamentos",
    "Descrição": "Organizar os materiais internos.",
    "Condições de conclusão": "Mapear materiais; Organizar conteúdos",
    "Entregável esperado": "Biblioteca publicada",
    "Evidências necessárias": "Link e registro de validação",
    "Tipo de desafio": "Aberto",
    "Estado de maturidade": "Pronto para rascunho",
    "Status no aplicativo": "Não enviado",
    "Recompensa em estrelas": "",
    "Penalidade em estrelas": "",
  };

  it("traz critérios legados como orientações, sem criar checklist artificial", () => {
    const [row] = parseMasterRows([masterRecord]);
    const prepared = prepareChallengeImport(row, units, collaborators);
    expect(isReadyForDraft(row)).toBe(true);
    expect(prepared.issues).toEqual([]);
    expect(prepared.kind).toBe("sector");
    expect(prepared.row.completionMode).toBe("guidance");
    expect(prepared.conditions).toEqual([]);
  });

  it("aceita checklist somente quando a planilha o declara explicitamente", () => {
    const [row] = parseMasterRows([{ ...masterRecord, "Modo de conclusão": "Checklist", "Itens do checklist": "Mapear materiais; Organizar conteúdos" }]);
    const prepared = prepareChallengeImport(row, units, collaborators);
    expect(prepared.conditions).toEqual([{ title: "Mapear materiais", isRequired: true }, { title: "Organizar conteúdos", isRequired: true }]);
  });

  it("bloqueia linhas com recompensa preenchida na primeira carga", () => {
    const [row] = parseMasterRows([{ ...masterRecord, "Recompensa em estrelas": "5" }]);
    expect(prepareChallengeImport(row, units, collaborators).issues.map((issue) => issue.field)).toContain("Valores");
    expect(splitCompletionConditions("A; B")).toHaveLength(2);
  });
});
