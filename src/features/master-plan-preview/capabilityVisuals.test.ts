import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import source from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { capabilityCoverPath, capabilityVisual, hasCapabilityPoster } from "./capabilityVisuals";

describe("capability covers", () => {
  it("maps every curated capability to its own local cover and visual concept", () => {
    expect(source.capabilities).toHaveLength(28);
    for (const item of source.capabilities) {
      const visual = capabilityVisual(item.code);
      const cover = capabilityCoverPath(item.code);
      expect(visual?.concept.length).toBeGreaterThan(20);
      expect(visual?.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(cover).toBe(`/universe-capabilities/${item.code}.png`);
      expect(existsSync(join(process.cwd(), "public", cover!.slice(1)))).toBe(true);
    }
  });

  it.each(["F19", "F20", "F21", "T11", "F22", "F23"])("uses the delivered cover for new capability %s", (code) => {
    expect(capabilityVisual(code)?.concept.length).toBeGreaterThan(20);
    expect(capabilityCoverPath(code)).toBe(`/universe-capabilities/${code}.png`);
    expect(existsSync(join(process.cwd(), "public", "universe-capabilities", `${code}.png`))).toBe(true);
    expect(hasCapabilityPoster(code)).toBe(false);
  });
});
