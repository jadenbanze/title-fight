/**
 * Shrinks the arena headline for longer titles.
 *
 * The display size is driven by viewport units, which knows nothing about how
 * many characters it has to fit. "Baby" and "First Day Out" at the same size
 * means the long one either overflows or gets ellipsised, so scale it down by
 * length instead of clipping it.
 */
export function titleScale(display: string): number {
  const length = display.trim().length;
  if (length <= 7) return 1;
  if (length <= 10) return 0.86;
  if (length <= 14) return 0.7;
  if (length <= 20) return 0.56;
  return 0.46;
}
