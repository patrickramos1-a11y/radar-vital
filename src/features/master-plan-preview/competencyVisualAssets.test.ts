import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { manualCatalog } from "./manualDigitalModel";
import { competencyStickerPath } from "./competencyVisualAssets";

describe("competency visual assets", () => {
  it("maps every competency to an existing sticker", () => {
    expect(manualCatalog.competencies).toHaveLength(67);
    for (const competency of manualCatalog.competencies) {
      const path = competencyStickerPath(competency.id);
      expect(path).toBeDefined();
      expect(existsSync(join(process.cwd(), "public", path!.slice(1)))).toBe(true);
    }
  });
});
