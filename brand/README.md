# HAQDAAR — brand assets

The mark is the Devanagari letter **ह** on a deep-green tile, with a single gold
dot at its foot. The dot is the same gold as a confirmed match in the app's
eligibility field: one entitlement, found. Read together the mark says "ह." — a
statement, not a question.

The glyph is a real letter, taken from **Noto Sans Devanagari ExtraBold** and
converted to an outline. It is never set as live text in a logo, because a
machine without a Devanagari font renders it as a box, and image generators
produce lookalike shapes that are not the letter at all.

## Files

| Path | Use |
|---|---|
| `svg/haqdaar-logo.svg` | primary horizontal lockup, light backgrounds |
| `svg/haqdaar-logo-reversed.svg` | on deep green or photography |
| `svg/haqdaar-logo-stacked.svg` | square placements, slide corners |
| `svg/haqdaar-mark.svg` | icon alone — app, favicon, avatar |
| `svg/haqdaar-mark-mono-dark.svg` | one-colour dark |
| `svg/haqdaar-mark-mono-white.svg` | one-colour light, print, embroidery |
| `png/` | rasters from 16px to 3200px, `favicon.ico`, `og-card.png` |
| `build_logo.py` | regenerates every SVG from the fonts |

Rasters are generated, not hand-edited. To change the logo, edit `build_logo.py`
and re-run it — that keeps every size in step.

## Colour

| Token | Hex | Where |
|---|---|---|
| Deep green | `#1C5836` | the tile |
| Cream | `#FBF8F0` | the letter |
| Gold | `#D9812A` | the dot |
| Ink | `#14261D` | the wordmark |

## Type

Wordmark is **Sora ExtraBold**, all capitals, letter-spacing `0.07em`. In the
lockup it is already outlined, so no font is needed to display it.

## Rules

- Clear space around the lockup: at least the height of the tile's corner radius.
- Smallest safe size: 16px for the mark, 96px wide for the lockup.
- Do not recolour the tile, restretch the lockup, add a gradient, a shadow or an
  outer glow, or set the wordmark in another typeface.
- Do not retype **ह** as text in a design tool unless Noto Sans Devanagari is
  actually installed — check the shape against `svg/haqdaar-mark.svg` first.

## Where it is wired in

`public/brand/` holds the copies the app serves; `index.html` links the favicon,
the apple-touch icon and `manifest.webmanifest`; `src/components/Logo.tsx` is the
inline-SVG mark used in the header; and `src/lib/pdf.ts` draws the same outline
on the masthead of every downloaded application.
