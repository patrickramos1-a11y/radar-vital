import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { manualCatalog } from "./manualDigitalModel";
import { sectorVisuals } from "./manualSectorVisuals";

describe("Manual Digital sector visuals", () => {
  it("covers every institutional sector with an existing image and valid interfaces", () => {
    expect(Object.keys(sectorVisuals).sort()).toEqual(manualCatalog.sectors.map((item) => item.id).sort());
    const ids = new Set(manualCatalog.sectors.map((item) => item.id));
    for (const sector of manualCatalog.sectors) {
      const visual = sectorVisuals[sector.id];
      expect(visual.concept).toBeTruthy();
      expect(visual.flow).toHaveLength(4);
      expect(existsSync(join(process.cwd(), "public", visual.image.slice(1)))).toBe(true);
      for (const link of visual.interfaces) {
        expect(ids.has(link.id)).toBe(true);
        expect(link.id).not.toBe(sector.id);
      }
    }
  });
});
