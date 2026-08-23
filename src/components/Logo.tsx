import type { CSSProperties } from "react";

/** The HAQDAAR mark: Devanagari ह on a deep-green tile, with the gold dot that
 *  stands for the one entitlement the solver confirmed. Inline SVG, so it needs
 *  no font, no network and no raster asset — and it stays crisp at 16px.
 *  Generated from Noto Sans Devanagari ExtraBold; the glyph is a real letter,
 *  converted to an outline. Do not retype it as text. */
export default function Logo({ size = 30, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} style={style}
         role="img" aria-label="HAQDAAR">
      <rect width="512" height="512" rx="118" fill="#1C5836"/>
        <path d="M350 47Q368 61 378.0 76.0Q388 91 388 107Q388 128 369.0 141.0Q350 154 309 154Q260 154 233.5 136.0Q207 118 207 86Q207 60 229.0 38.5Q251 17 298.5 -3.5Q346 -24 422 -49L359 -169Q250 -140 182.0 -102.5Q114 -65 82.5 -18.0Q51 29 51 84Q51 151 87 193Q95 202 105 211Q83 230 71 250Q50 283 50 319Q50 382 97.0 415.0Q144 448 230 448H348V498H0V622H592V498H503V330H254Q227 330 215.5 321.0Q204 312 204 295Q204 281 216 268Q218 266 220 263Q265 273 317 273Q397 273 447.0 251.0Q497 229 520.0 193.0Q543 157 543 113Q543 75 528.0 42.5Q513 10 481 -21Z" fill="#FBF8F0" transform="translate(100.74 341.90) scale(0.37927 -0.37927)"/>
        <circle cx="377.3" cy="372.0" r="34" fill="#D9812A"/>
    </svg>
  );
}
