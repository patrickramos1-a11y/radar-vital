import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { organizationMap } from "./organizationMapModel";
import { functionStickerPath, nucleusStickerPath, sectorCoverPath, sectorStickerPath } from "./organizationVisualAssets";

describe("organization visual assets", () => {
  it("maps every published nucleus, sector and essential function to an existing image", () => {
    const paths = organizationMap.flatMap((nucleus) => [
      nucleusStickerPath(nucleus.id),
      ...nucleus.sectors.flatMap((sector) => [
        sectorCoverPath(sector.item.id),
        sectorStickerPath(sector.item.id),
        ...sector.functions.map(({ item }) => functionStickerPath(item.id)),
      ]),
    ]);
    expect(paths).toHaveLength(3 + 11 * 2 + 41);
    for (const path of paths) {
      expect(path).toBeDefined();
      expect(existsSync(join(process.cwd(), "public", path!.slice(1)))).toBe(true);
    }
  });
});
