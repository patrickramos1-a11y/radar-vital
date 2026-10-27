import type { NucleusId } from "./model";

type ResponsibilityScope = { sourceSector: string; title: string };

// Capacidades transversais aparecem nos três núcleos, mas só entram na escada
// quando fizerem parte do PAC específico daquela jornada.
const transversalCodes = ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "T11"];

const capabilityCodesByNucleus: Record<NucleusId, string[]> = {
  tecnico: [
    "F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F10", "F11", "F12", "F13",
    "E01", "E02", "E03", "E04", "E05",
    ...transversalCodes,
  ],
  suporte: ["F15", "F17", "F19", "F20", "F21", ...transversalCodes],
  administrativo: ["F14", "F16", "F18", "F22", "F23", ...transversalCodes],
};

export function capabilityCodesForNucleus(nucleusId: NucleusId) {
  return capabilityCodesByNucleus[nucleusId];
}

export function isCapabilityInNucleus(code: string, nucleusId: NucleusId) {
  return capabilityCodesForNucleus(nucleusId).includes(code);
}

export function responsibilityNucleus(responsibility: ResponsibilityScope): NucleusId {
  if (responsibility.sourceSector !== "Fora do Núcleo Técnico") return "tecnico";
  if (responsibility.title === "Tecnologia e Sistemas" || responsibility.title === "Administrativo / Marketing") return "suporte";
  return "administrativo";
}

export function isResponsibilityInNucleus(responsibility: ResponsibilityScope, nucleusId: NucleusId) {
  return responsibilityNucleus(responsibility) === nucleusId;
}
