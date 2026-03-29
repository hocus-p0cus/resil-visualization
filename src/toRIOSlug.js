export function toRaiderIoSlug(seasonKey) {
  const match = seasonKey.match(/^(\w+)-season(\d+)$/);
  if (!match) return seasonKey;
  const [_, expac, num] = match;
  return `season-${expac}-${num}`;
}