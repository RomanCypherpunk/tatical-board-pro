/**
 * Portrait pitch coordinates.
 * The playable field keeps a real-world 1.55:1 length/width ratio.
 */
export const MARGIN_X = 42;
export const MARGIN_Y = 42;
export const FW = 720;
export const FH = 1116;
export const PITCH_W = FW + MARGIN_X * 2;
export const PITCH_H = FH + MARGIN_Y * 2;
export const FL = MARGIN_X;
export const FT = MARGIN_Y;
export const FR = FL + FW;
export const FB = FT + FH;
export const CX = PITCH_W / 2;
export const CY = PITCH_H / 2;

/** Convert percentage (0-100) to SVG coordinates. */
export function pctToSvg(x, y) {
  return {
    sx: FL + (x / 100) * FW,
    sy: FT + (y / 100) * FH,
  };
}
