import type { CSSProperties } from "react";

type CapabilityVisual = {
  accent: string;
  ink: string;
  concept: string;
};

const visuals: Record<string, CapabilityVisual> = {
  T01: { accent: "#25533F", ink: "#25533F", concept: "A informação certa, na versão certa, encontrada no momento certo." },
  T02: { accent: "#52A5CE", ink: "#187C86", concept: "O sistema como retrato confiável da operação." },
  T03: { accent: "#EFCE7B", ink: "#876029", concept: "Transformar uma entrega em etapas possíveis e coordenadas." },
  T04: { accent: "#EF6F3C", ink: "#6D1F42", concept: "Agir antes que o prazo se transforme em risco." },
  T05: { accent: "#B8CEE8", ink: "#35658A", concept: "Clareza que alinha, registra e movimenta o trabalho." },
  T06: { accent: "#F4BEAE", ink: "#A63458", concept: "Escutar, alinhar expectativas e construir confiança contínua." },
  T07: { accent: "#D3B6D3", ink: "#7656B8", concept: "Entradas e saídas claras para nenhuma entrega ficar sem dono." },
  T08: { accent: "#6D1F42", ink: "#6D1F42", concept: "Ver a causa por trás do sintoma e escolher uma resposta fundamentada." },
  T09: { accent: "#AFAB23", ink: "#25533F", concept: "O padrão que aprende e evolui sem perder consistência." },
  T10: { accent: "#AACC96", ink: "#25533F", concept: "Ensinar, acompanhar e criar autonomia para multiplicar conhecimento." },
  F01: { accent: "#3568C0", ink: "#264F95", concept: "Dar destino, dono e movimento a cada demanda." },
  F02: { accent: "#187C86", ink: "#12636C", concept: "Conduzir requisitos, documentos e decisões até a regularização." },
  F03: { accent: "#5265C9", ink: "#4050A5", concept: "Navegar com segurança pelos portais que materializam a obrigação." },
  F04: { accent: "#D99A18", ink: "#76500C", concept: "Converter licenças e compromissos em calendário comprovável." },
  F05: { accent: "#876029", ink: "#68471A", concept: "Montar um processo documental íntegro, coerente e aceito." },
  F06: { accent: "#6D1F42", ink: "#6D1F42", concept: "Dialogar com autoridade, evidência e clareza técnica." },
  F07: { accent: "#25533F", ink: "#25533F", concept: "Conhecimento técnico transformado em estudo, plano e solução aplicável." },
  F08: { accent: "#5B5B5B", ink: "#444444", concept: "A última barreira antes de uma entrega se tornar oficial." },
  F09: { accent: "#7656B8", ink: "#62469A", concept: "Definir o caminho técnico antes de mobilizar recursos." },
  F10: { accent: "#DF7A25", ink: "#94501A", concept: "Ir a campo com propósito, preparo e verificação." },
  F11: { accent: "#168F9B", ink: "#116E78", concept: "Transformar observações de campo em evidência confiável e rastreável." },
  F12: { accent: "#52A5CE", ink: "#2C5875", concept: "Ler o território por camadas para apoiar decisões." },
  F13: { accent: "#A64B3C", ink: "#81392E", concept: "Integrar especialistas externos sem perder escopo, qualidade e padrão Ramos." },
  E01: { accent: "#174A63", ink: "#174A63", concept: "Dimensionar sistemas que fazem água, efluentes e drenagem funcionarem." },
  E02: { accent: "#0D6E74", ink: "#0D6E74", concept: "Unir o comportamento da água à autorização para utilizá-la." },
  E03: { accent: "#263B59", ink: "#263B59", concept: "Tornar uma solução técnica precisa, visível e compreensível." },
  E04: { accent: "#76522F", ink: "#76522F", concept: "Dar identidade jurídica e espacial ao imóvel." },
  E05: { accent: "#1F5D4D", ink: "#1F5D4D", concept: "Medir o ambiente, interpretar resultados e demonstrar conformidade." },
  F19: { accent: "#5265C9", ink: "#263B59", concept: "Transformar rotinas repetitivas em fluxos automatizados, documentados e supervisionados." },
  F20: { accent: "#A64B3C", ink: "#25533F", concept: "Manter o ambiente de trabalho adequado por registro, acompanhamento e verificação." },
  F21: { accent: "#6D1F42", ink: "#6D1F42", concept: "Transformar conhecimento técnico em materiais, vídeos e experiências de aprendizagem reutilizáveis." },
  T11: { accent: "#187C86", ink: "#187C86", concept: "Medir, interpretar e transformar dados confiáveis em decisões e ações de gestão." },
  F22: { accent: "#C85676", ink: "#6D1F42", concept: "Conectar benefícios e parcerias para apoiar a experiência e o reconhecimento das pessoas." },
  F23: { accent: "#263B59", ink: "#263B59", concept: "Organizar papéis, fronteiras e decisões para que cada demanda encontre seu destino." },
};

const posterCodes = new Set(["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F10", "F11", "F12", "F13", "E01", "E02", "E03", "E04", "E05"]);

export function capabilityVisual(code: string): CapabilityVisual | undefined {
  return visuals[code];
}

export function capabilityVisualStyle(code: string): CSSProperties | undefined {
  const visual = capabilityVisual(code);
  return visual ? { "--cap-accent": visual.accent, "--cap-ink": visual.ink } as CSSProperties : undefined;
}

export function capabilityCoverPath(code: string): string | undefined {
  return capabilityVisual(code) ? `/universe-capabilities/${code}.png` : undefined;
}

export function hasCapabilityPoster(code: string) {
  return posterCodes.has(code);
}
