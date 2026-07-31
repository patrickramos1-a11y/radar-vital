import { describe, expect, it } from "vitest";
import { parseUniverseChallengeCsv } from "./universeChallengeImport";

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
