const competencyIdPattern = /^COMP-\d{3}$/;

export function competencyStickerPath(competencyId: string) {
  if (!competencyIdPattern.test(competencyId)) return undefined;
  return `/competency-stickers/${competencyId}.png`;
}
